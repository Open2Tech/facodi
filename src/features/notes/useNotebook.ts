import { useCallback, useEffect, useMemo, useSyncExternalStore } from 'react';
import { useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/useAuth';
import { createNote, sortNotes, type NoteDraft, type NoteResource, type StudyNote } from '@/entities/notes/notes';
import { clearNotebook, readNotebook, subscribeNotebooks, writeNotebook } from '@/entities/notes/notes.storage';
import { deleteNote, listMyNotes, saveNotes, updateNote } from '@/entities/notes/notes.api';
import { notesKeys } from '@/entities/notes/notes.keys';

type Patch = Partial<NoteDraft & { pinned: boolean }>;
const EMPTY: StudyNote[] = [];
const touch = (note: StudyNote, patch: Patch): StudyNote => ({ ...note, ...patch, updatedAt: new Date().toISOString() });
const upsertById = (notes: StudyNote[], saved: StudyNote[]) => {
  const ids = new Set(saved.map(note => note.id));
  return [...notes.filter(note => !ids.has(note.id)), ...saved];
};
const useBrowserNotebook = (owner: string | null) =>
  useSyncExternalStore(subscribeNotebooks, () => readNotebook(owner), () => readNotebook(null));

/**
 * Moves browser notes into the account. Rows the database refuses (for example a resource
 * that no longer exists) stay in the browser instead of being lost.
 */
async function moveToAccount(queryClient: QueryClient, userId: string, source: string, notes: StudyNote[]) {
  let saved: StudyNote[];
  try {
    saved = await saveNotes(notes);
  } catch {
    const results = await Promise.allSettled(notes.map(note => saveNotes([note])));
    saved = results.flatMap(result => (result.status === 'fulfilled' ? result.value : []));
  }
  const movedIds = new Set(saved.map(note => note.id));
  const left = readNotebook(source).filter(note => !movedIds.has(note.id));
  if (left.length) writeNotebook(source, left); else clearNotebook(source);
  queryClient.setQueryData<StudyNote[]>(notesKeys.mine(userId), current => upsertById(current ?? [], saved));
  return { moved: saved.length, failed: notes.length - saved.length };
}

const migrating = new Set<string>();

/**
 * The learner's notebook: synced to `facodi.study_notes` for signed-in accounts (optimistic,
 * rolled back on failure), or kept in this browser for visitors. Waits for session hydration so
 * a guest notebook never flashes before the account's own. Mutations reject when nothing was saved.
 */
export function useNotebook() {
  const { user, loading } = useAuth();
  const queryClient = useQueryClient();
  const userId = loading ? null : user?.id ?? null;
  const isGuest = !loading && !user;
  const key = useMemo(() => notesKeys.mine(userId ?? ''), [userId]);

  const query = useQuery({ queryKey: key, queryFn: ({ signal }) => listMyNotes(signal), enabled: Boolean(userId) });
  const guestNotes = useBrowserNotebook(loading ? null : 'guest');
  const legacyNotes = useBrowserNotebook(userId);

  useEffect(() => {
    if (!userId || !query.isSuccess || !legacyNotes.length || migrating.has(userId)) return;
    migrating.add(userId);
    void moveToAccount(queryClient, userId, userId, legacyNotes).finally(() => migrating.delete(userId));
  }, [legacyNotes, query.isSuccess, queryClient, userId]);

  const local = useCallback(async (update: (notes: StudyNote[]) => StudyNote[]) => {
    writeNotebook('guest', update(readNotebook('guest')));
  }, []);

  const remote = useCallback(async (apply: (notes: StudyNote[]) => StudyNote[], request: () => Promise<StudyNote[]>) => {
    await queryClient.cancelQueries({ queryKey: key });
    const previous = queryClient.getQueryData<StudyNote[]>(key);
    queryClient.setQueryData<StudyNote[]>(key, notes => apply(notes ?? []));
    try {
      const saved = await request();
      queryClient.setQueryData<StudyNote[]>(key, notes => upsertById(notes ?? [], saved));
    } catch (error) {
      queryClient.setQueryData(key, previous);
      void queryClient.invalidateQueries({ queryKey: key });
      throw error;
    }
  }, [key, queryClient]);

  const change = useCallback((id: string, patch: Patch) => {
    const apply = (notes: StudyNote[]) => notes.map(note => (note.id === id ? touch(note, patch) : note));
    return isGuest ? local(apply) : remote(apply, async () => [await updateNote(id, patch)]);
  }, [isGuest, local, remote]);

  const all = isGuest ? guestNotes : query.data ?? EMPTY;
  return {
    ready: isGuest || query.isSuccess,
    isGuest,
    failed: query.isError,
    retry: query.refetch,
    all,
    /** Visitor notes left in this browser that a signed-in learner can move into the account. */
    pendingGuest: userId ? guestNotes.length : 0,
    importGuest: useCallback(async () => {
      if (!userId) return { moved: 0, failed: 0 };
      return moveToAccount(queryClient, userId, 'guest', readNotebook('guest'));
    }, [queryClient, userId]),
    add: useCallback(async (resource: NoteResource, draft: NoteDraft) => {
      const note = createNote(resource, draft);
      if (isGuest) await local(notes => [...notes, note]);
      else await remote(notes => [...notes, note], () => saveNotes([note]));
      return note;
    }, [isGuest, local, remote]),
    update: useCallback((id: string, draft: NoteDraft) => change(id, draft), [change]),
    togglePin: useCallback((id: string) => {
      const note = all.find(item => item.id === id);
      return note ? change(id, { pinned: !note.pinned }) : Promise.resolve();
    }, [all, change]),
    remove: useCallback(async (id: string) => {
      const apply = (notes: StudyNote[]) => notes.filter(note => note.id !== id);
      if (isGuest) await local(apply);
      else await remote(apply, async () => { await deleteNote(id); return []; });
    }, [isGuest, local, remote]),
    restore: useCallback(async (note: StudyNote) => {
      const apply = (notes: StudyNote[]) => (notes.some(item => item.id === note.id) ? notes : [...notes, note]);
      if (isGuest) await local(apply);
      else await remote(apply, () => saveNotes([note]));
    }, [isGuest, local, remote]),
  };
}

export function useResourceNotes(resourceId: string) {
  const notebook = useNotebook();
  const notes = useMemo(() => sortNotes(notebook.all.filter(note => note.resourceId === resourceId)), [notebook.all, resourceId]);
  return { ...notebook, notes };
}
