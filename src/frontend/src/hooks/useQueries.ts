import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  Assessment,
  BehaviourRecord,
  Mark,
  Student,
  Subject,
} from "../backend.d";
import { useActor } from "./useActor";

// ─── Read Queries ──────────────────────────────────────────────────────────

/** Shared retry config: up to 4 retries, capped at 30s, exponential back-off */
const QUERY_RETRY_OPTIONS = {
  retry: 4,
  retryDelay: (attempt: number) => Math.min(1500 * 2 ** attempt, 30000),
} as const;

export function useStudents() {
  const { actor, isFetching } = useActor();
  return useQuery<Student[]>({
    queryKey: ["students"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllStudents();
    },
    enabled: !!actor && !isFetching,
    ...QUERY_RETRY_OPTIONS,
  });
}

export function useSubjects() {
  const { actor, isFetching } = useActor();
  return useQuery<Subject[]>({
    queryKey: ["subjects"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllSubjects();
    },
    enabled: !!actor && !isFetching,
    ...QUERY_RETRY_OPTIONS,
  });
}

export function useAssessments() {
  const { actor, isFetching } = useActor();
  return useQuery<Assessment[]>({
    queryKey: ["assessments"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllAssessments();
    },
    enabled: !!actor && !isFetching,
    ...QUERY_RETRY_OPTIONS,
  });
}

export function useMarks() {
  const { actor, isFetching } = useActor();
  return useQuery<Mark[]>({
    queryKey: ["marks"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllMarks();
    },
    enabled: !!actor && !isFetching,
    ...QUERY_RETRY_OPTIONS,
  });
}

export function useMarksByStudent(studentId: bigint) {
  const { actor, isFetching } = useActor();
  return useQuery<Mark[]>({
    queryKey: ["marks", "student", studentId.toString()],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMarksByStudent(studentId);
    },
    enabled: !!actor && !isFetching,
    ...QUERY_RETRY_OPTIONS,
  });
}

// ─── Mutations ──────────────────────────────────────────────────────────────

export function useCreateStudent() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ name, grade }: { name: string; grade: string }) => {
      if (!actor) throw new Error("Not connected");
      return actor.createStudent(name, grade);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["students"] });
    },
  });
}

export function useUpdateStudent() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      name,
      grade,
    }: {
      id: bigint;
      name: string;
      grade: string;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.updateStudent(id, name, grade);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["students"] });
    },
  });
}

export function useDeleteStudent() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Not connected");
      return actor.deleteStudent(id);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["students"] });
      void queryClient.invalidateQueries({ queryKey: ["marks"] });
    },
  });
}

export function useCreateSubject() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      if (!actor) throw new Error("Not connected");
      return actor.createSubject(name);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["subjects"] });
    },
  });
}

export function useUpdateSubject() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, name }: { id: bigint; name: string }) => {
      if (!actor) throw new Error("Not connected");
      return actor.updateSubject(id, name);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["subjects"] });
    },
  });
}

export function useDeleteSubject() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Not connected");
      return actor.deleteSubject(id);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["subjects"] });
    },
  });
}

export function useCreateAssessment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      name,
      term,
      date,
      maxScore,
    }: {
      name: string;
      term: string;
      date: string;
      maxScore: bigint;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.createAssessment(name, term, date, maxScore);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["assessments"] });
    },
  });
}

export function useUpdateAssessment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      name,
      term,
      date,
      maxScore,
    }: {
      id: bigint;
      name: string;
      term: string;
      date: string;
      maxScore: bigint;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.updateAssessment(id, name, term, date, maxScore);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["assessments"] });
    },
  });
}

export function useDeleteAssessment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Not connected");
      return actor.deleteAssessment(id);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["assessments"] });
    },
  });
}

export function useAddOrUpdateMark() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      studentId,
      subjectId,
      assessmentId,
      score,
    }: {
      studentId: bigint;
      subjectId: bigint;
      assessmentId: bigint;
      score: bigint;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.addOrUpdateMark(studentId, subjectId, assessmentId, score);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["marks"] });
    },
  });
}

export function useImportMarks() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (marks: Mark[]) => {
      if (!actor) throw new Error("Not connected");
      return actor.importMarks(marks);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["marks"] });
      void queryClient.invalidateQueries({ queryKey: ["students"] });
      void queryClient.invalidateQueries({ queryKey: ["subjects"] });
      void queryClient.invalidateQueries({ queryKey: ["assessments"] });
    },
  });
}

// ─── Behaviour & Advice ─────────────────────────────────────────────────────

export function useBehaviourRecord(studentId: bigint) {
  const { actor, isFetching } = useActor();
  return useQuery<BehaviourRecord | null>({
    queryKey: ["behaviour", studentId.toString()],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getBehaviourRecord(studentId);
    },
    enabled: !!actor && !isFetching,
    ...QUERY_RETRY_OPTIONS,
  });
}

export function useSaveBehaviourRecord() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      studentId,
      behaviourComment,
      advice,
    }: {
      studentId: bigint;
      behaviourComment: string;
      advice: string;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.saveBehaviourRecord(studentId, behaviourComment, advice);
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ["behaviour", variables.studentId.toString()],
      });
    },
  });
}
