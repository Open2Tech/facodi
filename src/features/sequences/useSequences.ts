import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { sequenceKeys } from '@/entities/sequence/sequence.keys';
import { getSequence, listMyCompletedSequencesForVideo, listMyProgress, listMySequences, listSequences, listSequencesForVideo, markStarted, resetProgress, saveProgress } from '@/entities/sequence/sequence.api';
import type { VideoProgress } from '@/entities/sequence/sequence';
import { useAuth } from '@/features/auth/useAuth';

export function useSequences(unitCode: string | null = null, enabled = true) {
  return useQuery({ queryKey: sequenceKeys.list(unitCode), queryFn: ({ signal }) => listSequences(unitCode, signal), enabled, staleTime: 5 * 60_000 });
}

export function useSequence(slug: string) {
  return useQuery({ queryKey: sequenceKeys.detail(slug), queryFn: ({ signal }) => getSequence(slug, signal) });
}

/** Public sequences containing a video, plus (signed in) which of them already count it as done. */
export function useVideoSequences(videoId: string | null) {
  const { user } = useAuth();
  const sequences = useQuery({
    queryKey: sequenceKeys.forVideo(videoId ?? ''),
    queryFn: ({ signal }) => listSequencesForVideo(videoId!, signal),
    enabled: !!videoId,
    staleTime: 5 * 60_000,
  });
  const completed = useQuery({
    queryKey: sequenceKeys.videoCompletion(user?.id ?? '', videoId ?? ''),
    queryFn: ({ signal }) => listMyCompletedSequencesForVideo(user!.id, videoId!, signal),
    enabled: !!user && !!videoId && !!sequences.data?.length,
  });
  return { sequences, completed };
}

export function useMySequences(limit: number) {
  const { user } = useAuth();
  return useQuery({
    queryKey: [...sequenceKeys.overview(user?.id ?? ''), limit],
    queryFn: ({ signal }) => listMySequences(user!.id, limit, signal),
    enabled: !!user,
  });
}

/** The signed-in learner's private progress in one sequence, plus the actions that change it. */
export function useSequenceProgress(playlistId: string | null | undefined) {
  const { user } = useAuth();
  const client = useQueryClient();
  const userId = user?.id ?? '';
  const key = sequenceKeys.progress(userId, playlistId ?? '');
  const query = useQuery({
    queryKey: key,
    queryFn: ({ signal }) => listMyProgress(userId, playlistId!, signal),
    enabled: !!user && !!playlistId,
    select: rows => new Map(rows.map(row => [row.videoId, row])),
  });
  const merge = (row: VideoProgress) => client.setQueryData<VideoProgress[]>(key, rows => [...(rows ?? []).filter(item => item.videoId !== row.videoId), row]);
  const settle = () => Promise.all([
    client.invalidateQueries({ queryKey: sequenceKeys.overview(userId) }),
    client.invalidateQueries({ queryKey: [...sequenceKeys.progressAll(userId), 'video'] }),
  ]);

  const toggle = useMutation({
    mutationFn: ({ videoId, completed }: { videoId: string; completed: boolean }) => saveProgress(userId, playlistId!, videoId, { completed }),
    onMutate: async ({ videoId, completed }) => {
      await client.cancelQueries({ queryKey: key });
      const previous = client.getQueryData<VideoProgress[]>(key);
      const current = previous?.find(row => row.videoId === videoId);
      const now = new Date().toISOString();
      merge({ videoId, lastPosition: current?.lastPosition ?? 0, completedAt: completed ? now : null, updatedAt: now });
      return { previous };
    },
    onError: (_error, _vars, context) => client.setQueryData(key, context?.previous),
    onSuccess: merge,
    onSettled: settle,
  });
  const reset = useMutation({
    mutationFn: () => resetProgress(userId, playlistId!),
    onSuccess: () => client.setQueryData<VideoProgress[]>(key, []),
    onSettled: settle,
  });
  /** Best effort: progress tracking must never interrupt watching. */
  async function start(videoId: string) {
    if (!user || !playlistId || query.data?.has(videoId)) return;
    try {
      await markStarted(userId, playlistId, videoId);
      await client.invalidateQueries({ queryKey: key });
      void settle();
    } catch { /* ignored */ }
  }
  async function savePosition(videoId: string, position: number) {
    if (!user || !playlistId) return;
    try { merge(await saveProgress(userId, playlistId, videoId, { position })); } catch { /* ignored */ }
  }
  return { ...query, signedIn: !!user, toggle, reset, start, savePosition };
}
