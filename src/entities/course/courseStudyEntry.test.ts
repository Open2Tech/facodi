import { describe, expect, it } from 'vitest';
import { findCourseUnits, suggestStudyUnits, type StudyEntryUnit } from './courseStudyEntry';

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

describe('findCourseUnits', () => {
  const units: StudyEntryUnit[] = [
    { ...unit('18021025', 1, 1, 1), title: 'Informática' },
    { ...unit('18021027', 1, 1, 2), title: 'Contabilidade Financeira I' },
    { ...unit('18021035', 2, 1, 1), title: 'Direito Fiscal Aplicado III' },
    { ...unit('18021023', null, null, null), title: 'Matemática Aplicada às Ciências Sociais' },
  ];
  const coverage = [
    { curricular_unit_id: '18021025', video_count: 3, reading_count: 1 },
    { curricular_unit_id: '18021027', video_count: 0, reading_count: 2 },
    { curricular_unit_id: '18021035', video_count: 0, reading_count: 0 },
  ];

  it('matches accents, title tokens in any order, and exact UC codes', () => {
    expect(findCourseUnits(units, coverage, 'matematica CieNcias').results.map(x => x.unit.id)).toEqual(['18021023']);
    expect(findCourseUnits(units, coverage, 'FINANCEIRA CONTABILIDADE').results.map(x => x.unit.id)).toEqual(['18021027']);
    expect(findCourseUnits(units, coverage, '18021025').results.map(x => x.unit.id)).toEqual(['18021025']);
  });

  it('filters to real videos or readings and keeps curriculum order', () => {
    const matches = findCourseUnits(units, coverage, '', true);
    expect(matches.total).toBe(2);
    expect(matches.results.map(x => x.unit.id)).toEqual(['18021025', '18021027']);
  });

  it('reports total results even when rendering a limited preview', () => {
    const result = findCourseUnits(units, coverage, '', false, 2);
    expect(result.total).toBe(4);
    expect(result.results.map(x => x.unit.id)).toEqual(['18021025', '18021027']);
  });

  it('does not fabricate coverage when the public view is empty', () => {
    expect(findCourseUnits(units, [], '', true)).toEqual({ total: 0, results: [] });
    expect(findCourseUnits(units, [], 'absent')).toEqual({ total: 0, results: [] });
  });
});

describe('playlist-aware study suggestions and search', () => {
  it('prioritizes the first UC containing playlists even when no videos/readings are linked', () => {
    const units = [unit('without', 1, 1, 1), unit('playlist', 1, 1, 2)];
    const result = suggestStudyUnits(units, [{ curricular_unit_id: 'playlist', video_count: 0, reading_count: 0, playlist_count: 2 }]);
    expect(result[0]).toMatchObject({ unit: units[1], playlistCount: 2 });
    expect(findCourseUnits(units, [{ curricular_unit_id: 'playlist', video_count: 0, reading_count: 0, playlist_count: 2 }], '', true).results.map(x => x.unit.id)).toEqual(['playlist']);
  });

  it('includes only guide-linked units in the material filter', () => {
    const units = [unit('guide', 1, 1, 1), unit('empty', 1, 1, 2)];
    const result = findCourseUnits(units, [{ curricular_unit_id: 'guide', video_count: 0, reading_count: 0, guide_count: 1 }], '', true);
    expect(result.total).toBe(1);
    expect(result.results[0].guideCount).toBe(1);
  });
});
