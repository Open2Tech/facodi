/**
 * UAlg exam seasons: the 1st-semester exams (normal and resit) run in January and February, the
 * 2nd-semester ones in June and July. The revision window opens a few weeks before each season.
 * Months are 1-based; both ends are inclusive.
 */
const WINDOWS = [
  { term: 1, from: { month: 12, day: 1 }, to: { month: 2, day: 20 } },
  { term: 2, from: { month: 5, day: 15 }, to: { month: 7, day: 25 } },
] as const;

export type ExamTerm = 1 | 2;

const ordinal = (month: number, day: number) => month * 100 + day;

/** Which semester's exams are coming up on this date, or null outside both windows. */
export function examTerm(date: Date): ExamTerm | null {
  const today = ordinal(date.getMonth() + 1, date.getDate());
  for (const { term, from, to } of WINDOWS) {
    const start = ordinal(from.month, from.day);
    const end = ordinal(to.month, to.day);
    const inside = start <= end ? today >= start && today <= end : today >= start || today <= end;
    if (inside) return term;
  }
  return null;
}

/**
 * Whether a unit's semester sits in the given exam term. Courses that count semesters across years
 * (a CTeSP's 3rd semester is the 1st of year two) are folded back to 1 or 2.
 */
export function unitInExamTerm(semester: number | null | undefined, term: ExamTerm | null) {
  if (!term || semester == null || semester < 1) return false;
  return (semester % 2 === 1 ? 1 : 2) === term;
}
