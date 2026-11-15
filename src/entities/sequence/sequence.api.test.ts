import { describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/shared/test/mswServer';
import { getEnv } from '@/shared/config/env';
import { getSequence, listMyCompletedSequencesForVideo, listSequences, listSequencesForVideo, saveProgress } from '@/entities/sequence/sequence.api';
import { completionPercent, nextItem, type SequenceItem, type VideoProgress } from '@/entities/sequence/sequence';

const base = `${getEnv().VITE_SUPABASE_URL}/rest/v1`;
const progressRow = { video_id: 'v1', completed_at: '2026-11-14T10:00:00Z', last_position_seconds: 0, updated_at: '2026-11-14T10:00:00Z' };
const item = (videoId: string): SequenceItem => ({
  position: 1, videoId, slug: null, youtubeId: null, title: videoId, channel: null, language: null, youtubeUrl: null, thumbnail: null, metadataVerified: true,
});

describe('FACODI editorial sequences', () => {
  it('maps the sequences containing a video and the learner\'s completed ones', async () => {
    let progressQuery: URLSearchParams | null = null;
    server.use(
      http.post(`${base}/rpc/list_public_sequences_for_video_v1`, async ({ request }) => {
        expect(await request.json()).toEqual({ p_video_id: 'v1' });
        return HttpResponse.json([{ playlist_id: 'p1', playlist_slug: 'a', playlist_title: 'A', lesson_position: 3, item_count: 8 }]);
      }),
      http.get(`${base}/editorial_playlist_progress`, ({ request }) => {
        progressQuery = new URL(request.url).searchParams;
        return HttpResponse.json([{ playlist_id: 'p1' }]);
      }),
    );
    expect(await listSequencesForVideo('v1')).toEqual([{ id: 'p1', slug: 'a', title: 'A', position: 3, total: 8 }]);
    expect(await listMyCompletedSequencesForVideo('u1', 'v1')).toEqual(new Set(['p1']));
    expect(progressQuery!.get('user_id')).toBe('eq.u1');
    expect(progressQuery!.get('video_id')).toBe('eq.v1');
    expect(progressQuery!.get('completed_at')).toBe('not.is.null');
  });

  it('lists one row per sequence with a lightweight cover and the unit filter only when asked', async () => {
    const bodies: unknown[] = [];
    server.use(http.post(`${base}/rpc/list_public_editorial_sequences_v1`, async ({ request }) => {
      expect(request.headers.get('Content-Profile')).toBe('facodi');
      bodies.push(await request.json());
      return HttpResponse.json([
        { playlist_id: 'p1', playlist_slug: 'a', playlist_title: 'A', playlist_description: null, language: 'pt', item_count: 3, unit_codes: ['U1', 'U2'], cover_youtube_id: 'abcdefghijk' },
        { playlist_id: 'p2', playlist_slug: 'b', playlist_title: 'B', playlist_description: 'D', language: '', item_count: 0, unit_codes: null, cover_youtube_id: null },
      ]);
    }));
    expect(await listSequences(null)).toEqual([
      { id: 'p1', slug: 'a', title: 'A', description: '', language: 'pt', itemCount: 3, unitCodes: ['U1', 'U2'], cover: 'https://i.ytimg.com/vi/abcdefghijk/hqdefault.jpg' },
      { id: 'p2', slug: 'b', title: 'B', description: 'D', language: null, itemCount: 0, unitCodes: [], cover: null },
    ]);
    await listSequences('U1');
    expect(bodies).toEqual([{}, { p_unit_code: 'U1' }]);
  });

  it('drops malformed lessons and links only the video pages the catalogue exposes', async () => {
    server.use(
      http.post(`${base}/rpc/get_public_editorial_playlist_v2`, () => HttpResponse.json([{
        playlist_id: 'p1', playlist_slug: 'a', playlist_title: 'A', playlist_description: 'D', language: 'pt', item_count: 2, verified_metadata_count: 2,
        items: [{ position: 1, video_id: 'v1', title: 'One', youtube_id: 'abcdefghijk' }, { position: 2, video_id: 'v2', title: 'Two' }, { position: 3, title: 'No id' }],
        curricular_units: [{ unit_code: 'U1', unit_slug: 'u1', unit_title: 'Unit', course_code: 'C', course_slug: 'c' }, { unit_code: 'broken' }],
      }])),
      http.get(`${base}/learning_objects`, () => HttpResponse.json([{ id: 'v1', slug: 'one' }])),
    );
    const sequence = await getSequence('a');
    expect(sequence?.items.map(lesson => [lesson.videoId, lesson.slug])).toEqual([['v1', 'one'], ['v2', null]]);
    expect(sequence?.units).toHaveLength(1);
  });

  it('updates existing progress without rewriting the key columns', async () => {
    server.use(
      http.patch(`${base}/editorial_playlist_progress`, async ({ request }) => {
        const body = await request.json() as Record<string, unknown>;
        expect(Object.keys(body)).toEqual(['completed_at']);
        expect(new URL(request.url).searchParams.get('user_id')).toBe('eq.u1');
        return HttpResponse.json([progressRow]);
      }),
      http.post(`${base}/editorial_playlist_progress`, () => { throw new Error('should not insert'); }),
    );
    expect(await saveProgress('u1', 'p1', 'v1', { completed: true })).toMatchObject({ videoId: 'v1', completedAt: progressRow.completed_at });
  });

  it('inserts the owner row when no progress exists yet, clamping the position', async () => {
    server.use(
      http.patch(`${base}/editorial_playlist_progress`, () => HttpResponse.json([])),
      http.post(`${base}/editorial_playlist_progress`, async ({ request }) => {
        const [sent] = [await request.json()].flat() as Record<string, unknown>[];
        expect(sent).toEqual({ user_id: 'u1', playlist_id: 'p1', video_id: 'v1', last_position_seconds: 0 });
        return HttpResponse.json([{ ...progressRow, completed_at: null }], { status: 201 });
      }),
    );
    expect(await saveProgress('u1', 'p1', 'v1', { position: -5 })).toMatchObject({ completedAt: null });
  });

  it('resumes at the first unfinished lesson and only reports 100% when everything is done', () => {
    const items = [item('a'), item('b'), item('c')];
    const progress = new Map<string, VideoProgress>([['a', { videoId: 'a', completedAt: 'x', lastPosition: 0, updatedAt: 'x' }]]);
    expect(nextItem(items, progress)?.videoId).toBe('b');
    expect(nextItem(items, new Map(items.map(lesson => [lesson.videoId, { videoId: lesson.videoId, completedAt: 'x', lastPosition: 0, updatedAt: 'x' }])))?.videoId).toBe('a');
    expect(completionPercent(199, 200)).toBe(99);
    expect(completionPercent(2, 2)).toBe(100);
    expect(completionPercent(0, 0)).toBe(0);
  });
});
