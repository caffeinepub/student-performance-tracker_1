import type { Assessment, Mark, Student, Subject } from "../backend.d";

// ─── Known classes and their subjects ────────────────────────────────────────
export const KNOWN_CLASSES = [
  "Year 8",
  "Year 9",
  "Form 3",
  "Grade 10",
] as const;
export type KnownClass = (typeof KNOWN_CLASSES)[number];

export const CLASS_SUBJECTS: Record<KnownClass, string[]> = {
  "Year 8": ["History", "French"],
  "Year 9": ["French"],
  "Form 3": ["French"],
  "Grade 10": ["French"],
};

// ─── Subjects ─────────────────────────────────────────────────────────────────
// id 1 = History, id 2 = French
export const SAMPLE_SUBJECTS: Subject[] = [
  { id: 1n, name: "History" },
  { id: 2n, name: "French" },
];

// ─── Students ─────────────────────────────────────────────────────────────────
// Year 8 (ids 1–4)
// Year 9 (ids 5–8)
// Form 3 (ids 9–12)
// Grade 10 (ids 13–16)
export const SAMPLE_STUDENTS: Student[] = [
  // Year 8
  { id: 1n, name: "Oliver Bennett", grade: "Year 8" },
  { id: 2n, name: "Sophie Clarke", grade: "Year 8" },
  { id: 3n, name: "James Thornton", grade: "Year 8" },
  { id: 4n, name: "Isabelle Marsh", grade: "Year 8" },
  // Year 9
  { id: 5n, name: "Lucas Fontaine", grade: "Year 9" },
  { id: 6n, name: "Camille Dubois", grade: "Year 9" },
  { id: 7n, name: "Ethan Rousseau", grade: "Year 9" },
  { id: 8n, name: "Zoe Lambert", grade: "Year 9" },
  // Form 3
  { id: 9n, name: "Amahle Dlamini", grade: "Form 3" },
  { id: 10n, name: "Sipho Nkosi", grade: "Form 3" },
  { id: 11n, name: "Lerato Molefe", grade: "Form 3" },
  { id: 12n, name: "Thabo Sithole", grade: "Form 3" },
  // Grade 10
  { id: 13n, name: "Naledi Khumalo", grade: "Grade 10" },
  { id: 14n, name: "Bongani Zulu", grade: "Grade 10" },
  { id: 15n, name: "Precious Ndlovu", grade: "Grade 10" },
  { id: 16n, name: "Kabelo Mokoena", grade: "Grade 10" },
];

// ─── Assessments ──────────────────────────────────────────────────────────────
// History assessments: ids 1–6 (Year 8 only)
// French assessments:  ids 7–12 (all classes)
//
// Per subject: T1 Entry, T1 Midterm, T1 Endterm, T2 Entry, T2 Midterm, T2 Endterm
export const SAMPLE_ASSESSMENTS: Assessment[] = [
  // History (Year 8)
  {
    id: 1n,
    name: "T1 Entry",
    term: "Term 1",
    date: "2025-02-10",
    maxScore: 100n,
  },
  {
    id: 2n,
    name: "T1 Midterm",
    term: "Term 1",
    date: "2025-03-01",
    maxScore: 100n,
  },
  {
    id: 3n,
    name: "T1 Endterm",
    term: "Term 1",
    date: "2025-03-28",
    maxScore: 100n,
  },
  {
    id: 4n,
    name: "T2 Entry",
    term: "Term 2",
    date: "2025-05-05",
    maxScore: 100n,
  },
  {
    id: 5n,
    name: "T2 Midterm",
    term: "Term 2",
    date: "2025-05-23",
    maxScore: 100n,
  },
  {
    id: 6n,
    name: "T2 Endterm",
    term: "Term 2",
    date: "2025-06-27",
    maxScore: 100n,
  },
  // French (all classes)
  {
    id: 7n,
    name: "T1 Entry",
    term: "Term 1",
    date: "2025-02-14",
    maxScore: 100n,
  },
  {
    id: 8n,
    name: "T1 Midterm",
    term: "Term 1",
    date: "2025-03-05",
    maxScore: 100n,
  },
  {
    id: 9n,
    name: "T1 Endterm",
    term: "Term 1",
    date: "2025-03-28",
    maxScore: 100n,
  },
  {
    id: 10n,
    name: "T2 Entry",
    term: "Term 2",
    date: "2025-05-09",
    maxScore: 100n,
  },
  {
    id: 11n,
    name: "T2 Midterm",
    term: "Term 2",
    date: "2025-05-26",
    maxScore: 100n,
  },
  {
    id: 12n,
    name: "T2 Endterm",
    term: "Term 2",
    date: "2025-06-27",
    maxScore: 100n,
  },
];

