import { describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/shared/test/mswServer';
import { changePublication, getCatalogCounts, getCourse, getResource, getUnit, getUnitFacets, listCourses, listEditorial, listResources, listTopics, listUnits, saveContent } from '@/entities/course/course.api';
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
  it('lists only active units whose parent course is public', async () => {
    server.use(http.get(`${endpoint}/curricular_units`, ({ request }) => {
      const url = new URL(request.url);
      expect(request.headers.get('Accept-Profile')).toBe('facodi');
      expect(url.searchParams.get('select')).toContain('courses!inner(');
      expect(url.searchParams.get('status')).toBe('eq.active');
      expect(url.searchParams.get('courses.published')).toBe('eq.true');
      expect(url.searchParams.get('courses.status')).toBe('eq.active');
      expect(url.searchParams.has('published')).toBe(false);
      return HttpResponse.json([], { headers: { 'Content-Range': '0-0/0' } });
    }));
    expect(await listUnits({ search: '', language: '', page: 1 })).toEqual({ items: [], total: 0 });
  });
  it('filters units by course, year, semester and a quoted title-or-code search in curriculum order', async () => {
    server.use(http.get(`${endpoint}/curricular_units`, ({ request }) => {
      const url = new URL(request.url);
      expect(url.searchParams.get('courses.slug')).toBe('eq.lesti');
      expect(url.searchParams.get('year')).toBe('eq.2');
      expect(url.searchParams.get('semester')).toBe('eq.3');
      expect(url.searchParams.get('or')).toBe('(title.ilike."%a,b\\\\%%",code.ilike."%a,b\\\\%%")');
      expect(url.searchParams.get('order')).toBe('year.asc.nullslast,semester.asc.nullslast,position.asc.nullslast,title.asc,id.asc');
      return HttpResponse.json([], { headers: { 'Content-Range': '0-0/0' } });
    }));
    expect(await listUnits({ search: 'a,b%', language: '', page: 1, course: 'lesti', year: 2, semester: 3 })).toEqual({ items: [], total: 0 });
  });
  it('builds unit facets from public units only', async () => {
    server.use(http.get(`${endpoint}/curricular_units`, ({ request }) => {
      const url = new URL(request.url);
      expect(url.searchParams.get('status')).toBe('eq.active');
      expect(url.searchParams.get('courses.published')).toBe('eq.true');
      const course = { slug: 'lesti', code: 'LESTI', title: 'LESTI' };
      return HttpResponse.json([{ year: 1, semester: 2, courses: course }, { year: 1, semester: 1, courses: course }, { year: 2, semester: 3, courses: course }]);
    }));
    const facets = await getUnitFacets();
    expect(facets.courses).toEqual([{ value: 'lesti', label: 'LESTI', count: 3 }]);
    expect(facets.years.map(option => [option.value, option.count])).toEqual([[1, 2], [2, 1]]);
    expect(facets.semesterYears).toEqual({ 1: [1], 2: [1], 3: [2] });
  });
  it('resolves a unit only inside its public course', async () => {
    server.use(
      http.get(`${endpoint}/courses`, ({ request }) => {
        const url = new URL(request.url);
        expect(url.searchParams.get('published')).toBe('eq.true');
        expect(url.searchParams.get('status')).toBe('eq.active');
        return HttpResponse.json(url.searchParams.get('slug') === 'eq.lesti' ? { id: 'c1', slug: 'lesti' } : null);
      }),
      http.get(`${endpoint}/curricular_units`, ({ request }) => {
        const url = new URL(request.url);
        expect(url.searchParams.get('status')).toBe('eq.active');
        if (url.searchParams.get('id')) return HttpResponse.json({ id: 'u2', slug: 'b', title: 'B' });
        expect(url.searchParams.get('course_id')).toBe('eq.c1');
        return HttpResponse.json([{ id: 'u1', slug: 'a' }, { id: 'u2', slug: 'b' }]);
      }),
    );
    expect(await getUnit('other', 'b')).toBeNull();
    expect(await getUnit('lesti', 'missing')).toBeNull();
    expect((await getUnit('lesti', 'b'))?.unit.title).toBe('B');
  });
  it('filters public resources by language and tag', async () => {
    server.use(http.get(`${endpoint}/learning_objects`, ({ request }) => {
      const url = new URL(request.url);
      expect(url.searchParams.get('published')).toBe('eq.true');
      expect(url.searchParams.get('status')).toBe('in.(active,published)');
      expect(url.searchParams.get('language')).toBe('eq.en');
      expect(url.searchParams.get('tags')).toBe('cs.{"data, \\"science\\""}');
      return HttpResponse.json([], { headers: { 'Content-Range': '0-0/0' } });
    }));
    expect(await listResources({ search: '', language: 'en', page: 1, tag: 'data, "science"' })).toEqual({ items: [], total: 0 });
  });
  it('counts public content with the same visibility rules and no RPC', async () => {
    const seen: string[] = [];
    server.use(http.head(`${endpoint}/:table`, ({ request, params }) => {
      const url = new URL(request.url);
      seen.push(String(params.table));
      expect(url.pathname).not.toContain('/rpc/');
      if (params.table === 'curricular_units') expect(url.searchParams.get('courses.published')).toBe('eq.true');
      else expect(url.searchParams.get('published')).toBe('eq.true');
      const totals: Record<string, number> = { courses: 2, curricular_units: 5, learning_objects: 9 };
      return new HttpResponse(null, { headers: { 'Content-Range': `*/${totals[String(params.table)]}` } });
    }));
    expect(await getCatalogCounts()).toEqual({ courses: 2, units: 5, resources: 9 });
    expect(seen.sort()).toEqual(['courses', 'curricular_units', 'learning_objects']);
  });
  it('ranks topics by frequency, ignoring blanks', async () => {
    server.use(http.get(`${endpoint}/learning_objects`, () => HttpResponse.json([
      { tags: ['Logic', 'Ethics'] }, { tags: ['Logic', ' '] }, { tags: ['Algebra'] },
    ])));
    expect(await listTopics(2)).toEqual([{ tag: 'Logic', count: 2 }, { tag: 'Algebra', count: 1 }]);
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
  it('filters the editorial list by status and object type and counts each status with the same scope', async () => {
    const seen: URLSearchParams[] = [];
    server.use(http.all(`${endpoint}/learning_objects`, ({ request }) => {
      const url = new URL(request.url);
      seen.push(url.searchParams);
      expect(url.searchParams.get('object_type')).toBe('eq.video');
      expect(url.searchParams.get('title')).toBe('ilike.%algebra%');
      if (request.method === 'HEAD') {
        const total = url.searchParams.get('status') === 'eq.draft' ? 380 : 2;
        return new HttpResponse(null, { headers: { 'Content-Range': `*/${total}` } });
      }
      expect(url.searchParams.get('status')).toBe('eq.draft');
      return HttpResponse.json([], { headers: { 'Content-Range': '0-0/380' } });
    }));
    const result = await listEditorial('learning_objects', { search: 'algebra', language: '', page: 1, status: 'draft', objectType: 'video' });
    expect(result.total).toBe(380);
    expect(result.statusCounts).toEqual({ draft: 380, active: 2, published: 2, archived: 2 });
    expect(seen).toHaveLength(5);
  });
  it('ignores the object type filter outside educational objects', async () => {
    server.use(http.all(`${endpoint}/courses`, ({ request }) => {
      expect(new URL(request.url).searchParams.has('object_type')).toBe(false);
      return request.method === 'HEAD'
        ? new HttpResponse(null, { headers: { 'Content-Range': '*/0' } })
        : HttpResponse.json([], { headers: { 'Content-Range': '*/0' } });
    }));
    expect((await listEditorial('courses', { search: '', language: '', page: 1, objectType: 'video' })).total).toBe(0);
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
