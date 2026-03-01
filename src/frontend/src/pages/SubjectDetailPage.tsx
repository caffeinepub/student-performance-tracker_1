import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Link, useParams } from "@tanstack/react-router";
import { ArrowLeft, Minus, TrendingDown, TrendingUp } from "lucide-react";
import { motion } from "motion/react";
import React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { filterByClass, useClassFilter } from "../context/ClassContext";
import {
  useAssessments,
  useMarks,
  useStudents,
  useSubjects,
} from "../hooks/useQueries";
import {
  SAMPLE_ASSESSMENTS,
  SAMPLE_MARKS,
  SAMPLE_STUDENTS,
  SAMPLE_SUBJECTS,
} from "../utils/sampleData";
import { mean, round, toPercent } from "../utils/statistics";

// Term names in display order
const TERM_ORDER = ["Term 1", "Term 2", "Term 3", "Term 4"];
// Exam types in order within a term
const EXAM_ORDER = [
  "T1 Entry",
  "T1 Midterm",
  "T1 Endterm",
  "T2 Entry",
  "T2 Midterm",
  "T2 Endterm",
  "T3 Entry",
  "T3 Midterm",
  "T3 Endterm",
  "T4 Entry",
  "T4 Midterm",
  "T4 Endterm",
  "Entry",
  "Midterm",
  "Endterm",
];

const TERM_COLORS: Record<string, string> = {
  "Term 1": "oklch(0.52 0.18 255)",
  "Term 2": "oklch(0.56 0.16 150)",
  "Term 3": "oklch(0.68 0.2 35)",
  "Term 4": "oklch(0.64 0.2 295)",
};

function scoreCell(score: number | null, maxScore: number) {
  if (score === null)
    return <span className="text-muted-foreground/40 text-xs">—</span>;
  const pct = toPercent(score, maxScore);
  const color =
    pct >= 75
      ? "text-emerald-600"
      : pct >= 50
        ? "text-foreground"
        : "text-destructive";
  return (
    <span className={`font-mono text-sm font-medium ${color}`}>
      {score}/{maxScore}
    </span>
  );
}

function avgCell(avg: number | null) {
  if (avg === null)
    return <span className="text-muted-foreground/40 text-xs">—</span>;
  const color =
    avg >= 75
      ? "text-emerald-600 font-semibold"
      : avg >= 50
        ? "text-foreground font-semibold"
        : "text-destructive font-semibold";
  return <span className={`font-mono text-sm ${color}`}>{avg}%</span>;
}

