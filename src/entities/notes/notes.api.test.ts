import { describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/shared/test/mswServer';
import { getEnv } from '@/shared/config/env';
import { listMyNotes, saveNotes } from '@/entities/notes/notes.api';
import { createNote } from '@/entities/notes/notes';

const endpoint = `${getEnv().VITE_SUPABASE_URL}/rest/v1/study_notes`;
const row = {
  id: 'n1', learning_object_id: 'lo1', title: 'OneHotEncoder', body: '', tags: ['exam'], timestamp_seconds: 42,
  pinned: false, created_at: '2026-11-14T10:00:00Z', updated_at: '2026-11-14T10:00:00Z',
};

describe('FACODI study notes API', () => {
  it('reads the owner notebook from facodi and keeps notes whose resource the catalogue hides', async () => {
    server.use(http.get(endpoint, ({ request }) => {
      expect(request.headers.get('Accept-Profile')).toBe('facodi');
      expect(new URL(request.url).searchParams.get('select')).toContain('learning_object:learning_objects(slug,title,object_type)');
      return HttpResponse.json([{ ...row, learning_object: { slug: 'video', title: 'Video', object_type: 'video' } }, { ...row, id: 'n2', learning_object: null }]);
    }));
    const notes = await listMyNotes();
    expect(notes.map(note => [note.id, note.resourceSlug, note.resourceType, note.timestamp])).toEqual([['n1', 'video', 'video', 42], ['n2', '', undefined, 42]]);
  });

  it('upserts by client id without sending an owner, and rejects when RLS saves nothing', async () => {
    const note = createNote({ id: 'lo1', slug: 'video', title: 'Video' }, { title: 'T', body: '', tags: [], timestamp: null });
    server.use(http.post(endpoint, async ({ request }) => {
      expect(new URL(request.url).searchParams.get('on_conflict')).toBe('id');
      const [sent] = await request.json() as Record<string, unknown>[];
      expect(sent).toMatchObject({ id: note.id, learning_object_id: 'lo1', timestamp_seconds: null });
      expect(sent).not.toHaveProperty('owner_id');
      return HttpResponse.json([]);
    }));
    await expect(saveNotes([note])).rejects.toThrow('notes_not_saved');
  });
});
