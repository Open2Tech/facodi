import type { StudyNote } from '@/entities/notes/notes';

export interface StudyNoteContextResource {
  id: string;
  title: string;
  /** Canonical, public, app-relative route from already loaded course/sequence data. */
  path: string;
  /** Same URL parameter already used by the existing resource-specific notebook drawer. */
  scope: 'course' | 'unit' | 'module' | 'open';
  timed?: boolean;
}

export interface ContextualNote {
  note: StudyNote;
  resource: StudyNoteContextResource;
  href: string;
}

/** Build a deep link to the existing drawer/player. No new copy of the note is ever created. */
export function contextNoteHref(resource: StudyNoteContextResource, timestamp: number | null): string {
  const separator = resource.path.includes('?') ? '&' : '?';
  const noteTime = resource.timed && timestamp !== null && Number.isInteger(timestamp) && timestamp >= 0
    ? `&t=${timestamp}` : '';
  return `${resource.path}${separator}notes=${resource.scope}${noteTime}`;
}

/** Read-only projection of the user's notebook onto resources already linked by the curriculum.
 * Unknown, inaccessible and unlinked resources are intentionally omitted, not guessed from titles.
 */
export function contextualStudyNotes(
  notes: readonly StudyNote[],
  resources: readonly StudyNoteContextResource[],
): ContextualNote[] {
  const indexed = new Map<string, StudyNoteContextResource>();
  for (const resource of resources) {
    if (resource.id && resource.path.startsWith('/') && !resource.path.startsWith('//') && !indexed.has(resource.id)) {
      indexed.set(resource.id, resource);
    }
  }
  return notes.flatMap(note => {
    const resource = indexed.get(note.resourceId);
    return resource ? [{ note, resource, href: contextNoteHref(resource, note.timestamp) }] : [];
  }).sort((a, b) =>
    Number(b.note.pinned) - Number(a.note.pinned)
    || b.note.updatedAt.localeCompare(a.note.updatedAt)
    || a.note.id.localeCompare(b.note.id));
}

/** Same resource id in multiple course/sequence contexts still represents only one note. */
export function noteCountsByResource(notes: readonly StudyNote[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const note of notes) counts.set(note.resourceId, (counts.get(note.resourceId) ?? 0) + 1);
  return counts;
}
