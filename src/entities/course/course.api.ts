import { supabase } from '@/shared/api/supabase/supabaseClient';
import { getSupabaseErrorMessage } from '@/shared/api/supabase/supabaseErrors';
import { videoInfo } from '@/entities/course/video';
import { unitPath } from '@/entities/course/course.paths';
import { EDITORIAL_STATUSES, PAGE_SIZE, type CatalogParams, type ContentKind, type EditorialStatus, type CourseInsert, type UnitInsert, type ResourceInsert, type LearningObject, type PublicCourse } from '@/entities/course/course.types';

export function searchPattern(search: string) {
  return `%${search.trim().replace(/[\\%_]/g, '\\$&')}%`;
}

/** Upper bound for the public degree catalogue, which is filtered client-side (it holds a handful of programmes). */
export const PUBLIC_COURSE_LIMIT = 500;

/** Every published, active course with its count of publicly visible (active) curricular units. */
export async function listPublicCourses(signal?: AbortSignal): Promise<PublicCourse[]> {
  const { data, error } = await supabase.from('courses').select('*, curricular_units(count)')
    .eq('published', true).eq('status', 'active').eq('curricular_units.status', 'active')
    .order('title').order('id').limit(PUBLIC_COURSE_LIMIT).abortSignal(signal);
  if (error) throw new Error(getSupabaseErrorMessage(error));
  return (data ?? []).map(({ curricular_units: units, ...course }) =>
    ({ ...course, unit_count: Array.isArray(units) ? Number(units[0]?.count ?? 0) : 0 }));
}

const PUBLIC_RESOURCE_STATES = ['active', 'published'];

const UNIT_LIST_FIELDS = 'id, slug, title, code, ects, metadata, year, semester, position, language, courses!inner(slug, code, title, published, status)';

