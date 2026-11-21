/** Public learning materials linked to a course or any of its curricular units.
 * Relations are resolved by the API under RLS; this helper only deduplicates visible objects.
 */
export interface CourseLearningAsset {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  sourceUrl: string | null;
  /** Unit names where the same object appears, without duplicate cards. */
  unitTitles: string[];
  /** Exact curricular-unit learning object IDs for scoped filtering. */
  unitIds: string[];
}

export type CourseLearningAssetType = 'playlist' | 'external_resource' | 'document' | 'video';

export interface CourseLearningAssets {
  videos: CourseLearningAsset[];
  playlists: CourseLearningAsset[];
  references: CourseLearningAsset[];
  guides: CourseLearningAsset[];
}

export interface CourseAssetRelation {
  parent_object_id: string;
  child_object_id: string;
  position: number | null;
}

export interface CourseAssetObject {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  source_url: string | null;
  object_type: string;
}

export const emptyCourseLearningAssets = (): CourseLearningAssets => ({
  videos: [], playlists: [], references: [], guides: [],
});

/** Caller supplies parent IDs in curriculum order and visible, published objects only. */
export function composeCourseLearningAssets(
  parentIds: readonly string[],
  unitLabels: ReadonlyMap<string, string>,
  relations: readonly CourseAssetRelation[],
  objects: readonly CourseAssetObject[],
): CourseLearningAssets {
  const result = emptyCourseLearningAssets();
  const byId = new Map(objects.map(object => [object.id, object]));
  const buckets = new Map<string, CourseLearningAsset>();
  const rank = new Map(parentIds.map((id, index) => [id, index]));
  const ordered = [...relations].sort((a, b) =>
    (rank.get(a.parent_object_id) ?? Number.MAX_SAFE_INTEGER) - (rank.get(b.parent_object_id) ?? Number.MAX_SAFE_INTEGER)
    || (a.position ?? Number.MAX_SAFE_INTEGER) - (b.position ?? Number.MAX_SAFE_INTEGER)
    || a.child_object_id.localeCompare(b.child_object_id));

  for (const relation of ordered) {
    const item = byId.get(relation.child_object_id);
    if (!item || !rank.has(relation.parent_object_id)) continue;
    let group: CourseLearningAsset[] | undefined;
    if (item.object_type === 'video') group = result.videos;
    else if (item.object_type === 'playlist') group = result.playlists;
    else if (item.object_type === 'external_resource') group = result.references;
    else if (item.object_type === 'document') group = result.guides;
    if (!group) continue;

    let asset = buckets.get(item.id);
    if (!asset) {
      asset = {
        id: item.id, slug: item.slug, title: item.title,
        description: item.description, sourceUrl: item.source_url, unitTitles: [], unitIds: [],
      };
      buckets.set(item.id, asset);
      group.push(asset);
    }
    const label = unitLabels.get(relation.parent_object_id);
    if (label && !asset.unitIds.includes(relation.parent_object_id)) asset.unitIds.push(relation.parent_object_id);
    if (label && !asset.unitTitles.includes(label)) asset.unitTitles.push(label);
  }
  return result;
}

/** Accent-insensitive local filtering. Course-wide assets remain available in every UC. */
export function normalizeCourseMaterialTerm(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLocaleLowerCase();
}

export function filterCourseLearningAssets(
  assets: CourseLearningAssets,
  unitObjectId: string | null,
  search: string,
): CourseLearningAssets {
  const term = normalizeCourseMaterialTerm(search);
  const filter = (values: CourseLearningAsset[]) => values.filter(value => {
    const matchesUnit = !unitObjectId || !value.unitIds.length || value.unitIds.includes(unitObjectId);
    const matchesSearch = !term || normalizeCourseMaterialTerm([
      value.title, value.description ?? '', ...value.unitTitles,
    ].join(' ')).includes(term);
    return matchesUnit && matchesSearch;
  });
  return {
    videos: filter(assets.videos),
    playlists: filter(assets.playlists),
    references: filter(assets.references),
    guides: filter(assets.guides),
  };
}
