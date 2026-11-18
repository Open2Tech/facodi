import { describe, expect, it } from 'vitest';
import { examTerm, unitInExamTerm } from './examSeason';

const d = (iso: string) => new Date(`${iso}T12:00:00`);

describe('examTerm', () => {
  it('opens the 1st-semester window across the new year', () => {
    expect(examTerm(d('2026-11-30'))).toBeNull();
    expect(examTerm(d('2026-12-01'))).toBe(1);
    expect(examTerm(d('2027-01-15'))).toBe(1);
    expect(examTerm(d('2027-02-20'))).toBe(1);
    expect(examTerm(d('2027-02-21'))).toBeNull();
  });
  it('opens the 2nd-semester window in late spring', () => {
    expect(examTerm(d('2027-05-14'))).toBeNull();
    expect(examTerm(d('2027-05-15'))).toBe(2);
    expect(examTerm(d('2027-07-25'))).toBe(2);
    expect(examTerm(d('2027-07-26'))).toBeNull();
  });
});

describe('unitInExamTerm', () => {
  it('matches odd semesters to the 1st term and even to the 2nd', () => {
    expect(unitInExamTerm(1, 1)).toBe(true);
    expect(unitInExamTerm(3, 1)).toBe(true);
    expect(unitInExamTerm(2, 1)).toBe(false);
    expect(unitInExamTerm(4, 2)).toBe(true);
  });
  it('is false without a term or a semester', () => {
    expect(unitInExamTerm(1, null)).toBe(false);
    expect(unitInExamTerm(null, 1)).toBe(false);
  });
});
