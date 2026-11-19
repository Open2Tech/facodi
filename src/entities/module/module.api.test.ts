import { describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/shared/test/mswServer';
import { getEnv } from '@/shared/config/env';
import { getModule, moduleResourcePath } from '@/entities/module/module.api';

const endpoint = `${getEnv().VITE_SUPABASE_URL}/rest/v1`;

describe('public module visibility', () => {
  it('loads published modules and both publicly visible child statuses, keeping curated order', async () => {
    server.use(
      http.get(`${endpoint}/learning_objects`, ({ request }) => {
        const params = new URL(request.url).searchParams;
        expect(request.headers.get('Accept-Profile')).toBe('facodi');
        expect(params.get('published')).toBe('eq.true');
        expect(params.get('status')).toBe('in.(active,published)');
        if (params.has('slug')) {
          expect(params.get('object_type')).toBe('eq.module');
          return HttpResponse.json({ id: 'm1', slug: 'published-module', title: 'Module', metadata: {} });
        }
        expect(params.get('id')).toBe('in.(child-2,child-1)');
        return HttpResponse.json([
          { id: 'child-1', slug: 'video-1', object_type: 'video', title: 'First' },
          { id: 'child-2', slug: 'reading-2', object_type: 'document', title: 'Second' },
        ]);
      }),
      http.get(`${endpoint}/learning_object_relations`, ({ request }) => {
        const params = new URL(request.url).searchParams;
        expect(params.get('relation_type')).toBe('eq.contains');
        if (params.has('parent_object_id')) {
          expect(params.get('parent_object_id')).toBe('eq.m1');
          return HttpResponse.json([
            { child_object_id: 'child-2', position: 1 },
            { child_object_id: 'child-1', position: 2 },
          ]);
        }
        expect(params.get('child_object_id')).toBe('eq.m1');
        return HttpResponse.json([]);
      }),
    );
    const result = await getModule('published-module');
    expect(result?.module.slug).toBe('published-module');
    expect(result?.items.map(item => item.id)).toEqual(['child-2', 'child-1']);
    expect(result?.units).toEqual([]);
  });

  it('does not request relations for a missing or unpublished module', async () => {
    let requestedRelations = false;
    server.use(
      http.get(`${endpoint}/learning_objects`, () => HttpResponse.json(null)),
      http.get(`${endpoint}/learning_object_relations`, () => {
        requestedRelations = true;
        return HttpResponse.json([]);
      }),
    );
    expect(await getModule('missing')).toBeNull();
    expect(requestedRelations).toBe(false);
  });

  it('preserves deep links for module and ordinary resource URLs', () => {
    expect(moduleResourcePath('module', 'a b')).toBe('/modules/a%20b');
    expect(moduleResourcePath('video', 'a b')).toBe('/resources/a%20b');
  });
});
