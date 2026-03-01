import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@tanstack/react-router";
import { ChevronRight, Loader2, Search, Trash2, UserPlus } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import {
  KNOWN_CLASSES,
  filterByClass,
  useClassFilter,
} from "../context/ClassContext";
import {
  useAssessments,
  useCreateStudent,
  useDeleteStudent,
  useMarks,
  useStudents,
} from "../hooks/useQueries";
import {
  SAMPLE_ASSESSMENTS,
  SAMPLE_MARKS,
  SAMPLE_STUDENTS,
} from "../utils/sampleData";
import { mean, round, toPercent } from "../utils/statistics";

export default function StudentsPage() {
  const { data: students, isLoading: studentsLoading } = useStudents();
  const { data: marks } = useMarks();
  const { data: assessments } = useAssessments();
  const createStudent = useCreateStudent();
  const deleteStudent = useDeleteStudent();
  const { selectedClass } = useClassFilter();

  const [addOpen, setAddOpen] = useState(false);
  const [name, setName] = useState("");
  const [grade, setGrade] = useState<string>("");
  const [search, setSearch] = useState("");

  const allStudents =
    students && students.length > 0 ? students : SAMPLE_STUDENTS;
  const displayMarks = marks && marks.length > 0 ? marks : SAMPLE_MARKS;
  const displayAssessments =
    assessments && assessments.length > 0 ? assessments : SAMPLE_ASSESSMENTS;
  const isDemo = !students?.length;

  // Filter students by class
  const classStudents = filterByClass(allStudents, selectedClass);

  // Further filter by search
  const filteredStudents = classStudents.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.grade.toLowerCase().includes(search.toLowerCase()),
  );

  // Default the grade field when opening the dialog
  const openAddDialog = () => {
    setName("");
    setGrade(selectedClass !== "All Classes" ? selectedClass : "");
    setAddOpen(true);
  };

  const handleCreate = async () => {
    if (!name.trim() || !grade.trim()) return;
    try {
      await createStudent.mutateAsync({
        name: name.trim(),
        grade: grade.trim(),
      });
      toast.success(`Student "${name}" added successfully`);
      setName("");
      setGrade("");
      setAddOpen(false);
    } catch {
      toast.error("Failed to add student");
    }
  };

  const handleDelete = async (id: bigint, studentName: string) => {
    try {
      await deleteStudent.mutateAsync(id);
      toast.success(`"${studentName}" removed`);
    } catch {
      toast.error("Failed to delete student");
    }
  };

  const getStudentAvg = (studentId: bigint) => {
    const studentMarks = displayMarks.filter((m) => m.studentId === studentId);
    if (studentMarks.length === 0) return null;
    const percents = studentMarks.map((m) => {
      const a = displayAssessments.find((a) => a.id === m.assessmentId);
      return a ? toPercent(Number(m.score), Number(a.maxScore)) : 0;
    });
    return round(mean(percents));
  };

  const getPerformanceBadge = (avg: number | null) => {
    if (avg === null)
      return { label: "No data", variant: "secondary" as const };
    if (avg >= 80) return { label: "Excellent", variant: "default" as const };
    if (avg >= 60) return { label: "Good", variant: "secondary" as const };
    if (avg >= 40) return { label: "Average", variant: "outline" as const };
    return { label: "Needs attention", variant: "destructive" as const };
  };

  // Group students by class when "All Classes" selected
  const groupedByClass =
    selectedClass === "All Classes"
      ? KNOWN_CLASSES.map((cls) => ({
          cls,
          students: filteredStudents.filter((s) => s.grade === cls),
        })).filter((g) => g.students.length > 0)
      : null;

  return (
    <div className="space-y-6 p-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            Students
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {classStudents.length} learner
            {classStudents.length !== 1 ? "s" : ""}
            {selectedClass !== "All Classes"
              ? ` · ${selectedClass}`
              : " · All classes"}
            {isDemo && " · Demo data"}
          </p>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button onClick={openAddDialog}>
              <UserPlus className="mr-2 h-4 w-4" />
              Add Student
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-display">
                Add New Student
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  placeholder="e.g. Sophie Clarke"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && void handleCreate()}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="grade-select">Class</Label>
                <Select value={grade} onValueChange={setGrade}>
                  <SelectTrigger id="grade-select">
                    <SelectValue placeholder="Select class…" />
                  </SelectTrigger>
                  <SelectContent>
                    {KNOWN_CLASSES.map((cls) => (
                      <SelectItem key={cls} value={cls}>
                        {cls}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => void handleCreate()}
                disabled={
                  !name.trim() || !grade.trim() || createStudent.isPending
                }
              >
                {createStudent.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Add Student
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search students..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Student grid — grouped when All Classes, flat otherwise */}
      {studentsLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : groupedByClass ? (
        /* All Classes: show sections */
        <div className="space-y-6">
          {groupedByClass.map(({ cls, students: clsStudents }) => (
            <div key={cls}>
              <h2 className="mb-3 flex items-center gap-2 font-display text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                {cls}
                <Badge
                  variant="secondary"
                  className="text-xs font-normal lowercase"
                >
                  {clsStudents.length} students
                </Badge>
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {clsStudents.map((student, i) => {
                  const avg = getStudentAvg(student.id);
                  const { label, variant } = getPerformanceBadge(avg);
                  return (
                    <StudentCard
                      key={student.id.toString()}
                      student={student}
                      avg={avg}
                      label={label}
                      variant={variant}
                      index={i}
                      isDemo={isDemo}
                      onDelete={handleDelete}
                      showDelete={!!(students && students.length > 0)}
                    />
                  );
                })}
              </div>
            </div>
          ))}
          {filteredStudents.length === 0 && (
            <p className="py-12 text-center text-sm text-muted-foreground">
              No students match your search
            </p>
          )}
        </div>
      ) : (
        /* Single class: flat grid */
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredStudents.map((student, i) => {
            const avg = getStudentAvg(student.id);
            const { label, variant } = getPerformanceBadge(avg);
            return (
              <StudentCard
                key={student.id.toString()}
                student={student}
                avg={avg}
                label={label}
                variant={variant}
                index={i}
                isDemo={isDemo}
                onDelete={handleDelete}
                showDelete={!!(students && students.length > 0)}
              />
            );
          })}
          {filteredStudents.length === 0 && (
            <div className="col-span-full py-12 text-center text-muted-foreground">
              <p className="text-sm">No students in {selectedClass}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Student Card sub-component ───────────────────────────────────────────────
function StudentCard({
  student,
  avg,
  label,
  variant,
  index,
  onDelete,
  showDelete,
}: {
  student: { id: bigint; name: string; grade: string };
  avg: number | null;
  label: string;
  variant: "default" | "secondary" | "outline" | "destructive";
  index: number;
  isDemo: boolean;
  onDelete: (id: bigint, name: string) => Promise<void>;
  showDelete: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
    >
      <Card className="group relative overflow-hidden transition-all hover:shadow-elevated">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Link
              to="/students/$id"
              params={{ id: student.id.toString() }}
              className="flex flex-1 items-start gap-3 min-w-0"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 font-display text-sm font-bold text-primary">
                {student.name.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-foreground group-hover:text-primary transition-colors">
                  {student.name}
                </p>
                <p className="text-xs text-muted-foreground">{student.grade}</p>
                <div className="mt-2 flex items-center gap-2">
                  <Badge variant={variant} className="text-[10px]">
                    {label}
                  </Badge>
                  {avg !== null && (
                    <span className="text-xs font-medium text-muted-foreground">
                      {avg}% avg
                    </span>
                  )}
                </div>
              </div>
              <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground/50 group-hover:text-primary transition-colors" />
            </Link>

            {showDelete && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Remove {student.name}?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete the student and all their
                      marks. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => void onDelete(student.id, student.name)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Remove
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
