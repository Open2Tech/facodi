import { z } from 'zod';

/**
 * Personal study notes live only in this browser, one notebook per account (or `guest`).
 * Nothing is sent to Supabase: there is no notes table in `facodi`, and private study
 * writing should not leave the device until a schema with owner-only RLS exists.
 */
export const NOTES_STORAGE_PREFIX = 'facodi-notes:v1:';
export const NOTE_TAGS_MAX = 12;

const noteSchema = z.object({
  id: z.string().min(1),
  resourceId: z.string().min(1),
  resourceSlug: z.string().min(1),
  resourceTitle: z.string(),
  title: z.string(),
  body: z.string(),
  tags: z.array(z.string()),
  timestamp: z.number().int().nonnegative().nullable(),
  pinned: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type StudyNote = z.infer<typeof noteSchema>;
export type NoteDraft = Pick<StudyNote, 'title' | 'body' | 'tags' | 'timestamp'>;
export type NoteResource = { id: string; slug: string; title: string };

export const notesStorageKey = (owner: string) => `${NOTES_STORAGE_PREFIX}${owner}`;

/** Corrupt or foreign entries are dropped one by one instead of losing the whole notebook. */
export function parseNotebook(raw: string | null): StudyNote[] {
  if (!raw) return [];
  try {
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value)) return [];
    return value.flatMap(item => {
      const parsed = noteSchema.safeParse(item);
      return parsed.success ? [parsed.data] : [];
    });
  } catch {
    return [];
  }
}

/** `#exam, sklearn  #exam` → `['exam', 'sklearn']`. */
export function parseTags(value: string) {
  const tags = value.split(/[\s,]+/).map(tag => tag.replace(/^#+/, '').trim().toLowerCase()).filter(Boolean);
  return [...new Set(tags)].slice(0, NOTE_TAGS_MAX);
}

/** Pinned first, then by position in the video, then most recently edited. */
export function sortNotes(notes: StudyNote[]) {
  return [...notes].sort((a, b) => Number(b.pinned) - Number(a.pinned)
    || (a.timestamp ?? Infinity) - (b.timestamp ?? Infinity)
    || b.updatedAt.localeCompare(a.updatedAt));
}

export const hasCode = (note: Pick<StudyNote, 'body'>) => note.body.includes('`');

export function createNote(resource: NoteResource, draft: NoteDraft, now = new Date()): StudyNote {
  const stamp = now.toISOString();
  return {
    id: crypto.randomUUID(), resourceId: resource.id, resourceSlug: resource.slug, resourceTitle: resource.title,
    ...draft, pinned: false, createdAt: stamp, updatedAt: stamp,
  };
}

export function formatTimestamp(seconds: number) {
  const whole = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(whole / 3600);
  const minutes = String(Math.floor((whole % 3600) / 60)).padStart(2, '0');
  const rest = String(whole % 60).padStart(2, '0');
  return hours ? `${hours}:${minutes}:${rest}` : `${minutes}:${rest}`;
}

/** `?t=` deep links into a video: plain non-negative whole seconds only. */
export function parseStartParam(value: string | null) {
  if (!value || !/^\d{1,6}$/.test(value)) return null;
  return Number(value);
}

/** Markdown notebook for Obsidian, Notion or any editor; timestamps link back into the video. */
export function notesToMarkdown(resource: NoteResource, notes: StudyNote[], url: string, labels: { source: string; exportedAt: string }, now = new Date()) {
  const lines = [`# ${resource.title}`, '', `${labels.source}: ${url}`, `${labels.exportedAt}: ${now.toISOString().slice(0, 10)}`];
  for (const note of sortNotes(notes)) {
    const time = note.timestamp == null ? '' : `[${formatTimestamp(note.timestamp)}](${url}?t=${note.timestamp}) `;
    lines.push('', `## ${time}${note.title}`);
    if (note.body.trim()) lines.push('', note.body.trim());
    if (note.tags.length) lines.push('', note.tags.map(tag => `#${tag}`).join(' '));
  }
  return `${lines.join('\n')}\n`;
}
