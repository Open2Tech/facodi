import { NOTES_STORAGE_PREFIX, notesStorageKey, parseNotebook, type StudyNote } from './notes';

const EMPTY: StudyNote[] = [];
const listeners = new Set<() => void>();
// useSyncExternalStore needs a stable snapshot per stored value, not a fresh parse on every render.
const cache = new Map<string, { raw: string | null; notes: StudyNote[] }>();

function readRaw(key: string) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function readNotebook(owner: string | null): StudyNote[] {
  if (!owner) return EMPTY;
  const key = notesStorageKey(owner);
  const raw = readRaw(key);
  const hit = cache.get(key);
  if (hit && hit.raw === raw) return hit.notes;
  const notes = raw ? parseNotebook(raw) : EMPTY;
  cache.set(key, { raw, notes });
  return notes;
}

/** Throws when storage is unavailable or full so the caller can report it instead of losing a note. */
export function writeNotebook(owner: string, notes: StudyNote[]) {
  localStorage.setItem(notesStorageKey(owner), JSON.stringify(notes));
  listeners.forEach(listener => listener());
}

/** Same-tab writes notify directly; other tabs arrive through the `storage` event. */
export function subscribeNotebooks(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === null || event.key.startsWith(NOTES_STORAGE_PREFIX)) listener();
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}
