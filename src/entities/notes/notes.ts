import { z } from 'zod';

/**
 * Personal study notes. Signed-in learners keep them in `facodi.study_notes` (owner-only RLS);
 * visitors keep a `guest` notebook in this browser. Per-account browser notebooks are the
 * pre-sync format and are moved to the account once.
 */
export const NOTES_STORAGE_PREFIX = 'facodi-notes:v1:';
export const NOTE_TAGS_MAX = 12;

const noteSchema = z.object({
  id: z.string().min(1),
  resourceId: z.string().min(1),
  resourceSlug: z.string().min(1),
  resourceTitle: z.string(),
  /** `learning_objects.object_type`; absent on notes written before it was recorded. */
  resourceType: z.string().optional(),
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
export type NoteResource = { id: string; slug: string; title: string; type?: string };

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
    ...(resource.type ? { resourceType: resource.type } : {}), ...draft, pinned: false, createdAt: stamp, updatedAt: stamp,
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

type ExportLabels = { source: string; exportedAt: string };

function noteMarkdown(note: StudyNote, url: string, level: string) {
  const time = note.timestamp == null ? '' : `[${formatTimestamp(note.timestamp)}](${url}?t=${note.timestamp}) `;
  const lines = ['', `${level} ${time}${note.title}`];
  if (note.body.trim()) lines.push('', note.body.trim());
  if (note.tags.length) lines.push('', note.tags.map(tag => `#${tag}`).join(' '));
  return lines;
}

/** Markdown notebook for Obsidian, Notion or any editor; timestamps link back into the video. */
export function notesToMarkdown(resource: NoteResource, notes: StudyNote[], url: string, labels: ExportLabels, now = new Date()) {
  const lines = [`# ${resource.title}`, '', `${labels.source}: ${url}`, `${labels.exportedAt}: ${now.toISOString().slice(0, 10)}`];
  for (const note of sortNotes(notes)) lines.push(...noteMarkdown(note, url, '##'));
  return `${lines.join('\n')}\n`;
}

export type NoteView = 'all' | 'pinned' | 'timed' | 'code';
export const NOTE_VIEWS: NoteView[] = ['all', 'pinned', 'timed', 'code'];
export const parseNoteView = (value: string | null): NoteView => NOTE_VIEWS.find(view => view === value) ?? 'all';

const fold = (value: string) => value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
const VIEW_TESTS: Record<NoteView, (note: StudyNote) => boolean> = {
  all: () => true,
  pinned: note => note.pinned,
  timed: note => note.timestamp !== null,
  code: hasCode,
};

/** Every word must appear in the note or its resource title, ignoring case and accents. */
export function searchNotes(notes: StudyNote[], { query = '', tag = '', view = 'all' }: { query?: string; tag?: string; view?: NoteView }) {
  const words = fold(query).split(/\s+/).filter(Boolean);
  return notes.filter(note => {
    if (!VIEW_TESTS[view](note) || (tag && !note.tags.includes(tag))) return false;
    if (!words.length) return true;
    const haystack = fold([note.title, note.body, note.resourceTitle, ...note.tags.map(item => `#${item}`)].join(' '));
    return words.every(word => haystack.includes(word));
  });
}

export const countNoteViews = (notes: StudyNote[]) =>
  Object.fromEntries(NOTE_VIEWS.map(view => [view, notes.filter(VIEW_TESTS[view]).length])) as Record<NoteView, number>;

/** Most used tags first, then alphabetically. */
export function tagCounts(notes: StudyNote[]) {
  const counts = new Map<string, number>();
  for (const note of notes) for (const tag of note.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  return [...counts].map(([tag, count]) => ({ tag, count })).sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

export type NoteGroup = { resourceId: string; slug: string; title: string; type: string | undefined; notes: StudyNote[]; updatedAt: string };

/** Notes per resource, sorted within each group; the most recently edited resource comes first. */
export function groupNotesByResource(notes: StudyNote[]): NoteGroup[] {
  const groups = new Map<string, StudyNote[]>();
  for (const note of notes) groups.set(note.resourceId, [...(groups.get(note.resourceId) ?? []), note]);
  return [...groups].map(([resourceId, items]) => {
    const latest = items.reduce((a, b) => (a.updatedAt > b.updatedAt ? a : b));
    return {
      resourceId, slug: latest.resourceSlug, title: latest.resourceTitle,
      type: items.find(item => item.resourceType)?.resourceType, notes: sortNotes(items), updatedAt: latest.updatedAt,
    };
  }).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

/** The whole notebook as one Markdown file, one section per resource. */
export function notebookToMarkdown(groups: NoteGroup[], origin: string, labels: ExportLabels & { title: string; unavailable: string }, now = new Date()) {
  const lines = [`# ${labels.title}`, '', `${labels.exportedAt}: ${now.toISOString().slice(0, 10)}`];
  for (const group of groups) {
    const url = group.slug ? `${origin}/resources/${group.slug}` : '';
    lines.push('', `## ${group.title || labels.unavailable}`);
    if (url) lines.push('', `${labels.source}: ${url}`);
    for (const note of group.notes) lines.push(...noteMarkdown(url ? note : { ...note, timestamp: null }, url, '###'));
  }
  return `${lines.join('\n')}\n`;
}
