import { describe, expect, it } from 'vitest';
import { courseYears, readStudyChoice } from './studyChoice';

describe('readStudyChoice', () => {
  it('reads a course and a valid year', () => {
    expect(readStudyChoice({ study_course: 'gestao', study_year: 2 })).toEqual({ course: 'gestao', year: 2 });
  });
  it('keeps the course when the year is missing or invalid', () => {
    expect(readStudyChoice({ study_course: 'gestao' })).toEqual({ course: 'gestao', year: null });
    expect(readStudyChoice({ study_course: 'gestao', study_year: 0 })).toEqual({ course: 'gestao', year: null });
    expect(readStudyChoice({ study_course: 'gestao', study_year: '2' })).toEqual({ course: 'gestao', year: null });
  });
  it('returns null without a course', () => {
    expect(readStudyChoice({})).toBeNull();
    expect(readStudyChoice({ study_course: '  ' })).toBeNull();
    expect(readStudyChoice(null)).toBeNull();
  });
});

describe('courseYears', () => {
  it('derives years from semesters', () => {
    expect(courseYears(6)).toEqual([1, 2, 3]);
    expect(courseYears(4)).toEqual([1, 2]);
    expect(courseYears(null)).toEqual([1, 2, 3]);
  });
});
