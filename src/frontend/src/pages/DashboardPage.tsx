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

// Updated chart colors to match new warm ink-navy + amber gold palette
const CHART_COLORS = [
  "oklch(0.42 0.16 260)",
  "oklch(0.62 0.18 145)",
  "oklch(0.72 0.18 55)",
  "oklch(0.60 0.18 310)",
];

const CLASS_BAR_COLORS: Record<string, string> = {
  "Year 8": "oklch(0.42 0.16 260)",
  "Year 9": "oklch(0.62 0.18 145)",
  "Form 3": "oklch(0.72 0.18 55)",
  "Grade 10": "oklch(0.60 0.18 310)",
};

// Left-border accent colors per stat card (editorial style)
const STAT_BORDERS = [
  "border-l-chart-1",
  "border-l-chart-2",
  "border-l-chart-3",
  "border-l-chart-4",
];

const STAT_NUM_COLORS = [
  "text-chart-1",
  "text-chart-2",
  "text-chart-3",
  "text-chart-4",
];

const QUICK_LINK_GRADIENTS = [
  "from-blue-50/80 to-blue-50/20",
  "from-emerald-50/80 to-emerald-50/20",
  "from-amber-50/80 to-amber-50/20",
  "from-violet-50/80 to-violet-50/20",
];

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
      link: "/students",
    },
    {
      title: "Subjects",
      value: filteredSubjects.length,
      icon: BookOpen,
      link: "/subjects",
    },
    {
      title: "Assessments",
      value: displayAssessments.length,
      icon: ClipboardList,
      link: "/subjects",
    },
    {
      title:
        selectedClass === "All Classes" ? "Overall Average" : "Class Average",
      value: `${classAvg}%`,
      icon: TrendingUp,
      link: "/reports",
    },
  ];

  const tooltipStyle = {
    background: "oklch(0.995 0.002 80)",
    border: "1px solid oklch(0.88 0.012 80)",
    borderRadius: "8px",
    fontSize: "12px",
    boxShadow: "0 4px 12px oklch(0.15 0.03 260 / 0.08)",
  };

  const axisTickStyle = { fontSize: 11, fill: "oklch(0.50 0.025 260)" };

  return (
    <div className="space-y-8 p-6 animate-fade-in">
      {/* Header */}
      <div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">
              {selectedClass === "All Classes"
                ? "Bienvenue — Vue d'ensemble"
                : `Bienvenue — ${selectedClass}`}
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground font-body">
              {selectedClass === "All Classes"
                ? "Aperçu de toutes vos classes · résultats et progressions"
                : `Performances et progrès · ${selectedClass} · résultats du semestre`}
            </p>
          </div>
          {isDemo && (
            <Badge variant="secondary" className="text-xs shrink-0 mt-1">
              Demo Data
            </Badge>
          )}
        </div>
        {/* Decorative divider */}
        <div className="mt-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <div className="h-1.5 w-1.5 rounded-full bg-accent" />
          <div className="h-px w-8 bg-border" />
        </div>
      </div>

      {/* Summary cards — editorial style with left border accent */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {summaryCards.map(({ title, value, icon: Icon, link }, i) => (
          <motion.div
            key={title}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07, ease: "easeOut" }}
          >
            <Link to={link}>
              <Card
                className={`group cursor-pointer transition-all duration-200 hover:shadow-elevated border-l-4 ${STAT_BORDERS[i]} overflow-hidden`}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest truncate">
                        {title}
                      </p>
                      {isLoading ? (
                        <Skeleton className="mt-2 h-9 w-16" />
                      ) : (
                        <p
                          className={`mt-2 font-display text-3xl font-bold ${STAT_NUM_COLORS[i]}`}
                        >
                          {value}
                        </p>
                      )}
                    </div>
                    <div className="rounded-lg bg-secondary p-2 shrink-0 group-hover:bg-secondary/80 transition-colors">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-1 text-[11px] text-muted-foreground/70 group-hover:text-primary transition-colors">
                    <span>View details</span>
                    <ArrowRight className="h-3 w-3" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Subject/Class performance chart */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="font-display text-base font-semibold tracking-tight">
                {selectedClass === "All Classes"
                  ? "Average Score by Class"
                  : "Average Score by Subject"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-56 w-full" />
              ) : selectedClass === "All Classes" ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={crossClassData} barSize={36}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="oklch(0.88 0.012 80)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="class"
                      tick={axisTickStyle}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={axisTickStyle}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => `${v}%`}
                    />
                    <Tooltip
                      formatter={(v: number) => [`${v}%`, "Average"]}
                      contentStyle={tooltipStyle}
                    />
                    <Bar dataKey="average" radius={[5, 5, 0, 0]}>
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
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={subjectData} barSize={36}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="oklch(0.88 0.012 80)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="name"
                      tick={axisTickStyle}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={axisTickStyle}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => `${v}%`}
                    />
                    <Tooltip
                      formatter={(v: number) => [`${v}%`, "Average"]}
                      contentStyle={tooltipStyle}
                    />
                    <Bar dataKey="average" radius={[5, 5, 0, 0]}>
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
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="font-display text-base font-semibold tracking-tight">
                Recent Assessments
              </CardTitle>
              <Link
                to="/subjects"
                className="flex items-center gap-1 text-xs text-primary hover:underline font-medium"
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
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <ClipboardList className="h-8 w-8 text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No assessment data for this class yet
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {recentAssessments.map((assessment) => (
                    <div
                      key={assessment.id.toString()}
                      className="group flex items-center justify-between px-5 py-3.5 hover:bg-secondary/40 transition-colors"
                    >
                      <div>
                        <p className="text-sm font-semibold text-foreground leading-snug">
                          {assessment.name}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {assessment.term} · {assessment.date}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 text-right">
                        <div>
                          <p className="text-sm font-bold text-foreground font-display">
                            {assessment.classAvg}%
                          </p>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                            avg
                          </p>
                        </div>
                        <div className="hidden sm:block">
                          <p className="text-sm font-semibold text-muted-foreground font-mono">
                            ±{assessment.stdDeviation}
                          </p>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                            σ dev
                          </p>
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
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="font-display text-base font-semibold tracking-tight">
                Class Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {crossClassData.map((cls) => (
                  <div
                    key={cls.class}
                    className="flex items-center justify-between px-5 py-4 hover:bg-secondary/40 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="h-3 w-3 rounded-full shrink-0"
                        style={{
                          background:
                            CLASS_BAR_COLORS[cls.class] ?? CHART_COLORS[0],
                        }}
                      />
                      <span className="font-semibold text-sm text-foreground">
                        {cls.class}
                      </span>
                    </div>
                    <div className="flex items-center gap-6">
                      <span className="text-xs text-muted-foreground">
                        {cls.students} students
                      </span>
                      <span className="font-display font-bold text-foreground text-xl">
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

      {/* Quick links — action tiles with gradient backgrounds */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="grid grid-cols-2 gap-4 sm:grid-cols-4"
      >
        {[
          {
            to: "/students",
            label: "Manage Students",
            icon: Users,
            gradient: QUICK_LINK_GRADIENTS[0],
          },
          {
            to: "/subjects",
            label: "Manage Subjects",
            icon: BookOpen,
            gradient: QUICK_LINK_GRADIENTS[1],
          },
          {
            to: "/import",
            label: "Import from Excel",
            icon: ClipboardList,
            gradient: QUICK_LINK_GRADIENTS[2],
          },
          {
            to: "/reports",
            label: "View Reports",
            icon: TrendingUp,
            gradient: QUICK_LINK_GRADIENTS[3],
          },
        ].map(({ to, label, icon: Icon, gradient }) => (
          <Link key={to} to={to}>
            <Card
              className={`cursor-pointer transition-all duration-200 hover:shadow-elevated bg-gradient-to-br ${gradient} border-border/60`}
            >
              <CardContent className="flex flex-col gap-2.5 p-4">
                <div className="flex items-center justify-between">
                  <Icon className="h-4 w-4 text-foreground/60" />
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/50 group-hover:text-primary transition-colors" />
                </div>
                <span className="text-sm font-semibold text-foreground leading-snug">
                  {label}
                </span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </motion.div>
    </div>
  );
}
