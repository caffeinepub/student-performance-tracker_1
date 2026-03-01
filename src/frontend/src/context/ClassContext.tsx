import { type ReactNode, createContext, useContext, useState } from "react";
import {
  CLASS_SUBJECTS,
  KNOWN_CLASSES,
  type KnownClass,
} from "../utils/sampleData";

// Re-export for convenience
export { KNOWN_CLASSES, CLASS_SUBJECTS, type KnownClass };

export type ClassFilter = KnownClass | "All Classes";

export const ALL_CLASS_OPTIONS: ClassFilter[] = [
  "All Classes",
  ...KNOWN_CLASSES,
];

interface ClassContextValue {
  selectedClass: ClassFilter;
  setSelectedClass: (cls: ClassFilter) => void;
}

const ClassContext = createContext<ClassContextValue | undefined>(undefined);

export function ClassProvider({ children }: { children: ReactNode }) {
  const [selectedClass, setSelectedClass] =
    useState<ClassFilter>("All Classes");

  return (
    <ClassContext.Provider value={{ selectedClass, setSelectedClass }}>
      {children}
    </ClassContext.Provider>
  );
}

export function useClassFilter() {
  const ctx = useContext(ClassContext);
  if (!ctx) throw new Error("useClassFilter must be used within ClassProvider");
  return ctx;
}

/**
 * Filter students by the selected class.
 * If "All Classes" is selected, returns all students.
 */
export function filterByClass<T extends { grade: string }>(
  items: T[],
  selectedClass: ClassFilter,
): T[] {
  if (selectedClass === "All Classes") return items;
  return items.filter((item) => item.grade === selectedClass);
}
