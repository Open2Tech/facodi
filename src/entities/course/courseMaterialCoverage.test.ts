import { describe, expect, it } from 'vitest';
import { mergeCourseMaterialCoverage, hasCourseStudyMaterials } from './courseMaterialCoverage';
import { emptyCourseLearningAssets, type CourseLearningAsset } from './courseLearningAssets';

const unit = (id: string, objectId: string | null) => ({ id, learning_object_id: objectId });
const asset = (id: string, unitIds: string[]): CourseLearningAsset => ({
  id, slug: id, title: id, description: null, sourceUrl: null, unitTitles: [], unitIds,
});

describe('mergeCourseMaterialCoverage', () => {
  it('combines official video/reading counts with already published playlists and guides', () => {
    const assets = emptyCourseLearningAssets();
    assets.playlists = [asset('p1', ['obj-a', 'obj-b']), asset('p2', ['obj-a'])];
    assets.guides = [asset('g1', ['obj-b'])];
    const result = mergeCourseMaterialCoverage(
      [unit('a', 'obj-a'), unit('b', 'obj-b'), unit('c', 'obj-c')],
      [{ curricular_unit_id: 'a', video_count: 1, reading_count: 2 }],
      assets,
    );
    expect(result).toEqual([
      { curricular_unit_id: 'a', video_count: 1, reading_count: 2, playlist_count: 2, guide_count: 0 },
      { curricular_unit_id: 'b', video_count: 0, reading_count: 0, playlist_count: 1, guide_count: 1 },
      { curricular_unit_id: 'c', video_count: 0, reading_count: 0, playlist_count: 0, guide_count: 0 },
    ]);
    expect(hasCourseStudyMaterials(result[1])).toBe(true);
    expect(hasCourseStudyMaterials(result[2])).toBe(false);
  });

  it('does not pretend a course-level resource belongs directly to every UC', () => {
    const assets = emptyCourseLearningAssets();
    assets.playlists = [asset('course-wide', []), asset('real-unit', ['obj-a'])];
    const result = mergeCourseMaterialCoverage([unit('a', 'obj-a'), unit('b', 'obj-b')], [], assets);
    expect(result.map(x => x.playlist_count)).toEqual([1, 0]);
  });

  it('deduplicates repeated unit object ids on the same resource and ignores unrelated ids', () => {
    const assets = emptyCourseLearningAssets();
    assets.playlists = [asset('p1', ['obj-a', 'obj-a', 'external-id'])];
    const result = mergeCourseMaterialCoverage([unit('a', 'obj-a'), unit('b', null)], [], assets);
    expect(result.map(x => x.playlist_count)).toEqual([1, 0]);
  });

  it('preserves the input arrays and rejects invalid or negative server counts', () => {
    const units = [unit('a', 'obj-a')];
    const coverage = [{ curricular_unit_id: 'a', video_count: -1, reading_count: Number.NaN }];
    const result = mergeCourseMaterialCoverage(units, coverage, undefined);
    expect(result[0]).toEqual({ curricular_unit_id: 'a', video_count: 0, reading_count: 0, playlist_count: 0, guide_count: 0 });
    expect(coverage[0].video_count).toBe(-1);
    expect(units.length).toBe(1);
  });
});
