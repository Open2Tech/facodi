import { supabase } from '@/shared/api/supabase/supabaseClient';

/** The course (and optionally the year) a learner picked on first access. Kept in their own auth metadata. */
export interface StudyChoice { course: string; year: number | null }

const MAX_YEAR = 6;

export function readStudyChoice(metadata: Record<string, unknown> | null | undefined): StudyChoice | null {
  const course = metadata?.study_course;
  if (typeof course !== 'string' || !course.trim()) return null;
  const year = metadata?.study_year;
  const valid = typeof year === 'number' && Number.isInteger(year) && year >= 1 && year <= MAX_YEAR;
  return { course: course.trim(), year: valid ? year : null };
}

/** Years offered by a course, from its length in semesters (licenciatura = 3, CTeSP = 2). */
export function courseYears(durationSemesters: number | null | undefined) {
  const years = durationSemesters && durationSemesters > 0 ? Math.min(MAX_YEAR, Math.ceil(durationSemesters / 2)) : 3;
  return Array.from({ length: years }, (_, i) => i + 1);
}

/** Saves (or clears, with null) the choice. Supabase emits USER_UPDATED, so useAuth picks it up. */
export async function saveStudyChoice(choice: StudyChoice | null) {
  const { error } = await supabase.auth.updateUser({
    data: { study_course: choice?.course ?? null, study_year: choice?.year ?? null },
  });
  if (error) throw error;
}
