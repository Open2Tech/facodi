import { supabase } from '@/shared/api/supabase/supabaseClient';
import { getSupabaseErrorMessage } from '@/shared/api/supabase/supabaseErrors';
import type { Completion } from './milestones';
import { parseSequenceItems, parseSequenceUnits, youtubeThumbnail, type Sequence, type SequenceProgressSummary, type SequenceSummary, type VideoProgress, type VideoSequence } from './sequence';

const PROGRESS_FIELDS = 'video_id, completed_at, last_position_seconds, updated_at';
// Keep metadata JSON path selection dynamic to avoid recursive Supabase TS query type expansion.
const SEQUENCE_ACTIVITY_FIELDS: string = 'child_object_id, activity:metadata->>editorial_activity, review_status:metadata->>review_status';
const MAX_POSITION = 10_000_000;

type ProgressRow = { video_id: string; completed_at: string | null; last_position_seconds: number; updated_at: string };
const toProgress = (row: ProgressRow): VideoProgress => ({
  videoId: row.video_id, completedAt: row.completed_at, lastPosition: row.last_position_seconds, updatedAt: row.updated_at,
});

export async function listSequences(unitCode: string | null, signal?: AbortSignal): Promise<SequenceSummary[]> {
  const { data, error } = await supabase.rpc('list_public_editorial_sequences_v1', unitCode ? { p_unit_code: unitCode } : {}).abortSignal(signal);
  if (error) throw new Error(getSupabaseErrorMessage(error));
  return (data ?? []).map(row => ({
    id: row.playlist_id, slug: row.playlist_slug, title: row.playlist_title, description: row.playlist_description ?? '',
    language: row.language || null, itemCount: row.item_count, unitCodes: row.unit_codes ?? [], cover: youtubeThumbnail(row.cover_youtube_id),
  }));
}

/** Public sequence with its reviewed lessons; null when it is unpublished, unknown or not editorial. */
export async function getSequence(slug: string, signal?: AbortSignal): Promise<Sequence | null> {
  const { data, error } = await supabase.rpc('get_public_editorial_playlist_v2', { p_slug: slug }).abortSignal(signal);
  if (error) throw new Error(getSupabaseErrorMessage(error));
  const row = data?.[0];
  if (!row) return null;
  const items = parseSequenceItems(row.items);
  const slugs = new Map<string, string>();
  const activities = new Map<string, string>();
  if (items.length) {
    // Read only published video slugs and approved editorial prompts under the caller's RLS.
    // This extends the existing sequence endpoint without adding privileged RPCs or tables.
    const [slugsReply, promptsReply] = await Promise.all([
      supabase.from('learning_objects').select('id, slug')
        .in('id', items.map(item => item.videoId)).abortSignal(signal),
      supabase.from('learning_object_relations')
        .select(SEQUENCE_ACTIVITY_FIELDS)
        .eq('parent_object_id', row.playlist_id).eq('relation_type', 'contains').abortSignal(signal),
    ]);
    if (slugsReply.error) throw new Error(getSupabaseErrorMessage(slugsReply.error));
    for (const video of slugsReply.data ?? []) slugs.set(video.id, video.slug);
    // Activities are optional; if the independent relation query is unavailable,
    // the learner can still watch videos and track their progress normally.
    for (const relation of promptsReply.data ?? []) {
      if (relation.review_status === 'approved' && typeof relation.activity === 'string' && relation.activity.trim()) {
        activities.set(relation.child_object_id, relation.activity.trim());
      }
    }
  }
  return {
    id: row.playlist_id, slug: row.playlist_slug, title: row.playlist_title, description: row.playlist_description ?? '',
    language: row.language || null, verifiedCount: row.verified_metadata_count,
    items: items.map(item => ({ ...item, slug: slugs.get(item.videoId) ?? null, activity: activities.get(item.videoId) ?? null })),
    units: parseSequenceUnits(row.curricular_units),
  };
}

export async function listMyProgress(userId: string, playlistId: string, signal?: AbortSignal) {
  const { data, error } = await supabase.from('editorial_playlist_progress').select(PROGRESS_FIELDS)
    .eq('user_id', userId).eq('playlist_id', playlistId).abortSignal(signal);
  if (error) throw new Error(getSupabaseErrorMessage(error));
  return data.map(toProgress);
}

/** Sequences the learner can reach from a video page; same visibility rules as the sequence page. */
export async function listSequencesForVideo(videoId: string, signal?: AbortSignal): Promise<VideoSequence[]> {
  const { data, error } = await supabase.rpc('list_public_sequences_for_video_v1', { p_video_id: videoId }).abortSignal(signal);
  if (error) throw new Error(getSupabaseErrorMessage(error));
  return (data ?? []).map(row => ({ id: row.playlist_id, slug: row.playlist_slug, title: row.playlist_title, position: row.lesson_position, total: row.item_count }));
}

