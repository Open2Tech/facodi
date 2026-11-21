import { describe, expect, it } from 'vitest';
import { suggestStudyUnits, type StudyEntryUnit } from './courseStudyEntry';

const unit = (id: string, year: number | null, semester: number | null, position: number | null): StudyEntryUnit => ({
  id, slug: id, title: id, code: id, year, semester, position,
});

describe('suggestStudyUnits', () => {
  it('selects the earliest units with actual readings or videos', () => {
    const units = [unit('later', 2, 1, 1), unit('empty', 1, 1, 1), unit('video', 1, 2, 1), unit('reading', 1, 1, 2)];
    expect(suggestStudyUnits(units, [
      { curricular_unit_id: 'later', video_count: 2, reading_count: 0 },
      { curricular_unit_id: 'video', video_count: 1, reading_count: 0 },
      { curricular_unit_id: 'reading', video_count: 0, reading_count: 3 },
    ]).map(item => item.unit.id)).toEqual(['reading', 'video', 'later']);
  });

  it('does not imply materials where there is no verified coverage', () => {
    const result = suggestStudyUnits([unit('one', 1, 1, 1), unit('two', 1, 2, 1)], []);
    expect(result.map(item => item.unit.id)).toEqual(['one', 'two']);
    expect(result.every(item => item.videoCount === 0 && item.readingCount === 0)).toBe(true);
  });

  it('keeps unknown placements after the known curriculum and respects the limit', () => {
    const units = [unit('unknown', null, null, null), unit('second', 1, 2, 1), unit('first', 1, 1, 1)];
    expect(suggestStudyUnits(units, [], 2).map(x => x.unit.id)).toEqual(['first', 'second']);
    expect(suggestStudyUnits(units, [], 0)).toEqual([]);
  });

  it('ignores negative or invalid coverage counts', () => {
    const result = suggestStudyUnits([unit('x', 1, 1, 1)], [{ curricular_unit_id: 'x', video_count: -2, reading_count: Number.NaN }]);
    expect(result[0].videoCount).toBe(0);
    expect(result[0].readingCount).toBe(0);
  });
});
