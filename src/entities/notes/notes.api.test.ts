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

describe('curricular notebook API integration', () => {
  it('hydrates public course and UC links using their real curriculum routes', async () => {
    const root = getEnv().VITE_SUPABASE_URL;
    server.use(
      http.get(endpoint, () => HttpResponse.json([
        { ...row, id: 'n-course', learning_object_id: 'course-obj', learning_object: { slug: 'facodi-course-bioquimica', title: 'Bioquímica', object_type: 'course' } },
        { ...row, id: 'n-uc', learning_object_id: 'uc-obj', learning_object: { slug: 'facodi-uc-bioquimica-140064284', title: 'Biologia Celular', object_type: 'curricular_unit' } },
      ])),
      http.get(`${root}/rest/v1/courses`, ({ request }) => {
        expect(request.headers.get('Accept-Profile')).toBe('facodi');
        return HttpResponse.json([{ learning_object_id: 'course-obj', slug: 'bioquimica' }]);
      }),
      http.get(`${root}/rest/v1/curricular_units`, ({ request }) => {
        expect(request.headers.get('Accept-Profile')).toBe('facodi');
        expect(new URL(request.url).searchParams.get('select')).toContain('courses!inner(slug)');
        return HttpResponse.json([{ learning_object_id: 'uc-obj', slug: '140064284', courses: { slug: 'bioquimica' } }]);
      }),
    );
    const result = await listMyNotes();
    expect(result.map(note => [note.resourceType, note.resourceHref])).toEqual([
      ['course', '/courses/bioquimica'],
      ['curricular_unit', '/courses/bioquimica/units/140064284'],
    ]);
  });

  it('retains notes even when an unpublished UC cannot be resolved under public RLS', async () => {
    const root = getEnv().VITE_SUPABASE_URL;
    server.use(
      http.get(endpoint, () => HttpResponse.json([
        { ...row, learning_object: { slug: 'facodi-uc-bioquimica-140064284', title: 'Biologia Celular', object_type: 'curricular_unit' } },
      ])),
      http.get(`${root}/rest/v1/curricular_units`, () => HttpResponse.json([])),
    );
    const result = await listMyNotes();
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('OneHotEncoder');
    expect(result[0].resourceHref).toBeUndefined();
  });
});
