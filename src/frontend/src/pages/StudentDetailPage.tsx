import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Link, useParams } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ClipboardList,
  Copy,
  GraduationCap,
  Loader2,
  MessageSquare,
  Minus,
  Save,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import {
  useAssessments,
  useBehaviourRecord,
  useMarks,
  useSaveBehaviourRecord,
  useStudents,
  useSubjects,
} from "../hooks/useQueries";
import {
  type IgcseCommentParams,
  generateIgcseComments,
  getCurriculumLabel,
  isCbcGrade,
  isKcse844Grade,
  isKs3Grade,
} from "../utils/igcseComments";
import {
  type GradeBoundary,
  IGCSE_GRADE_BOUNDARIES,
} from "../utils/igcseSyllabus";
import {
  CBC_ACHIEVEMENT_LEVELS,
  type CbcAchievementLevel,
  KCSE_GRADE_BOUNDARIES,
  type KcseGradeBoundary,
} from "../utils/kenyanCurriculumSyllabus";
import { KS3_FRENCH_BANDS, type Ks3Band } from "../utils/ks3FrenchSyllabus";
import {
  SAMPLE_ASSESSMENTS,
  SAMPLE_MARKS,
  SAMPLE_STUDENTS,
  SAMPLE_SUBJECTS,
} from "../utils/sampleData";
import {
  clamp,
  linearRegression,
  mean,
  round,
  stdDev,
  toPercent,
} from "../utils/statistics";

