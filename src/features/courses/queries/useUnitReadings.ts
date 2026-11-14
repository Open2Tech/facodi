import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabase/supabaseClient';
import { getSupabaseErrorMessage } from '@/shared/api/supabase/supabaseErrors';

export interface UnitReading {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  sourceUrl: string;
}

/** RLS allows only publicly approved external reading links and published objects.
 * Source content is not imported, only official landing-page URLs. */
async function loadUnitReadings(unitObjectId: string, signal?: AbortSignal): Promise<UnitReading[]> {
  const { data: links, error: linkError } = await supabase
    .from('learning_object_relations')
    .select('child_object_id, position')
    .eq('parent_object_id', unitObjectId)
    .eq('relation_type', 'contains')
    .order('position', { nullsFirst: false })
    .limit(600)
    .abortSignal(signal);
  if (linkError) throw new Error(getSupabaseErrorMessage(linkError));
  const ids = [...new Set((links ?? []).map(row => row.child_object_id))];
  if (!ids.length) return [];

  const chunks: string[][] = [];
  for (let start = 0; start < ids.length; start += 60) chunks.push(ids.slice(start, start + 60));
  const replies = await Promise.all(chunks.map(chunk => supabase
    .from('learning_objects')
    .select('id, slug, title, description, source_url')
    .in('id', chunk)
    .eq('object_type', 'external_resource')
    .eq('published', true)
    .eq('status', 'active')
    .abortSignal(signal)));
  for (const reply of replies) if (reply.error) throw new Error(getSupabaseErrorMessage(reply.error));

  const selected = new Map<string, UnitReading>();
  for (const reply of replies) for (const item of reply.data ?? []) {
    if (!item.source_url || !item.source_url.startsWith('https://')) continue;
    selected.set(item.id, {
      id: item.id,
      slug: item.slug,
      title: item.title,
      description: item.description,
      sourceUrl: item.source_url,
    });
  }
  const seen = new Set<string>();
  return (links ?? []).flatMap(link => {
    const match = selected.get(link.child_object_id);
    if (!match || seen.has(match.id)) return [];
    seen.add(match.id);
    return [match];
  });
}

export function useUnitReadings(unitObjectId: string | null | undefined) {
  return useQuery({
    queryKey: ['facodi', 'published-unit-readings', unitObjectId ?? ''],
    queryFn: ({ signal }) => loadUnitReadings(unitObjectId!, signal),
    enabled: Boolean(unitObjectId),
    staleTime: 10 * 60 * 1000,
  });
}
