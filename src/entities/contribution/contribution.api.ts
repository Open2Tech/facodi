import { supabase } from '@/shared/api/supabase/supabaseClient';
import { getSupabaseErrorMessage } from '@/shared/api/supabase/supabaseErrors';
import { PAGE_SIZE } from '@/entities/course/course.types';
import { isYoutubePlaylistUrl, parsePlaylistVideoIds } from '@/entities/facodi-playlists/playlistUtils';
import type {
  Blueprint, BlueprintDecision, BlueprintStatus, CatalogOption, PlaylistDecision,
  PlaylistSubmission, PlaylistSubmissionInput, PlaylistSummary,
} from '@/entities/contribution/contribution.types';

const BLUEPRINT_SOURCE = 'facodi_deterministic_editorial_blueprint';
const BLUEPRINT_STATES: BlueprintStatus[] = ['draft', 'accepted', 'rejected'];
const PLAYLIST_FIELDS = 'id,title,description,source_url,status,import_status,language,submitted_at,review_note,courses(code,title),curricular_units(code,title)';
export async function listCourseOptions(signal?: AbortSignal): Promise<CatalogOption[]> {
  const { data, error } = await supabase.from('courses').select('id,code,title')
    .eq('published', true).eq('status', 'active').order('title').abortSignal(signal);
  if (error) throw new Error(getSupabaseErrorMessage(error));
  return data ?? [];
}

/** Units follow the public catalogue rule (active, inside a public course); unit `published` is not a gate. */
export async function listUnitOptions(courseId: string, signal?: AbortSignal): Promise<CatalogOption[]> {
  const { data, error } = await supabase.from('curricular_units').select('id,code,title')
    .eq('course_id', courseId).eq('status', 'active')
    .order('year').order('semester').order('position').order('title').abortSignal(signal);
  if (error) throw new Error(getSupabaseErrorMessage(error));
  return data ?? [];
}

export async function submitPlaylist(input: PlaylistSubmissionInput): Promise<PlaylistSubmission> {
  if (!input.courseId || !input.unitId || !isYoutubePlaylistUrl(input.url.trim())) throw new Error('invalid_course_unit_or_youtube_playlist');
  const videoIds = input.manualIds.trim() ? parsePlaylistVideoIds(input.manualIds) : [];
  const { data, error } = await supabase.functions.invoke<PlaylistSubmission>('facodi-submit-playlist', {
    body: {
      course_id: input.courseId,
      curricular_unit_id: input.unitId,
      playlist_url: input.url.trim(),
      ...(input.title.trim() ? { title: input.title.trim() } : {}),
      ...(input.description.trim() ? { description: input.description.trim() } : {}),
      language: input.language,
      max_videos: input.maxVideos,
      ...(videoIds.length ? { youtube_video_ids: videoIds } : {}),
    },
  });
  if (error) {
    let code = error.message;
    const context = 'context' in error ? error.context : null;
    if (context instanceof Response) {
      try {
        const payload: unknown = await context.clone().json();
        if (payload && typeof payload === 'object' && 'error' in payload && typeof payload.error === 'string') code = payload.error;
      } catch { /* The function may answer with a non-JSON body. */ }
    }
    throw new Error(code);
  }
  if (!data || typeof data.playlist_id !== 'string') throw new Error('playlist_submission_failed');
  return data;
}

export async function listMyPlaylists(userId: string, signal?: AbortSignal): Promise<PlaylistSummary[]> {
  const { data, error } = await supabase.from('playlists').select(PLAYLIST_FIELDS)
    .eq('submitted_by', userId).order('submitted_at', { ascending: false }).limit(10).abortSignal(signal);
  if (error) throw new Error(getSupabaseErrorMessage(error));
  return data ?? [];
}

export async function listPendingPlaylists(signal?: AbortSignal): Promise<PlaylistSummary[]> {
  const { data, error } = await supabase.from('playlists').select(PLAYLIST_FIELDS)
    .eq('status', 'pending').order('submitted_at', { ascending: true }).limit(80).abortSignal(signal);
  if (error) throw new Error(getSupabaseErrorMessage(error));
  return data ?? [];
}

export async function listPlaylistItems(playlistId: string, signal?: AbortSignal) {
  const { data, error } = await supabase.from('playlist_items')
    .select('id,position,youtube_video_id,video_id,review_status')
    .eq('playlist_id', playlistId).order('position').limit(100).abortSignal(signal);
  if (error) throw new Error(getSupabaseErrorMessage(error));
  return data ?? [];
}

export async function reviewPlaylist(playlistId: string, decision: PlaylistDecision, note: string) {
  const { error } = await supabase.rpc('review_playlist', {
    p_playlist_id: playlistId, p_decision: decision, p_review_note: note.trim() || null,
  });
  if (error) throw new Error(getSupabaseErrorMessage(error));
}

export async function listBlueprints(status: BlueprintStatus, page: number, signal?: AbortSignal): Promise<{ items: Blueprint[]; total: number }> {
  const { data, count, error } = await supabase.from('generated_structures').select('*', { count: 'exact' })
    .eq('generated_by', BLUEPRINT_SOURCE).eq('status', status)
    .order('created_at', { ascending: false }).order('id')
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1).abortSignal(signal);
  if (error) throw new Error(getSupabaseErrorMessage(error));
  return { items: data ?? [], total: count ?? 0 };
}

export async function countBlueprints(signal?: AbortSignal): Promise<Record<BlueprintStatus, number>> {
  const replies = await Promise.all(BLUEPRINT_STATES.map(status => supabase.from('generated_structures')
    .select('id', { count: 'exact', head: true })
    .eq('generated_by', BLUEPRINT_SOURCE).eq('status', status).abortSignal(signal)));
  const failed = replies.find(reply => reply.error);
  if (failed?.error) throw new Error(getSupabaseErrorMessage(failed.error));
  return Object.fromEntries(BLUEPRINT_STATES.map((status, index) => [status, replies[index].count ?? 0])) as Record<BlueprintStatus, number>;
}

export async function reviewBlueprint(id: string, decision: BlueprintDecision, note: string) {
  const { error } = await supabase.rpc('review_study_blueprint', { p_id: id, p_decision: decision, p_note: note.trim() || null });
  if (error) throw new Error(getSupabaseErrorMessage(error));
}
