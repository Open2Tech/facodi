import { describe, expect, it } from 'vitest';
import { examTerm, unitInExamTerm } from './examSeason';

const d = (iso: string) => new Date(`${iso}T12:00:00`);

describe('2026/27 UAlg verified exam revision windows', () => {
  it('covers first-semester revision and only the official exam period', () => {
    expect(examTerm(d('2026-11-30'))).toBeNull();
    expect(examTerm(d('2026-12-01'))).toBe(1);
    expect(examTerm(d('2027-01-08'))).toBe(1);
    expect(examTerm(d('2027-02-04'))).toBe(1);
    expect(examTerm(d('2027-02-05'))).toBeNull();
  });
  it('covers second-semester revision and official exam period', () => {
    expect(examTerm(d('2027-05-14'))).toBeNull();
    expect(examTerm(d('2027-05-15'))).toBe(2);
    expect(examTerm(d('2027-06-08'))).toBe(2);
    expect(examTerm(d('2027-07-06'))).toBe(2);
    expect(examTerm(d('2027-07-07'))).toBeNull();
  });
  it('never extrapolates past 2026/27 without an updated calendar', () => {
    expect(examTerm(d('2027-12-10'))).toBeNull();
    expect(examTerm(d('2028-01-15'))).toBeNull();
    expect(examTerm(new Date(Number.NaN))).toBeNull();
  });
});

describe('unitInExamTerm', () => {
  it('supports regular and CTeSP third/fourth semesters', () => {
    expect(unitInExamTerm(1, 1)).toBe(true);
    expect(unitInExamTerm(3, 1)).toBe(true);
    expect(unitInExamTerm(2, 1)).toBe(false);
    expect(unitInExamTerm(4, 2)).toBe(true);
  });
  it('rejects missing/invalid semesters and inactive windows', () => {
    expect(unitInExamTerm(1, null)).toBe(false);
    expect(unitInExamTerm(null, 1)).toBe(false);
    expect(unitInExamTerm(2.5, 2)).toBe(false);
  });
});
