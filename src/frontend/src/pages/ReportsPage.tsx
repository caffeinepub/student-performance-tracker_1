import { Badge } from "@/components/ui/badge";
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
import { AlertTriangle, Trophy } from "lucide-react";
import { motion } from "motion/react";
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
import {
  KNOWN_CLASSES,
  filterByClass,
  useClassFilter,
} from "../context/ClassContext";
import {
  useAssessments,
  useMarks,
  useStudents,
  useSubjects,
} from "../hooks/useQueries";
import {
  CLASS_SUBJECTS,
  SAMPLE_ASSESSMENTS,
  SAMPLE_MARKS,
  SAMPLE_STUDENTS,
  SAMPLE_SUBJECTS,
} from "../utils/sampleData";
import { mean, round, stdDev, toPercent } from "../utils/statistics";

const TERM_COLORS = [
  "oklch(0.52 0.18 255)",
  "oklch(0.56 0.16 150)",
  "oklch(0.68 0.2 35)",
  "oklch(0.64 0.2 295)",
];

const BUCKET_COLORS = [
  "oklch(0.65 0.22 27)",
  "oklch(0.72 0.2 45)",
  "oklch(0.56 0.16 150)",
  "oklch(0.52 0.18 255)",
];

const CLASS_BAR_COLORS: Record<string, string> = {
  "Year 8": "oklch(0.52 0.18 255)",
  "Year 9": "oklch(0.56 0.16 150)",
  "Form 3": "oklch(0.68 0.2 35)",
  "Grade 10": "oklch(0.64 0.2 295)",
};