// ─── Marks ────────────────────────────────────────────────────────────────────
// Format: [studentId, subjectId, assessmentId, score]
type MarkTuple = [bigint, bigint, bigint, bigint];

const rawMarks: MarkTuple[] = [
  // ── Year 8 History (subjectId=1, assessments 1–6) ──
  // Oliver - strong History
  [1n, 1n, 1n, 43n], // T1 Entry
  [1n, 1n, 2n, 79n], // T1 Midterm
  [1n, 1n, 3n, 84n], // T1 Endterm
  [1n, 1n, 4n, 41n], // T2 Entry
  [1n, 1n, 5n, 85n], // T2 Midterm
  [1n, 1n, 6n, 88n], // T2 Endterm
  // Sophie - average History
  [2n, 1n, 1n, 30n], // T1 Entry
  [2n, 1n, 2n, 55n], // T1 Midterm
  [2n, 1n, 3n, 61n], // T1 Endterm
  [2n, 1n, 4n, 32n], // T2 Entry
  [2n, 1n, 5n, 60n], // T2 Midterm
  [2n, 1n, 6n, 65n], // T2 Endterm
  // James - struggling History (absent T1 Entry — did not sit)
  // [3n, 1n, 1n, 19n], // T1 Entry — ABSENT
  [3n, 1n, 2n, 28n], // T1 Midterm
  [3n, 1n, 3n, 38n], // T1 Endterm
  [3n, 1n, 4n, 17n], // T2 Entry
  [3n, 1n, 5n, 26n], // T2 Midterm
  [3n, 1n, 6n, 35n], // T2 Endterm
  // Isabelle - good History
  [4n, 1n, 1n, 38n], // T1 Entry
  [4n, 1n, 2n, 68n], // T1 Midterm
  [4n, 1n, 3n, 76n], // T1 Endterm
  [4n, 1n, 4n, 41n], // T2 Entry
  [4n, 1n, 5n, 74n], // T2 Midterm
  [4n, 1n, 6n, 80n], // T2 Endterm

  // ── Year 8 French (subjectId=2, assessments 7–12) ──
  // Oliver - decent French
  [1n, 2n, 7n, 35n], // T1 Entry
  [1n, 2n, 8n, 62n], // T1 Midterm
  [1n, 2n, 9n, 70n], // T1 Endterm
  [1n, 2n, 10n, 37n], // T2 Entry
  [1n, 2n, 11n, 69n], // T2 Midterm
  [1n, 2n, 12n, 74n], // T2 Endterm
  // Sophie - good French, improving
  [2n, 2n, 7n, 38n], // T1 Entry
  [2n, 2n, 8n, 68n], // T1 Midterm
  [2n, 2n, 9n, 77n], // T1 Endterm
  [2n, 2n, 10n, 41n], // T2 Entry
  [2n, 2n, 11n, 76n], // T2 Midterm
  [2n, 2n, 12n, 83n], // T2 Endterm
  // James - weak French
  [3n, 2n, 7n, 22n], // T1 Entry
  [3n, 2n, 8n, 33n], // T1 Midterm
  [3n, 2n, 9n, 44n], // T1 Endterm
  [3n, 2n, 10n, 24n], // T2 Entry
  [3n, 2n, 11n, 36n], // T2 Midterm
  [3n, 2n, 12n, 48n], // T2 Endterm
  // Isabelle - strong French
  [4n, 2n, 7n, 44n], // T1 Entry
  [4n, 2n, 8n, 80n], // T1 Midterm
  [4n, 2n, 9n, 88n], // T1 Endterm
  [4n, 2n, 10n, 46n], // T2 Entry
  [4n, 2n, 11n, 87n], // T2 Midterm
  [4n, 2n, 12n, 92n], // T2 Endterm

  // ── Year 9 French (subjectId=2, assessments 7–12) ──
  // Lucas - improving
  [5n, 2n, 7n, 31n], // T1 Entry
  [5n, 2n, 8n, 57n], // T1 Midterm
  [5n, 2n, 9n, 64n], // T1 Endterm
  [5n, 2n, 10n, 34n], // T2 Entry
  [5n, 2n, 11n, 63n], // T2 Midterm
  [5n, 2n, 12n, 70n], // T2 Endterm
  // Camille - top performer
  [6n, 2n, 7n, 45n], // T1 Entry
  [6n, 2n, 8n, 85n], // T1 Midterm
  [6n, 2n, 9n, 91n], // T1 Endterm
  [6n, 2n, 10n, 46n], // T2 Entry
  [6n, 2n, 11n, 90n], // T2 Midterm
  [6n, 2n, 12n, 93n], // T2 Endterm
  // Ethan - average
  [7n, 2n, 7n, 28n], // T1 Entry
  [7n, 2n, 8n, 49n], // T1 Midterm
  [7n, 2n, 9n, 56n], // T1 Endterm
  [7n, 2n, 10n, 30n], // T2 Entry
  [7n, 2n, 11n, 54n], // T2 Midterm
  [7n, 2n, 12n, 60n], // T2 Endterm
  // Zoe - good
  [8n, 2n, 7n, 39n], // T1 Entry
  [8n, 2n, 8n, 72n], // T1 Midterm
  [8n, 2n, 9n, 79n], // T1 Endterm
  [8n, 2n, 10n, 41n], // T2 Entry
  [8n, 2n, 11n, 77n], // T2 Midterm
  [8n, 2n, 12n, 82n], // T2 Endterm

  // ── Form 3 French (subjectId=2, assessments 7–12) ──
  // Amahle
  [9n, 2n, 7n, 33n], // T1 Entry
  [9n, 2n, 8n, 60n], // T1 Midterm
  [9n, 2n, 9n, 67n], // T1 Endterm
  [9n, 2n, 10n, 35n], // T2 Entry
  [9n, 2n, 11n, 65n], // T2 Midterm
  [9n, 2n, 12n, 71n], // T2 Endterm
  // Sipho - struggling (absent T2 Midterm — did not sit)
  [10n, 2n, 7n, 21n], // T1 Entry
  [10n, 2n, 8n, 32n], // T1 Midterm
  [10n, 2n, 9n, 43n], // T1 Endterm
  [10n, 2n, 10n, 20n], // T2 Entry
  // [10n, 2n, 11n, 31n], // T2 Midterm — ABSENT
  [10n, 2n, 12n, 41n], // T2 Endterm
  // Lerato - excellent
  [11n, 2n, 7n, 46n], // T1 Entry
  [11n, 2n, 8n, 86n], // T1 Midterm
  [11n, 2n, 9n, 92n], // T1 Endterm
  [11n, 2n, 10n, 47n], // T2 Entry
  [11n, 2n, 11n, 90n], // T2 Midterm
  [11n, 2n, 12n, 94n], // T2 Endterm
  // Thabo - declining
  [12n, 2n, 7n, 29n], // T1 Entry
  [12n, 2n, 8n, 46n], // T1 Midterm
  [12n, 2n, 9n, 55n], // T1 Endterm
  [12n, 2n, 10n, 26n], // T2 Entry
  [12n, 2n, 11n, 39n], // T2 Midterm
  [12n, 2n, 12n, 50n], // T2 Endterm

  // ── Grade 10 French (subjectId=2, assessments 7–12) ──
  // Naledi - very strong
  [13n, 2n, 7n, 47n], // T1 Entry
  [13n, 2n, 8n, 88n], // T1 Midterm
  [13n, 2n, 9n, 94n], // T1 Endterm
  [13n, 2n, 10n, 48n], // T2 Entry
  [13n, 2n, 11n, 93n], // T2 Midterm
  [13n, 2n, 12n, 96n], // T2 Endterm
  // Bongani - steady
  [14n, 2n, 7n, 36n], // T1 Entry
  [14n, 2n, 8n, 65n], // T1 Midterm
  [14n, 2n, 9n, 73n], // T1 Endterm
  [14n, 2n, 10n, 38n], // T2 Entry
  [14n, 2n, 11n, 70n], // T2 Midterm
  [14n, 2n, 12n, 76n], // T2 Endterm
  // Precious - average
  [15n, 2n, 7n, 27n], // T1 Entry
  [15n, 2n, 8n, 46n], // T1 Midterm
  [15n, 2n, 9n, 54n], // T1 Endterm
  [15n, 2n, 10n, 29n], // T2 Entry
  [15n, 2n, 11n, 50n], // T2 Midterm
  [15n, 2n, 12n, 58n], // T2 Endterm
  // Kabelo - improving
  [16n, 2n, 7n, 32n], // T1 Entry
  [16n, 2n, 8n, 55n], // T1 Midterm
  [16n, 2n, 9n, 64n], // T1 Endterm
  [16n, 2n, 10n, 35n], // T2 Entry
  [16n, 2n, 11n, 63n], // T2 Midterm
  [16n, 2n, 12n, 71n], // T2 Endterm
];

export const SAMPLE_MARKS: Mark[] = rawMarks.map(
  ([studentId, subjectId, assessmentId, score]) => ({
    studentId,
    subjectId,
    assessmentId,
    score,
  }),
);
