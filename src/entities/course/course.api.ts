import { supabase } from '@/shared/api/supabase/supabaseClient';
import { getSupabaseErrorMessage } from '@/shared/api/supabase/supabaseErrors';
import { EDITORIAL_STATUSES, PAGE_SIZE, type CatalogParams, type ContentKind, type EditorialStatus, type CourseInsert, type UnitInsert, type ResourceInsert } from '@/entities/course/course.types';

export function searchPattern(search: string) {
  return `%${search.trim().replace(/[\\%_]/g, '\\$&')}%`;
}

export async function listCourses({ search, language, page }: CatalogParams, signal?: AbortSignal) {
  let query = supabase.from('courses').select('*', { count: 'exact' })
    .eq('published', true).eq('status', 'active').order('title').order('id');
  if (search.trim()) query = query.ilike('title', searchPattern(search));
  if (language) query = query.eq('language', language);
  const { data, count, error } = await query.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1).abortSignal(signal);
  if (error) throw new Error(getSupabaseErrorMessage(error));
  return { items: data, total: count ?? 0 };
}

const PUBLIC_RESOURCE_STATES = ['active', 'published'];

const UNIT_LIST_FIELDS = 'id, slug, title, code, ects, year, semester, position, language, courses!inner(slug, code, title, published, status)';

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

export async function listResources({ search, language, page, tag }: CatalogParams, signal?: AbortSignal) {
  let query = supabase.from('learning_objects')
    .select('id, slug, title, description, object_type, language, tags', { count: 'exact' })
    .eq('published', true).in('status', PUBLIC_RESOURCE_STATES).order('title').order('id');
  if (search.trim()) query = query.ilike('title', searchPattern(search));
  if (language) query = query.eq('language', language);
  // Quote the element so tags with spaces, commas or braces stay a single array item.
  if (tag) query = query.contains('tags', `{"${tag.replace(/["\\]/g, '\\$&')}"}`);
  const { data, count, error } = await query.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1).abortSignal(signal);
  if (error) throw new Error(getSupabaseErrorMessage(error));
  return { items: data, total: count ?? 0 };
}

export async function getCatalogCounts(signal?: AbortSignal) {
  const [courses, units, resources] = await Promise.all([
    supabase.from('courses').select('id', { count: 'exact', head: true })
      .eq('published', true).eq('status', 'active').abortSignal(signal),
    supabase.from('curricular_units').select('id, courses!inner(id)', { count: 'exact', head: true })
      .eq('status', 'active').eq('courses.published', true).eq('courses.status', 'active').abortSignal(signal),
    supabase.from('learning_objects').select('id', { count: 'exact', head: true })
      .eq('published', true).in('status', PUBLIC_RESOURCE_STATES).abortSignal(signal),
  ]);
  for (const result of [courses, units, resources]) if (result.error) throw new Error(getSupabaseErrorMessage(result.error));
  return { courses: courses.count ?? 0, units: units.count ?? 0, resources: resources.count ?? 0 };
}

/** Most frequent tags across a bounded sample of published resources. */
export async function listTopics(limit = 6, signal?: AbortSignal) {
  const { data, error } = await supabase.from('learning_objects').select('tags')
    .eq('published', true).in('status', PUBLIC_RESOURCE_STATES).order('updated_at', { ascending: false }).limit(200).abortSignal(signal);
  if (error) throw new Error(getSupabaseErrorMessage(error));
  const counts = new Map<string, number>();
  for (const row of data) for (const tag of row.tags) {
    const label = tag.trim();
    if (label) counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  return [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, limit).map(([tag, count]) => ({ tag, count }));
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
    .select('id, slug, title, code, ects, year, semester, position')
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
  const pattern = searchPattern(search);
  const byType = <Q extends { filter: (column: string, operator: string, value: string) => Q }>(query: Q) =>
    objectType && kind === 'learning_objects' ? query.filter('object_type', 'eq', objectType) : query;
  let query = byType(supabase.from(kind).select('*', { count: 'exact' }).ilike('title', pattern));
  if (status) query = query.eq('status', status);
  const [list, ...counts] = await Promise.all([
    query.order('updated_at', { ascending: false }).order('id')
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1).abortSignal(signal),
    ...EDITORIAL_STATUSES.map(state => byType(supabase.from(kind).select('id', { count: 'exact', head: true }).ilike('title', pattern))
      .eq('status', state).abortSignal(signal)),
  ]);
  for (const result of [list, ...counts]) if (result.error) throw new Error(getSupabaseErrorMessage(result.error));
  const statusCounts = Object.fromEntries(EDITORIAL_STATUSES.map((state, index) => [state, counts[index].count ?? 0])) as Record<EditorialStatus, number>;
  return { items: list.data ?? [], total: list.count ?? 0, statusCounts };
}

/** Object types in use, with counts, so editors can triage imported resources by kind. */
export async function getObjectTypeFacets(signal?: AbortSignal) {
  const { data, error } = await supabase.from('learning_objects').select('object_type').limit(5000).abortSignal(signal);
  if (error) throw new Error(getSupabaseErrorMessage(error));
  const counts = new Map<string, number>();
  for (const { object_type } of data) counts.set(object_type, (counts.get(object_type) ?? 0) + 1);
  return [...counts].map(([value, count]) => ({ value, count })).sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));
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