export default function ReportsPage() {
  const { data: students, isLoading } = useStudents();
  const { data: subjects } = useSubjects();
  const { data: assessments } = useAssessments();
  const { data: marks } = useMarks();
  const { selectedClass } = useClassFilter();

  const allStudents =
    students && students.length > 0 ? students : SAMPLE_STUDENTS;
  const displaySubjects =
    subjects && subjects.length > 0 ? subjects : SAMPLE_SUBJECTS;
  const displayAssessments =
    assessments && assessments.length > 0 ? assessments : SAMPLE_ASSESSMENTS;
  const allMarks = marks && marks.length > 0 ? marks : SAMPLE_MARKS;
  const isDemo = !students?.length;

  // Filter by selected class
  const displayStudents = filterByClass(allStudents, selectedClass);
  const classStudentIds = new Set(displayStudents.map((s) => s.id));
  const displayMarks = allMarks.filter((m) => classStudentIds.has(m.studentId));

  // Relevant subjects for the selected class
  const relevantSubjectNames =
    selectedClass === "All Classes"
      ? displaySubjects.map((s) => s.name)
      : (CLASS_SUBJECTS[selectedClass] ?? []);
  const filteredSubjects = displaySubjects.filter((s) =>
    relevantSubjectNames.includes(s.name),
  );

  // Get unique terms
  const terms = [...new Set(displayAssessments.map((a) => a.term))].sort();

  // Subject performance per term: grouped bar chart data
  const subjectTermData = filteredSubjects.map((subject) => {
    const entry: Record<string, string | number> = { subject: subject.name };
    for (const term of terms) {
      const termAssessments = displayAssessments.filter((a) => a.term === term);
      const relevantMarks = displayMarks.filter(
        (m) =>
          m.subjectId === subject.id &&
          termAssessments.some((a) => a.id === m.assessmentId),
      );
      const percents = relevantMarks.map((m) => {
        const a = displayAssessments.find((a) => a.id === m.assessmentId);
        return a ? toPercent(Number(m.score), Number(a.maxScore)) : 0;
      });
      entry[term] = percents.length > 0 ? round(mean(percents)) : 0;
    }
    return entry;
  });

  // Cross-class performance comparison (for All Classes view)
  const crossClassData = KNOWN_CLASSES.map((cls) => {
    const clsStudents = filterByClass(allStudents, cls);
    const clsIds = new Set(clsStudents.map((s) => s.id));
    const clsMarks = allMarks.filter((m) => clsIds.has(m.studentId));
    const percents = clsMarks.map((m) => {
      const a = displayAssessments.find((a) => a.id === m.assessmentId);
      return a ? toPercent(Number(m.score), Number(a.maxScore)) : 0;
    });
    return { class: cls, average: round(mean(percents)) };
  });

  // Student overall averages (within selected class)
  const studentAverages = displayStudents
    .map((student) => {
      const studentMarks = displayMarks.filter(
        (m) => m.studentId === student.id,
      );
      const percents = studentMarks.map((m) => {
        const a = displayAssessments.find((a) => a.id === m.assessmentId);
        return a ? toPercent(Number(m.score), Number(a.maxScore)) : 0;
      });
      return {
        student,
        avg: round(mean(percents)),
        markCount: studentMarks.length,
      };
    })
    .filter((s) => s.markCount > 0);

  const sorted = [...studentAverages].sort((a, b) => b.avg - a.avg);
  const top5 = sorted.slice(0, 5);
  const bottom5 = sorted.slice(-5).reverse();

  // Std deviation per assessment (using filtered marks)
  const stdDevData = [...displayAssessments]
    .sort((a, b) => (a.date < b.date ? -1 : 1))
    .map((assessment) => {
      const assessmentMarks = displayMarks.filter(
        (m) => m.assessmentId === assessment.id,
      );
      const percents = assessmentMarks.map((m) =>
        toPercent(Number(m.score), Number(assessment.maxScore)),
      );
      if (percents.length === 0) return null;
      return {
        name:
          assessment.name.length > 14
            ? `${assessment.name.slice(0, 11)}…`
            : assessment.name,
        fullName: assessment.name,
        stdDev: round(stdDev(percents)),
        avg: round(mean(percents)),
        count: percents.length,
      };
    })
    .filter(Boolean) as {
    name: string;
    fullName: string;
    stdDev: number;
    avg: number;
    count: number;
  }[];

  // Score distribution
  const recentAssessments = [...displayAssessments]
    .sort((a, b) => (a.date > b.date ? -1 : 1))
    .slice(0, 3);

  const distributionData = [
    { range: "0–40%", label: "Failing" },
    { range: "40–60%", label: "Pass" },
    { range: "60–80%", label: "Good" },
    { range: "80–100%", label: "Excellent" },
  ].map((bucket) => {
    const entry: Record<string, string | number> = {
      range: bucket.label,
    };
    for (const assessment of recentAssessments) {
      const assessmentMarks = displayMarks.filter(
        (m) => m.assessmentId === assessment.id,
      );
      const percents = assessmentMarks.map((m) =>
        toPercent(Number(m.score), Number(assessment.maxScore)),
      );
      let count = 0;
      if (bucket.range === "0–40%")
        count = percents.filter((p) => p < 40).length;
      else if (bucket.range === "40–60%")
        count = percents.filter((p) => p >= 40 && p < 60).length;
      else if (bucket.range === "60–80%")
        count = percents.filter((p) => p >= 60 && p < 80).length;
      else count = percents.filter((p) => p >= 80).length;
      entry[assessment.name] = count;
    }
    return entry;
  });

  return (
    <div className="space-y-6 p-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            Reports & Analytics
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {selectedClass === "All Classes"
              ? "Cross-class performance analysis"
              : `${selectedClass} performance analysis`}
            {isDemo && " · Demo data"}
          </p>
        </div>
        {isDemo && <Badge variant="secondary">Demo Data</Badge>}
      </div>

      {/* All Classes: cross-class comparison bar */}
      {selectedClass === "All Classes" && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="font-display text-base font-semibold">
                Class Performance Comparison
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-48 w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={crossClassData} barSize={40}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="oklch(0.88 0.015 255)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="class"
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
                      formatter={(v: number) => [`${v}%`, "Average"]}
                      contentStyle={{
                        background: "oklch(1 0 0)",
                        border: "1px solid oklch(0.88 0.015 255)",
                        borderRadius: "6px",
                        fontSize: "12px",
                      }}
                    />
                    <Bar dataKey="average" radius={[4, 4, 0, 0]}>
                      {crossClassData.map((entry) => (
                        <Cell
                          key={entry.class}
                          fill={CLASS_BAR_COLORS[entry.class] ?? TERM_COLORS[0]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Subject performance by term */}
      {filteredSubjects.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="font-display text-base font-semibold">
                Subject Performance by Term
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart
                    data={subjectTermData}
                    barGap={2}
                    barCategoryGap="30%"
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="oklch(0.88 0.015 255)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="subject"
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
                    <Legend
                      wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
                    />
                    {terms.map((term, i) => (
                      <Bar
                        key={term}
                        dataKey={term}
                        fill={TERM_COLORS[i % TERM_COLORS.length]}
                        radius={[3, 3, 0, 0]}
                        maxBarSize={40}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Top/Bottom performers */}
      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="font-display text-base font-semibold flex items-center gap-2">
                <Trophy className="h-4 w-4 text-chart-3" />
                Top 5 Performers
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8">#</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead className="text-right">Average</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {top5.length > 0 ? (
                    top5.map(({ student, avg }, i) => (
                      <TableRow key={student.id.toString()}>
                        <TableCell className="font-bold text-chart-3">
                          {i + 1}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">
                              {student.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {student.grade}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="font-display font-bold text-success">
                            {avg}%
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="text-center text-sm text-muted-foreground py-6"
                      >
                        No data
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="font-display text-base font-semibold flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                Needs Attention
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8">#</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead className="text-right">Average</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bottom5.length > 0 ? (
                    bottom5.map(({ student, avg }, i) => (
                      <TableRow key={student.id.toString()}>
                        <TableCell className="text-muted-foreground text-sm">
                          {i + 1}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">
                              {student.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {student.grade}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <span
                            className={`font-display font-bold ${avg < 40 ? "text-destructive" : "text-warning"}`}
                          >
                            {avg}%
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="text-center text-sm text-muted-foreground py-6"
                      >
                        No data
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Std deviation chart */}
      {stdDevData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="font-display text-base font-semibold">
                Score Spread per Assessment (Std Deviation)
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Higher values indicate greater variation in student scores —
                potentially harder assessments or uneven understanding.
              </p>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-56 w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={stdDevData} barSize={28}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="oklch(0.88 0.015 255)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 10, fill: "oklch(0.52 0.02 255)" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "oklch(0.52 0.02 255)" }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => `${v}%`}
                    />
                    <Tooltip
                      formatter={(v: number, name: string) => [
                        `${v}%`,
                        name === "stdDev" ? "Std Deviation" : "Class Average",
                      ]}
                      contentStyle={{
                        background: "oklch(1 0 0)",
                        border: "1px solid oklch(0.88 0.015 255)",
                        borderRadius: "6px",
                        fontSize: "12px",
                      }}
                    />
                    <Bar dataKey="stdDev" radius={[4, 4, 0, 0]}>
                      {stdDevData.map((entry) => (
                        <Cell
                          key={entry.fullName}
                          fill={
                            entry.stdDev > 20
                              ? "oklch(0.65 0.22 27)"
                              : entry.stdDev > 12
                                ? "oklch(0.72 0.2 45)"
                                : "oklch(0.52 0.18 255)"
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Score distribution */}
      {recentAssessments.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="font-display text-base font-semibold">
                Score Distribution (Recent Assessments)
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Number of students per score range for the 3 most recent
                assessments
              </p>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-56 w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart
                    data={distributionData}
                    barGap={2}
                    barCategoryGap="35%"
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="oklch(0.88 0.015 255)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="range"
                      tick={{ fontSize: 11, fill: "oklch(0.52 0.02 255)" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 11, fill: "oklch(0.52 0.02 255)" }}
                      axisLine={false}
                      tickLine={false}
                      label={{
                        value: "Students",
                        angle: -90,
                        position: "insideLeft",
                        fontSize: 10,
                        fill: "oklch(0.52 0.02 255)",
                      }}
                    />
                    <Tooltip
                      formatter={(v: number, name: string) => [
                        `${v} student${v !== 1 ? "s" : ""}`,
                        name,
                      ]}
                      contentStyle={{
                        background: "oklch(1 0 0)",
                        border: "1px solid oklch(0.88 0.015 255)",
                        borderRadius: "6px",
                        fontSize: "12px",
                      }}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: "10px", paddingTop: "8px" }}
                    />
                    {recentAssessments.map((a, i) => (
                      <Bar
                        key={a.id.toString()}
                        dataKey={a.name}
                        fill={BUCKET_COLORS[i % BUCKET_COLORS.length]}
                        radius={[3, 3, 0, 0]}
                        maxBarSize={36}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
