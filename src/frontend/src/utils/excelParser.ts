/**
 * Minimal spreadsheet parser supporting:
 *  - CSV (.csv)
 *  - Excel XLSX (.xlsx) via lightweight XML approach (ZIP-based)
 *
 * Returns a 2D array of string/number cells (row-major, row 0 = header).
 */

// ─── CSV parser ──────────────────────────────────────────────────────────────

function parseCsv(text: string): (string | number)[][] {
  const rows: (string | number)[][] = [];
  const lines = text.split(/\r?\n/);
  for (const line of lines) {
    if (!line.trim()) continue;
    const cells = splitCsvLine(line);
    rows.push(cells.map(coerce));
  }
  return rows;
}

function splitCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

// ─── Coerce cell value ────────────────────────────────────────────────────────

function coerce(value: string): string | number {
  const trimmed = value.trim();
  if (trimmed === "") return "";
  const n = Number(trimmed);
  if (!Number.isNaN(n) && trimmed !== "") return n;
  return trimmed;
}

// ─── XLSX parser (ZIP + XML) ──────────────────────────────────────────────────

/** Minimum ZIP local file header structure */
interface ZipEntry {
  name: string;
  data: Uint8Array;
  method: number;
}

function parseZip(buffer: ArrayBuffer): ZipEntry[] {
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);
  const entries: ZipEntry[] = [];

  let offset = 0;
  while (offset < bytes.length - 4) {
    // Local file header signature = 0x04034b50
    const sig =
      view.getUint8(offset) |
      (view.getUint8(offset + 1) << 8) |
      (view.getUint8(offset + 2) << 16) |
      (view.getUint8(offset + 3) << 24);

    if (sig !== 0x04034b50) break;

    const compressionMethod = view.getUint16(offset + 8, true);
    const compressedSize = view.getUint32(offset + 18, true);
    const fileNameLength = view.getUint16(offset + 26, true);
    const extraFieldLength = view.getUint16(offset + 28, true);

    const fileNameBytes = bytes.slice(
      offset + 30,
      offset + 30 + fileNameLength,
    );
    const fileName = new TextDecoder().decode(fileNameBytes);

    const dataOffset = offset + 30 + fileNameLength + extraFieldLength;
    const compressedData = bytes.slice(dataOffset, dataOffset + compressedSize);

    entries.push({
      name: fileName,
      data: compressedData,
      method: compressionMethod,
    });

    offset = dataOffset + compressedSize;
  }

  return entries;
}

async function decompressEntry(entry: ZipEntry): Promise<string> {
  if (entry.method === 0) {
    // Stored (no compression)
    return new TextDecoder().decode(entry.data);
  }
  // Deflate (method 8)
  const ds = new DecompressionStream("deflate-raw");
  const writer = ds.writable.getWriter();
  const reader = ds.readable.getReader();
  void writer.write(entry.data as unknown as ArrayBuffer);
  void writer.close();

  const chunks: Uint8Array[] = [];
  let reading = true;
  while (reading) {
    const result = await reader.read();
    if (result.done) {
      reading = false;
    } else {
      chunks.push(result.value);
    }
  }

  const total = chunks.reduce((n, c) => n + c.length, 0);
  const out = new Uint8Array(total);
  let pos = 0;
  for (const chunk of chunks) {
    out.set(chunk, pos);
    pos += chunk.length;
  }
  return new TextDecoder().decode(out);
}

/** Parse XLSX shared strings XML */
function parseSharedStrings(xml: string): string[] {
  const strings: string[] = [];
  const re = /<si>(.*?)<\/si>/gs;
  let m = re.exec(xml);
  while (m !== null) {
    const tMatch = /<t[^>]*>(.*?)<\/t>/s.exec(m[1]);
    strings.push(tMatch ? decodeXmlEntities(tMatch[1]) : "");
    m = re.exec(xml);
  }
  return strings;
}

function decodeXmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