/** PostgREST `or()` value: quoted so commas, dots or parentheses in user search stay literal. */
function orIlike(columns: string[], search: string) {
  const value = searchPattern(search).replace(/["\\]/g, '\\$&');
  return columns.map(column => `${column}.ilike."${value}"`).join(',');
}

export async function listUnits({ search, page, course, year, semester, sort = 'curriculum' }: CatalogParams, signal?: AbortSignal) {
  // Mirrors the public RLS rule: active unit inside a published, active course.
  let query = supabase.from('curricular_units')
    .select(UNIT_LIST_FIELDS, { count: 'exact' })
    .eq('status', 'active').eq('courses.published', true).eq('courses.status', 'active');
  if (search.trim()) query = query.or(orIlike(['title', 'code'], search));
  if (course) query = query.eq('courses.slug', course);
  if (year) query = query.eq('year', year);
  if (semester) query = query.eq('semester', semester);
  if (sort === 'title') query = query.order('title');
  else if (sort === 'ects') query = query.order('ects', { ascending: false, nullsFirst: false }).order('title');
  else query = query.order('year', { nullsFirst: false }).order('semester', { nullsFirst: false }).order('position', { nullsFirst: false }).order('title');
  const { data, count, error } = await query.order('id').range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1).abortSignal(signal);
  if (error) throw new Error(getSupabaseErrorMessage(error));
  return { items: data, total: count ?? 0 };
}

export interface FacetOption<T extends string | number = string | number> { value: T; label: string; count: number }

function tally<T extends string | number>(map: Map<T, FacetOption<T>>, value: T | null, label: string) {
  if (value == null) return;
  const entry = map.get(value);
  if (entry) entry.count += 1;
  else map.set(value, { value, label, count: 1 });
}

/** Facet counts across every public unit (bounded), so filters only offer values that exist. */
export async function getUnitFacets(signal?: AbortSignal) {
  const { data, error } = await supabase.from('curricular_units')
    .select('year, semester, courses!inner(slug, code, title, published, status)')
    .eq('status', 'active').eq('courses.published', true).eq('courses.status', 'active')
    .limit(2000).abortSignal(signal);
  if (error) throw new Error(getSupabaseErrorMessage(error));
  const courses = new Map<string, FacetOption<string>>();
  const years = new Map<number, FacetOption<number>>();
  const semesters = new Map<number, FacetOption<number>>();
  const semesterYears: Record<number, number[]> = {};
  for (const row of data) {
    if (row.semester != null && row.year != null && !(semesterYears[row.semester] ??= []).includes(row.year)) semesterYears[row.semester].push(row.year);
    tally(courses, row.courses.slug, row.courses.code || row.courses.title);
    tally(years, row.year, String(row.year));
    tally(semesters, row.semester, String(row.semester));
  }
  const byValue = <T extends string | number>(map: Map<T, FacetOption<T>>) => [...map.values()].sort((a, b) => String(a.value).localeCompare(String(b.value), undefined, { numeric: true }));
  return { total: data.length, courses: byValue(courses), years: byValue(years), semesters: byValue(semesters), semesterYears };
}

type ResourceRow = Pick<LearningObject,
  'id' | 'slug' | 'title' | 'description' | 'object_type' | 'language' | 'tags' | 'metadata' | 'source_url'>;
export interface ResourceTypeFacet { value: string; count: number }

/**
 * Public resource catalogue through one SECURITY INVOKER RPC: accent-insensitive ranked search and thematic area filtering,
 * base-language matching (pt includes pt-BR) and exact type counts for the current search,
 * language and tag (the type filter itself is excluded so every type stays reachable).
 */
export async function listResources({ search, language, page, tag, area, objectType }: CatalogParams, signal?: AbortSignal) {
  const { data, error } = await supabase.rpc('search_public_resources_v4', {
    p_search: search.trim(),
    p_language: language || undefined,
    p_object_type: objectType || undefined,
    p_tag: tag || undefined,
    p_area: area || undefined,
    p_page: page,
    p_page_size: PAGE_SIZE,
  }).abortSignal(signal);
  if (error) throw new Error(getSupabaseErrorMessage(error));
  const payload = data as { total?: unknown; items?: unknown; types?: unknown } | null;
  if (!payload || typeof payload.total !== 'number' || !Array.isArray(payload.items) || !Array.isArray(payload.types)) {
    throw new Error('Formato de resposta de pesquisa inválido.');
  }
  return { items: payload.items as ResourceRow[], total: payload.total, types: payload.types as ResourceTypeFacet[] };
}

export async function getCatalogCounts(signal?: AbortSignal) {
  const [courses, units, resources, videos] = await Promise.all([
    supabase.from('courses').select('id', { count: 'exact', head: true })
      .eq('published', true).eq('status', 'active').abortSignal(signal),
    supabase.from('curricular_units').select('id, courses!inner(id)', { count: 'exact', head: true })
      .eq('status', 'active').eq('courses.published', true).eq('courses.status', 'active').abortSignal(signal),
    supabase.from('learning_objects').select('id', { count: 'exact', head: true })
      .eq('published', true).in('status', PUBLIC_RESOURCE_STATES).abortSignal(signal),
    supabase.from('learning_objects').select('id', { count: 'exact', head: true })
      .eq('object_type', 'video').eq('published', true).in('status', PUBLIC_RESOURCE_STATES).abortSignal(signal),
  ]);
  for (const result of [courses, units, resources, videos]) if (result.error) throw new Error(getSupabaseErrorMessage(result.error));
  return { courses: courses.count ?? 0, units: units.count ?? 0, resources: resources.count ?? 0, videos: videos.count ?? 0 };
}

/**
 * Most frequent study topics in the public library. Uses the same curated vocabulary as the library's topic
 * filter, so bookkeeping tags (source, institution, year, format) never appear as themes on the home page.
 */
export async function listTopics(limit = 6, signal?: AbortSignal) {
  const { data, error } = await supabase.rpc('list_public_resource_topics_v1', { p_search: '' }).abortSignal(signal);
  if (error) throw new Error(getSupabaseErrorMessage(error));
  return [...(data ?? [])].sort((a, b) => b.item_count - a.item_count || a.tag.localeCompare(b.tag))
    .slice(0, limit).map(row => ({ tag: row.tag, count: row.item_count }));
}

export async function getCourse(slug: string, signal?: AbortSignal) {
  const { data: course, error } = await supabase.from('courses').select('*')
    .eq('slug', slug).eq('published', true).eq('status', 'active').abortSignal(signal).maybeSingle();
  if (error) throw new Error(getSupabaseErrorMessage(error));
  if (!course) return null;
  // Unit visibility follows the parent course, not the unit's published flag.
  const { data: units, error: unitError } = await supabase.from('curricular_units')
    .select('*, learning_objects(id, slug, title, published, status)')
    .eq('course_id', course.id).eq('status', 'active')
    .order('position', { nullsFirst: false }).order('title').order('id').abortSignal(signal);
  if (unitError) throw new Error(getSupabaseErrorMessage(unitError));
  const resource = course.learning_object_id ? await getPublishedResourceById(course.learning_object_id, signal) : null;
  return { course, units, resource };
}

/** A public unit inside its public course, plus the course's unit outline for navigation. */
export async function getUnit(courseSlug: string, unitSlug: string, signal?: AbortSignal) {
  const { data: course, error } = await supabase.from('courses').select('id, slug, code, title, institution, school, degree_type')
    .eq('slug', courseSlug).eq('published', true).eq('status', 'active').abortSignal(signal).maybeSingle();
  if (error) throw new Error(getSupabaseErrorMessage(error));
  if (!course) return null;
  const { data: outline, error: outlineError } = await supabase.from('curricular_units')
    .select('id, slug, title, code, ects, metadata, year, semester, position')
    .eq('course_id', course.id).eq('status', 'active')
    .order('year', { nullsFirst: false }).order('semester', { nullsFirst: false }).order('position', { nullsFirst: false }).order('title').order('id')
    .abortSignal(signal);
  if (outlineError) throw new Error(getSupabaseErrorMessage(outlineError));
  const match = outline.find(item => item.slug === unitSlug);
  if (!match) return null;
  const { data: unit, error: unitError } = await supabase.from('curricular_units')
    .select('*, learning_objects(id, slug, title, published, status)')
    .eq('id', match.id).eq('status', 'active').abortSignal(signal).maybeSingle();
  if (unitError) throw new Error(getSupabaseErrorMessage(unitError));
  if (!unit) return null;
  return { course, unit, outline };
}

async function getPublishedResourceById(id: string, signal?: AbortSignal) {
  const { data, error } = await supabase.from('learning_objects').select('*').eq('id', id)
    .eq('published', true).in('status', PUBLIC_RESOURCE_STATES).abortSignal(signal).maybeSingle();
  if (error) throw new Error(getSupabaseErrorMessage(error));
  return data;
}

export async function getResource(slug: string, signal?: AbortSignal) {
  const { data, error } = await supabase.from('learning_objects').select('*')
    .eq('slug', slug).eq('published', true).in('status', PUBLIC_RESOURCE_STATES).abortSignal(signal).maybeSingle();
  if (error) throw new Error(getSupabaseErrorMessage(error));
  return data;
}

export async function listEditorial(kind: ContentKind, { page, search, status, objectType }: CatalogParams, signal?: AbortSignal) {
  // Shared by the list and the per-state counts; an empty search adds no title filter.
  const scope = <Q extends { filter: (column: string, operator: string, value: string) => Q; ilike: (column: string, pattern: string) => Q }>(query: Q) => {
    let scoped = search.trim() ? query.ilike('title', searchPattern(search)) : query;
    if (objectType && kind === 'learning_objects') scoped = scoped.filter('object_type', 'eq', objectType);
    return scoped;
  };
  let query = scope(supabase.from(kind).select('*', { count: 'exact' }));
  if (status) query = query.eq('status', status);
  const [list, ...counts] = await Promise.all([
    query.order('updated_at', { ascending: false }).order('id')
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1).abortSignal(signal),
    ...EDITORIAL_STATUSES.map(state => scope(supabase.from(kind).select('id', { count: 'exact', head: true }))
      .eq('status', state).abortSignal(signal)),
  ]);
  for (const result of [list, ...counts]) if (result.error) throw new Error(getSupabaseErrorMessage(result.error));
  const statusCounts = Object.fromEntries(EDITORIAL_STATUSES.map((state, index) => [state, counts[index].count ?? 0])) as Record<EditorialStatus, number>;
  return { items: list.data ?? [], total: list.count ?? 0, statusCounts };
}