export default function StudentDetailPage() {
  const { id } = useParams({ from: "/layout/students/$id" });

  const { data: students } = useStudents();
  const { data: marks } = useMarks();
  const { data: assessments } = useAssessments();
  const { data: subjects } = useSubjects();

  const [commentText, setCommentText] = useState<string | null>(null);

  // Behaviour & Advice state
  const [behaviourComment, setBehaviourComment] = useState("");
  const [advice, setAdvice] = useState("");
  const behaviourInitialized = useRef(false);

  const studentId = BigInt(id);
  const { data: behaviourData } = useBehaviourRecord(studentId);
  const saveBehaviourMutation = useSaveBehaviourRecord();

  // Initialize from backend data when it first arrives
  useEffect(() => {
    if (behaviourData !== undefined && !behaviourInitialized.current) {
      behaviourInitialized.current = true;
      if (behaviourData) {
        setBehaviourComment(behaviourData.behaviourComment);
        setAdvice(behaviourData.advice);
      }
    }
  }, [behaviourData]);

  const displayStudents =
    students && students.length > 0 ? students : SAMPLE_STUDENTS;
  const displayMarks = marks && marks.length > 0 ? marks : SAMPLE_MARKS;
  const displayAssessments =
    assessments && assessments.length > 0 ? assessments : SAMPLE_ASSESSMENTS;
  const displaySubjects =
    subjects && subjects.length > 0 ? subjects : SAMPLE_SUBJECTS;

  const student = displayStudents.find((s) => s.id === studentId);

  if (!student) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Student not found.</p>
        <Link to="/students">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Students
          </Button>
        </Link>
      </div>
    );
  }

  // Student's marks
  const studentMarks = displayMarks.filter((m) => m.studentId === studentId);

  // Sort assessments in the correct pedagogical order:
  // Term 1 → Term 2 (and so on), then within each term: Entry → Midterm → Endterm.
  // Falls back to date if neither heuristic matches.
  const TERM_ORDER: Record<string, number> = {
    "term 1": 0,
    t1: 0,
    "term 2": 1,
    t2: 1,
    "term 3": 2,
    t3: 2,
  };
  const EXAM_TYPE_ORDER: Record<string, number> = {
    entry: 0,
    midterm: 1,
    "mid-term": 1,
    "mid term": 1,
    endterm: 2,
    "end-term": 2,
    "end term": 2,
  };

  function termRank(assessment: { term: string; name: string }): number {
    const key = assessment.term.toLowerCase().trim();
    if (key in TERM_ORDER) return TERM_ORDER[key];
    // Fall back: scan the name for T1/T2/T3 pattern
    const nameKey = assessment.name.toLowerCase();
    for (const [k, v] of Object.entries(TERM_ORDER)) {
      if (nameKey.startsWith(k) || nameKey.includes(k)) return v;
    }
    return 99;
  }

  function examRank(assessment: { name: string }): number {
    const lower = assessment.name.toLowerCase();
    for (const [k, v] of Object.entries(EXAM_TYPE_ORDER)) {
      if (lower.includes(k)) return v;
    }
    return 99;
  }

  const sortedAssessments = [...displayAssessments].sort((a, b) => {
    const termDiff = termRank(a) - termRank(b);
    if (termDiff !== 0) return termDiff;
    const examDiff = examRank(a) - examRank(b);
    if (examDiff !== 0) return examDiff;
    // Final fallback: date
    return a.date < b.date ? -1 : a.date > b.date ? 1 : 0;
  });

  // Build chart data: per assessment, student score % and class average %
  const chartData = sortedAssessments.map((assessment, idx) => {
    const studentMark = studentMarks.find(
      (m) => m.assessmentId === assessment.id,
    );
    const allMarksForAssessment = displayMarks.filter(
      (m) => m.assessmentId === assessment.id,
    );
    const classPercents = allMarksForAssessment.map((m) =>
      toPercent(Number(m.score), Number(assessment.maxScore)),
    );

    const studentPct = studentMark
      ? toPercent(Number(studentMark.score), Number(assessment.maxScore))
      : null;

    return {
      name:
        assessment.name.length > 15
          ? `${assessment.name.slice(0, 12)}…`
          : assessment.name,
      fullName: assessment.name,
      studentScore: studentPct !== null ? round(studentPct) : null,
      classAverage: round(mean(classPercents)),
      index: idx,
    };
  });

  // Linear regression on student scores
  const regressionPoints = chartData
    .filter((d) => d.studentScore !== null)
    .map((d) => ({ x: d.index, y: d.studentScore as number }));

  const regression = linearRegression(regressionPoints);

  // Add regression line and projection to chart data
  const extendedChartData = chartData.map((d) => ({
    ...d,
    regression: round(clamp(regression.predict(d.index), 0, 100)),
  }));

  // Projected next score
  const nextIndex = chartData.length;
  const projectedScore = round(clamp(regression.predict(nextIndex), 0, 100));
  const trendSlope = regression.slope;
  const TrendIcon =
    trendSlope > 1 ? TrendingUp : trendSlope < -1 ? TrendingDown : Minus;
  const trendColor =
    trendSlope > 1
      ? "text-success"
      : trendSlope < -1
        ? "text-destructive"
        : "text-muted-foreground";
  const trendLabel =
    trendSlope > 1 ? "Improving" : trendSlope < -1 ? "Declining" : "Stable";

  // Student overall average
  const studentPercents = studentMarks.map((m) => {
    const a = displayAssessments.find((a) => a.id === m.assessmentId);
    return a ? toPercent(Number(m.score), Number(a.maxScore)) : 0;
  });
  const studentAvg = round(mean(studentPercents));

  // Class overall average
  const allClassPercents = displayMarks.map((m) => {
    const a = displayAssessments.find((a) => a.id === m.assessmentId);
    return a ? toPercent(Number(m.score), Number(a.maxScore)) : 0;
  });
  const classAvg = round(mean(allClassPercents));

  const deviation = round(studentAvg - classAvg);

  // Per-subject breakdown
  const subjectBreakdown = displaySubjects
    .map((subject) => {
      const subjectStudentMarks = studentMarks.filter(
        (m) => m.subjectId === subject.id,
      );
      const subjectAllMarks = displayMarks.filter(
        (m) => m.subjectId === subject.id,
      );

      const studentSubjectPercents = subjectStudentMarks.map((m) => {
        const a = displayAssessments.find((a) => a.id === m.assessmentId);
        return a ? toPercent(Number(m.score), Number(a.maxScore)) : 0;
      });
      const classSubjectPercents = subjectAllMarks.map((m) => {
        const a = displayAssessments.find((a) => a.id === m.assessmentId);
        return a ? toPercent(Number(m.score), Number(a.maxScore)) : 0;
      });

      const studentSubjectAvg = round(mean(studentSubjectPercents));
      const classSubjectAvg = round(mean(classSubjectPercents));
      const subjectDeviation = round(studentSubjectAvg - classSubjectAvg);

      // Latest mark for this subject
      const latestMark = subjectStudentMarks[subjectStudentMarks.length - 1];
      const latestAssessment = latestMark
        ? displayAssessments.find((a) => a.id === latestMark.assessmentId)
        : undefined;

      return {
        subject,
        studentAvg: studentSubjectAvg,
        classAvg: classSubjectAvg,
        deviation: subjectDeviation,
        latestScore: latestMark ? Number(latestMark.score) : null,
        latestMax: latestAssessment ? Number(latestAssessment.maxScore) : null,
        markCount: subjectStudentMarks.length,
      };
    })
    .filter((s) => s.markCount > 0);

  // Build assessment scores for comment generation
  const assessmentScoresForComments = sortedAssessments
    .map((a) => {
      const m = studentMarks.find((mk) => mk.assessmentId === a.id);
      return m
        ? {
            assessmentName: a.name,
            term: a.term,
            scorePercent: toPercent(Number(m.score), Number(a.maxScore)),
          }
        : null;
    })
    .filter(Boolean) as {
    assessmentName: string;
    term: string;
    scorePercent: number;
  }[];

  // Generate personalized IGCSE comments
  const commentParams: IgcseCommentParams = {
    studentName: student.name,
    grade: student.grade,
    overallAvg: studentAvg,
    trendSlope,
    trendLabel,
    deviation,
    subjectBreakdown: subjectBreakdown.map((s) => ({
      subjectName: s.subject.name,
      studentAvg: s.studentAvg,
      classAvg: s.classAvg,
      deviation: s.deviation,
      markCount: s.markCount,
    })),
    assessmentScores: assessmentScoresForComments,
  };
  const igcseComments =
    studentMarks.length > 0 ? generateIgcseComments(commentParams) : null;

  // Use generated text as the editable textarea content (teacher can modify before copying)
  const editableCommentText = commentText ?? igcseComments?.fullText ?? "";

  // Grade badge color per curriculum type
  const gradeBadgeStyle = (() => {
    if (isKs3Grade(student.grade)) {
      // KS3 — warm amber
      return {
        bg: "bg-amber-100 text-amber-900 ring-1 ring-amber-300/60",
        dot: "bg-amber-500",
      };
    }
    if (isKcse844Grade(student.grade)) {
      // KCSE 8-4-4 — orange
      return {
        bg: "bg-orange-100 text-orange-900 ring-1 ring-orange-300/60",
        dot: "bg-orange-500",
      };
    }
    if (isCbcGrade(student.grade)) {
      // CBC — teal
      return {
        bg: "bg-teal-100 text-teal-900 ring-1 ring-teal-300/60",
        dot: "bg-teal-500",
      };
    }
    // Cambridge IGCSE — navy
    return {
      bg: "bg-primary/10 text-primary ring-1 ring-primary/20",
      dot: "bg-primary",
    };
  })();

  const chartAxisTick = { fontSize: 11, fill: "oklch(0.50 0.025 260)" };
  const chartGridColor = "oklch(0.88 0.012 80)";
  const chartTooltipStyle = {
    background: "oklch(0.995 0.002 80)",
    border: "1px solid oklch(0.88 0.012 80)",
    borderRadius: "8px",
    fontSize: "12px",
    boxShadow: "0 4px 12px oklch(0.15 0.03 260 / 0.08)",
  };

  return (
    <div className="space-y-6 p-6 animate-fade-in">
      {/* Back button */}
      <Link to="/students">
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 -ml-2 mb-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          All Students
        </Button>
      </Link>

      {/* Student header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 font-display text-3xl font-bold text-primary ring-1 ring-primary/20">
            {student.name.charAt(0)}
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground tracking-tight">
              {student.name}
            </h1>
            <div className="mt-1 flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${gradeBadgeStyle.bg}`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${gradeBadgeStyle.dot}`}
                />
                {student.grade}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-3 flex-wrap">
          {/* Overall Average — premium stat box */}
          <div className="rounded-xl border border-border bg-card px-5 py-3.5 text-center shadow-card">
            <p className="font-display text-4xl font-bold text-foreground leading-none">
              {studentAvg}%
            </p>
            <p className="mt-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Overall Avg
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card px-5 py-3.5 text-center shadow-card">
            <p
              className={`font-display text-4xl font-bold leading-none ${deviation >= 0 ? "text-success" : "text-destructive"}`}
            >
              {deviation >= 0 ? "+" : ""}
              {deviation}%
            </p>
            <p className="mt-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              vs Class
            </p>
          </div>
          {studentMarks.length > 0 && igcseComments && (
            <div
              className={`rounded-xl px-5 py-3.5 text-center shadow-card ${gradeBadgeStyle.bg}`}
            >
              <p className="font-display text-4xl font-bold leading-none">
                {igcseComments.igcseGrade}
              </p>
              <p className="mt-1.5 text-[10px] font-semibold uppercase tracking-widest opacity-70">
                {isKs3Grade(student.grade)
                  ? "Niveau KS3"
                  : isKcse844Grade(student.grade)
                    ? `KCSE (${igcseComments.igcseUms})`
                    : isCbcGrade(student.grade)
                      ? `CBC (${igcseComments.igcseUms})`
                      : `IGCSE (${igcseComments.igcseUms})`}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Performance chart */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-base font-semibold tracking-tight">
              Score Trend Over Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={extendedChartData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={chartGridColor}
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  tick={chartAxisTick}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={chartAxisTick}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  formatter={(value: unknown, name: string) => {
                    if (value === null || value === undefined)
                      return ["—", name];
                    const labels: Record<string, string> = {
                      studentScore: student.name,
                      classAverage: "Class Average",
                      regression: "Trend Line",
                    };
                    return [`${value}%`, labels[name] ?? name];
                  }}
                  contentStyle={chartTooltipStyle}
                />
                <Legend
                  wrapperStyle={{ fontSize: "11px", paddingTop: "12px" }}
                  formatter={(value) => {
                    const labels: Record<string, string> = {
                      studentScore: student.name,
                      classAverage: "Class Average",
                      regression: "Trend (Regression)",
                    };
                    return labels[value] ?? value;
                  }}
                />
                <ReferenceLine
                  y={50}
                  stroke="oklch(0.88 0.012 80)"
                  strokeDasharray="2 4"
                />
                <Line
                  type="monotone"
                  dataKey="studentScore"
                  stroke="oklch(0.42 0.16 260)"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "oklch(0.42 0.16 260)" }}
                  activeDot={{ r: 6 }}
                  connectNulls={false}
                />
                <Line
                  type="monotone"
                  dataKey="classAverage"
                  stroke="oklch(0.62 0.18 145)"
                  strokeWidth={1.5}
                  strokeDasharray="5 3"
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="regression"
                  stroke="oklch(0.72 0.18 55)"
                  strokeWidth={1.5}
                  strokeDasharray="3 3"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* Projection section */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-base font-semibold flex items-center gap-2">
              <TrendIcon className={`h-5 w-5 ${trendColor}`} />
              Projected Outcome
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-8">
              <div>
                <p className="text-xs text-muted-foreground mb-1">
                  Next Assessment (Projected)
                </p>
                <p className="font-display text-4xl font-bold text-foreground">
                  {projectedScore}%
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Trend</p>
                <Badge
                  variant="outline"
                  className={`${trendColor} border-current text-sm font-semibold px-3 py-1`}
                >
                  <TrendIcon className="mr-1 h-3.5 w-3.5" />
                  {trendLabel}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">
                  Rate of Change
                </p>
                <p className="font-mono text-lg font-semibold text-foreground">
                  {trendSlope >= 0 ? "+" : ""}
                  {round(trendSlope, 2)}% / assessment
                </p>
              </div>
              <div className="max-w-xs">
                <p className="text-xs text-muted-foreground">
                  Based on linear regression of {regressionPoints.length} data
                  points. This is a mathematical projection — actual performance
                  may vary.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Subject breakdown table */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-base font-semibold">
              Subject Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead className="text-right">Latest Score</TableHead>
                  <TableHead className="text-right">Student Avg</TableHead>
                  <TableHead className="text-right">Class Avg</TableHead>
                  <TableHead className="text-right">Deviation</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subjectBreakdown.map(
                  ({
                    subject,
                    studentAvg: sAvg,
                    classAvg: cAvg,
                    deviation: dev,
                    latestScore,
                    latestMax,
                  }) => (
                    <TableRow key={subject.id.toString()}>
                      <TableCell className="font-medium">
                        {subject.name}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {latestScore !== null && latestMax !== null
                          ? `${latestScore}/${latestMax}`
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {sAvg}%
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {cAvg}%
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        <span
                          className={
                            dev >= 0 ? "text-success" : "text-destructive"
                          }
                        >
                          {dev >= 0 ? "+" : ""}
                          {dev}%
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            dev >= 5
                              ? "default"
                              : dev >= -5
                                ? "secondary"
                                : "destructive"
                          }
                          className="text-xs"
                        >
                          {dev >= 5
                            ? "Above Avg"
                            : dev >= -5
                              ? "On Track"
                              : "Below Avg"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ),
                )}
                {subjectBreakdown.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="py-8 text-center text-sm text-muted-foreground"
                    >
                      No marks recorded for this student yet
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>

      {/* Personalized Comments */}
      {igcseComments && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card
            className="border-l-4 overflow-hidden"
            style={{ borderLeftColor: "oklch(0.78 0.14 75)" }}
          >
            <CardHeader className="pb-2">
              <CardTitle className="font-display text-base font-semibold flex items-center gap-2 tracking-tight">
                <MessageSquare
                  className="h-5 w-5"
                  style={{ color: "oklch(0.55 0.14 75)" }}
                />
                Commentaires personnalisés
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-1">
                {getCurriculumLabel(student.grade)} · généré automatiquement ·
                modifiable avant impression
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Summary */}
              <p className="text-sm text-foreground leading-relaxed rounded-lg bg-secondary/60 px-4 py-3.5 border border-border/50">
                {igcseComments.summary}
              </p>

              {/* Strengths + Improvements columns */}
              <div className="flex flex-wrap gap-4">
                {/* Strengths */}
                <div className="flex-1 min-w-[240px] space-y-2">
                  <h4 className="text-[10px] font-bold uppercase tracking-[0.12em] text-success flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Points forts
                  </h4>
                  <ul className="space-y-2">
                    {igcseComments.strengths.map((strength) => (
                      <li
                        key={strength}
                        className="flex gap-2.5 text-sm text-foreground"
                      >
                        <span className="mt-1.5 h-2 w-2 rounded-full shrink-0 bg-success" />
                        <span>{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Improvements */}
                <div className="flex-1 min-w-[240px] space-y-2">
                  <h4
                    className="text-[10px] font-bold uppercase tracking-[0.12em] flex items-center gap-1.5"
                    style={{ color: "oklch(0.55 0.14 75)" }}
                  >
                    <AlertCircle className="h-3.5 w-3.5" />
                    Axes d&apos;amélioration
                  </h4>
                  <ul className="space-y-2">
                    {igcseComments.improvements.map((improvement) => (
                      <li
                        key={improvement}
                        className="flex gap-2.5 text-sm text-foreground"
                      >
                        <span
                          className="mt-1.5 h-2 w-2 rounded-full shrink-0"
                          style={{ background: "oklch(0.72 0.18 55)" }}
                        />
                        <span>{improvement}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Target skills */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                  {isKs3Grade(student.grade)
                    ? "Compétences à développer (KS3 Français)"
                    : isKcse844Grade(student.grade)
                      ? "Compétences à renforcer (KCSE Français · Form 3)"
                      : isCbcGrade(student.grade)
                        ? "Compétences CBC à développer (Grade 10)"
                        : "Compétences à renforcer (IGCSE Français)"}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {igcseComments.targetSkills.map((skill) => (
                    <Badge
                      key={skill}
                      variant="outline"
                      className="text-xs font-medium"
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Teacher note */}
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <GraduationCap className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                    Note pour l&apos;enseignant(e)
                  </span>
                </div>
                <p className="text-sm italic text-muted-foreground rounded-lg bg-secondary/50 border border-border/50 px-4 py-3.5 leading-relaxed">
                  {igcseComments.teacherNote}
                </p>
              </div>

              {/* Editable textarea */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                  Texte complet (éditable)
                </h4>
                <Textarea
                  value={editableCommentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="min-h-[200px] font-mono text-xs leading-relaxed resize-y bg-secondary/50"
                  placeholder="Les commentaires générés apparaîtront ici…"
                />
              </div>

              {/* Copy button */}
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => {
                  navigator.clipboard
                    .writeText(editableCommentText)
                    .then(() => toast.success("Commentaires copiés !"))
                    .catch(() => toast.error("Impossible de copier le texte."));
                }}
              >
                <Copy className="h-4 w-4" />
                Copier les commentaires
              </Button>

              {/* Reference table — adapts to each curriculum */}

              {/* Cambridge IGCSE (Year 8/9 excluded, Form 3/Grade 10 excluded) */}
              {!isKs3Grade(student.grade) &&
                !isKcse844Grade(student.grade) &&
                !isCbcGrade(student.grade) && (
                  <details className="group rounded-md border border-border/60 bg-muted/20">
                    <summary className="flex cursor-pointer select-none items-center justify-between px-4 py-2.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors list-none">
                      <span>
                        Référence : Barème des notes Cambridge IGCSE (UMS)
                      </span>
                      <span className="ml-2 text-muted-foreground group-open:rotate-180 transition-transform duration-200 inline-block">
                        ▾
                      </span>
                    </summary>
                    <div className="px-4 pb-4 pt-1 overflow-x-auto">
                      <table className="w-full text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="py-1.5 pr-3 text-left font-semibold text-muted-foreground">
                              Note
                            </th>
                            <th className="py-1.5 pr-3 text-left font-semibold text-muted-foreground">
                              UMS
                            </th>
                            <th className="py-1.5 pr-3 text-left font-semibold text-muted-foreground">
                              Seuil (%)
                            </th>
                            <th className="py-1.5 text-left font-semibold text-muted-foreground">
                              Descripteur
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {IGCSE_GRADE_BOUNDARIES.map(
                            (boundary: GradeBoundary) => {
                              const isCurrentGrade =
                                boundary.grade === igcseComments.igcseGrade;
                              return (
                                <tr
                                  key={boundary.grade}
                                  className={`border-b border-border/40 transition-colors ${isCurrentGrade ? "bg-primary/10 font-semibold" : "hover:bg-muted/40"}`}
                                >
                                  <td className="py-1.5 pr-3 font-mono font-bold text-foreground">
                                    {boundary.grade}
                                    {isCurrentGrade && (
                                      <span className="ml-1 text-[9px] text-primary font-normal align-middle">
                                        ← actuel
                                      </span>
                                    )}
                                  </td>
                                  <td className="py-1.5 pr-3 font-mono text-muted-foreground">
                                    {boundary.umsEquivalent}
                                  </td>
                                  <td className="py-1.5 pr-3 font-mono text-muted-foreground">
                                    {boundary.maxPercent === 100
                                      ? `≥ ${boundary.minPercent}%`
                                      : `${boundary.minPercent}–${boundary.maxPercent}%`}
                                  </td>
                                  <td className="py-1.5 text-muted-foreground">
                                    {boundary.label}
                                  </td>
                                </tr>
                              );
                            },
                          )}
                        </tbody>
                      </table>
                    </div>
                  </details>
                )}

              {/* KS3 — Year 8 / Year 9 */}
              {isKs3Grade(student.grade) && (
                <details className="group rounded-md border border-border/60 bg-muted/20">
                  <summary className="flex cursor-pointer select-none items-center justify-between px-4 py-2.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors list-none">
                    <span>Référence : Niveaux KS3 Français</span>
                    <span className="ml-2 text-muted-foreground group-open:rotate-180 transition-transform duration-200 inline-block">
                      ▾
                    </span>
                  </summary>
                  <div className="px-4 pb-4 pt-1 overflow-x-auto">
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="py-1.5 pr-3 text-left font-semibold text-muted-foreground">
                            Niveau
                          </th>
                          <th className="py-1.5 pr-3 text-left font-semibold text-muted-foreground">
                            Seuil (%)
                          </th>
                          <th className="py-1.5 text-left font-semibold text-muted-foreground">
                            Description
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {KS3_FRENCH_BANDS.map((band: Ks3Band) => {
                          const isCurrent =
                            band.band === igcseComments.igcseGrade;
                          return (
                            <tr
                              key={band.band}
                              className={`border-b border-border/40 transition-colors ${isCurrent ? "bg-primary/10 font-semibold" : "hover:bg-muted/40"}`}
                            >
                              <td className="py-1.5 pr-3 font-mono font-bold text-foreground">
                                {band.band}
                                {isCurrent && (
                                  <span className="ml-1 text-[9px] text-primary font-normal align-middle">
                                    ← actuel
                                  </span>
                                )}
                              </td>
                              <td className="py-1.5 pr-3 font-mono text-muted-foreground">
                                {band.maxPercent === 100
                                  ? `≥ ${band.minPercent}%`
                                  : `${band.minPercent}–${band.maxPercent}%`}
                              </td>
                              <td className="py-1.5 text-muted-foreground">
                                {band.label}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </details>
              )}

              {/* Kenya 8-4-4 KCSE — Form 3 */}
              {isKcse844Grade(student.grade) && (
                <details className="group rounded-md border border-border/60 bg-muted/20">
                  <summary className="flex cursor-pointer select-none items-center justify-between px-4 py-2.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors list-none">
                    <span>
                      Référence : Barème KCSE Français (8-4-4 · Form 3)
                    </span>
                    <span className="ml-2 text-muted-foreground group-open:rotate-180 transition-transform duration-200 inline-block">
                      ▾
                    </span>
                  </summary>
                  <div className="px-4 pb-4 pt-1 overflow-x-auto">
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="py-1.5 pr-3 text-left font-semibold text-muted-foreground">
                            Note KCSE
                          </th>
                          <th className="py-1.5 pr-3 text-left font-semibold text-muted-foreground">
                            Points
                          </th>
                          <th className="py-1.5 pr-3 text-left font-semibold text-muted-foreground">
                            Seuil (%)
                          </th>
                          <th className="py-1.5 text-left font-semibold text-muted-foreground">
                            Descripteur
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {KCSE_GRADE_BOUNDARIES.map(
                          (boundary: KcseGradeBoundary) => {
                            const isCurrentGrade =
                              boundary.grade === igcseComments.igcseGrade;
                            return (
                              <tr
                                key={boundary.grade}
                                className={`border-b border-border/40 transition-colors ${isCurrentGrade ? "bg-primary/10 font-semibold" : "hover:bg-muted/40"}`}
                              >
                                <td className="py-1.5 pr-3 font-mono font-bold text-foreground">
                                  {boundary.grade}
                                  {isCurrentGrade && (
                                    <span className="ml-1 text-[9px] text-primary font-normal align-middle">
                                      ← actuel
                                    </span>
                                  )}
                                </td>
                                <td className="py-1.5 pr-3 font-mono text-muted-foreground">
                                  {boundary.points}
                                </td>
                                <td className="py-1.5 pr-3 font-mono text-muted-foreground">
                                  {boundary.maxPercent === 100
                                    ? `≥ ${boundary.minPercent}%`
                                    : `${boundary.minPercent}–${boundary.maxPercent}%`}
                                </td>
                                <td className="py-1.5 text-muted-foreground">
                                  {boundary.label}
                                </td>
                              </tr>
                            );
                          },
                        )}
                      </tbody>
                    </table>
                  </div>
                </details>
              )}

              {/* Kenya CBC/CBE — Grade 10 */}
              {isCbcGrade(student.grade) && (
                <details className="group rounded-md border border-border/60 bg-muted/20">
                  <summary className="flex cursor-pointer select-none items-center justify-between px-4 py-2.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors list-none">
                    <span>
                      Référence : Niveaux de réalisation CBC (Grade 10)
                    </span>
                    <span className="ml-2 text-muted-foreground group-open:rotate-180 transition-transform duration-200 inline-block">
                      ▾
                    </span>
                  </summary>
                  <div className="px-4 pb-4 pt-1 overflow-x-auto">
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="py-1.5 pr-3 text-left font-semibold text-muted-foreground">
                            Niveau
                          </th>
                          <th className="py-1.5 pr-3 text-left font-semibold text-muted-foreground">
                            Seuil (%)
                          </th>
                          <th className="py-1.5 text-left font-semibold text-muted-foreground">
                            Description
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {CBC_ACHIEVEMENT_LEVELS.map(
                          (level: CbcAchievementLevel) => {
                            const isCurrent =
                              level.level === igcseComments.igcseGrade;
                            return (
                              <tr
                                key={level.level}
                                className={`border-b border-border/40 transition-colors ${isCurrent ? "bg-primary/10 font-semibold" : "hover:bg-muted/40"}`}
                              >
                                <td className="py-1.5 pr-3 font-mono font-bold text-foreground">
                                  {level.level}
                                  {isCurrent && (
                                    <span className="ml-1 text-[9px] text-primary font-normal align-middle">
                                      ← actuel
                                    </span>
                                  )}
                                </td>
                                <td className="py-1.5 pr-3 font-mono text-muted-foreground">
                                  {level.maxPercent === 100
                                    ? `≥ ${level.minPercent}%`
                                    : `${level.minPercent}–${level.maxPercent}%`}
                                </td>
                                <td className="py-1.5 text-muted-foreground">
                                  {level.labelFr}
                                </td>
                              </tr>
                            );
                          },
                        )}
                      </tbody>
                    </table>
                  </div>
                </details>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ── Behaviour & Advice ──────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="border-amber-500/20 bg-amber-50/30 dark:bg-amber-950/10">
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-base font-semibold flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              Behaviour &amp; Advice
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-1">
              Record general classroom behaviour and personalised advice for{" "}
              {student?.name ?? "this student"}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            {/* Quick-tag chips */}
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Quick tags — click to append
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  "Participates actively",
                  "Needs encouragement",
                  "Respectful & polite",
                  "Disruptive at times",
                  "Excellent focus",
                  "Punctual",
                  "Frequently late",
                  "Strong teamwork",
                  "Works independently",
                  "Needs more effort",
                ].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() =>
                      setBehaviourComment((prev) =>
                        prev ? `${prev} ${tag}.` : `${tag}.`,
                      )
                    }
                    className="inline-flex items-center rounded-full border border-amber-300/60 bg-amber-100/60 dark:bg-amber-900/20 dark:border-amber-700/40 px-3 py-1 text-xs font-medium text-amber-800 dark:text-amber-300 hover:bg-amber-200/70 dark:hover:bg-amber-800/30 transition-colors cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Behaviour Comment textarea */}
            <div className="space-y-1.5">
              <Label
                htmlFor="behaviour-comment"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                General Behaviour
              </Label>
              <Textarea
                id="behaviour-comment"
                value={behaviourComment}
                onChange={(e) => setBehaviourComment(e.target.value)}
                placeholder="Describe the student's general classroom behaviour, attitude, and participation…"
                className="min-h-[120px] resize-y text-sm leading-relaxed bg-background/80"
              />
            </div>

            {/* Advice textarea */}
            <div className="space-y-1.5">
              <Label
                htmlFor="advice"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Personalised Advice
              </Label>
              <Textarea
                id="advice"
                value={advice}
                onChange={(e) => setAdvice(e.target.value)}
                placeholder="Write specific, actionable advice to help this student improve — aligned with IGCSE French expectations…"
                className="min-h-[120px] resize-y text-sm leading-relaxed bg-background/80"
              />
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Button
                size="sm"
                className="gap-2 bg-amber-600 hover:bg-amber-700 text-white dark:bg-amber-500 dark:hover:bg-amber-600"
                disabled={saveBehaviourMutation.isPending}
                onClick={() => {
                  saveBehaviourMutation.mutate(
                    { studentId, behaviourComment, advice },
                    {
                      onSuccess: () => toast.success("Behaviour record saved"),
                      onError: () =>
                        toast.error("Failed to save behaviour record"),
                    },
                  );
                }}
              >
                {saveBehaviourMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {saveBehaviourMutation.isPending ? "Saving…" : "Save Record"}
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => {
                  const combined = `Behaviour:\n${behaviourComment}\n\nAdvice:\n${advice}`;
                  navigator.clipboard
                    .writeText(combined)
                    .then(() => toast.success("Copied to clipboard"))
                    .catch(() => toast.error("Failed to copy"));
                }}
              >
                <Copy className="h-4 w-4" />
                Copy All
              </Button>
            </div>

            {/* Saved indicator */}
            {saveBehaviourMutation.isSuccess && (
              <p className="text-xs text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Saved successfully
              </p>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
