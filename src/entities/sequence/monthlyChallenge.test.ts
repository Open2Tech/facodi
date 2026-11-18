import { describe, expect, it } from 'vitest';
import { challengeFor, goalPercent, MONTHLY_CHALLENGES } from './monthlyChallenge';

describe('challengeFor', () => {
  it('finds the challenge of the calendar month with its bounds', () => {
    const challenge = challengeFor(new Date(2026, 11, 18));
    expect(challenge?.slug).toBe(MONTHLY_CHALLENGES[0].slug);
    expect(challenge?.from).toEqual(new Date(Date.UTC(2026, 11, 1)));
    expect(challenge?.to).toEqual(new Date(Date.UTC(2027, 0, 1)));
  });
  it('returns null for a month without a challenge', () => {
    expect(challengeFor(new Date(2026, 10, 18))).toBeNull();
  });
});

describe('goalPercent', () => {
  it('caps at 100 and treats a hidden total as 0', () => {
    expect(goalPercent(150, 300)).toBe(50);
    expect(goalPercent(900, 300)).toBe(100);
    expect(goalPercent(null, 300)).toBe(0);
  });
});
