import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabase/supabaseClient';
import { getSupabaseErrorMessage } from '@/shared/api/supabase/supabaseErrors';

/** Only published external YouTube references are offered to anonymous learners.
 * Relations remain protected by RLS; no private curation queue is queried. */
export interface UnitVideo {
  id: string;
  slug: string;
  title: string;
  youtubeId: string;
  channel: string | null;
  durationSeconds: number | null;
  position: number | null;
}

const YOUTUBE_CANONICAL = /^https:\/\/www\.youtube\.com\/watch\?v=([A-Za-z0-9_-]{11})$/;

async function loadUnitVideos(unitObjectId: string, signal?: AbortSignal): Promise<UnitVideo[]> {
  const { data: links, error: linksError } = await supabase.from('learning_object_relations')
    .select('child_object_id, position')
    .eq('parent_object_id', unitObjectId)
    .eq('relation_type', 'contains')
    .order('position', { nullsFirst: false })
    .limit(500)
    .abortSignal(signal);

  if (linksError) throw new Error(getSupabaseErrorMessage(linksError));
  const ids = [...new Set((links ?? []).map(link => link.child_object_id))];
  if (!ids.length) return [];

  const chunks: string[][] = [];
  for (let i = 0; i < ids.length; i += 60) chunks.push(ids.slice(i, i + 60));
  const responses = await Promise.all(chunks.map(chunk => supabase.from('learning_objects')
    .select('id, slug, title, source_url, metadata')
    .in('id', chunk)
    .eq('object_type', 'video')
    .eq('published', true)
    .eq('status', 'active')
    .abortSignal(signal)));
  for (const result of responses) if (result.error) throw new Error(getSupabaseErrorMessage(result.error));

  const videos = new Map<string, UnitVideo>();
  for (const result of responses) for (const resource of result.data ?? []) {
    const match = resource.source_url?.match(YOUTUBE_CANONICAL);
    if (!match) continue;
    const meta = resource.metadata && typeof resource.metadata === 'object' && !Array.isArray(resource.metadata)
      ? resource.metadata as Record<string, unknown> : null;
    videos.set(resource.id, {
      id: resource.id,
      slug: resource.slug,
      title: resource.title,
      youtubeId: match[1],
      channel: typeof meta?.channel_name === 'string' ? meta.channel_name : null,
      durationSeconds: typeof meta?.duration_seconds === 'number' ? meta.duration_seconds : null,
      position: null,
    });
  }

  const seen = new Set<string>();
  return (links ?? []).flatMap(link => {
    const video = videos.get(link.child_object_id);
    if (!video || seen.has(video.id)) return [];
    seen.add(video.id);
    return [{ ...video, position: link.position }];
  });
}

export function useUnitVideos(unitObjectId: string | null | undefined) {
  return useQuery({
    queryKey: ['facodi', 'published-unit-videos', unitObjectId ?? ''],
    queryFn: ({ signal }) => loadUnitVideos(unitObjectId!, signal),
    enabled: Boolean(unitObjectId),
    staleTime: 5 * 60 * 1000,
  });
}