/** Object types in use, with counts. Editors see every row RLS allows; the public facet mirrors the catalogue filter. */
export async function getObjectTypeFacets(signal?: AbortSignal) {
  const { data, error } = await supabase.from('learning_objects').select('object_type').limit(5000).abortSignal(signal);
  if (error) throw new Error(getSupabaseErrorMessage(error));
  const counts = new Map<string, number>();
  for (const { object_type } of data) counts.set(object_type, (counts.get(object_type) ?? 0) + 1);
  return [...counts].map(([value, count]) => ({ value, count })).sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));
}

const VIDEO_FIELDS = 'id, slug, title, object_type, language, metadata, source_url';
const APPROVED = ['metadata->>review_status', 'eq', 'approved'] as const;

/**
 * Published videos a parent object (a curricular unit's learning object) contains, in curated order.
 * Filters repeat the public RLS rule so editors, who can read pending links, see the public sequence.
 */
export async function listContainedVideos(parentObjectId: string, signal?: AbortSignal) {
  const { data, error } = await supabase.from('learning_object_relations')
    .select(`position, child:learning_objects!learning_object_relations_child_object_id_fkey!inner(${VIDEO_FIELDS})`)
    .eq('parent_object_id', parentObjectId).eq('relation_type', 'contains').filter(...APPROVED)
    .eq('child.object_type', 'video').eq('child.published', true).in('child.status', PUBLIC_RESOURCE_STATES)
    .order('position', { nullsFirst: false }).order('child_object_id').abortSignal(signal);
  if (error) throw new Error(getSupabaseErrorMessage(error));
  return data.map(row => row.child);
}

