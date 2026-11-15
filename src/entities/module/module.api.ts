import { supabase } from '@/shared/api/supabase/supabaseClient';
import { getSupabaseErrorMessage } from '@/shared/api/supabase/supabaseErrors';
import { searchPattern } from '@/entities/course/course.api';

export const MODULE_PAGE_SIZE = 12;

const PUBLIC_MODULE_FIELDS = 'id,slug,title,description,language,tags,metadata';
const PUBLIC_CHILD_FIELDS = 'id,slug,title,description,object_type,source_url';

export async function listModules(page: number, search: string, signal?: AbortSignal) {
  const safePage = Math.max(1, Math.floor(page));
  let query = supabase.from('learning_objects')
    .select(PUBLIC_MODULE_FIELDS, { count: 'exact' })
    .eq('object_type', 'module').eq('published', true).eq('status', 'active')
    .order('title').order('id');
  if (search.trim()) query = query.ilike('title', searchPattern(search));
  const { data, count, error } = await query
    .range((safePage - 1) * MODULE_PAGE_SIZE, safePage * MODULE_PAGE_SIZE - 1)
    .abortSignal(signal);
  if (error) throw new Error(getSupabaseErrorMessage(error));
  return { items: data ?? [], total: count ?? 0 };
}

export type StudyModuleSummary = Awaited<ReturnType<typeof listModules>>['items'][number];

export function moduleResourcePath(type: string, slug: string): string {
  const encoded = encodeURIComponent(slug);
  return type === 'module' ? `/modules/${encoded}` : `/resources/${encoded}`;
}

export async function getModule(slug: string, signal?: AbortSignal) {
  const { data: module, error } = await supabase.from('learning_objects')
    .select(PUBLIC_MODULE_FIELDS)
    .eq('object_type', 'module').eq('slug', slug)
    .eq('published', true).eq('status', 'active')
    .abortSignal(signal).maybeSingle();
  if (error) throw new Error(getSupabaseErrorMessage(error));
  if (!module) return null;

  const [{ data: contained, error: contentsError }, { data: parents, error: parentsError }] = await Promise.all([
    supabase.from('learning_object_relations')
      .select('child_object_id,position')
      .eq('parent_object_id', module.id).eq('relation_type','contains')
      .order('position', { nullsFirst: false }).limit(100).abortSignal(signal),
    supabase.from('learning_object_relations')
      .select('parent_object_id')
      .eq('child_object_id', module.id).eq('relation_type','contains')
      .limit(100).abortSignal(signal),
  ]);
  if (contentsError) throw new Error(getSupabaseErrorMessage(contentsError));
  if (parentsError) throw new Error(getSupabaseErrorMessage(parentsError));

  const childIds = [...new Set((contained ?? []).map(relation => relation.child_object_id))];
  const parentIds = [...new Set((parents ?? []).map(relation => relation.parent_object_id))];

  const [childReply, unitReply] = await Promise.all([
    childIds.length
      ? supabase.from('learning_objects').select(PUBLIC_CHILD_FIELDS)
          .in('id', childIds).eq('published', true).eq('status', 'active')
          .abortSignal(signal)
      : Promise.resolve({ data: [], error: null }),
    parentIds.length
      ? supabase.from('curricular_units')
          .select('id,slug,title,courses!inner(slug,published,status)')
          .in('learning_object_id', parentIds)
          .eq('status','active').eq('courses.published',true).eq('courses.status','active')
          .abortSignal(signal)
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (childReply.error) throw new Error(getSupabaseErrorMessage(childReply.error));
  if (unitReply.error) throw new Error(getSupabaseErrorMessage(unitReply.error));

  const byId = new Map((childReply.data ?? []).map(item => [item.id, item]));
  const items = (contained ?? []).flatMap(relation => {
    const item = byId.get(relation.child_object_id);
    return item ? [item] : [];
  });
  return { module, items, units: unitReply.data ?? [] };
}

export type StudyModuleDetail = NonNullable<Awaited<ReturnType<typeof getModule>>>;