/** Ids of the learner's sequences in which this lesson is marked as done. */
export async function listMyCompletedSequencesForVideo(userId: string, videoId: string, signal?: AbortSignal) {
  const { data, error } = await supabase.from('editorial_playlist_progress').select('playlist_id')
    .eq('user_id', userId).eq('video_id', videoId).not('completed_at', 'is', null).abortSignal(signal);
  if (error) throw new Error(getSupabaseErrorMessage(error));
  return new Set(data.map(row => row.playlist_id));
}

/** Records that the learner opened a lesson, without touching progress that already exists. */
export async function markStarted(userId: string, playlistId: string, videoId: string) {
  const { error } = await supabase.from('editorial_playlist_progress')
    .upsert({ user_id: userId, playlist_id: playlistId, video_id: videoId }, { onConflict: 'user_id,playlist_id,video_id', ignoreDuplicates: true });
  if (error) throw new Error(getSupabaseErrorMessage(error));
}

/**
 * Self-reported progress. Learners may only update the position and completion columns, so this
 * updates first and inserts only when the row is new, instead of an upsert that would rewrite the key.
 */
export async function saveProgress(userId: string, playlistId: string, videoId: string, patch: { completed?: boolean; position?: number }): Promise<VideoProgress> {
  const values: { completed_at?: string | null; last_position_seconds?: number } = {};
  if (patch.completed !== undefined) values.completed_at = patch.completed ? new Date().toISOString() : null;
  if (patch.position !== undefined) values.last_position_seconds = Math.min(MAX_POSITION, Math.max(0, Math.floor(patch.position)));
  const update = () => supabase.from('editorial_playlist_progress').update(values)
    .eq('user_id', userId).eq('playlist_id', playlistId).eq('video_id', videoId).select(PROGRESS_FIELDS);
  const updated = await update();
  if (updated.error) throw new Error(getSupabaseErrorMessage(updated.error));
  if (updated.data[0]) return toProgress(updated.data[0]);
  const inserted = await supabase.from('editorial_playlist_progress')
    .insert({ user_id: userId, playlist_id: playlistId, video_id: videoId, ...values }).select(PROGRESS_FIELDS);
  if (inserted.error?.code === '23505') {
    // Another tab created the row between both requests.
    const retried = await update();
    if (retried.error) throw new Error(getSupabaseErrorMessage(retried.error));
    if (retried.data[0]) return toProgress(retried.data[0]);
  }
  if (inserted.error) throw new Error(getSupabaseErrorMessage(inserted.error));
  if (!inserted.data[0]) throw new Error('progress_not_saved');
  return toProgress(inserted.data[0]);
}

export async function resetProgress(userId: string, playlistId: string) {
  const { error } = await supabase.from('editorial_playlist_progress').delete().eq('user_id', userId).eq('playlist_id', playlistId);
  if (error) throw new Error(getSupabaseErrorMessage(error));
}

/** Sequences the learner has started, most recent activity first, with server-computed totals. */
export async function listMySequences(userId: string, limit: number, signal?: AbortSignal): Promise<{ items: SequenceProgressSummary[]; total: number }> {
  const { data, error } = await supabase.from('editorial_playlist_progress').select('playlist_id, updated_at')
    .eq('user_id', userId).order('updated_at', { ascending: false }).limit(1000).abortSignal(signal);
  if (error) throw new Error(getSupabaseErrorMessage(error));
  const latest = new Map<string, string>();
  for (const row of data) if (!latest.has(row.playlist_id)) latest.set(row.playlist_id, row.updated_at);
  const recent = [...latest.keys()].slice(0, limit);
  if (!recent.length) return { items: [], total: 0 };
  const { data: playlists, error: playlistError } = await supabase.from('learning_objects').select('id, slug')
    .in('id', recent).abortSignal(signal);
  if (playlistError) throw new Error(getSupabaseErrorMessage(playlistError));
  const slugs = new Map(playlists.map(playlist => [playlist.id, playlist.slug]));
  const items = await Promise.all(recent.flatMap(id => {
    const slug = slugs.get(id);
    if (!slug) return [];
    return [supabase.rpc('get_my_editorial_playlist_progress_v1', { p_slug: slug }).abortSignal(signal).then(({ data: rows, error: rpcError }) => {
      if (rpcError) throw new Error(getSupabaseErrorMessage(rpcError));
      const row = rows?.[0];
      return row ? [{ slug, title: row.playlist_title, total: Number(row.total_items), started: Number(row.started_items), completed: Number(row.completed_items), updatedAt: latest.get(id)! }] : [];
    })];
  }));
  return { items: items.flat(), total: latest.size };
}

/** Every lesson the learner marked as done, in any sequence: their own rows only (filter and RLS). */
export async function listMyCompletions(userId: string, signal?: AbortSignal): Promise<Completion[]> {
  const { data, error } = await supabase.from('editorial_playlist_progress').select('playlist_id, video_id, completed_at')
    .eq('user_id', userId).not('completed_at', 'is', null).order('completed_at').limit(5000).abortSignal(signal);
  if (error) throw new Error(getSupabaseErrorMessage(error));
  return data.flatMap(row => (row.completed_at ? [{ playlistId: row.playlist_id, videoId: row.video_id, completedAt: row.completed_at }] : []));
}
