import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Mark {
    studentId: bigint;
    score: bigint;
    subjectId: bigint;
    assessmentId: bigint;
}
export interface Subject {
    id: bigint;
    name: string;
}
export interface Assessment {
    id: bigint;
    maxScore: bigint;
    date: string;
    name: string;
    term: string;
}
export interface Student {
    id: bigint;
    name: string;
    grade: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addOrUpdateMark(studentId: bigint, subjectId: bigint, assessmentId: bigint, score: bigint): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createAssessment(name: string, term: string, date: string, maxScore: bigint): Promise<bigint>;
    createStudent(name: string, grade: string): Promise<bigint>;
    createSubject(name: string): Promise<bigint>;
    deleteAssessment(id: bigint): Promise<void>;
    deleteMark(studentId: bigint, subjectId: bigint, assessmentId: bigint): Promise<void>;
    deleteStudent(id: bigint): Promise<void>;
    deleteSubject(id: bigint): Promise<void>;
    getAllAssessments(): Promise<Array<Assessment>>;
    getAllMarks(): Promise<Array<Mark>>;
    getAllStudents(): Promise<Array<Student>>;
    getAllSubjects(): Promise<Array<Subject>>;
    getCallerUserRole(): Promise<UserRole>;
    getMarksByAssessment(subjectId: bigint, assessmentId: bigint): Promise<Array<Mark>>;
    getMarksByStudent(studentId: bigint): Promise<Array<Mark>>;
    importMarks(bulkMarks: Array<Mark>): Promise<void>;
    isCallerAdmin(): Promise<boolean>;
    updateAssessment(id: bigint, name: string, term: string, date: string, maxScore: bigint): Promise<void>;
    updateStudent(id: bigint, name: string, grade: string): Promise<void>;
    updateSubject(id: bigint, name: string): Promise<void>;
}
