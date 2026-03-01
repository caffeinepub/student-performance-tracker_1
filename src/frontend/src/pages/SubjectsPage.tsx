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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BookOpen,
  ClipboardList,
  Loader2,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { Assessment } from "../backend.d";
import {
  useAssessments,
  useCreateAssessment,
  useCreateSubject,
  useDeleteAssessment,
  useDeleteSubject,
  useSubjects,
  useUpdateAssessment,
  useUpdateSubject,
} from "../hooks/useQueries";
import { SAMPLE_ASSESSMENTS, SAMPLE_SUBJECTS } from "../utils/sampleData";

export default function SubjectsPage() {
  const { data: subjects, isLoading: subjectsLoading } = useSubjects();
  const { data: assessments, isLoading: assessmentsLoading } = useAssessments();

  const createSubject = useCreateSubject();
  const updateSubject = useUpdateSubject();
  const deleteSubject = useDeleteSubject();
  const createAssessment = useCreateAssessment();
  const updateAssessment = useUpdateAssessment();
  const deleteAssessment = useDeleteAssessment();

  const displaySubjects =
    subjects && subjects.length > 0 ? subjects : SAMPLE_SUBJECTS;
  const displayAssessments =
    assessments && assessments.length > 0 ? assessments : SAMPLE_ASSESSMENTS;
  const isDemo = !subjects?.length;

  // Subject dialog state
  const [subjectDialogOpen, setSubjectDialogOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<{
    id: bigint;
    name: string;
  } | null>(null);
  const [subjectName, setSubjectName] = useState("");

  // Assessment dialog state
  const [assessmentDialogOpen, setAssessmentDialogOpen] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState<Assessment | null>(
    null,
  );
  const [aName, setAName] = useState("");
  const [aTerm, setATerm] = useState("");
  const [aDate, setADate] = useState("");
  const [aMaxScore, setAMaxScore] = useState("");

  const openAddSubject = () => {
    setEditingSubject(null);
    setSubjectName("");
    setSubjectDialogOpen(true);
  };

  const openEditSubject = (s: { id: bigint; name: string }) => {
    setEditingSubject(s);
    setSubjectName(s.name);
    setSubjectDialogOpen(true);
  };

  const handleSaveSubject = async () => {
    if (!subjectName.trim()) return;
    try {
      if (editingSubject) {
        await updateSubject.mutateAsync({
          id: editingSubject.id,
          name: subjectName.trim(),
        });
        toast.success("Subject updated");
      } else {
        await createSubject.mutateAsync(subjectName.trim());
        toast.success("Subject created");
      }
      setSubjectDialogOpen(false);
    } catch {
      toast.error("Failed to save subject");
    }
  };

  const handleDeleteSubject = async (id: bigint, name: string) => {
    try {
      await deleteSubject.mutateAsync(id);
      toast.success(`"${name}" deleted`);
    } catch {
      toast.error("Failed to delete subject");
    }
  };

  const openAddAssessment = () => {
    setEditingAssessment(null);
    setAName("");
    setATerm("");
    setADate("");
    setAMaxScore("");
    setAssessmentDialogOpen(true);
  };

  const openEditAssessment = (a: Assessment) => {
    setEditingAssessment(a);
    setAName(a.name);
    setATerm(a.term);
    setADate(a.date);
    setAMaxScore(a.maxScore.toString());
    setAssessmentDialogOpen(true);
  };

  const handleSaveAssessment = async () => {
    if (!aName.trim() || !aTerm.trim() || !aDate || !aMaxScore) return;
    const maxScore = BigInt(Math.round(Number(aMaxScore)));
    try {
      if (editingAssessment) {
        await updateAssessment.mutateAsync({
          id: editingAssessment.id,
          name: aName.trim(),
          term: aTerm.trim(),
          date: aDate,
          maxScore,
        });
        toast.success("Assessment updated");
      } else {
        await createAssessment.mutateAsync({
          name: aName.trim(),
          term: aTerm.trim(),
          date: aDate,
          maxScore,
        });
        toast.success("Assessment created");
      }
      setAssessmentDialogOpen(false);
    } catch {
      toast.error("Failed to save assessment");
    }
  };

  const handleDeleteAssessment = async (id: bigint, name: string) => {
    try {
      await deleteAssessment.mutateAsync(id);
      toast.success(`"${name}" deleted`);
    } catch {
      toast.error("Failed to delete assessment");
    }
  };

  // Group assessments by term
  const assessmentsByTerm: Record<string, typeof displayAssessments> = {};
  for (const a of displayAssessments) {
    if (!assessmentsByTerm[a.term]) assessmentsByTerm[a.term] = [];
    assessmentsByTerm[a.term].push(a);
  }
  const terms = Object.keys(assessmentsByTerm).sort();

  const isSaving =
    createSubject.isPending ||
    updateSubject.isPending ||
    createAssessment.isPending ||
    updateAssessment.isPending;

  return (
    <div className="space-y-6 p-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            Subjects & Assessments
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your curriculum{isDemo && " · Demo data"}
          </p>
        </div>
      </div>

      <Tabs defaultValue="subjects">
        <TabsList>
          <TabsTrigger value="subjects" className="gap-2">
            <BookOpen className="h-4 w-4" />
            Subjects
          </TabsTrigger>
          <TabsTrigger value="assessments" className="gap-2">
            <ClipboardList className="h-4 w-4" />
            Assessments
          </TabsTrigger>
        </TabsList>

        {/* Subjects Tab */}
        <TabsContent value="subjects" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <Button onClick={openAddSubject} disabled={isDemo} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Subject
            </Button>
          </div>

          {subjectsLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {displaySubjects.map((subject, i) => (
                <motion.div
                  key={subject.id.toString()}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className="group hover:shadow-elevated transition-all">
                    <CardContent className="flex items-center justify-between p-4">
                      <Link
                        to="/subjects/$id"
                        params={{ id: subject.id.toString() }}
                        className="flex flex-1 items-center gap-3 min-w-0"
                      >
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                          <BookOpen className="h-4 w-4 text-primary" />
                        </div>
                        <p className="font-medium text-foreground group-hover:text-primary transition-colors">
                          {subject.name}
                        </p>
                        <ArrowRight className="ml-1 h-3.5 w-3.5 text-muted-foreground/50 group-hover:text-primary transition-colors" />
                      </Link>
                      {!isDemo && (
                        <div className="flex items-center gap-2 ml-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openEditSubject(subject)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Delete "{subject.name}"?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete this subject.
                                  This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() =>
                                    void handleDeleteSubject(
                                      subject.id,
                                      subject.name,
                                    )
                                  }
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
              {displaySubjects.length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No subjects yet. Add your first subject to get started.
                </p>
              )}
            </div>
          )}
        </TabsContent>

        {/* Assessments Tab */}
        <TabsContent value="assessments" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <Button onClick={openAddAssessment} disabled={isDemo} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Assessment
            </Button>
          </div>

          {assessmentsLoading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {terms.map((term) => (
                <div key={term}>
                  <h3 className="mb-3 font-display text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                    {term}
                  </h3>
                  <div className="space-y-2">
                    {assessmentsByTerm[term]
                      .sort((a, b) => (a.date < b.date ? -1 : 1))
                      .map((assessment, i) => (
                        <motion.div
                          key={assessment.id.toString()}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.04 }}
                        >
                          <Card>
                            <CardContent className="flex items-center justify-between p-4">
                              <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-chart-3/10">
                                  <ClipboardList className="h-4 w-4 text-chart-3" />
                                </div>
                                <div>
                                  <p className="font-medium text-foreground">
                                    {assessment.name}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {assessment.date} · Max score:{" "}
                                    {assessment.maxScore.toString()}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <Badge variant="secondary" className="text-xs">
                                  /{assessment.maxScore.toString()}
                                </Badge>
                                {!isDemo && (
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() =>
                                        openEditAssessment(assessment)
                                      }
                                    >
                                      <Pencil className="h-3.5 w-3.5" />
                                    </Button>
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-8 w-8 text-destructive hover:text-destructive"
                                        >
                                          <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>
                                            Delete "{assessment.name}"?
                                          </AlertDialogTitle>
                                          <AlertDialogDescription>
                                            This will remove the assessment and
                                            all associated marks.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>
                                            Cancel
                                          </AlertDialogCancel>
                                          <AlertDialogAction
                                            onClick={() =>
                                              void handleDeleteAssessment(
                                                assessment.id,
                                                assessment.name,
                                              )
                                            }
                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                          >
                                            Delete
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                  </div>
                </div>
              ))}
              {terms.length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No assessments yet. Add your first assessment to get started.
                </p>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Subject Dialog */}
      <Dialog open={subjectDialogOpen} onOpenChange={setSubjectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">
              {editingSubject ? "Edit Subject" : "Add Subject"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="subjectName">Subject Name</Label>
              <Input
                id="subjectName"
                placeholder="e.g. Mathematics"
                value={subjectName}
                onChange={(e) => setSubjectName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && void handleSaveSubject()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSubjectDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => void handleSaveSubject()}
              disabled={!subjectName.trim() || isSaving}
            >
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assessment Dialog */}
      <Dialog
        open={assessmentDialogOpen}
        onOpenChange={setAssessmentDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">
              {editingAssessment ? "Edit Assessment" : "Add Assessment"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="aName">Assessment Name</Label>
              <Input
                id="aName"
                placeholder="e.g. Term 1 Test 1"
                value={aName}
                onChange={(e) => setAName(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="aTerm">Term</Label>
                <Input
                  id="aTerm"
                  placeholder="e.g. Term 1"
                  value={aTerm}
                  onChange={(e) => setATerm(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="aMaxScore">Max Score</Label>
                <Input
                  id="aMaxScore"
                  type="number"
                  placeholder="e.g. 100"
                  value={aMaxScore}
                  onChange={(e) => setAMaxScore(e.target.value)}
                  min="1"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="aDate">Date</Label>
              <Input
                id="aDate"
                type="date"
                value={aDate}
                onChange={(e) => setADate(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAssessmentDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => void handleSaveAssessment()}
              disabled={
                !aName.trim() ||
                !aTerm.trim() ||
                !aDate ||
                !aMaxScore ||
                isSaving
              }
            >
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