/** Column letter to 0-based index: A=0, B=1, ..., Z=25, AA=26 */
function colLetterToIndex(letters: string): number {
  let idx = 0;
  for (const ch of letters) {
    idx = idx * 26 + (ch.charCodeAt(0) - 64);
  }
  return idx - 1;
}

function parseXlsxSheet(
  sheetXml: string,
  sharedStrings: string[],
): (string | number)[][] {
  const rows: (string | number)[][] = [];

  // Get row elements
  const rowRe = /<row[^>]*r="(\d+)"[^>]*>(.*?)<\/row>/gs;
  let rowM = rowRe.exec(sheetXml);

  while (rowM !== null) {
    const rowIdx = Number.parseInt(rowM[1], 10) - 1; // 0-based
    const rowXml = rowM[2];

    // Ensure rows array has enough entries
    while (rows.length <= rowIdx) rows.push([]);
    const row = rows[rowIdx];

    // Get cell elements
    const cellRe = /<c\s([^>]*)>(.*?)<\/c>/gs;
    let cellM = cellRe.exec(rowXml);

    while (cellM !== null) {
      const attrs = cellM[1];
      const cellContent = cellM[2];

      // Get cell reference (e.g. "A1", "B3")
      const rMatch = /r="([A-Z]+)(\d+)"/.exec(attrs);
      if (rMatch) {
        const colLetters = rMatch[1];
        const colIdx = colLetterToIndex(colLetters);

        // Get cell type
        const tMatch = /t="([^"]*)"/.exec(attrs);
        const cellType = tMatch ? tMatch[1] : "";

        // Get value
        const vMatch = /<v>(.*?)<\/v>/.exec(cellContent);
        const rawVal = vMatch ? vMatch[1] : "";

        let cellValue: string | number = "";

        if (cellType === "s") {
          // Shared string
          const sIdx = Number.parseInt(rawVal, 10);
          cellValue = sharedStrings[sIdx] ?? "";
        } else if (cellType === "str" || cellType === "inlineStr") {
          const isMatch = /<is>.*?<t[^>]*>(.*?)<\/t>/s.exec(cellContent);
          cellValue = isMatch ? decodeXmlEntities(isMatch[1]) : rawVal;
        } else if (rawVal !== "") {
          const n = Number(rawVal);
          cellValue = Number.isNaN(n) ? rawVal : n;
        }

        // Fill sparse columns
        while (row.length <= colIdx) row.push("");
        row[colIdx] = cellValue;
      }

      cellM = cellRe.exec(rowXml);
    }

    rowM = rowRe.exec(sheetXml);
  }

  return rows;
}

// ─── Parse workbook sheet names from workbook.xml ─────────────────────────────

function parseSheetNames(wbXml: string): string[] {
  const names: string[] = [];
  const re = /<sheet\s[^>]*name="([^"]*)"[^>]*/g;
  let m = re.exec(wbXml);
  while (m !== null) {
    names.push(decodeXmlEntities(m[1]));
    m = re.exec(wbXml);
  }
  return names;
}

// ─── Main parse result ────────────────────────────────────────────────────────

export interface SpreadsheetParseResult {
  data: (string | number)[][];
  sheetName: string | null; // null for CSV
}

// ─── Main parse function ──────────────────────────────────────────────────────

