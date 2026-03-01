import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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

  const displayStudents =
    students && students.length > 0 ? students : SAMPLE_STUDENTS;
  const displayMarks = marks && marks.length > 0 ? marks : SAMPLE_MARKS;
  const displayAssessments =
    assessments && assessments.length > 0 ? assessments : SAMPLE_ASSESSMENTS;
  const displaySubjects =
    subjects && subjects.length > 0 ? subjects : SAMPLE_SUBJECTS;

  const studentId = BigInt(id);
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

  // Sort assessments by date
  const sortedAssessments = [...displayAssessments].sort((a, b) =>
    a.date < b.date ? -1 : 1,
  );

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
        <div className="flex gap-4">
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
    </div>
  );
}
