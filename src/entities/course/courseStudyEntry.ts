/** Lightweight study suggestions for public course pages.
 * We only prioritise curricular units with confirmed public resource counts.
 * This does not invent prerequisites, mandatory study order, or resources.
 */
export interface StudyEntryUnit {
  id: string;
  slug: string;
  title: string;
  code: string | null;
  year: number | null;
  semester: number | null;
  position: number | null;
}
export interface StudyEntryCoverage {
  curricular_unit_id: string;
  video_count: number;
  reading_count: number;
}
export interface SuggestedStudyUnit<T extends StudyEntryUnit = StudyEntryUnit> {
  unit: T;
  videoCount: number;
  readingCount: number;
}

const count = (value: number | null | undefined) =>
  Number.isFinite(value) ? Math.max(0, Math.floor(value ?? 0)) : 0;

/** Stable ordering with genuine year / semester information before unknown placements. */
export function suggestStudyUnits<T extends StudyEntryUnit>(
  units: readonly T[],
  coverage: readonly StudyEntryCoverage[],
  limit = 3,
): SuggestedStudyUnit<T>[] {
  if (limit <= 0) return [];
  const counts = new Map(coverage.map(row => [row.curricular_unit_id, row]));
  const ranked = [...units]
    .sort((a, b) =>
      (a.year ?? Number.MAX_SAFE_INTEGER) - (b.year ?? Number.MAX_SAFE_INTEGER)
      || (a.semester ?? Number.MAX_SAFE_INTEGER) - (b.semester ?? Number.MAX_SAFE_INTEGER)
      || (a.position ?? Number.MAX_SAFE_INTEGER) - (b.position ?? Number.MAX_SAFE_INTEGER)
      || a.title.localeCompare(b.title)
      || a.id.localeCompare(b.id))
    .map(unit => ({
      unit,
      videoCount: count(counts.get(unit.id)?.video_count),
      readingCount: count(counts.get(unit.id)?.reading_count),
    }));
  const withMaterials = ranked.filter(entry => entry.videoCount > 0 || entry.readingCount > 0);
  return (withMaterials.length ? withMaterials : ranked).slice(0, limit);
}
