import { supabase } from '@/shared/api/supabase/supabaseClient';
import { getSupabaseErrorMessage } from '@/shared/api/supabase/supabaseErrors';
import type { Database } from '@/integrations/supabase/types';
import type { NoteDraft, StudyNote } from './notes';

type NoteRow = Database['facodi']['Tables']['study_notes']['Row'] & {
  learning_object: { slug: string; title: string; object_type: string } | null;
};

const NOTE_FIELDS = 'id,learning_object_id,title,body,tags,timestamp_seconds,pinned,created_at,updated_at,learning_object:learning_objects(slug,title,object_type)';

/** A resource hidden by catalogue RLS keeps its notes, with an empty slug the UI treats as unavailable. */
export function noteFromRow(row: NoteRow): StudyNote {
  return {
    id: row.id,
    resourceId: row.learning_object_id,
    resourceSlug: row.learning_object?.slug ?? '',
    resourceTitle: row.learning_object?.title ?? '',
    ...(row.learning_object ? { resourceType: row.learning_object.object_type } : {}),
    title: row.title,
    body: row.body,
    tags: row.tags,
    timestamp: row.timestamp_seconds,
    pinned: row.pinned,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const toRow = (note: StudyNote) => ({
  id: note.id,
  learning_object_id: note.resourceId,
  title: note.title,
  body: note.body,
  tags: note.tags,
  timestamp_seconds: note.timestamp,
  pinned: note.pinned,
  created_at: note.createdAt,
  updated_at: note.updatedAt,
});

/** RLS returns only the signed-in owner's notes. */
export async function listMyNotes(signal?: AbortSignal): Promise<StudyNote[]> {
  const { data, error } = await supabase.from('study_notes').select(NOTE_FIELDS)
    .order('updated_at', { ascending: false }).abortSignal(signal);
  if (error) throw new Error(getSupabaseErrorMessage(error));
  const notes = (data as NoteRow[] | null ?? []).map(noteFromRow);
  const courseIds = [...new Set(notes.filter(note => note.resourceType === 'course').map(note => note.resourceId))];
  const unitIds = [...new Set(notes.filter(note => note.resourceType === 'curricular_unit').map(note => note.resourceId))];
  if (!courseIds.length && !unitIds.length) return notes;
  const routes = new Map<string, string>();
  // Resolve only publicly readable curricular routes under their existing RLS.
  // If a course/UC has been unpublished, notes remain editable in /notes without a dead link.
  if (courseIds.length) {
    const { data: courses, error: courseError } = await supabase.from('courses')
      .select('learning_object_id, slug').in('learning_object_id', courseIds)
      .eq('published', true).eq('status', 'active').abortSignal(signal);
    if (!courseError) for (const course of courses ?? []) {
      if (course.learning_object_id) routes.set(course.learning_object_id, `/courses/${encodeURIComponent(course.slug)}`);
    }
  }
  if (unitIds.length) {
    const { data: units, error: unitError } = await supabase.from('curricular_units')
      .select('learning_object_id, slug, courses!inner(slug)')
      .in('learning_object_id', unitIds)
      .eq('published', true).eq('status', 'active')
      .eq('courses.published', true).eq('courses.status', 'active').abortSignal(signal);
    if (!unitError) for (const unit of units ?? []) {
      if (unit.learning_object_id && unit.courses?.slug) {
        routes.set(unit.learning_object_id, `/courses/${encodeURIComponent(unit.courses.slug)}/units/${encodeURIComponent(unit.slug)}`);
      }
    }
  }
  return notes.map(note => routes.has(note.resourceId)
    ? { ...note, resourceHref: routes.get(note.resourceId) } : note);
}

/** Insert or re-insert (undo, import) by client id; `owner_id` comes from the session. */
export async function saveNotes(notes: StudyNote[]): Promise<StudyNote[]> {
  if (!notes.length) return [];
  const { data, error } = await supabase.from('study_notes').upsert(notes.map(toRow), { onConflict: 'id' }).select(NOTE_FIELDS);
  if (error) throw new Error(getSupabaseErrorMessage(error));
  if ((data?.length ?? 0) !== notes.length) throw new Error('notes_not_saved');
  return (data as NoteRow[]).map(noteFromRow);
}

export async function updateNote(id: string, patch: Partial<NoteDraft & { pinned: boolean }>): Promise<StudyNote> {
  const { timestamp, ...rest } = patch;
  const values = timestamp === undefined ? rest : { ...rest, timestamp_seconds: timestamp };
  const { data, error } = await supabase.from('study_notes').update(values).eq('id', id).select(NOTE_FIELDS).maybeSingle();
  if (error) throw new Error(getSupabaseErrorMessage(error));
  if (!data) throw new Error('notes_not_saved');
  return noteFromRow(data as NoteRow);
}

export async function deleteNote(id: string): Promise<void> {
  const { data, error } = await supabase.from('study_notes').delete().eq('id', id).select('id');
  if (error) throw new Error(getSupabaseErrorMessage(error));
  if (!data?.length) throw new Error('notes_not_saved');
}