export default function SubjectDetailPage() {
  const { id } = useParams({ from: "/layout/subjects/$id" });
  const { selectedClass } = useClassFilter();

  const { data: subjects } = useSubjects();
  const { data: students } = useStudents();
  const { data: marks } = useMarks();
  const { data: assessments } = useAssessments();

  const displaySubjects =
    subjects && subjects.length > 0 ? subjects : SAMPLE_SUBJECTS;
  const allStudents =
    students && students.length > 0 ? students : SAMPLE_STUDENTS;
  const displayMarks = marks && marks.length > 0 ? marks : SAMPLE_MARKS;
  const displayAssessments =
    assessments && assessments.length > 0 ? assessments : SAMPLE_ASSESSMENTS;

  const subjectId = BigInt(id);
  const subject = displaySubjects.find((s) => s.id === subjectId);

  if (!subject) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Subject not found.</p>
        <Link to="/subjects">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Subjects
          </Button>
        </Link>
      </div>
    );
  }

  // Filter students by selected class
  const classStudents = filterByClass(allStudents, selectedClass);

  // Only marks for this subject
  const subjectMarks = displayMarks.filter((m) => m.subjectId === subjectId);

  // Only assessments that have at least one mark for this subject
  const assessmentsForSubject = displayAssessments.filter((a) =>
    subjectMarks.some((m) => m.assessmentId === a.id),
  );

  // Group assessments by term, sorted
  const termGroups: Record<string, typeof assessmentsForSubject> = {};
  for (const a of assessmentsForSubject) {
    if (!termGroups[a.term]) termGroups[a.term] = [];
    termGroups[a.term].push(a);
  }

  const sortedTerms = TERM_ORDER.filter((t) => termGroups[t]);

  // Sort assessments within each term by exam order, then by date
  for (const term of sortedTerms) {
    termGroups[term].sort((a, b) => {
      const ai = EXAM_ORDER.indexOf(a.name);
      const bi = EXAM_ORDER.indexOf(b.name);
      if (ai !== -1 && bi !== -1) return ai - bi;
      return a.date < b.date ? -1 : 1;
    });
  }

  // All sorted assessments flat
  const allSortedAssessments = sortedTerms.flatMap((t) => termGroups[t]);

  // For each student, compute their mark for each assessment
  type StudentRow = {
    student: (typeof classStudents)[number];
    scores: (number | null)[]; // one per assessment
    termAvgs: Record<string, number | null>; // term -> avg %
    overallAvg: number | null;
  };

  const studentRows: StudentRow[] = classStudents.map((student) => {
    const scores = allSortedAssessments.map((a) => {
      const mark = subjectMarks.find(
        (m) => m.studentId === student.id && m.assessmentId === a.id,
      );
      return mark ? Number(mark.score) : null;
    });

    const termAvgs: Record<string, number | null> = {};
    for (const term of sortedTerms) {
      const termAssessments = termGroups[term];
      const termScores: number[] = [];
      for (const a of termAssessments) {
        const mark = subjectMarks.find(
          (m) => m.studentId === student.id && m.assessmentId === a.id,
        );
        if (mark)
          termScores.push(toPercent(Number(mark.score), Number(a.maxScore)));
      }
      termAvgs[term] = termScores.length > 0 ? round(mean(termScores)) : null;
    }

    const allPcts: number[] = [];
    scores.forEach((s, i) => {
      if (s !== null) {
        allPcts.push(toPercent(s, Number(allSortedAssessments[i].maxScore)));
      }
    });
    const overallAvg = allPcts.length > 0 ? round(mean(allPcts)) : null;

    return { student, scores, termAvgs, overallAvg };
  });

  // Class averages per assessment
  const classAssessmentAvgs = allSortedAssessments.map((a) => {
    const scores = classStudents
      .map((s) => {
        const mark = subjectMarks.find(
          (m) => m.studentId === s.id && m.assessmentId === a.id,
        );
        return mark ? toPercent(Number(mark.score), Number(a.maxScore)) : null;
      })
      .filter((x): x is number => x !== null);
    return scores.length > 0 ? round(mean(scores)) : null;
  });

  // Class term averages
  const classTermAvgs: Record<string, number | null> = {};
  for (const term of sortedTerms) {
    const allPcts: number[] = [];
    for (const a of termGroups[term]) {
      for (const s of classStudents) {
        const mark = subjectMarks.find(
          (m) => m.studentId === s.id && m.assessmentId === a.id,
        );
        if (mark)
          allPcts.push(toPercent(Number(mark.score), Number(a.maxScore)));
      }
    }
    classTermAvgs[term] = allPcts.length > 0 ? round(mean(allPcts)) : null;
  }

  // Chart: term averages per student (bar chart)
  const termChartData = sortedTerms.map((term) => {
    const entry: Record<string, number | string | null> = { term };
    for (const row of studentRows) {
      entry[row.student.name] = row.termAvgs[term];
    }
    return entry;
  });

  // Trend icon for a student
  const getTrend = (row: StudentRow) => {
    const avgs = sortedTerms
      .map((t) => row.termAvgs[t])
      .filter((x): x is number => x !== null);
    if (avgs.length < 2)
      return { icon: Minus, color: "text-muted-foreground", label: "Stable" };
    const delta = avgs[avgs.length - 1] - avgs[0];
    if (delta > 3)
      return {
        icon: TrendingUp,
        color: "text-emerald-600",
        label: "Improving",
      };
    if (delta < -3)
      return {
        icon: TrendingDown,
        color: "text-destructive",
        label: "Declining",
      };
    return { icon: Minus, color: "text-muted-foreground", label: "Stable" };
  };

  // Subject overall class average
  const allClassPcts: number[] = [];
  for (const a of allSortedAssessments) {
    for (const s of classStudents) {
      const mark = subjectMarks.find(
        (m) => m.studentId === s.id && m.assessmentId === a.id,
      );
      if (mark)
        allClassPcts.push(toPercent(Number(mark.score), Number(a.maxScore)));
    }
  }
  const overallClassAvg =
    allClassPcts.length > 0 ? round(mean(allClassPcts)) : null;

  const hasData = allSortedAssessments.length > 0 && studentRows.length > 0;

  return (
    <div className="space-y-6 p-6 animate-fade-in">
      {/* Back */}
      <Link to="/subjects">
        <Button variant="ghost" size="sm" className="gap-2 -ml-2 mb-2">
          <ArrowLeft className="h-4 w-4" />
          All Subjects
        </Button>
      </Link>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            {subject.name}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {selectedClass !== "All Classes" ? selectedClass : "All classes"} ·{" "}
            {studentRows.length} student{studentRows.length !== 1 ? "s" : ""}
          </p>
        </div>
        {overallClassAvg !== null && (
          <div className="rounded-lg border border-border bg-card px-5 py-3 text-center">
            <p className="font-display text-2xl font-bold text-foreground">
              {overallClassAvg}%
            </p>
            <p className="text-xs text-muted-foreground">Class Average</p>
          </div>
        )}
      </div>

      {!hasData && (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No marks recorded for {subject.name} in this class yet.
            <br />
            Import data or add marks to get started.
          </CardContent>
        </Card>
      )}

      {hasData && (
        <>
          {/* Marks table */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="font-display text-base font-semibold">
                  Marks by Student
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      {/* Top header: grouped by term */}
                      <TableRow className="border-b-0">
                        <TableHead
                          rowSpan={2}
                          className="align-bottom pb-2 font-semibold min-w-[140px]"
                        >
                          Student
                        </TableHead>
                        {sortedTerms.map((term) => (
                          <TableHead
                            key={term}
                            colSpan={termGroups[term].length + 1}
                            className="text-center border-l border-border/40 pb-1 text-xs font-semibold uppercase tracking-wide"
                            style={{ color: TERM_COLORS[term] ?? undefined }}
                          >
                            {term}
                          </TableHead>
                        ))}
                        <TableHead
                          rowSpan={2}
                          className="text-right align-bottom pb-2 font-semibold whitespace-nowrap"
                        >
                          Overall
                        </TableHead>
                        <TableHead
                          rowSpan={2}
                          className="align-bottom pb-2 font-semibold"
                        >
                          Trend
                        </TableHead>
                      </TableRow>
                      {/* Second header row: exam names + Term Avg */}
                      <TableRow>
                        {sortedTerms.map((term) => (
                          <React.Fragment key={term}>
                            {termGroups[term].map((a) => (
                              <TableHead
                                key={a.id.toString()}
                                className="text-center border-l border-border/40 text-xs whitespace-nowrap py-2"
                              >
                                {a.name.replace(/^T\d\s/, "")}
                                <span className="block text-[10px] text-muted-foreground font-normal">
                                  /{a.maxScore.toString()}
                                </span>
                              </TableHead>
                            ))}
                            <TableHead className="text-center text-xs whitespace-nowrap py-2 font-semibold bg-muted/40">
                              Avg
                            </TableHead>
                          </React.Fragment>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {studentRows.map((row) => {
                        const trend = getTrend(row);
                        const TrendIcon = trend.icon;
                        // Build a flat index lookup: termIndex -> assessmentLocalIndex -> globalIndex
                        const termOffsets: Record<string, number> = {};
                        let offset = 0;
                        for (const t of sortedTerms) {
                          termOffsets[t] = offset;
                          offset += termGroups[t].length;
                        }
                        return (
                          <TableRow
                            key={row.student.id.toString()}
                            className="hover:bg-muted/30"
                          >
                            <TableCell className="font-medium text-sm">
                              <Link
                                to="/students/$id"
                                params={{ id: row.student.id.toString() }}
                                className="hover:text-primary hover:underline"
                              >
                                {row.student.name}
                              </Link>
                            </TableCell>
                            {sortedTerms.map((term) => (
                              <React.Fragment key={term}>
                                {termGroups[term].map((a, localIdx) => {
                                  const globalIdx =
                                    termOffsets[term] + localIdx;
                                  const score = row.scores[globalIdx];
                                  return (
                                    <TableCell
                                      key={a.id.toString()}
                                      className="text-center border-l border-border/20 py-2.5"
                                    >
                                      {scoreCell(score, Number(a.maxScore))}
                                    </TableCell>
                                  );
                                })}
                                <TableCell className="text-center py-2.5 bg-muted/20">
                                  {avgCell(row.termAvgs[term])}
                                </TableCell>
                              </React.Fragment>
                            ))}
                            <TableCell className="text-right py-2.5">
                              {avgCell(row.overallAvg)}
                            </TableCell>
                            <TableCell className="py-2.5">
                              <div
                                className={`flex items-center gap-1 text-xs ${trend.color}`}
                              >
                                <TrendIcon className="h-3.5 w-3.5" />
                                {trend.label}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}

                      {/* Class average row */}
                      {studentRows.length > 1 && (
                        <TableRow className="bg-muted/30 border-t-2 border-border font-semibold">
                          <TableCell className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Class Average
                          </TableCell>
                          {(() => {
                            // Build term offsets for class avg row
                            const termOffsets: Record<string, number> = {};
                            let off = 0;
                            for (const t of sortedTerms) {
                              termOffsets[t] = off;
                              off += termGroups[t].length;
                            }
                            return sortedTerms.map((term) => (
                              <React.Fragment key={term}>
                                {termGroups[term].map(
                                  (assessmentItem, localIdx) => {
                                    const globalIdx =
                                      termOffsets[term] + localIdx;
                                    const avg = classAssessmentAvgs[globalIdx];
                                    return (
                                      <TableCell
                                        key={assessmentItem.id.toString()}
                                        className="text-center border-l border-border/20 py-2.5"
                                      >
                                        {avg !== null ? (
                                          <span className="font-mono text-xs text-muted-foreground">
                                            {avg}%
                                          </span>
                                        ) : (
                                          <span className="text-muted-foreground/40 text-xs">
                                            —
                                          </span>
                                        )}
                                      </TableCell>
                                    );
                                  },
                                )}
                                <TableCell className="text-center py-2.5 bg-muted/30">
                                  {avgCell(classTermAvgs[term])}
                                </TableCell>
                              </React.Fragment>
                            ));
                          })()}
                          <TableCell className="text-right py-2.5">
                            {avgCell(overallClassAvg)}
                          </TableCell>
                          <TableCell />
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Term averages chart */}
          {sortedTerms.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="font-display text-base font-semibold">
                    Term Averages by Student
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart
                      data={termChartData}
                      barGap={2}
                      barCategoryGap="25%"
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="oklch(0.88 0.015 255)"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="term"
                        tick={{ fontSize: 11, fill: "oklch(0.52 0.02 255)" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        domain={[0, 100]}
                        tick={{ fontSize: 11, fill: "oklch(0.52 0.02 255)" }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) => `${v}%`}
                      />
                      <Tooltip
                        formatter={(v: number, name: string) => [`${v}%`, name]}
                        contentStyle={{
                          background: "oklch(1 0 0)",
                          border: "1px solid oklch(0.88 0.015 255)",
                          borderRadius: "6px",
                          fontSize: "12px",
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: "11px" }} />
                      {studentRows.map((row, i) => {
                        const colors = [
                          "oklch(0.52 0.18 255)",
                          "oklch(0.56 0.16 150)",
                          "oklch(0.68 0.2 35)",
                          "oklch(0.64 0.2 295)",
                          "oklch(0.60 0.18 20)",
                          "oklch(0.55 0.15 310)",
                        ];
                        return (
                          <Bar
                            key={row.student.id.toString()}
                            dataKey={row.student.name}
                            fill={colors[i % colors.length]}
                            radius={[3, 3, 0, 0]}
                          />
                        );
                      })}
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Performance summary cards */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid gap-4 sm:grid-cols-3"
          >
            {/* Top performer */}
            {(() => {
              const sorted = [...studentRows]
                .filter((r) => r.overallAvg !== null)
                .sort((a, b) => (b.overallAvg ?? 0) - (a.overallAvg ?? 0));
              const top = sorted[0];
              const bottom = sorted[sorted.length - 1];
              const needsAttention = studentRows.filter(
                (r) => r.overallAvg !== null && r.overallAvg < 50,
              );
              return (
                <>
                  <Card className="border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/20">
                    <CardContent className="p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                        Top Performer
                      </p>
                      {top ? (
                        <>
                          <p className="mt-1 font-display text-base font-bold text-foreground">
                            {top.student.name}
                          </p>
                          <p className="text-xl font-bold text-emerald-600">
                            {top.overallAvg}%
                          </p>
                        </>
                      ) : (
                        <p className="text-sm text-muted-foreground">—</p>
                      )}
                    </CardContent>
                  </Card>
                  <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20">
                    <CardContent className="p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
                        Needs Attention
                      </p>
                      <p className="mt-1 font-display text-3xl font-bold text-foreground">
                        {needsAttention.length}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        student{needsAttention.length !== 1 ? "s" : ""} below
                        50%
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="border-rose-200 bg-rose-50/50 dark:border-rose-800 dark:bg-rose-950/20">
                    <CardContent className="p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-rose-700 dark:text-rose-400">
                        Lowest Average
                      </p>
                      {bottom && bottom !== top ? (
                        <>
                          <p className="mt-1 font-display text-base font-bold text-foreground">
                            {bottom.student.name}
                          </p>
                          <p className="text-xl font-bold text-rose-600">
                            {bottom.overallAvg}%
                          </p>
                        </>
                      ) : (
                        <p className="text-sm text-muted-foreground">—</p>
                      )}
                    </CardContent>
                  </Card>
                </>
              );
            })()}
          </motion.div>

          {/* Assessment breakdown table */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="font-display text-base font-semibold">
                  Assessment Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Assessment</TableHead>
                      <TableHead>Term</TableHead>
                      <TableHead className="text-right">Max Score</TableHead>
                      <TableHead className="text-right">Sat</TableHead>
                      <TableHead className="text-right">Class Avg</TableHead>
                      <TableHead>Grade Dist.</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allSortedAssessments.map((a) => {
                      const marksForA = subjectMarks.filter(
                        (m) =>
                          m.assessmentId === a.id &&
                          classStudents.some((s) => s.id === m.studentId),
                      );
                      const pcts = marksForA.map((m) =>
                        toPercent(Number(m.score), Number(a.maxScore)),
                      );
                      const avg = pcts.length > 0 ? round(mean(pcts)) : null;
                      const excellent = pcts.filter((p) => p >= 75).length;
                      const good = pcts.filter((p) => p >= 50 && p < 75).length;
                      const poor = pcts.filter((p) => p < 50).length;
                      return (
                        <TableRow key={a.id.toString()}>
                          <TableCell className="font-medium text-sm">
                            {a.name}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className="text-[10px]"
                              style={{
                                borderColor: TERM_COLORS[a.term],
                                color: TERM_COLORS[a.term],
                              }}
                            >
                              {a.term}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm">
                            {a.maxScore.toString()}
                          </TableCell>
                          <TableCell className="text-right text-sm">
                            {marksForA.length}/{classStudents.length}
                          </TableCell>
                          <TableCell className="text-right">
                            {avgCell(avg)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              {excellent > 0 && (
                                <Badge
                                  variant="default"
                                  className="text-[10px] bg-emerald-600"
                                >
                                  {excellent} ≥75%
                                </Badge>
                              )}
                              {good > 0 && (
                                <Badge
                                  variant="secondary"
                                  className="text-[10px]"
                                >
                                  {good} 50–74%
                                </Badge>
                              )}
                              {poor > 0 && (
                                <Badge
                                  variant="destructive"
                                  className="text-[10px]"
                                >
                                  {poor} &lt;50%
                                </Badge>
                              )}
                              {marksForA.length === 0 && (
                                <span className="text-xs text-muted-foreground">
                                  No data
                                </span>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}
    </div>
  );
}
