import { describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/shared/test/mswServer';
import { getEnv } from '@/shared/config/env';
import { fetchPublicMetadata } from '@/entities/suggestion/metadata';
import { recognizeUrl } from '@/entities/suggestion/recognition';
import { parseAnalysis, parseScreening, reviewSuggestion, submitSuggestion } from '@/entities/suggestion/suggestion.api';
import type { Json } from '@/integrations/supabase/types';

const endpoint = `${getEnv().VITE_SUPABASE_URL}/rest/v1`;
const input = {
  url: 'https://youtu.be/dQw4w9WgXcQ', title: 'Aula', author: '', license: '', thumbnailUrl: null,
  objectType: 'video' as const, language: '', tags: [], unitId: '', note: '',
};

describe('FACODI resource suggestions API', () => {
  it('sends the declarations and leaves screening to the database', async () => {
    let body: Record<string, unknown> = {};
    server.use(http.post(`${endpoint}/resource_suggestions`, async ({ request }) => {
      expect(request.headers.get('Content-Profile')).toBe('facodi');
      body = await request.json() as Record<string, unknown>;
      return HttpResponse.json({ id: 's1', status: 'pending' }, { status: 201 });
    }));
    await submitSuggestion(input);
    expect(body).toMatchObject({ canonical_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', license_declared: true, attribution_declared: true, curricular_unit_id: null });
    expect(body).not.toHaveProperty('status');
    expect(body).not.toHaveProperty('screening');
  });

  it.each([['23505', 'already_suggested'], ['54000', 'daily_limit']])('maps database error %s', async (code, key) => {
    server.use(http.post(`${endpoint}/resource_suggestions`, () => HttpResponse.json({ code, message: 'db' }, { status: 409 })));
    await expect(submitSuggestion(input)).rejects.toThrow(key);
  });

  it('reviews through the editorial RPC', async () => {
    server.use(http.post(`${endpoint}/rpc/review_resource_suggestion`, async ({ request }) => {
      expect(await request.json()).toEqual({ p_suggestion_id: 's1', p_decision: 'approved' });
      return HttpResponse.json('lo-1');
    }));
    expect(await reviewSuggestion('s1', 'approved', '  ')).toBe('lo-1');
  });

  it('sends the unit chosen by the editor', async () => {
    server.use(http.post(`${endpoint}/rpc/review_resource_suggestion`, async ({ request }) => {
      expect(await request.json()).toEqual({ p_suggestion_id: 's1', p_decision: 'approved', p_curricular_unit_id: 'u2' });
      return HttpResponse.json('lo-1');
    }));
    await reviewSuggestion('s1', 'approved', '', 'u2');
  });

  it('reads the advisory analysis defensively', () => {
    const job = (status: string, extra: Record<string, unknown> = {}) => [{ status, error_code: null, result_payload: {}, ...extra }];
    expect(parseAnalysis(undefined)).toBeNull();
    expect(parseAnalysis(job('cancelled'))).toBeNull();
    expect(parseAnalysis(job('retrying'))).toMatchObject({ state: 'pending' });
    expect(parseAnalysis(job('queued', { error_code: 'budget_exhausted' }))).toMatchObject({ state: 'waiting' });
    expect(parseAnalysis(job('failed'))).toMatchObject({ state: 'failed' });
    expect(parseAnalysis(job('succeeded', { result_payload: { matching: { topics: ['Cálculo', 3], matches: [
      { unit_id: 'u1', title: 'Análise Matemática II', slug: 'am2', course_slug: 'lei', course_code: 'LEI', code: '19', fit: 'strong', reason: 'Derivadas parciais.' },
      { unit_id: 'u2', title: 'Sem curso', slug: 'x', fit: 'strong', reason: 'Incompleto' },
    ] } } }))).toEqual({ state: 'done', topics: ['Cálculo'], published: null, reviewReason: null, matches: [{
      unitId: 'u1', title: 'Análise Matemática II', unitSlug: 'am2', courseSlug: 'lei', courseCode: 'LEI', code: '19', fit: 'strong', reason: 'Derivadas parciais.',
    }] });
  });

  it('reads the automatic decision', () => {
    const done = (decision: Json) => parseAnalysis([{ status: 'succeeded', error_code: null, result_payload: { matching: {}, decision } }]);
    expect(done({ outcome: 'published', object_slug: 'vetores-1a2b3c4d' })).toMatchObject({ published: { objectSlug: 'vetores-1a2b3c4d' }, reviewReason: null });
    expect(done({ outcome: 'review', reason: 'no_course' })).toMatchObject({ published: null, reviewReason: 'no_course' });
    expect(done({ outcome: 'published' })).toMatchObject({ published: null });
  });

  it('reads screening defensively', () => {
    expect(parseScreening({ provider_recognized: true, license: 'open', unit_selected: true, recommendation: 'fast_track', duplicate: null }))
      .toMatchObject({ providerRecognized: true, license: 'open', recommendation: 'fast_track', duplicate: null });
    expect(parseScreening({ license: 'odd', recommendation: 'auto_publish', duplicate: { slug: 1 } }))
      .toMatchObject({ license: 'unknown', recommendation: 'review', duplicate: null });
  });
});

describe('public metadata', () => {
  it('reads GitHub repositories without credentials and keeps only trusted avatars', async () => {
    server.use(http.get('https://api.github.com/repos/numpy/numpy', ({ request }) => {
      expect(request.credentials).toBe('omit');
      return HttpResponse.json({
        name: 'numpy', description: 'Arrays', topics: ['python'], license: { spdx_id: 'BSD-3-Clause' },
        owner: { login: 'numpy', avatar_url: 'https://avatars.githubusercontent.com/u/288276?v=4' },
      });
    }));
    expect(await fetchPublicMetadata(recognizeUrl('https://github.com/numpy/numpy')!)).toMatchObject({
      title: 'numpy', author: 'numpy', license: 'BSD-3-Clause', tags: ['python'], objectType: 'external_resource',
      thumbnail: 'https://avatars.githubusercontent.com/u/288276?v=4',
    });
  });

  it('uses YouTube oEmbed and the video thumbnail', async () => {
    server.use(http.get('https://www.youtube.com/oembed', () => HttpResponse.json({ title: 'Aula 1', author_name: 'Canal' })));
    expect(await fetchPublicMetadata(recognizeUrl('https://youtu.be/dQw4w9WgXcQ')!)).toMatchObject({
      title: 'Aula 1', author: 'Canal', objectType: 'video', thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
    });
  });

  it('returns null for sources without a public API', async () => {
    expect(await fetchPublicMetadata(recognizeUrl('https://example.org/notes')!)).toBeNull();
  });
});
