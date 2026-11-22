import type { CourseLearningAssets, CourseLearningAsset } from './courseLearningAssets';
import type { StudyEntryCoverage } from './courseStudyEntry';

export interface CurriculumCoverageUnit {
  id: string;
  learning_object_id: string | null;
}
export interface EnrichedUnitCoverage extends StudyEntryCoverage {
  playlist_count: number;
  guide_count: number;
}

const safeCount = (value: number | null | undefined) =>
  typeof value === 'number' && Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;

/** Merge the existing server-side video/reading view with already fetched public course materials.
 * The SQL view deliberately counts only videos/readings; it has no playlist or document count.
 * Do not treat course-wide resources (unitIds=[]) as directly assigned to every UC.
 * Do not add a new API request: both datasets are already fetched by the course page.
 */
export function mergeCourseMaterialCoverage(
  units: readonly CurriculumCoverageUnit[],
  coverage: readonly StudyEntryCoverage[],
  assets: CourseLearningAssets | undefined,
): EnrichedUnitCoverage[] {
  const baseline = new Map(coverage.map(row => [row.curricular_unit_id, row]));
  const byObjectId = new Map(units.filter(unit => unit.learning_object_id).map(unit => [unit.learning_object_id, unit.id]));
  const perUnit = (entries: readonly CourseLearningAsset[] | undefined): Map<string, number> => {
    const counts = new Map<string, number>();
    for (const entry of entries ?? []) {
      for (const objectId of new Set(entry.unitIds)) {
        const id = byObjectId.get(objectId);
        if (id) counts.set(id, (counts.get(id) ?? 0) + 1);
      }
    }
    return counts;
  };
  const playlists = perUnit(assets?.playlists);
  const guides = perUnit(assets?.guides);
  return units.map(unit => {
    const row = baseline.get(unit.id);
    return {
      curricular_unit_id: unit.id,
      video_count: safeCount(row?.video_count),
      reading_count: safeCount(row?.reading_count),
      playlist_count: playlists.get(unit.id) ?? 0,
      guide_count: guides.get(unit.id) ?? 0,
    };
  });
}

export function hasCourseStudyMaterials(item: Pick<EnrichedUnitCoverage,'video_count'|'reading_count'|'playlist_count'|'guide_count'>) {
  return item.video_count > 0 || item.reading_count > 0 || item.playlist_count > 0 || item.guide_count > 0;
}
