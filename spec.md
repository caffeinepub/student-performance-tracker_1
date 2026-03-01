# Student Performance Tracker

## Current State
The app has a student detail page (`StudentDetailPage.tsx`) that shows score trends, subject breakdowns, projected outcomes, and auto-generated IGCSE academic comments per student. There is also a Students list page, Subjects page, Import page, and Reports page. Navigation is via a sidebar with class filter.

The existing IGCSE comments section is academic/performance-focused (strengths, improvements, target skills, teacher note) and is on the individual student detail page.

## Requested Changes (Diff)

### Add
- A new **"Behaviour & Advice"** section on the individual student detail page (below the existing IGCSE comments card).
- This section allows the teacher to write free-form comments about the student's general classroom behaviour (e.g. attitude, participation, punctuality, respect).
- A set of quick-select tags for common behaviour descriptors (e.g. "Participates actively", "Needs encouragement", "Respectful", "Disruptive at times", "Punctual", "Late frequently", "Good team player") that pre-fill or append to the textarea.
- A structured advice field: teacher can type personalised advice for the student aligned to their behaviour patterns (e.g. study habits, attitude improvements, next steps).
- A "Save" button that persists the behaviour comment and advice text to the backend per student.
- On load, previously saved comments are fetched and displayed in the fields.
- A "Copy" button to copy the combined behaviour comment + advice as plain text (useful for report cards).

### Modify
- Backend `main.mo`: add a `BehaviourRecord` type with fields `studentId: Nat`, `behaviourComment: Text`, `advice: Text`. Add a stable map `behaviourRecords: Map<Nat, BehaviourRecord>`. Add `saveBehaviourRecord(studentId: Nat, behaviourComment: Text, advice: Text)` update function and `getBehaviourRecord(studentId: Nat)` query function.
- `backend.d.ts` / `useQueries.ts`: add hooks `useBehaviourRecord(studentId)` and `useSaveBehaviourRecord()`.

### Remove
- Nothing removed.

## Implementation Plan
1. Update `main.mo` to add `BehaviourRecord` type, stable map, save and get functions.
2. Update `backend.d.ts` to expose the new types and functions.
3. Add `useBehaviourRecord` query hook and `useSaveBehaviourRecord` mutation hook in `useQueries.ts`.
4. Add a `BehaviourCard` component to `StudentDetailPage.tsx`:
   - Quick-tag chips (click to append tag to behaviour textarea).
   - Behaviour comment `Textarea`.
   - Personalised advice `Textarea`.
   - Save button with loading state.
   - Copy button that combines both fields.
   - Pre-fills from backend on load.
