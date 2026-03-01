import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle,
  Download,
  Edit2,
  FileSpreadsheet,
  Loader2,
  RotateCcw,
  Upload,
} from "lucide-react";
import { motion } from "motion/react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import type { Mark } from "../backend.d";
import { useActor } from "../hooks/useActor";
import {
  useAssessments,
  useImportMarks,
  useStudents,
  useSubjects,
} from "../hooks/useQueries";
import {
  aoaToRecords,
  generateXlsx,
  parseSpreadsheet,
} from "../utils/excelParser";
import { CLASS_SUBJECTS, KNOWN_CLASSES } from "../utils/sampleData";

// ─── Known subject keywords for detection ─────────────────────────────────────

const KNOWN_SUBJECTS = [
  "French",
  "History",
  "Mathematics",
  "Maths",
  "Science",
  "English",
  "Biology",
  "Physics",
  "Chemistry",
  "Geography",
];

// ─── Subject detection logic ──────────────────────────────────────────────────

type DetectionConfidence = "high" | "medium" | "none";

interface SubjectDetectionResult {
  subject: string | null;
  source: string;
  confidence: DetectionConfidence;
}

function detectSubjectFromText(text: string): string | null {
  if (!text) return null;
  const lower = text.toLowerCase();
  for (const s of KNOWN_SUBJECTS) {
    if (lower.includes(s.toLowerCase())) return s;
  }
  // Also check for "Subject: X" pattern
  const subjectPattern = /subject[:\s]+([a-z]+)/i.exec(text);
  if (subjectPattern) return subjectPattern[1];
  return null;
}

function detectClassFromText(text: string): string | null {
  if (!text) return null;
  const lower = text.toLowerCase();
  if (lower.includes("year 8")) return "Year 8";
  if (lower.includes("year 9")) return "Year 9";
  if (lower.includes("form 3")) return "Form 3";
  if (lower.includes("grade 10")) return "Grade 10";
  return null;
}

function detectSubject(
  sheetName: string | null,
  fileName: string,
  titleRows: (string | number)[][],
): SubjectDetectionResult {
  // 1. Sheet name (skip generic names)
  const genericSheetNames = [
    "sheet1",
    "sheet2",
    "sheet3",
    "marks",
    "data",
    "students",
  ];
  if (sheetName && !genericSheetNames.includes(sheetName.toLowerCase())) {
    const fromSheet = detectSubjectFromText(sheetName);
    if (fromSheet) {
      return {
        subject: fromSheet,
        source: `sheet name "${sheetName}"`,
        confidence: "high",
      };
    }
    // Sheet name is non-generic but no known keyword matched — use it directly
    if (sheetName.length > 1 && sheetName.length < 40) {
      return { subject: sheetName, source: "sheet name", confidence: "medium" };
    }
  }

  // 2. Title cell — scan first 5 rows for a cell that looks like a subject header
  for (let r = 0; r < Math.min(titleRows.length, 5); r++) {
    for (const cell of titleRows[r]) {
      const cellStr = String(cell ?? "").trim();
      if (!cellStr || cellStr.length < 2) continue;
      const fromCell = detectSubjectFromText(cellStr);
      if (fromCell) {
        return {
          subject: fromCell,
          source: `title cell "${cellStr}"`,
          confidence: "high",
        };
      }
    }
  }

  // 3. Filename
  const baseName = fileName.replace(/\.[^.]+$/, "").replace(/[_\-]/g, " ");
  const fromFile = detectSubjectFromText(baseName);
  if (fromFile) {
    return { subject: fromFile, source: "filename", confidence: "medium" };
  }

  return { subject: null, source: "", confidence: "none" };
}

// ─── Wide format (one row per student per subject, 6 score columns) ───────────

const WIDE_SCORE_COLS = [
  "T1 Entry",
  "T1 Midterm",
  "T1 Endterm",
  "T2 Entry",
  "T2 Midterm",
  "T2 Endterm",
] as const;
type WideScoreCol = (typeof WIDE_SCORE_COLS)[number];

const WIDE_COL_TERM: Record<WideScoreCol, string> = {
  "T1 Entry": "Term 1",
  "T1 Midterm": "Term 1",
  "T1 Endterm": "Term 1",
  "T2 Entry": "Term 2",
  "T2 Midterm": "Term 2",
  "T2 Endterm": "Term 2",
};

// Column aliases for flexible matching
const NAME_ALIASES = [
  "student name",
  "name",
  "student",
  "learner name",
  "learner",
];
const CLASS_ALIASES = ["class", "grade", "year group", "form"];
const T1_ENTRY_ALIASES = [
  "t1 entry",
  "entry t1",
  "term 1 entry",
  "exam 1",
  "t1entry",
];
const T1_MID_ALIASES = [
  "t1 midterm",
  "midterm t1",
  "term 1 midterm",
  "exam 2",
  "mid t1",
  "t1 mid",
  "t1midterm",
];
const T1_END_ALIASES = [
  "t1 endterm",
  "endterm t1",
  "term 1 endterm",
  "exam 3",
  "end t1",
  "final t1",
  "t1 end",
  "t1endterm",
];
const T2_ENTRY_ALIASES = [
  "t2 entry",
  "entry t2",
  "term 2 entry",
  "exam 4",
  "t2entry",
];
const T2_MID_ALIASES = [
  "t2 midterm",
  "midterm t2",
  "term 2 midterm",
  "exam 5",
  "mid t2",
  "t2 mid",
  "t2midterm",
];
const T2_END_ALIASES = [
  "t2 endterm",
  "endterm t2",
  "term 2 endterm",
  "exam 6",
  "end t2",
  "final t2",
  "t2 end",
  "t2endterm",
];
const T1_AVG_ALIASES = [
  "t1 average",
  "t1 avg",
  "term 1 avg",
  "term 1 average",
  "t1avg",
];
const T2_AVG_ALIASES = [
  "t2 average",
  "t2 avg",
  "term 2 avg",
  "term 2 average",
  "t2avg",
];
const OVERALL_AVG_ALIASES = [
  "average",
  "avg",
  "overall avg",
  "overall average",
  "termly average",
];