export async function parseSpreadsheet(
  file: File,
): Promise<SpreadsheetParseResult> {
  const name = file.name.toLowerCase();

  if (name.endsWith(".csv")) {
    const text = await file.text();
    return { data: parseCsv(text), sheetName: null };
  }

  // XLSX (ZIP-based format)
  const buffer = await file.arrayBuffer();

  try {
    const entries = parseZip(buffer);
    if (entries.length === 0) throw new Error("Not a valid ZIP/XLSX");

    // Find shared strings, first sheet, and workbook
    let sharedStringsXml = "";
    let sheetXml = "";
    let workbookXml = "";

    for (const entry of entries) {
      if (entry.name === "xl/sharedStrings.xml") {
        sharedStringsXml = await decompressEntry(entry);
      } else if (entry.name === "xl/worksheets/sheet1.xml" && !sheetXml) {
        sheetXml = await decompressEntry(entry);
      } else if (entry.name === "xl/workbook.xml" && !workbookXml) {
        workbookXml = await decompressEntry(entry);
      }
    }

    if (!sheetXml) throw new Error("Could not find sheet1.xml");

    const sharedStrings = sharedStringsXml
      ? parseSharedStrings(sharedStringsXml)
      : [];
    const data = parseXlsxSheet(sheetXml, sharedStrings);

    // Get first sheet name from workbook
    const sheetNames = workbookXml ? parseSheetNames(workbookXml) : [];
    const sheetName = sheetNames[0] ?? null;

    return { data, sheetName };
  } catch {
    throw new Error(
      "Could not parse the Excel file. Please save it as CSV (.csv) and try again.",
    );
  }
}

// ─── Convert AOA to named-column records ──────────────────────────────────────

export function aoaToRecords(
  aoa: (string | number)[][],
  headerRowIndex = 0,
): Record<string, string | number>[] {
  const headers = (aoa[headerRowIndex] ?? []).map((h) =>
    String(h ?? "").trim(),
  );
  return aoa.slice(headerRowIndex + 1).map((row) => {
    const obj: Record<string, string | number> = {};
    headers.forEach((h, idx) => {
      if (h) obj[h] = row[idx] ?? "";
    });
    return obj;
  });
}

// ─── Generate XLSX (simple, stored/no-compression) ───────────────────────────

