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

type LinkedAssetType = 'playlist' | 'collection' | 'video' | 'module';

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
