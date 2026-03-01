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
} from "../utils/igcseComments";
import {
  type GradeBoundary,
  IGCSE_GRADE_BOUNDARIES,
} from "../utils/igcseSyllabus";
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

  return (
    <div className="space-y-6 p-6 animate-fade-in">
      {/* Back button */}
      <Link to="/students">
        <Button variant="ghost" size="sm" className="gap-2 -ml-2 mb-2">
          <ArrowLeft className="h-4 w-4" />
          All Students
        </Button>
      </Link>

      {/* Student header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 font-display text-2xl font-bold text-primary">
            {student.name.charAt(0)}
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">
              {student.name}
            </h1>
            <p className="text-sm text-muted-foreground">{student.grade}</p>
          </div>
        </div>
        <div className="flex gap-4 flex-wrap">
          <div className="rounded-lg border border-border bg-card px-4 py-3 text-center">
            <p className="font-display text-2xl font-bold text-foreground">
              {studentAvg}%
            </p>
            <p className="text-xs text-muted-foreground">Overall Avg</p>
          </div>
          <div className="rounded-lg border border-border bg-card px-4 py-3 text-center">
            <p
              className={`font-display text-2xl font-bold ${deviation >= 0 ? "text-success" : "text-destructive"}`}
            >
              {deviation >= 0 ? "+" : ""}
              {deviation}%
            </p>
            <p className="text-xs text-muted-foreground">vs Class</p>
          </div>
          {studentMarks.length > 0 && igcseComments && (
            <div className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-center">
              <p className="font-display text-2xl font-bold text-foreground">
                {igcseComments.igcseGrade}
              </p>
              <p className="text-xs text-muted-foreground">
                IGCSE ({igcseComments.igcseUms})
              </p>
              <p className="text-[10px] text-muted-foreground">
                {igcseComments.igcseGradeLabel}
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
            <CardTitle className="font-display text-base font-semibold">
              Score Trend Over Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={extendedChartData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="oklch(0.88 0.015 255)"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
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
                  contentStyle={{
                    background: "oklch(1 0 0)",
                    border: "1px solid oklch(0.88 0.015 255)",
                    borderRadius: "6px",
                    fontSize: "12px",
                  }}
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
                  stroke="oklch(0.88 0.015 255)"
                  strokeDasharray="2 4"
                />
                <Line
                  type="monotone"
                  dataKey="studentScore"
                  stroke="oklch(0.52 0.18 255)"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "oklch(0.52 0.18 255)" }}
                  activeDot={{ r: 6 }}
                  connectNulls={false}
                />
                <Line
                  type="monotone"
                  dataKey="classAverage"
                  stroke="oklch(0.56 0.16 150)"
                  strokeWidth={1.5}
                  strokeDasharray="5 3"
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="regression"
                  stroke="oklch(0.68 0.2 35)"
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

      {/* Personalized IGCSE Comments */}
      {igcseComments && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="font-display text-base font-semibold flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                Commentaires personnalisés
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-1">
                Généré automatiquement · modifiable avant impression
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Summary */}
              <p className="text-sm text-foreground leading-relaxed rounded-md bg-muted/40 px-4 py-3 border border-border/50">
                {igcseComments.summary}
              </p>

              {/* Strengths + Improvements columns */}
              <div className="flex flex-wrap gap-4">
                {/* Strengths */}
                <div className="flex-1 min-w-[240px] space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-success flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Points forts
                  </h4>
                  <ul className="space-y-2">
                    {igcseComments.strengths.map((strength) => (
                      <li
                        key={strength}
                        className="flex gap-2 text-sm text-foreground"
                      >
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                        <span>{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Improvements */}
                <div className="flex-1 min-w-[240px] space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                    <AlertCircle className="h-3.5 w-3.5" />
                    Axes d&apos;amélioration
                  </h4>
                  <ul className="space-y-2">
                    {igcseComments.improvements.map((improvement) => (
                      <li
                        key={improvement}
                        className="flex gap-2 text-sm text-foreground"
                      >
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                        <span>{improvement}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Target skills */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Compétences à renforcer (IGCSE Français)
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
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Note pour l&apos;enseignant(e)
                  </span>
                </div>
                <p className="text-sm italic text-muted-foreground rounded-md bg-muted/40 border border-border/50 px-4 py-3 leading-relaxed">
                  {igcseComments.teacherNote}
                </p>
              </div>

              {/* Editable textarea */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Texte complet (éditable)
                </h4>
                <Textarea
                  value={editableCommentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="min-h-[200px] font-mono text-xs leading-relaxed resize-y"
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

              {/* IGCSE Grade Reference Table */}
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
                      {IGCSE_GRADE_BOUNDARIES.map((boundary: GradeBoundary) => {
                        const isCurrentGrade =
                          boundary.grade === igcseComments.igcseGrade;
                        return (
                          <tr
                            key={boundary.grade}
                            className={`border-b border-border/40 transition-colors ${
                              isCurrentGrade
                                ? "bg-primary/10 font-semibold"
                                : "hover:bg-muted/40"
                            }`}
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
                      })}
                    </tbody>
                  </table>
                </div>
              </details>
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