export function generateXlsx(
  aoa: (string | number)[][],
  sheetName = "Sheet1",
): Blob {
  const sharedStrings: string[] = [];
  const strIndex = new Map<string, number>();

  const getStr = (s: string): number => {
    if (strIndex.has(s)) return strIndex.get(s) as number;
    const idx = sharedStrings.length;
    sharedStrings.push(s);
    strIndex.set(s, idx);
    return idx;
  };

  let sheetRows = "";
  for (let r = 0; r < aoa.length; r++) {
    const row = aoa[r];
    let rowXml = `<row r="${r + 1}">`;
    for (let c = 0; c < row.length; c++) {
      const colLetter = indexToColLetter(c);
      const ref = `${colLetter}${r + 1}`;
      const val = row[c];
      if (val === "" || val === undefined || val === null) continue;
      if (typeof val === "number") {
        rowXml += `<c r="${ref}"><v>${val}</v></c>`;
      } else {
        const idx = getStr(val);
        rowXml += `<c r="${ref}" t="s"><v>${idx}</v></c>`;
      }
    }
    rowXml += "</row>";
    sheetRows += rowXml;
  }

  const sheetXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<sheetData>${sheetRows}</sheetData>
</worksheet>`;

  const ssXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="${sharedStrings.length}" uniqueCount="${sharedStrings.length}">
${sharedStrings.map((s) => `<si><t>${escapeXml(s)}</t></si>`).join("")}
</sst>`;

  const relsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;

  const wbRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" Target="sharedStrings.xml"/>
</Relationships>`;

  const wbXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheets><sheet name="${escapeXml(sheetName)}" sheetId="1" r:id="rId1"/></sheets>
</workbook>`;

  const ctXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
<Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/>
</Types>`;

  const zipFiles: { name: string; data: string }[] = [
    { name: "[Content_Types].xml", data: ctXml },
    { name: "_rels/.rels", data: relsXml },
    { name: "xl/workbook.xml", data: wbXml },
    { name: "xl/_rels/workbook.xml.rels", data: wbRelsXml },
    { name: "xl/worksheets/sheet1.xml", data: sheetXml },
    { name: "xl/sharedStrings.xml", data: ssXml },
  ];

  return buildZip(zipFiles);
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function indexToColLetter(colIndex: number): string {
  let result = "";
  let n = colIndex + 1;
  while (n > 0) {
    const rem = (n - 1) % 26;
    result = String.fromCharCode(65 + rem) + result;
    n = Math.floor((n - 1) / 26);
  }
  return result;
}

// ─── Minimal ZIP builder (stored, no compression) ─────────────────────────────

function buildZip(files: { name: string; data: string }[]): Blob {
  const enc = new TextEncoder();
  const localHeaders: Uint8Array[] = [];
  const centralDir: Uint8Array[] = [];
  let fileOffset = 0;

  for (const file of files) {
    const nameBytes = enc.encode(file.name);
    const dataBytes = enc.encode(file.data);
    const crcValue = crc32(dataBytes);
    const size = dataBytes.length;

    // Local file header (30 bytes + filename + data)
    const local = new Uint8Array(30 + nameBytes.length + size);
    const lv = new DataView(local.buffer);
    lv.setUint32(0, 0x04034b50, true);
    lv.setUint16(4, 20, true);
    lv.setUint16(6, 0, true);
    lv.setUint16(8, 0, true); // stored
    lv.setUint16(10, 0, true);
    lv.setUint16(12, 0, true);
    lv.setUint32(14, crcValue, true);
    lv.setUint32(18, size, true);
    lv.setUint32(22, size, true);
    lv.setUint16(26, nameBytes.length, true);
    lv.setUint16(28, 0, true);
    local.set(nameBytes, 30);
    local.set(dataBytes, 30 + nameBytes.length);
    localHeaders.push(local);

    // Central directory entry (46 bytes + filename)
    const cd = new Uint8Array(46 + nameBytes.length);
    const cv = new DataView(cd.buffer);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint16(4, 20, true);
    cv.setUint16(6, 20, true);
    cv.setUint16(8, 0, true);
    cv.setUint16(10, 0, true);
    cv.setUint16(12, 0, true);
    cv.setUint16(14, 0, true);
    cv.setUint32(16, crcValue, true);
    cv.setUint32(20, size, true);
    cv.setUint32(24, size, true);
    cv.setUint16(28, nameBytes.length, true);
    cv.setUint16(30, 0, true);
    cv.setUint16(32, 0, true);
    cv.setUint16(34, 0, true);
    cv.setUint16(36, 0, true);
    cv.setUint32(38, 0, true);
    cv.setUint32(42, fileOffset, true);
    cd.set(nameBytes, 46);
    centralDir.push(cd);

    fileOffset += local.length;
  }

  const cdSize = centralDir.reduce((n, b) => n + b.length, 0);

  // End of central directory record
  const eocd = new Uint8Array(22);
  const ev = new DataView(eocd.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(4, 0, true);
  ev.setUint16(6, 0, true);
  ev.setUint16(8, files.length, true);
  ev.setUint16(10, files.length, true);
  ev.setUint32(12, cdSize, true);
  ev.setUint32(16, fileOffset, true);
  ev.setUint16(20, 0, true);

  const toArrayBuffer = (u: Uint8Array): ArrayBuffer =>
    u.buffer.slice(u.byteOffset, u.byteOffset + u.byteLength) as ArrayBuffer;

  return new Blob(
    [
      ...localHeaders.map(toArrayBuffer),
      ...centralDir.map(toArrayBuffer),
      toArrayBuffer(eocd),
    ],
    {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    },
  );
}

function crc32(data: Uint8Array): number {
  const table = makeCrcTable();
  let crc = 0xffffffff;
  for (const byte of data) {
    crc = (crc >>> 8) ^ table[(crc ^ byte) & 0xff];
  }
  return (crc ^ 0xffffffff) >>> 0;
}

let _crcTable: number[] | null = null;
function makeCrcTable(): number[] {
  if (_crcTable) return _crcTable;
  _crcTable = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    _crcTable[n] = c;
  }
  return _crcTable;
}
