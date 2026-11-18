import { describe, expect, it } from 'vitest';
import { studyMilestones, weekKey, weeklyStreak } from './milestones';

// Local dates, so the tests hold in any time zone.
const at = (year: number, month: number, day: number) => new Date(year, month - 1, day, 12).toISOString();

describe('weekly study streak', () => {
  it('groups days into Monday-based weeks', () => {
    expect(weekKey(new Date(2026, 10, 18))).toBe('2026-11-16'); // Wednesday
    expect(weekKey(new Date(2026, 10, 16))).toBe('2026-11-16'); // Monday
    expect(weekKey(new Date(2026, 10, 22))).toBe('2026-11-16'); // Sunday
  });

  it('counts consecutive weeks and keeps the run while the current week is still open', () => {
    const now = new Date(2026, 10, 18);
    const dates = [at(2026, 11, 3), at(2026, 11, 4), at(2026, 11, 10)];
    expect(weeklyStreak(dates, now)).toEqual({ current: 2, best: 2, thisWeek: false });
    expect(weeklyStreak([...dates, at(2026, 11, 17)], now)).toEqual({ current: 3, best: 3, thisWeek: true });
  });

  it('breaks the current run after a whole week without lessons, but remembers the best', () => {
    const now = new Date(2026, 10, 18);
    const dates = [at(2026, 10, 6), at(2026, 10, 13), at(2026, 10, 20), at(2026, 11, 3)];
    expect(weeklyStreak(dates, now)).toEqual({ current: 0, best: 3, thisWeek: false });
    expect(weeklyStreak([], now)).toEqual({ current: 0, best: 0, thisWeek: false });
  });
});

describe('study milestones', () => {
  it('counts distinct lessons, complete public sequences and notes', () => {
    const summary = studyMilestones({
      completions: [
        { playlistId: 'a', videoId: 'v1', completedAt: at(2026, 11, 17) },
        { playlistId: 'a', videoId: 'v2', completedAt: at(2026, 11, 17) },
        { playlistId: 'b', videoId: 'v1', completedAt: at(2026, 11, 18) },
        { playlistId: 'gone', videoId: 'v9', completedAt: at(2026, 11, 18) },
      ],
      itemCounts: new Map([['a', 2], ['b', 3]]),
      notes: 1,
      now: new Date(2026, 10, 18),
    });
    expect(summary).toMatchObject({ lessons: 3, sequences: 1, notes: 1 });
    const reached = summary.milestones.filter(item => item.reached).map(item => item.key);
    expect(reached).toEqual(['firstLesson', 'firstSequence', 'firstNote']);
    expect(summary.milestones.find(item => item.key === 'tenLessons')).toMatchObject({ value: 3, target: 10, reached: false });
  });
});
