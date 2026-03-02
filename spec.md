# Student Performance Tracker

## Current State
- Four class groups: Year 8, Year 9, Form 3, Grade 10
- Year 8 / Year 9 → KS3 acquisition-focused comments (no exam grades)
- Form 3 / Grade 10 → Cambridge IGCSE comments and grade boundaries
- Behaviour & Advice section per student
- Excel import with subject auto-detection

## Requested Changes (Diff)

### Add
- `kenyanCurriculumSyllabus.ts`: KCSE 8-4-4 grade boundaries (A to E, 12-point scale) for Form 3; CBC/CBE achievement levels (EE/ME/AE/BE) for Grade 10
- `kenyanCurriculumComments.ts`: Personalized comment generators for both Kenyan systems
- Helper functions `isKcse844Grade()`, `isCbcGrade()`, `getCurriculumLabel()` in igcseComments.ts
- Reference tables in StudentDetailPage for KCSE (Form 3) and CBC (Grade 10)
- Backend connection banner in Layout showing "Connecting…" while actor initializes
- Retry logic (up to 4 retries, exponential back-off) in all data queries (useQueries.ts)

### Modify
- `igcseComments.ts` dispatcher: Form 3 → Kenya 8-4-4/KCSE; Grade 10 → Kenya CBC/CBE; Year 8/9 → KS3 (unchanged); everything else → IGCSE
- `StudentDetailPage.tsx`: grade badge label, comments card subtitle, skills panel label, and reference table all adapt to the student's curriculum
- `Layout.tsx`: imports useActor, shows amber banner when backend is still initializing

### Remove
- Nothing removed

## Implementation Plan
1. Create kenyanCurriculumSyllabus.ts with KCSE and CBC grade data
2. Create kenyanCurriculumComments.ts with full comment generators for both systems
3. Add routing helpers and update dispatcher in igcseComments.ts
4. Update StudentDetailPage to use new helpers and show correct reference table per curriculum
5. Add retry options to all queries in useQueries.ts
6. Add backend connection banner to Layout.tsx
7. Build and deploy
