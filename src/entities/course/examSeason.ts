/**
 * FACODI study prompts for the UAlg 2026/27 academic calendar.
 *
 * Official ordinary + resit exam dates (UAlg):
 * Semester 1: 2027-01-08 through 2027-02-04.
 * Semester 2: 2027-06-08 through 2027-07-06.
 * Source: https://www.ualg.pt/calendario-escolar
 *
 * The *revision* banner starts several weeks before exams. It does NOT represent
 * an individual UC exam timetable. The windows are specific to 2026/27 and do
 * not silently repeat in future academic years without verification.
 */
const WINDOWS = [
  { term: 1, from: '2026-12-01', to: '2027-02-04' },
  { term: 2, from: '2027-05-15', to: '2027-07-06' },
] as const;

export type ExamTerm = 1 | 2;

/** Current year's revision season, or null when not within verified dates. */
export function examTerm(date: Date): ExamTerm | null {
  if (Number.isNaN(date.getTime())) return null;
  const day = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  return WINDOWS.find(window => window.from <= day && day <= window.to)?.term ?? null;
}

/** The 3rd/4th semesters of a CTeSP correspond to the next year's 1st/2nd term. */
export function unitInExamTerm(semester: number | null | undefined, term: ExamTerm | null): boolean {
  return !!term && typeof semester === 'number' && Number.isInteger(semester) && semester >= 1
    && (semester % 2 === 1 ? 1 : 2) === term;
}
