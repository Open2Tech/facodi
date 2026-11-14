import { useCallback, useMemo, useSyncExternalStore } from 'react';
import { useAuth } from '@/features/auth/useAuth';
import { createNote, sortNotes, type NoteDraft, type NoteResource, type StudyNote } from '@/entities/notes/notes';
import { readNotebook, subscribeNotebooks, writeNotebook } from '@/entities/notes/notes.storage';

const touch = (note: StudyNote, patch: Partial<StudyNote>): StudyNote => ({ ...note, ...patch, updatedAt: new Date().toISOString() });

/**
 * The signed-in account's notebook on this device, or the shared `guest` notebook for visitors.
 * Waits for session hydration so a guest notebook never flashes before the account's own.
 * Mutations throw when the browser refuses to store them.
 */
export function useNotebook() {
  const { user, loading } = useAuth();
  const owner = loading ? null : user?.id ?? 'guest';
  const all = useSyncExternalStore(subscribeNotebooks, () => readNotebook(owner), () => readNotebook(null));

  const save = useCallback((update: (notes: StudyNote[]) => StudyNote[]) => {
    if (!owner) throw new Error('notes.notReady');
    writeNotebook(owner, update(readNotebook(owner)));
  }, [owner]);

  return {
    ready: owner !== null,
    isGuest: owner === 'guest',
    all,
    add: useCallback((resource: NoteResource, draft: NoteDraft) => {
      const note = createNote(resource, draft);
      save(notes => [...notes, note]);
      return note;
    }, [save]),
    update: useCallback((id: string, draft: NoteDraft) => save(notes => notes.map(note => note.id === id ? touch(note, draft) : note)), [save]),
    togglePin: useCallback((id: string) => save(notes => notes.map(note => note.id === id ? touch(note, { pinned: !note.pinned }) : note)), [save]),
    remove: useCallback((id: string) => save(notes => notes.filter(note => note.id !== id)), [save]),
    restore: useCallback((note: StudyNote) => save(notes => notes.some(item => item.id === note.id) ? notes : [...notes, note]), [save]),
  };
}

export function useResourceNotes(resourceId: string) {
  const notebook = useNotebook();
  const notes = useMemo(() => sortNotes(notebook.all.filter(note => note.resourceId === resourceId)), [notebook.all, resourceId]);
  return { ...notebook, notes };
}
