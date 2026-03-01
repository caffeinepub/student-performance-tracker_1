import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BookOpen,
  ClipboardList,
  TrendingUp,
  Users,
} from "lucide-react";
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

const CHART_COLORS = [
  "oklch(0.52 0.18 255)",
  "oklch(0.56 0.16 150)",
  "oklch(0.68 0.2 35)",
  "oklch(0.64 0.2 295)",
];

const CLASS_BAR_COLORS: Record<string, string> = {
  "Year 8": "oklch(0.52 0.18 255)",
  "Year 9": "oklch(0.56 0.16 150)",
  "Form 3": "oklch(0.68 0.2 35)",
  "Grade 10": "oklch(0.64 0.2 295)",
};

export default function DashboardPage() {
  const { data: students, isLoading: studentsLoading } = useStudents();
  const { data: subjects, isLoading: subjectsLoading } = useSubjects();
  const { data: assessments, isLoading: assessmentsLoading } = useAssessments();
  const { data: marks, isLoading: marksLoading } = useMarks();
  const { selectedClass } = useClassFilter();

  const isLoading =
    studentsLoading || subjectsLoading || assessmentsLoading || marksLoading;

  // Use sample data if no real data exists
  const allStudents =
    students && students.length > 0 ? students : SAMPLE_STUDENTS;
  const displaySubjects =
    subjects && subjects.length > 0 ? subjects : SAMPLE_SUBJECTS;
  const displayAssessments =
    assessments && assessments.length > 0 ? assessments : SAMPLE_ASSESSMENTS;
  const allMarks = marks && marks.length > 0 ? marks : SAMPLE_MARKS;
  const isDemo = !students?.length && !subjects?.length && !assessments?.length;

  // Filter students by selected class
  const displayStudents = filterByClass(allStudents, selectedClass);

  // Get student IDs in the current class
  const classStudentIds = new Set(displayStudents.map((s) => s.id));

  // Filter marks to only current class students
  const displayMarks = allMarks.filter((m) => classStudentIds.has(m.studentId));

  // For All Classes: subjects relevant are all subjects with marks in this filtered set
  // For specific class: use CLASS_SUBJECTS mapping to filter subjects
  const relevantSubjectNames =
    selectedClass === "All Classes"
      ? displaySubjects.map((s) => s.name)
      : (CLASS_SUBJECTS[selectedClass] ?? []);

  const filteredSubjects = displaySubjects.filter((s) =>
    relevantSubjectNames.includes(s.name),
  );

  // Overall average for selected class
  const allScorePercents = displayMarks.map((m) => {
    const assessment = displayAssessments.find((a) => a.id === m.assessmentId);
    return assessment
      ? toPercent(Number(m.score), Number(assessment.maxScore))
      : 0;
  });
  const classAvg = round(mean(allScorePercents));

  // Per-subject averages for bar chart (filtered subjects only)
  const subjectData = filteredSubjects.map((subject) => {
    const subjectMarks = displayMarks.filter((m) => m.subjectId === subject.id);
    const percents = subjectMarks.map((m) => {
      const a = displayAssessments.find((a) => a.id === m.assessmentId);
      return a ? toPercent(Number(m.score), Number(a.maxScore)) : 0;
    });
    return {
      name: subject.name,
      average: round(mean(percents)),
    };
  });

  // All Classes: cross-class comparison chart
  const crossClassData = KNOWN_CLASSES.map((cls) => {
    const clsStudents = filterByClass(allStudents, cls);
    const clsStudentIds = new Set(clsStudents.map((s) => s.id));
    const clsMarks = allMarks.filter((m) => clsStudentIds.has(m.studentId));
    const percents = clsMarks.map((m) => {
      const a = displayAssessments.find((a) => a.id === m.assessmentId);
      return a ? toPercent(Number(m.score), Number(a.maxScore)) : 0;
    });
    return {
      class: cls,
      average: round(mean(percents)),
      students: clsStudents.length,
    };
  });

  // Recent assessments with stats
  const recentAssessments = [...displayAssessments]
    .sort((a, b) => (a.date > b.date ? -1 : 1))
    .slice(0, 4)
    .map((assessment) => {
      const assessmentMarks = displayMarks.filter(
        (m) => m.assessmentId === assessment.id,
      );
      const percents = assessmentMarks.map((m) =>
        toPercent(Number(m.score), Number(assessment.maxScore)),
      );
      return {
        ...assessment,
        classAvg: round(mean(percents)),
        stdDeviation: round(stdDev(percents)),
        count: percents.length,
      };
    })
    .filter((a) => a.count > 0);

  const summaryCards = [
    {
      title:
        selectedClass === "All Classes"
          ? "Total Students"
          : `${selectedClass} Students`,
      value: displayStudents.length,
      icon: Users,
      color: "text-chart-1",
      bg: "bg-chart-1/10",
      link: "/students",
    },
    {
      title: "Subjects",
      value: filteredSubjects.length,
      icon: BookOpen,
      color: "text-chart-2",
      bg: "bg-chart-2/10",
      link: "/subjects",
    },
    {
      title: "Assessments",
      value: displayAssessments.length,
      icon: ClipboardList,
      color: "text-chart-3",
      bg: "bg-chart-3/10",
      link: "/subjects",
    },
    {
      title:
        selectedClass === "All Classes" ? "Overall Average" : "Class Average",
      value: `${classAvg}%`,
      icon: TrendingUp,
      color: "text-chart-4",
      bg: "bg-chart-4/10",
      link: "/reports",
    },
  ];

  return (
    <div className="space-y-6 p-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {selectedClass === "All Classes"
              ? "All classes overview"
              : `${selectedClass} performance overview`}
          </p>
        </div>
        {isDemo && (
          <Badge variant="secondary" className="text-xs">
            Demo Data
          </Badge>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {summaryCards.map(
          ({ title, value, icon: Icon, color, bg, link }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <Link to={link}>
                <Card className="group cursor-pointer transition-shadow hover:shadow-elevated">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          {title}
                        </p>
                        {isLoading ? (
                          <Skeleton className="mt-2 h-8 w-16" />
                        ) : (
                          <p className="mt-2 font-display text-3xl font-bold text-foreground">
                            {value}
                          </p>
                        )}
                      </div>
                      <div className={`rounded-lg ${bg} p-2.5`}>
                        <Icon className={`h-5 w-5 ${color}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ),
        )}
      </div>

      {/* Charts row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Subject/Class performance chart */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="font-display text-base font-semibold">
                {selectedClass === "All Classes"
                  ? "Average Score by Class"
                  : "Average Score by Subject"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-56 w-full" />
              ) : selectedClass === "All Classes" ? (
                /* Cross-class comparison */
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={crossClassData} barSize={36}>
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
                          fill={
                            CLASS_BAR_COLORS[entry.class] ?? CHART_COLORS[0]
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                /* Subject performance for selected class */
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={subjectData} barSize={36}>
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
                      formatter={(v: number) => [`${v}%`, "Average"]}
                      contentStyle={{
                        background: "oklch(1 0 0)",
                        border: "1px solid oklch(0.88 0.015 255)",
                        borderRadius: "6px",
                        fontSize: "12px",
                      }}
                    />
                    <Bar dataKey="average" radius={[4, 4, 0, 0]}>
                      {subjectData.map((entry, idx) => (
                        <Cell
                          key={entry.name}
                          fill={CHART_COLORS[idx % CHART_COLORS.length]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent assessments */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="font-display text-base font-semibold">
                Recent Assessments
              </CardTitle>
              <Link
                to="/subjects"
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="space-y-2 p-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : recentAssessments.length === 0 ? (
                <p className="p-6 text-center text-sm text-muted-foreground">
                  No assessment data for this class yet
                </p>
              ) : (
                <div className="divide-y divide-border">
                  {recentAssessments.map((assessment) => (
                    <div
                      key={assessment.id.toString()}
                      className="flex items-center justify-between px-5 py-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {assessment.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {assessment.term} · {assessment.date}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 text-right">
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            {assessment.classAvg}%
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            avg
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-muted-foreground">
                            ±{assessment.stdDeviation}
                          </p>
                          <p className="text-[10px] text-muted-foreground">σ</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* All Classes summary table */}
      {selectedClass === "All Classes" && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="font-display text-base font-semibold">
                Class Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {crossClassData.map((cls) => (
                  <div
                    key={cls.class}
                    className="flex items-center justify-between px-5 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="h-3 w-3 rounded-full"
                        style={{
                          background:
                            CLASS_BAR_COLORS[cls.class] ?? CHART_COLORS[0],
                        }}
                      />
                      <span className="font-medium text-sm text-foreground">
                        {cls.class}
                      </span>
                    </div>
                    <div className="flex items-center gap-6">
                      <span className="text-xs text-muted-foreground">
                        {cls.students} students
                      </span>
                      <span className="font-display font-bold text-foreground text-lg">
                        {cls.average}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Quick links */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="grid grid-cols-2 gap-4 sm:grid-cols-4"
      >
        {[
          { to: "/students", label: "Manage Students", icon: Users },
          { to: "/subjects", label: "Manage Subjects", icon: BookOpen },
          { to: "/import", label: "Import from Excel", icon: ClipboardList },
          { to: "/reports", label: "View Reports", icon: TrendingUp },
        ].map(({ to, label, icon: Icon }) => (
          <Link key={to} to={to}>
            <Card className="cursor-pointer transition-all hover:shadow-elevated hover:border-primary/30">
              <CardContent className="flex items-center gap-3 p-4">
                <Icon className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-foreground">
                  {label}
                </span>
                <ArrowRight className="ml-auto h-3 w-3 text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </motion.div>
    </div>
  );
}