/**
 * Academic context for a public resource: the public curricular units that contain it and the
 * curated video sequence of the first one. Course and unit mirror objects resolve to their own page.
 */
export async function getResourceContext(resource: { id: string; object_type: string }, signal?: AbortSignal) {
  if (resource.object_type === 'course') {
    const { data, error } = await supabase.from('courses').select('slug')
      .eq('learning_object_id', resource.id).eq('published', true).eq('status', 'active').abortSignal(signal).maybeSingle();
    if (error) throw new Error(getSupabaseErrorMessage(error));
    return { redirect: data ? `/courses/${encodeURIComponent(data.slug)}` : null, units: [], sequence: [] };
  }
  const unitFields = 'id, slug, title, code, ects, year, semester, learning_object_id, courses!inner(slug, title, code)';
  const publicUnits = () => supabase.from('curricular_units').select(unitFields)
    .eq('status', 'active').eq('courses.published', true).eq('courses.status', 'active');
  if (resource.object_type === 'curricular_unit') {
    const { data, error } = await publicUnits().eq('learning_object_id', resource.id).limit(1).abortSignal(signal);
    if (error) throw new Error(getSupabaseErrorMessage(error));
    const unit = data[0];
    return { redirect: unit ? unitPath(unit.courses.slug, unit.slug) : null, units: [], sequence: [] };
  }
  const { data: links, error } = await supabase.from('learning_object_relations').select('parent_object_id')
    .eq('child_object_id', resource.id).eq('relation_type', 'contains').filter(...APPROVED).abortSignal(signal);
  if (error) throw new Error(getSupabaseErrorMessage(error));
  const parents = [...new Set(links.map(link => link.parent_object_id))];
  if (!parents.length) return { redirect: null, units: [], sequence: [] };
  const { data: units, error: unitError } = await publicUnits().in('learning_object_id', parents)
    .order('title').order('id').abortSignal(signal);
  if (unitError) throw new Error(getSupabaseErrorMessage(unitError));
  const primary = units.find(unit => unit.learning_object_id);
  const sequence = primary?.learning_object_id ? await listContainedVideos(primary.learning_object_id, signal) : [];
  return { redirect: null, units, sequence };
}

/**
 * Opening videos of curated unit trails (optionally only the given units' trails), one per channel (globally) so
 * the selection shows the range of sources. Uses the same approved-and-published rule as unit sequences.
 */
