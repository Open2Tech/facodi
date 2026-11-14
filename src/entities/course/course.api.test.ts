import { describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/shared/test/mswServer';
import { changePublication, getCourse, getResource, listCourses, saveContent } from '@/entities/course/course.api';
import { getEnv } from '@/shared/config/env';

const endpoint = `${getEnv().VITE_SUPABASE_URL}/rest/v1`;
describe('FACODI Data API contract', () => {
  it('filters published active courses, escapes search and paginates with a FACODI profile', async () => {
    server.use(http.get(`${endpoint}/courses`, ({ request }) => {
      const url = new URL(request.url);
      expect(request.headers.get('Accept-Profile')).toBe('facodi');
      expect(url.searchParams.get('published')).toBe('eq.true');
      expect(url.searchParams.get('status')).toBe('eq.active');
      expect(url.searchParams.get('title')).toBe('ilike.%100\\%\\_math%');
      expect(url.searchParams.get('language')).toBe('eq.pt');
      expect(url.searchParams.get('offset')).toBe('12');
      expect(url.searchParams.get('limit')).toBe('12');
      return HttpResponse.json([], { headers: { 'Content-Range': '12-11/13' } });
    }));
    expect(await listCourses({ search: '100%_math', language: 'pt', page: 2 })).toEqual({ items: [], total: 13 });
  });
  it('requires an active public parent but does not misrepresent the unit published flag', async () => {
    server.use(
      http.get(`${endpoint}/courses`, ({ request }) => {
        expect(new URL(request.url).searchParams.get('published')).toBe('eq.true');
        return HttpResponse.json({ id: 'course-id', title: 'Math', learning_object_id: null });
      }),
      http.get(`${endpoint}/curricular_units`, ({ request }) => {
        const url = new URL(request.url);
        expect(request.headers.get('Accept-Profile')).toBe('facodi');
        expect(url.searchParams.get('course_id')).toBe('eq.course-id');
        expect(url.searchParams.get('status')).toBe('eq.active');
        expect(url.searchParams.has('published')).toBe(false);
        expect(url.searchParams.get('select')).not.toContain('learning_object_relations');
        return HttpResponse.json([{ id: 'unit', published: false, status: 'active' }]);
      }),
    );
    const result = await getCourse('math');
    expect(result.units[0].published).toBe(false);
  });
  it('filters resources to published objects in active or published states', async () => {
    server.use(http.get(`${endpoint}/learning_objects`, ({ request }) => {
      const url = new URL(request.url);
      expect(url.searchParams.get('published')).toBe('eq.true');
      expect(url.searchParams.get('status')).toBe('in.(active,published)');
      return HttpResponse.json(null);
    }));
    expect(await getResource('missing')).toBeNull();
  });
  it.each(['courses', 'curricular_units', 'learning_objects'] as const)('creates manual drafts in %s, never auto-publishing', async kind => {
    server.use(http.post(`${endpoint}/${kind}`, async ({ request }) => {
      expect(request.headers.get('Content-Profile')).toBe('facodi');
      const body = await request.json() as Record<string, unknown>;
      expect(body.status).toBe('draft');
      expect(body.published).toBe(false);
      expect(body[kind === 'learning_objects' ? 'source_type' : 'external_source']).toBe('manual');
      return HttpResponse.json({ id: 'new-id' }, { status: 201 });
    }));
    const values = { title: 'New content', slug: 'new', published: true, status: 'active' };
    if (kind === 'courses') await saveContent({ kind, values });
    else if (kind === 'curricular_units') await saveContent({ kind, values: { ...values, course_id: 'course-id' } });
    else await saveContent({ kind, values: { ...values, object_type: 'document' } });
  });
  it('archives without deleting and surfaces RLS-denied or zero-row writes', async () => {
    server.use(http.patch(`${endpoint}/courses`, async ({ request }) => {
      expect(await request.json()).toEqual({ published: false, status: 'archived' });
      return HttpResponse.json({ message: 'RLS denied', code: '42501' }, { status: 403 });
    }));
    await expect(changePublication('courses', 'id', 'archive')).rejects.toThrow('RLS denied');
    server.use(http.patch(`${endpoint}/courses`, () => HttpResponse.json({ message: 'No rows returned', code: 'PGRST116' }, { status: 406 })));
    await expect(changePublication('courses', 'id', 'publish')).rejects.toThrow('No rows returned');
  });
});
