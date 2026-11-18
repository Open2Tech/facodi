/**
 * Private study milestones, computed only from what the learner already records: lessons marked as done in
 * editorial sequences and notes in the study notebook. No points for watching, no rankings, nothing public.
 */
export interface Completion { playlistId: string; videoId: string; completedAt: string }

export type MilestoneKey =
  | 'firstLesson' | 'tenLessons' | 'fiftyLessons'
  | 'firstSequence' | 'threeSequences'
  | 'firstNote' | 'tenNotes'
  | 'fourWeeks';

export interface Milestone { key: MilestoneKey; value: number; target: number; reached: boolean }

const pad = (value: number) => String(value).padStart(2, '0');
const dayKey = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

/** Monday of the learner's local calendar week, as YYYY-MM-DD. */
export function weekKey(date: Date) {
  const offset = (date.getDay() + 6) % 7;
  return dayKey(new Date(date.getFullYear(), date.getMonth(), date.getDate() - offset));
}

function shiftWeeks(key: string, weeks: number) {
  const [year, month, day] = key.split('-').map(Number);
  return dayKey(new Date(year, month - 1, day + weeks * 7));
}

/**
 * Consecutive calendar weeks with at least one completed lesson. Weekly rather than daily on purpose: a quiet
 * day never breaks it, and the current week only counts once something is done in it, so an open week does
 * not reset the run either.
 */
export function weeklyStreak(dates: string[], now = new Date()) {
  const weeks = new Set(dates.map(value => new Date(value)).filter(date => !Number.isNaN(date.getTime())).map(weekKey));
  let best = 0;
  let run = 0;
  let previous: string | null = null;
  for (const week of [...weeks].sort()) {
    run = previous && shiftWeeks(previous, 1) === week ? run + 1 : 1;
    best = Math.max(best, run);
    previous = week;
  }
  const thisWeek = weeks.has(weekKey(now));
  let cursor = thisWeek ? weekKey(now) : shiftWeeks(weekKey(now), -1);
  let current = 0;
  while (weeks.has(cursor)) {
    current += 1;
    cursor = shiftWeeks(cursor, -1);
  }
  return { current, best, thisWeek };
}

const milestone = (key: MilestoneKey, value: number, target: number): Milestone => ({ key, value, target, reached: value >= target });

/** `itemCounts` maps each public sequence id to its number of lessons; unknown sequences never count as complete. */
export function studyMilestones({ completions, itemCounts, notes, now = new Date() }: {
  completions: Completion[]; itemCounts: ReadonlyMap<string, number>; notes: number; now?: Date;
}) {
  // The same lesson can sit in several sequences; it is still one lesson learned.
  const lessons = new Set(completions.map(item => item.videoId)).size;
  const perSequence = new Map<string, Set<string>>();
  for (const item of completions) perSequence.set(item.playlistId, (perSequence.get(item.playlistId) ?? new Set()).add(item.videoId));
  const sequences = [...perSequence].filter(([id, videos]) => {
    const total = itemCounts.get(id);
    return !!total && videos.size >= total;
  }).length;
  const streak = weeklyStreak(completions.map(item => item.completedAt), now);
  return {
    lessons, sequences, notes, streak,
    milestones: [
      milestone('firstLesson', lessons, 1),
      milestone('tenLessons', lessons, 10),
      milestone('fiftyLessons', lessons, 50),
      milestone('firstSequence', sequences, 1),
      milestone('threeSequences', sequences, 3),
      milestone('firstNote', notes, 1),
      milestone('tenNotes', notes, 10),
      milestone('fourWeeks', streak.best, 4),
    ],
  };
}
