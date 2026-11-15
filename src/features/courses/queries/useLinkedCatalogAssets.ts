import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabase/supabaseClient';
import { getSupabaseErrorMessage } from '@/shared/api/supabase/supabaseErrors';

export interface LinkedCatalogAsset {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  sourceUrl: string | null;
}

type LinkedAssetType = 'playlist' | 'collection' | 'video' | 'module' | 'document' | 'external_resource';

/** Lists only public linked resources visible under the caller's RLS policies.
 * We do not infer playlist ownership or membership from a YouTube link. */
async function loadLinkedCatalogAssets(parentId: string, type: LinkedAssetType, signal?: AbortSignal): Promise<LinkedCatalogAsset[]> {
  const { data: relations, error } = await supabase.from('learning_object_relations')
    .select('child_object_id, position')
    .eq('parent_object_id', parentId)
    .eq('relation_type', 'contains')
    .order('position', { nullsFirst: false })
    .limit(600)
    .abortSignal(signal);
  if (error) throw new Error(getSupabaseErrorMessage(error));

  const ids = [...new Set((relations ?? []).map(row => row.child_object_id))];
  if (!ids.length) return [];

  const chunks: string[][] = [];
  for (let start = 0; start < ids.length; start += 60) chunks.push(ids.slice(start, start + 60));
  const replies = await Promise.all(chunks.map(chunk => supabase.from('learning_objects')
    .select('id, slug, title, description, source_url')
    .in('id', chunk)
    .eq('object_type', type)
    .eq('published', true)
    .eq('status', 'active')
    .abortSignal(signal)));
  for (const reply of replies) if (reply.error) throw new Error(getSupabaseErrorMessage(reply.error));

  const assets = new Map<string, LinkedCatalogAsset>();
  for (const reply of replies) for (const object of reply.data ?? []) {
    assets.set(object.id, {
      id: object.id,
      slug: object.slug,
      title: object.title,
      description: object.description,
      sourceUrl: object.source_url,
    });
  }
  const seen = new Set<string>();
  return (relations ?? []).flatMap(relation => {
    const asset = assets.get(relation.child_object_id);
    if (!asset || seen.has(asset.id)) return [];
    seen.add(asset.id);
    return [asset];
  });
}

export function useLinkedCatalogAssets(parentId: string | null | undefined, type: LinkedAssetType) {
  return useQuery({
    queryKey: ['facodi', 'linked-catalog-assets', type, parentId ?? ''],
    queryFn: ({ signal }) => loadLinkedCatalogAssets(parentId!, type, signal),
    enabled: !!parentId,
    staleTime: 10 * 60_000,
  });
}

/** Conceptual study progression only: authored, published module-to-module edges.
 * PostgreSQL RLS controls which prerequisite_of relations can be read by visitors.
 */
async function loadModuleProgression(moduleId: string, signal?: AbortSignal): Promise<{
  prerequisites: LinkedCatalogAsset[];
  nextModules: LinkedCatalogAsset[];
}> {
  const [incoming, outgoing] = await Promise.all([
    supabase.from('learning_object_relations')
      .select('parent_object_id')
      .eq('relation_type', 'prerequisite_of')
      .eq('child_object_id', moduleId)
      .limit(30).abortSignal(signal),
    supabase.from('learning_object_relations')
      .select('child_object_id')
      .eq('relation_type', 'prerequisite_of')
      .eq('parent_object_id', moduleId)
      .limit(30).abortSignal(signal),
  ]);
  if (incoming.error) throw new Error(getSupabaseErrorMessage(incoming.error));
  if (outgoing.error) throw new Error(getSupabaseErrorMessage(outgoing.error));

  const incomingIds = [...new Set((incoming.data ?? []).map(item => item.parent_object_id))];
  const outgoingIds = [...new Set((outgoing.data ?? []).map(item => item.child_object_id))];
  const ids = [...new Set([...incomingIds, ...outgoingIds])];
  if (!ids.length) return { prerequisites: [], nextModules: [] };

  const { data, error } = await supabase.from('learning_objects')
    .select('id, slug, title, description, source_url')
    .in('id', ids)
    .eq('object_type', 'module')
    .eq('published', true)
    .eq('status', 'active')
    .abortSignal(signal);
  if (error) throw new Error(getSupabaseErrorMessage(error));
  const byId = new Map((data ?? []).map(item => [item.id, {
    id: item.id, slug: item.slug, title: item.title,
    description: item.description, sourceUrl: item.source_url,
  } satisfies LinkedCatalogAsset]));
  const resolve = (values: string[]) => values.flatMap(id => {
    const item = byId.get(id);
    return item ? [item] : [];
  });
  return { prerequisites: resolve(incomingIds), nextModules: resolve(outgoingIds) };
}

export function useModuleProgression(moduleId: string | null | undefined) {
  return useQuery({
    queryKey: ['facodi', 'module-progression', moduleId ?? ''],
    queryFn: ({ signal }) => loadModuleProgression(moduleId!, signal),
    enabled: !!moduleId,
    staleTime: 10 * 60_000,
  });
}