function matchColAlias(headerLower: string, aliases: string[]): boolean {
  return aliases.some((a) => a === headerLower || headerLower.includes(a));
}

interface ParsedRowWide {
  rowIndex: number;
  studentName: string;
  grade: string;
  subjectName: string; // from detection, not the file
  t1Entry: number | null;
  t1Midterm: number | null;
  t1Endterm: number | null;
  t2Entry: number | null;
  t2Midterm: number | null;
  t2Endterm: number | null;
  t1Avg: number | null; // read-only computed column
  t2Avg: number | null; // read-only computed column
  maxScore: number;
  issues: string[];
  valid: boolean;
}

// ─── Flat format (one row per mark) ──────────────────────────────────────────

interface ParsedRowFlat {
  rowIndex: number;
  studentName: string;
  grade: string;
  subjectName: string;
  assessmentName: string;
  term: string;
  date: string;
  score: number;
  maxScore: number;
  issues: string[];
  valid: boolean;
}

const FLAT_COLUMNS = [
  "Student Name",
  "Grade",
  "Subject",
  "Assessment Name",
  "Term",
  "Date",
  "Score",
  "Max Score",
];

// ─── Types ────────────────────────────────────────────────────────────────────

type FormatMode = "wide" | "flat";
type Step = 1 | 2 | 3;

// ─── Component ────────────────────────────────────────────────────────────────