export async function listFeaturedVideos(limit = 8, parentObjectIds: string[] = [], signal?: AbortSignal) {
  let query = supabase.from('learning_object_relations')
    .select(`position, child:learning_objects!learning_object_relations_child_object_id_fkey!inner(${VIDEO_FIELDS})`)
    .eq('relation_type', 'contains').filter(...APPROVED);
  if (parentObjectIds.length) query = query.in('parent_object_id', parentObjectIds);
  const { data, error } = await query
    .eq('child.object_type', 'video').eq('child.published', true).in('child.status', PUBLIC_RESOURCE_STATES)
    .order('position', { nullsFirst: false }).order('child_object_id').limit(120).abortSignal(signal);
  if (error) throw new Error(getSupabaseErrorMessage(error));
  const seen = new Set<string>();
  const picked: (typeof data)[number]['child'][] = [];
  for (const { child } of data) {
    // Course banners already share a context, so only the global selection spreads across channels.
    const channel = parentObjectIds.length ? child.id : videoInfo(child.metadata, child.source_url).channel ?? child.id;
    if (seen.has(channel) || seen.has(child.id)) continue;
    seen.add(channel).add(child.id);
    picked.push(child);
    if (picked.length === limit) break;
  }
  return picked;
}

/** Other published videos from the same channel, for "more from this channel". */
export async function listChannelVideos(channel: string, excludeId: string, signal?: AbortSignal) {
  const { data, error } = await supabase.from('learning_objects').select(VIDEO_FIELDS)
    .eq('object_type', 'video').eq('published', true).in('status', PUBLIC_RESOURCE_STATES)
    .filter('metadata->>channel_name', 'eq', channel).neq('id', excludeId)
    .order('title').order('id').limit(4).abortSignal(signal);
  if (error) throw new Error(getSupabaseErrorMessage(error));
  return data;
}

export async function findContentOptions(kind: ContentKind, search: string, signal?: AbortSignal) {
  const { data, error } = await supabase.from(kind).select('id, title')
    .ilike('title', searchPattern(search)).order('title').order('id').limit(50).abortSignal(signal);
  if (error) throw new Error(getSupabaseErrorMessage(error));
  return data;
}

export type SaveContent =
  | { kind: 'courses'; id?: string; values: CourseInsert }
  | { kind: 'curricular_units'; id?: string; values: UnitInsert }
  | { kind: 'learning_objects'; id?: string; values: ResourceInsert };

export async function saveContent(input: SaveContent) {
  if (input.kind === 'courses') {
    const result = await (input.id
      ? supabase.from('courses').update(input.values).eq('id', input.id)
      : supabase.from('courses').insert({ ...input.values, published: false, status: 'draft', external_source: 'manual' }))
      .select('id').single();
    if (result.error) throw new Error(getSupabaseErrorMessage(result.error));
    return result.data;
  }
  if (input.kind === 'curricular_units') {
    const result = await (input.id
      ? supabase.from('curricular_units').update(input.values).eq('id', input.id)
      : supabase.from('curricular_units').insert({ ...input.values, published: false, status: 'draft', external_source: 'manual' }))
      .select('id').single();
    if (result.error) throw new Error(getSupabaseErrorMessage(result.error));
    return result.data;
  }
  const result = await (input.id
    ? supabase.from('learning_objects').update(input.values).eq('id', input.id)
    : supabase.from('learning_objects').insert({ ...input.values, published: false, status: 'draft', source_type: 'manual' }))
    .select('id').single();
  if (result.error) throw new Error(getSupabaseErrorMessage(result.error));
  return result.data;
}

export async function changePublication(kind: ContentKind, id: string, action: 'publish' | 'archive' | 'draft') {
  const values = {
    published: action === 'publish',
    status: action === 'publish' ? 'active' : action === 'archive' ? 'archived' : 'draft',
  };
  const { data, error } = await supabase.from(kind).update(values).eq('id', id).select('id').single();
  if (error) throw new Error(getSupabaseErrorMessage(error));
  return data;
}

export async function getOverview(signal?: AbortSignal) {
  return Promise.all((['courses', 'curricular_units', 'learning_objects'] as const).map(async (kind) => {
    const count = async (status?: string, published?: boolean) => {
      let query = supabase.from(kind).select('id', { count: 'exact', head: true });
      if (status) query = query.eq('status', status);
      if (published !== undefined) query = query.eq('published', published);
      const result = await query.abortSignal(signal);
      if (result.error) throw new Error(getSupabaseErrorMessage(result.error));
      return result.count ?? 0;
    };
    const [total, draft, active, publishedState, archived, published] = await Promise.all([
      count(), count('draft'), count('active'), count('published'), count('archived'), count(undefined, true),
    ]);
    return { kind, total, draft, active, publishedState, archived, published };
  }));
}
