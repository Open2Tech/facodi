import { describe, expect, it } from 'vitest';
import { brazilianCredits, courseHours, ufesElectiveGroup, ufesElectiveGroupOrder, unitHours } from './brazilianCurriculum';

describe('Brazilian university curriculum metadata', () => {
  it('reads official contact hours without converting to ECTS', () => {
    expect(courseHours({ official_course_hours: 3210 })).toBe(3210);
    expect(unitHours({ official_hours: 75, brazilian_course_credits: 2 })).toBe(75);
    expect(brazilianCredits({ brazilian_course_credits: 4 })).toBe(4);
  });
  it('rejects missing, invalid and speculative numbers', () => {
    for (const metadata of [null, [], '75', {}, { official_hours: -1 }, { official_hours: '75' }]) {
      expect(unitHours(metadata)).toBeNull();
    }
    expect(courseHours({ official_course_hours: NaN })).toBeNull();
    expect(brazilianCredits({ brazilian_course_credits: 0 })).toBeNull();
  });
  it('accepts only known 2019 PPC elective groups in prescribed order', () => {
    expect(ufesElectiveGroup({ elective_group: 'opt_english_literature' })).toBe('opt_english_literature');
    expect(ufesElectiveGroupOrder('opt_english_literature')).toBe(1);
    expect(ufesElectiveGroup({ elective_group: 'required' })).toBeNull();
    expect(ufesElectiveGroup({ elective_group: 'opt_made_up' })).toBeNull();
  });
});
