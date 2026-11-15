import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabase/supabaseClient';
import { getSupabaseErrorMessage } from '@/shared/api/supabase/supabaseErrors';

export type ResourceTopicFacet = { value: string; count: number };

export function usePublicResourceTopics(params: {
  search: string;
  language: string;
  objectType: string;
  area: string;
}) {
  return useQuery({
    queryKey: ['facodi', 'public-resource-topic-facets', params],
    queryFn: async ({ signal }): Promise<ResourceTopicFacet[]> => {
      const { data, error } = await supabase.rpc('list_public_resource_topics_v1', {
        p_search: params.search,
        p_language: params.language || null,
        p_object_type: params.objectType || null,
        p_area: params.area || null,
      }).abortSignal(signal);
      if (error) throw new Error(getSupabaseErrorMessage(error));
      return (data ?? []).map(row => ({ value: row.tag, count: row.item_count }));
    },
    staleTime: 5 * 60_000,
  });
}