export default function ImportPage() {
  const { data: students } = useStudents();
  const { data: subjects } = useSubjects();
  const { data: assessments } = useAssessments();
  const { actor, isFetching: actorLoading } = useActor();
  const importMarks = useImportMarks();

  const [formatMode, setFormatMode] = useState<FormatMode>("wide");
  const [step, setStep] = useState<Step>(1);
  const [parsedWide, setParsedWide] = useState<ParsedRowWide[]>([]);
  const [parsedFlat, setParsedFlat] = useState<ParsedRowFlat[]>([]);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: number;
    errors: number;
  } | null>(null);
  const [fileName, setFileName] = useState("");

  // Subject detection state
  const [detectedSubject, setDetectedSubject] =
    useState<SubjectDetectionResult | null>(null);
  const [confirmedSubject, setConfirmedSubject] = useState<string>("");
  const [editingSubject, setEditingSubject] = useState(false);
  const [subjectInput, setSubjectInput] = useState("");

  // Class detection state (used as fallback when row has no class)
  const [detectedClass, setDetectedClass] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Wide format parsing ──────────────────────────────────────────────────

  const parseWideRows = (
    aoa: (string | number)[][],
    subject: string,
    detectedCls: string | null,
  ): ParsedRowWide[] => {
    if (aoa.length === 0) return [];

    const headerRow = aoa[0].map((c) => String(c ?? "").trim());
    const headerLowers = headerRow.map((h) => h.toLowerCase());

    const findCol = (aliases: string[]): number => {
      return headerLowers.findIndex((h) => matchColAlias(h, aliases));
    };

    const nameIdx = findCol(NAME_ALIASES);
    const classIdx = findCol(CLASS_ALIASES);
    const t1EntryIdx = findCol(T1_ENTRY_ALIASES);
    const t1MidIdx = findCol(T1_MID_ALIASES);
    const t1EndIdx = findCol(T1_END_ALIASES);
    const t2EntryIdx = findCol(T2_ENTRY_ALIASES);
    const t2MidIdx = findCol(T2_MID_ALIASES);
    const t2EndIdx = findCol(T2_END_ALIASES);
    const t1AvgIdx = findCol(T1_AVG_ALIASES);
    const t2AvgIdx = findCol(T2_AVG_ALIASES);
    const overallAvgIdx = findCol(OVERALL_AVG_ALIASES);

    // Detect optional max-score row (row 1)
    const maxScores: Record<string, number> = {
      "T1 Entry": 100,
      "T1 Midterm": 100,
      "T1 Endterm": 100,
      "T2 Entry": 100,
      "T2 Midterm": 100,
      "T2 Endterm": 100,
    };

    let dataStartRow = 1;
    if (aoa.length > 1) {
      const row1 = aoa[1];
      const firstValidIdx =
        [t1EntryIdx, t1MidIdx, t1EndIdx, t2EntryIdx, t2MidIdx, t2EndIdx].find(
          (i) => i >= 0,
        ) ?? -1;
      if (
        firstValidIdx >= 0 &&
        row1[firstValidIdx] !== "" &&
        !Number.isNaN(Number(row1[firstValidIdx]))
      ) {
        const idxMap: [number, string][] = [
          [t1EntryIdx, "T1 Entry"],
          [t1MidIdx, "T1 Midterm"],
          [t1EndIdx, "T1 Endterm"],
          [t2EntryIdx, "T2 Entry"],
          [t2MidIdx, "T2 Midterm"],
          [t2EndIdx, "T2 Endterm"],
        ];
        for (const [idx, col] of idxMap) {
          if (idx >= 0 && idx < row1.length) {
            const val = Number(row1[idx]);
            if (!Number.isNaN(val) && val > 0) maxScores[col] = val;
          }
        }
        dataStartRow = 2;
      }
    }

    const getByIdx = (row: (string | number)[], idx: number): string => {
      if (idx < 0 || idx >= row.length) return "";
      return String(row[idx] ?? "").trim();
    };

    const parseScore = (
      row: (string | number)[],
      idx: number,
      colName: string,
      issues: string[],
    ): number | null => {
      if (idx < 0 || idx >= row.length) return null;
      const raw = row[idx];
      if (raw === "" || raw === undefined || raw === null) return null;
      const n = Number(raw);
      if (Number.isNaN(n) || n < 0) {
        issues.push(`Invalid score in "${colName}"`);
        return null;
      }
      return n;
    };

    const parseReadOnly = (
      row: (string | number)[],
      idx: number,
    ): number | null => {
      if (idx < 0 || idx >= row.length) return null;
      const raw = row[idx];
      if (raw === "" || raw === undefined || raw === null) return null;
      const n = Number(raw);
      return Number.isNaN(n) ? null : n;
    };

    return aoa
      .slice(dataStartRow)
      .map((row, i) => {
        const issues: string[] = [];

        const studentName = getByIdx(row, nameIdx);
        const rawGrade = getByIdx(row, classIdx);
        // Fall back to detected class if row has no grade
        const grade = rawGrade || detectedCls || "";

        if (!studentName) issues.push("Missing student name");
        if (!grade) {
          issues.push("Missing class");
        } else if (!(KNOWN_CLASSES as readonly string[]).includes(grade)) {
          issues.push(
            `Unknown class "${grade}" — expected: ${KNOWN_CLASSES.join(", ")}`,
          );
        } else {
          const cls = grade as (typeof KNOWN_CLASSES)[number];
          if (subject && !CLASS_SUBJECTS[cls].includes(subject)) {
            issues.push(`"${subject}" not taught in ${grade}`);
          }
        }
        if (!subject) issues.push("Missing subject — please enter it above");

        const t1Entry = parseScore(row, t1EntryIdx, "T1 Entry", issues);
        const t1Midterm = parseScore(row, t1MidIdx, "T1 Midterm", issues);
        const t1Endterm = parseScore(row, t1EndIdx, "T1 Endterm", issues);
        const t2Entry = parseScore(row, t2EntryIdx, "T2 Entry", issues);
        const t2Midterm = parseScore(row, t2MidIdx, "T2 Midterm", issues);
        const t2Endterm = parseScore(row, t2EndIdx, "T2 Endterm", issues);

        const t1Avg =
          t1AvgIdx >= 0
            ? parseReadOnly(row, t1AvgIdx)
            : overallAvgIdx >= 0
              ? parseReadOnly(row, overallAvgIdx)
              : null;
        const t2Avg = t2AvgIdx >= 0 ? parseReadOnly(row, t2AvgIdx) : null;

        const maxScore = maxScores["T1 Entry"] ?? 100;

        return {
          rowIndex: dataStartRow + i + 2,
          studentName,
          grade,
          subjectName: subject,
          t1Entry,
          t1Midterm,
          t1Endterm,
          t2Entry,
          t2Midterm,
          t2Endterm,
          t1Avg,
          t2Avg,
          maxScore,
          issues,
          valid: issues.length === 0,
        };
      })
      .filter((r) => r.studentName !== "");
  };

  // ── Flat format parsing ──────────────────────────────────────────────────

  const parseFlatRows = (
    records: Record<string, string | number>[],
  ): ParsedRowFlat[] => {
    return records
      .map((row, i) => {
        const issues: string[] = [];

        const studentName = String(row["Student Name"] ?? "").trim();
        const grade = String(row.Grade ?? "").trim();
        const subjectName = String(row.Subject ?? "").trim();
        const assessmentName = String(row["Assessment Name"] ?? "").trim();
        const term = String(row.Term ?? "").trim();
        const date = String(row.Date ?? "").trim();
        const score = Number(row.Score);
        const maxScore = Number(row["Max Score"]);

        if (!studentName) issues.push("Missing student name");
        if (!grade) issues.push("Missing grade");
        else if (!(KNOWN_CLASSES as readonly string[]).includes(grade)) {
          issues.push(
            `Unknown class "${grade}" — expected: ${KNOWN_CLASSES.join(", ")}`,
          );
        } else {
          const cls = grade as (typeof KNOWN_CLASSES)[number];
          if (subjectName && !CLASS_SUBJECTS[cls].includes(subjectName)) {
            issues.push(`"${subjectName}" not taught in ${grade}`);
          }
        }
        if (!subjectName) issues.push("Missing subject");
        if (!assessmentName) issues.push("Missing assessment name");
        if (!term) issues.push("Missing term");
        if (!date) issues.push("Missing date");
        if (Number.isNaN(score) || score < 0) issues.push("Invalid score");
        if (Number.isNaN(maxScore) || maxScore <= 0)
          issues.push("Invalid max score");
        if (!Number.isNaN(score) && !Number.isNaN(maxScore) && score > maxScore)
          issues.push("Score exceeds max score");

        return {
          rowIndex: i + 2,
          studentName,
          grade,
          subjectName,
          assessmentName,
          term,
          date,
          score,
          maxScore,
          issues,
          valid: issues.length === 0,
        };
      })
      .filter((r) => r.studentName !== "");
  };

  // ── File upload handler ──────────────────────────────────────────────────

  const handleFileUpload = async (file: File) => {
    setFileName(file.name);
    try {
      const result = await parseSpreadsheet(file);
      const { data: aoa, sheetName } = result;

      if (formatMode === "wide") {
        // Run subject and class detection
        const detection = detectSubject(sheetName, file.name, aoa);
        const cls = sheetName
          ? detectClassFromText(sheetName)
          : detectClassFromText(
              file.name.replace(/\.[^.]+$/, "").replace(/[_\-]/g, " "),
            );

        setDetectedSubject(detection);
        setDetectedClass(cls);
        const subject = detection.subject ?? "";
        setConfirmedSubject(subject);
        setSubjectInput(subject);
        setEditingSubject(detection.confidence === "none");

        const rows = parseWideRows(aoa, subject, cls);
        setParsedWide(rows);
      } else {
        const records = aoaToRecords(aoa, 0);
        const rows = parseFlatRows(records);
        setParsedFlat(rows);
      }
      setStep(2);
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Failed to parse file. Please check the format.",
      );
      console.error(err);
    }
  };

  // ── When confirmed subject changes, re-parse wide rows ──────────────────

  const handleSubjectConfirm = (subject: string) => {
    setConfirmedSubject(subject);
    setEditingSubject(false);
    // Re-parse with the new subject name using existing parsed rows
    setParsedWide((prev) =>
      prev.map((r) => {
        const issues: string[] = [];
        if (!r.studentName) issues.push("Missing student name");
        if (!r.grade) {
          issues.push("Missing class");
        } else if (!(KNOWN_CLASSES as readonly string[]).includes(r.grade)) {
          issues.push(
            `Unknown class "${r.grade}" — expected: ${KNOWN_CLASSES.join(", ")}`,
          );
        } else {
          const cls = r.grade as (typeof KNOWN_CLASSES)[number];
          if (subject && !CLASS_SUBJECTS[cls].includes(subject)) {
            issues.push(`"${subject}" not taught in ${r.grade}`);
          }
        }
        if (!subject) issues.push("Missing subject — please enter it above");
        return {
          ...r,
          subjectName: subject,
          issues,
          valid: issues.length === 0,
        };
      }),
    );
  };

  // ── Import logic (wide) ──────────────────────────────────────────────────

  const importWide = async () => {
    if (!actor) {
      toast.error(
        "Backend is not ready yet. Please wait a moment and try again.",
      );
      return;
    }
    setImporting(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      const validRows = parsedWide.filter((r) => r.valid);

      const uniqueStudentKeys = [
        ...new Set(validRows.map((r) => `${r.studentName}|||${r.grade}`)),
      ];
      const uniqueSubjectNames = [
        ...new Set(validRows.map((r) => r.subjectName)),
      ];

      // One assessment per (col, term, maxScore)
      const sampleMaxScore = validRows[0]?.maxScore ?? 100;
      const uniqueAssessmentKeys = WIDE_SCORE_COLS.map(
        (col) => `${col}|||${WIDE_COL_TERM[col]}|||${sampleMaxScore}`,
      );

      // Get or create students (parallel)
      const studentMap = new Map<string, bigint>();
      const existingStudents = students ?? [];
      await Promise.all(
        uniqueStudentKeys.map(async (key) => {
          const [name, grade] = key.split("|||");
          const existing = existingStudents.find(
            (s) => s.name.toLowerCase() === name.toLowerCase(),
          );
          const id = existing
            ? existing.id
            : await actor.createStudent(name, grade);
          studentMap.set(key, id);
        }),
      );

      // Get or create subjects (parallel)
      const subjectMap = new Map<string, bigint>();
      const existingSubjects = subjects ?? [];
      await Promise.all(
        uniqueSubjectNames.map(async (name) => {
          const existing = existingSubjects.find(
            (s) => s.name.toLowerCase() === name.toLowerCase(),
          );
          const id = existing ? existing.id : await actor.createSubject(name);
          subjectMap.set(name, id);
        }),
      );

      // Get or create assessments (parallel)
      const assessmentMap = new Map<string, bigint>();
      const existingAssessments = assessments ?? [];
      await Promise.all(
        uniqueAssessmentKeys.map(async (key) => {
          const [name, term, maxScoreStr] = key.split("|||");
          const existing = existingAssessments.find(
            (a) =>
              a.name.toLowerCase() === name.toLowerCase() && a.term === term,
          );
          const id = existing
            ? existing.id
            : await actor.createAssessment(
                name,
                term,
                "",
                BigInt(Math.round(Number(maxScoreStr))),
              );
          assessmentMap.set(key, id);
        }),
      );

      // Build marks — skip null scores (student was absent)
      const marks: Mark[] = [];
      for (const row of validRows) {
        const studentKey = `${row.studentName}|||${row.grade}`;
        const studentId = studentMap.get(studentKey);
        const subjectId = subjectMap.get(row.subjectName);
        if (studentId === undefined || subjectId === undefined) {
          errorCount++;
          continue;
        }

        const scoreEntries: [WideScoreCol, number | null][] = [
          ["T1 Entry", row.t1Entry],
          ["T1 Midterm", row.t1Midterm],
          ["T1 Endterm", row.t1Endterm],
          ["T2 Entry", row.t2Entry],
          ["T2 Midterm", row.t2Midterm],
          ["T2 Endterm", row.t2Endterm],
        ];

        for (const [col, score] of scoreEntries) {
          if (score === null) continue; // absent — skip
          const assessmentKey = `${col}|||${WIDE_COL_TERM[col]}|||${row.maxScore}`;
          const assessmentId = assessmentMap.get(assessmentKey);
          if (assessmentId === undefined) {
            errorCount++;
            continue;
          }
          marks.push({
            studentId,
            subjectId,
            assessmentId,
            score: BigInt(Math.round(score)),
          });
          successCount++;
        }
      }

      if (marks.length > 0) await importMarks.mutateAsync(marks);
      setImportResult({ success: successCount, errors: errorCount });
      setStep(3);
    } catch (err) {
      console.error(err);
      toast.error("Import failed. Please try again.");
    } finally {
      setImporting(false);
    }
  };

  // ── Import logic (flat) ──────────────────────────────────────────────────

  const importFlat = async () => {
    if (!actor) {
      toast.error(
        "Backend is not ready yet. Please wait a moment and try again.",
      );
      return;
    }
    setImporting(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      const validRows = parsedFlat.filter((r) => r.valid);

      const uniqueStudentNames = [
        ...new Set(validRows.map((r) => `${r.studentName}|||${r.grade}`)),
      ];
      const uniqueSubjectNames = [
        ...new Set(validRows.map((r) => r.subjectName)),
      ];
      const uniqueAssessmentKeys = [
        ...new Set(
          validRows.map(
            (r) =>
              `${r.assessmentName}|||${r.term}|||${r.date}|||${r.maxScore}`,
          ),
        ),
      ];

      const studentMap = new Map<string, bigint>();
      const existingStudents = students ?? [];
      await Promise.all(
        uniqueStudentNames.map(async (key) => {
          const [name, grade] = key.split("|||");
          const existing = existingStudents.find(
            (s) => s.name.toLowerCase() === name.toLowerCase(),
          );
          const id = existing
            ? existing.id
            : await actor.createStudent(name, grade);
          studentMap.set(key, id);
        }),
      );

      const subjectMap = new Map<string, bigint>();
      const existingSubjects = subjects ?? [];
      await Promise.all(
        uniqueSubjectNames.map(async (name) => {
          const existing = existingSubjects.find(
            (s) => s.name.toLowerCase() === name.toLowerCase(),
          );
          const id = existing ? existing.id : await actor.createSubject(name);
          subjectMap.set(name, id);
        }),
      );

      const assessmentMap = new Map<string, bigint>();
      const existingAssessments = assessments ?? [];
      await Promise.all(
        uniqueAssessmentKeys.map(async (key) => {
          const [name, term, date, maxScoreStr] = key.split("|||");
          const existing = existingAssessments.find(
            (a) =>
              a.name.toLowerCase() === name.toLowerCase() && a.term === term,
          );
          const id = existing
            ? existing.id
            : await actor.createAssessment(
                name,
                term,
                date,
                BigInt(Math.round(Number(maxScoreStr))),
              );
          assessmentMap.set(key, id);
        }),
      );

      const marks: Mark[] = [];
      for (const row of validRows) {
        const studentKey = `${row.studentName}|||${row.grade}`;
        const assessmentKey = `${row.assessmentName}|||${row.term}|||${row.date}|||${row.maxScore}`;
        const studentId = studentMap.get(studentKey);
        const subjectId = subjectMap.get(row.subjectName);
        const assessmentId = assessmentMap.get(assessmentKey);

        if (
          studentId !== undefined &&
          subjectId !== undefined &&
          assessmentId !== undefined
        ) {
          marks.push({
            studentId,
            subjectId,
            assessmentId,
            score: BigInt(Math.round(row.score)),
          });
          successCount++;
        } else {
          errorCount++;
        }
      }

      if (marks.length > 0) await importMarks.mutateAsync(marks);
      setImportResult({ success: successCount, errors: errorCount });
      setStep(3);
    } catch (err) {
      console.error(err);
      toast.error("Import failed. Please try again.");
    } finally {
      setImporting(false);
    }
  };

  const handleConfirmImport = () => {
    if (formatMode === "wide") return importWide();
    return importFlat();
  };

  // ── Reset ────────────────────────────────────────────────────────────────

  const handleReset = () => {
    setStep(1);
    setParsedWide([]);
    setParsedFlat([]);
    setImportResult(null);
    setFileName("");
    setDetectedSubject(null);
    setConfirmedSubject("");
    setSubjectInput("");
    setEditingSubject(false);
    setDetectedClass(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── Template download ────────────────────────────────────────────────────

  const downloadTemplate = () => {
    if (formatMode === "wide") {
      const aoa: (string | number)[][] = [
        [
          "Student Name",
          "Class",
          "T1 Entry",
          "T1 Midterm",
          "T1 Endterm",
          "T1 Average",
          "T2 Entry",
          "T2 Midterm",
          "T2 Endterm",
          "T2 Average",
        ],
        ["Max Score:", "", 100, 100, 100, "", 100, 100, 100, ""],
        ["Oliver Bennett", "Year 9", 43, 38, 45, 42, 41, 39, 44, 41.3],
        ["Camille Dubois", "Year 9", 30, 28, 32, 30, 29, 31, 35, 31.7],
        ["Lucas Fontaine", "Year 9", 35, 33, 37, 35, 34, 36, 39, 36.3],
        ["Zoe Lambert", "Year 9", 38, 36, 41, 38.3, 37, 40, 43, 40],
      ];
      const blob = generateXlsx(aoa, "French");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "French-marks-template.xlsx";
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const aoa: (string | number)[][] = [
        [
          "Student Name",
          "Grade",
          "Subject",
          "Assessment Name",
          "Term",
          "Date",
          "Score",
          "Max Score",
        ],
        [
          "Oliver Bennett",
          "Year 9",
          "French",
          "T1 Entry",
          "Term 1",
          "2025-02-14",
          43,
          100,
        ],
        [
          "Camille Dubois",
          "Year 9",
          "French",
          "T1 Entry",
          "Term 1",
          "2025-02-14",
          30,
          100,
        ],
        [
          "Oliver Bennett",
          "Year 9",
          "French",
          "T1 Midterm",
          "Term 1",
          "2025-03-05",
          38,
          100,
        ],
        [
          "Camille Dubois",
          "Year 9",
          "French",
          "T1 Midterm",
          "Term 1",
          "2025-03-05",
          28,
          100,
        ],
      ];
      const blob = generateXlsx(aoa, "French");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "student-marks-flat-template.xlsx";
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  // ── Derived counts ───────────────────────────────────────────────────────

  const parsedRows = formatMode === "wide" ? parsedWide : parsedFlat;
  const validCount = parsedRows.filter((r) => r.valid).length;
  const invalidCount = parsedRows.filter((r) => !r.valid).length;
  const stepLabels = ["Upload File", "Preview Data", "Complete"];

  const wideMarkCount = parsedWide
    .filter((r) => r.valid)
    .reduce((sum, r) => {
      return (
        sum +
        [
          r.t1Entry,
          r.t1Midterm,
          r.t1Endterm,
          r.t2Entry,
          r.t2Midterm,
          r.t2Endterm,
        ].filter((v) => v !== null).length
      );
    }, 0);

  const importCount = formatMode === "wide" ? wideMarkCount : validCount;

  // ── Detection banner ─────────────────────────────────────────────────────

  const renderDetectionBanner = () => {
    if (!detectedSubject) return null;

    const { confidence } = detectedSubject;

    const bannerClass =
      confidence === "high"
        ? "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-300"
        : confidence === "medium"
          ? "bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-300"
          : "bg-orange-50 border-orange-200 text-orange-800 dark:bg-orange-950/30 dark:border-orange-800 dark:text-orange-300";

    const icon =
      confidence === "high" ? (
        <CheckCircle className="h-4 w-4 flex-shrink-0" />
      ) : (
        <AlertCircle className="h-4 w-4 flex-shrink-0" />
      );

    return (
      <div className={`rounded-lg border p-3 ${bannerClass}`}>
        <div className="flex flex-wrap items-start gap-3">
          <div className="flex items-start gap-2 flex-1 min-w-0">
            {icon}
            <div className="min-w-0">
              {confidence === "none" ? (
                <p className="text-sm font-medium">
                  Could not detect subject — please enter it below
                </p>
              ) : (
                <p className="text-sm font-medium">
                  {confidence === "high" ? "Detected" : "Guessed"}:{" "}
                  <strong>{confirmedSubject || detectedSubject.subject}</strong>
                  {detectedSubject.source && (
                    <span className="font-normal opacity-75">
                      {" "}
                      (from {detectedSubject.source})
                    </span>
                  )}
                  {confidence === "medium" && " — is this correct?"}
                </p>
              )}
              {detectedClass && (
                <p className="mt-0.5 text-xs opacity-75">
                  Class detected: {detectedClass}
                </p>
              )}
            </div>
          </div>

          {!editingSubject && (
            <button
              type="button"
              onClick={() => {
                setEditingSubject(true);
                setSubjectInput(confirmedSubject);
              }}
              className="flex items-center gap-1 text-xs font-medium underline underline-offset-2 hover:opacity-80 flex-shrink-0"
            >
              <Edit2 className="h-3 w-3" />
              Edit
            </button>
          )}
        </div>

        {editingSubject && (
          <div className="mt-3 flex flex-wrap items-end gap-2">
            <div className="flex-1 min-w-[180px] space-y-1">
              <Label htmlFor="subject-input" className="text-xs font-medium">
                Subject name
              </Label>
              <div className="flex gap-2">
                <Select
                  value={
                    KNOWN_SUBJECTS.includes(subjectInput) ? subjectInput : ""
                  }
                  onValueChange={(v) => {
                    if (v) setSubjectInput(v);
                  }}
                >
                  <SelectTrigger className="h-8 bg-white/80 text-sm dark:bg-black/20">
                    <SelectValue placeholder="Select…" />
                  </SelectTrigger>
                  <SelectContent>
                    {KNOWN_SUBJECTS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-xs self-center opacity-60">or</span>
                <Input
                  id="subject-input"
                  placeholder="Type subject name"
                  value={subjectInput}
                  onChange={(e) => setSubjectInput(e.target.value)}
                  className="h-8 text-sm bg-white/80 dark:bg-black/20 flex-1 min-w-[120px]"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && subjectInput.trim()) {
                      handleSubjectConfirm(subjectInput.trim());
                    }
                  }}
                />
              </div>
            </div>
            <Button
              size="sm"
              className="h-8"
              disabled={!subjectInput.trim()}
              onClick={() => handleSubjectConfirm(subjectInput.trim())}
            >
              Confirm
            </Button>
          </div>
        )}
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 p-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">
          Import Marks
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload your Excel spreadsheet to bulk import student marks
        </p>
      </div>

      {/* Progress steps */}
      <div className="flex items-center gap-2">
        {stepLabels.map((label, i) => {
          const stepNum = (i + 1) as Step;
          const isActive = step === stepNum;
          const isDone = step > stepNum;
          return (
            <div key={label} className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                    isDone
                      ? "bg-success text-success-foreground"
                      : isActive
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {isDone ? <CheckCircle className="h-4 w-4" /> : stepNum}
                </div>
                <span
                  className={`text-sm font-medium ${isActive ? "text-foreground" : "text-muted-foreground"}`}
                >
                  {label}
                </span>
              </div>
              {i < stepLabels.length - 1 && (
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          );
        })}
      </div>

      {/* Step 1: Upload */}
      {step === 1 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Format toggle */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="font-display text-sm font-semibold">
                Choose Import Format
              </CardTitle>
            </CardHeader>
            <CardContent className="flex gap-3 flex-wrap">
              <button
                type="button"
                onClick={() => setFormatMode("wide")}
                className={`flex-1 min-w-[200px] rounded-lg border-2 p-4 text-left transition-colors ${
                  formatMode === "wide"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/40"
                }`}
              >
                <p className="font-semibold text-sm text-foreground">
                  Wide Format
                  {formatMode === "wide" && (
                    <Badge className="ml-2 text-xs" variant="default">
                      Selected
                    </Badge>
                  )}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  One row per student — columns for T1 Entry, T1 Midterm, T1
                  Endterm, T2 Entry, T2 Midterm, T2 Endterm. Subject detected
                  automatically from sheet name.
                </p>
                <p className="mt-1 text-xs font-medium text-primary">
                  Recommended — matches your Excel file
                </p>
              </button>
              <button
                type="button"
                onClick={() => setFormatMode("flat")}
                className={`flex-1 min-w-[200px] rounded-lg border-2 p-4 text-left transition-colors ${
                  formatMode === "flat"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/40"
                }`}
              >
                <p className="font-semibold text-sm text-foreground">
                  Flat Format
                  {formatMode === "flat" && (
                    <Badge className="ml-2 text-xs" variant="default">
                      Selected
                    </Badge>
                  )}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  One row per individual mark — columns: Student Name, Grade,
                  Subject, Assessment Name, Term, Date, Score, Max Score
                </p>
              </button>
            </CardContent>
          </Card>

          {/* Drop zone */}
          <Card>
            <CardContent className="p-6">
              <label
                htmlFor="file-upload"
                className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30 p-12 transition-colors hover:border-primary/50 hover:bg-primary/5"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files[0];
                  if (file) void handleFileUpload(file);
                }}
              >
                <FileSpreadsheet className="mb-4 h-12 w-12 text-muted-foreground" />
                <p className="font-medium text-foreground">
                  Drop your Excel file here
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  or click to browse
                </p>
                <p className="mt-3 text-xs text-muted-foreground">
                  Supports .xlsx and .csv files
                </p>
                <input
                  id="file-upload"
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".xlsx,.xls,.csv"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void handleFileUpload(file);
                  }}
                />
              </label>
            </CardContent>
          </Card>

          {/* Format instructions */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="font-display text-sm font-semibold">
                {formatMode === "wide" ? "Wide Format" : "Flat Format"} —
                Expected Columns
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {formatMode === "wide" ? (
                <>
                  <p className="text-xs text-muted-foreground">
                    Each row represents <strong>one student's scores</strong>.
                    The subject is detected automatically from the{" "}
                    <strong>sheet/tab name</strong>, a title cell, or the
                    filename — no Subject column needed. Blank score cells are
                    treated as absent (not zero).
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {["Student Name", "Class"].map((col) => (
                      <Badge
                        key={col}
                        variant="outline"
                        className="font-mono text-xs"
                      >
                        {col}
                      </Badge>
                    ))}
                    {WIDE_SCORE_COLS.map((col) => (
                      <Badge
                        key={col}
                        variant="secondary"
                        className="font-mono text-xs"
                      >
                        {col}
                      </Badge>
                    ))}
                    <Badge
                      variant="outline"
                      className="font-mono text-xs text-muted-foreground"
                    >
                      T1 Average (read-only)
                    </Badge>
                    <Badge
                      variant="outline"
                      className="font-mono text-xs text-muted-foreground"
                    >
                      T2 Average (read-only)
                    </Badge>
                  </div>
                  <div className="rounded-md bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800 space-y-1 dark:bg-emerald-950/20 dark:border-emerald-800 dark:text-emerald-300">
                    <p className="font-semibold">Automatic subject detection</p>
                    <p>
                      Name your Excel sheet tab (e.g.{" "}
                      <code className="rounded bg-emerald-100 px-1 dark:bg-emerald-900/40">
                        French
                      </code>{" "}
                      or{" "}
                      <code className="rounded bg-emerald-100 px-1 dark:bg-emerald-900/40">
                        Year 9 French
                      </code>
                      ) and the subject will be detected automatically. You can
                      always override it after upload.
                    </p>
                  </div>
                  <div className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground space-y-1">
                    <p className="font-semibold text-foreground">
                      Optional max-score row
                    </p>
                    <p>
                      You can add a second row (before the student data) with
                      label{" "}
                      <code className="rounded bg-muted px-1">Max Score:</code>{" "}
                      in column A and the max score values in the score columns
                      (default: 100).
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-xs text-muted-foreground">
                    Each row is <strong>one mark record</strong> for one
                    student, subject, and assessment.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {FLAT_COLUMNS.map((col) => (
                      <Badge
                        key={col}
                        variant="secondary"
                        className="font-mono text-xs"
                      >
                        {col}
                      </Badge>
                    ))}
                  </div>
                </>
              )}
              <div className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground space-y-1">
                <p className="font-semibold text-foreground">
                  Accepted Class Names (
                  {formatMode === "wide" ? "Class" : "Grade"} column):
                </p>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {KNOWN_CLASSES.map((cls) => (
                    <Badge key={cls} variant="outline" className="text-xs">
                      {cls}
                    </Badge>
                  ))}
                </div>
                <p className="mt-2">
                  <span className="font-semibold">Year 8:</span> History, French
                  ·{" "}
                  <span className="font-semibold">
                    Year 9 / Form 3 / Grade 10:
                  </span>{" "}
                  French only
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={downloadTemplate}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Download {formatMode === "wide" ? "Wide" : "Flat"} Template
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Step 2: Preview */}
      {step === 2 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Subject detection banner (wide mode only) */}
          {formatMode === "wide" && renderDetectionBanner()}

          {/* Summary */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 rounded-lg bg-card border border-border px-4 py-2">
              <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">
                {fileName}
              </span>
              <Badge variant="outline" className="text-xs">
                {formatMode === "wide" ? "Wide" : "Flat"} format
              </Badge>
            </div>
            <Badge variant="default" className="gap-1">
              <CheckCircle className="h-3 w-3" />
              {validCount} valid {formatMode === "wide" ? "rows" : "records"}
            </Badge>
            {formatMode === "wide" && (
              <Badge variant="secondary" className="gap-1">
                {wideMarkCount} total marks
              </Badge>
            )}
            {invalidCount > 0 && (
              <Badge variant="destructive" className="gap-1">
                <AlertCircle className="h-3 w-3" />
                {invalidCount} with issues
              </Badge>
            )}
          </div>

          {/* Preview table — wide */}
          {formatMode === "wide" && (
            <Card>
              <CardContent className="p-0">
                <div className="max-h-96 overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-8">#</TableHead>
                        <TableHead>Student</TableHead>
                        <TableHead>Class</TableHead>
                        <TableHead className="text-right">T1 Entry</TableHead>
                        <TableHead className="text-right">T1 Mid</TableHead>
                        <TableHead className="text-right">T1 End</TableHead>
                        <TableHead className="text-right bg-muted/40 text-muted-foreground text-xs">
                          T1 Avg
                        </TableHead>
                        <TableHead className="text-right">T2 Entry</TableHead>
                        <TableHead className="text-right">T2 Mid</TableHead>
                        <TableHead className="text-right">T2 End</TableHead>
                        <TableHead className="text-right bg-muted/40 text-muted-foreground text-xs">
                          T2 Avg
                        </TableHead>
                        <TableHead className="text-right">Max</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedWide.slice(0, 100).map((row) => (
                        <TableRow
                          key={row.rowIndex}
                          className={row.valid ? "" : "bg-destructive/5"}
                        >
                          <TableCell className="text-xs text-muted-foreground">
                            {row.rowIndex}
                          </TableCell>
                          <TableCell className="font-medium text-sm">
                            {row.studentName || "—"}
                          </TableCell>
                          <TableCell className="text-sm">
                            {row.grade || "—"}
                          </TableCell>
                          {(
                            [
                              ["t1e", row.t1Entry],
                              ["t1m", row.t1Midterm],
                              ["t1n", row.t1Endterm],
                            ] as [string, number | null][]
                          ).map(([colKey, val]) => (
                            <TableCell
                              key={colKey}
                              className="text-right font-mono text-sm"
                            >
                              {val === null ? (
                                <span className="text-muted-foreground/40 italic text-xs">
                                  absent
                                </span>
                              ) : (
                                val
                              )}
                            </TableCell>
                          ))}
                          {/* T1 Average (read-only) */}
                          <TableCell className="text-right font-mono text-xs bg-muted/20 text-muted-foreground">
                            {row.t1Avg !== null ? (
                              row.t1Avg
                            ) : (
                              <span className="opacity-40">—</span>
                            )}
                          </TableCell>
                          {(
                            [
                              ["t2e", row.t2Entry],
                              ["t2m", row.t2Midterm],
                              ["t2n", row.t2Endterm],
                            ] as [string, number | null][]
                          ).map(([colKey, val]) => (
                            <TableCell
                              key={colKey}
                              className="text-right font-mono text-sm"
                            >
                              {val === null ? (
                                <span className="text-muted-foreground/40 italic text-xs">
                                  absent
                                </span>
                              ) : (
                                val
                              )}
                            </TableCell>
                          ))}
                          {/* T2 Average (read-only) */}
                          <TableCell className="text-right font-mono text-xs bg-muted/20 text-muted-foreground">
                            {row.t2Avg !== null ? (
                              row.t2Avg
                            ) : (
                              <span className="opacity-40">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm">
                            {row.maxScore}
                          </TableCell>
                          <TableCell>
                            {row.valid ? (
                              <CheckCircle className="h-4 w-4 text-success" />
                            ) : (
                              <div className="flex items-center gap-1">
                                <AlertCircle className="h-4 w-4 text-destructive" />
                                <span className="text-xs text-destructive">
                                  {row.issues[0]}
                                </span>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {parsedWide.length > 100 && (
                    <p className="p-4 text-center text-xs text-muted-foreground">
                      Showing first 100 of {parsedWide.length} rows
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Preview table — flat */}
          {formatMode === "flat" && (
            <Card>
              <CardContent className="p-0">
                <div className="max-h-96 overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-8">#</TableHead>
                        <TableHead>Student</TableHead>
                        <TableHead>Grade</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Assessment</TableHead>
                        <TableHead>Term</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Score</TableHead>
                        <TableHead className="text-right">Max</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedFlat.slice(0, 100).map((row) => (
                        <TableRow
                          key={row.rowIndex}
                          className={row.valid ? "" : "bg-destructive/5"}
                        >
                          <TableCell className="text-xs text-muted-foreground">
                            {row.rowIndex}
                          </TableCell>
                          <TableCell className="font-medium text-sm">
                            {row.studentName || "—"}
                          </TableCell>
                          <TableCell className="text-sm">
                            {row.grade || "—"}
                          </TableCell>
                          <TableCell className="text-sm">
                            {row.subjectName || "—"}
                          </TableCell>
                          <TableCell className="text-sm">
                            {row.assessmentName || "—"}
                          </TableCell>
                          <TableCell className="text-sm">
                            {row.term || "—"}
                          </TableCell>
                          <TableCell className="text-sm">
                            {row.date || "—"}
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm">
                            {Number.isNaN(row.score) ? "—" : row.score}
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm">
                            {Number.isNaN(row.maxScore) ? "—" : row.maxScore}
                          </TableCell>
                          <TableCell>
                            {row.valid ? (
                              <CheckCircle className="h-4 w-4 text-success" />
                            ) : (
                              <div className="flex items-center gap-1">
                                <AlertCircle className="h-4 w-4 text-destructive" />
                                <span className="text-xs text-destructive">
                                  {row.issues[0]}
                                </span>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {parsedFlat.length > 100 && (
                    <p className="p-4 text-center text-xs text-muted-foreground">
                      Showing first 100 of {parsedFlat.length} rows
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex gap-3">
            <Button variant="outline" onClick={handleReset}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Upload Different File
            </Button>
            <Button
              onClick={() => void handleConfirmImport()}
              disabled={
                importCount === 0 ||
                importing ||
                actorLoading ||
                !actor ||
                (formatMode === "wide" && editingSubject)
              }
              className="gap-2"
            >
              {importing || actorLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {importing
                ? "Importing..."
                : actorLoading || !actor
                  ? "Connecting..."
                  : `Import ${importCount} Mark${importCount === 1 ? "" : "s"}`}
            </Button>
            {formatMode === "wide" && editingSubject && (
              <p className="self-center text-xs text-amber-600">
                Please confirm the subject before importing
              </p>
            )}
            {!actorLoading && !actor && (
              <p className="self-center text-xs text-destructive">
                Not connected to backend — please refresh the page
              </p>
            )}
          </div>

          {importing && (
            <div className="space-y-2">
              <Progress value={undefined} className="h-2" />
              <p className="text-xs text-muted-foreground">
                Creating students, subjects, and assessments as needed...
              </p>
            </div>
          )}
        </motion.div>
      )}

      {/* Step 3: Complete */}
      {step === 3 && importResult && (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-6 py-12"
        >
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-success/10">
            <CheckCircle className="h-10 w-10 text-success" />
          </div>
          <div className="text-center">
            <h2 className="font-display text-2xl font-bold text-foreground">
              Import Complete!
            </h2>
            <p className="mt-2 text-muted-foreground">
              Successfully imported {importResult.success} mark records
              {importResult.errors > 0 && `, ${importResult.errors} failed`}.
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleReset}>
              Import Another File
            </Button>
            <Button asChild>
              <a href="/students">View Students</a>
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
