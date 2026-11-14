import { describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/shared/test/mswServer';
import { listBlueprints, listUnitOptions, submitPlaylist } from '@/entities/contribution/contribution.api';
import { getEnv } from '@/shared/config/env';

const endpoint = `${getEnv().VITE_SUPABASE_URL}/rest/v1`;

describe('FACODI contribution API', () => {
  it('offers active units of a course without relying on the unit published flag', async () => {
    server.use(http.get(`${endpoint}/curricular_units`, ({ request }) => {
      const url = new URL(request.url);
      expect(request.headers.get('Accept-Profile')).toBe('facodi');
      expect(url.searchParams.get('course_id')).toBe('eq.course-1');
      expect(url.searchParams.get('status')).toBe('eq.active');
      expect(url.searchParams.has('published')).toBe(false);
      return HttpResponse.json([{ id: 'u1', code: '101', title: 'Lógica' }]);
    }));
    expect(await listUnitOptions('course-1')).toEqual([{ id: 'u1', code: '101', title: 'Lógica' }]);
  });

  it('pages study paths with the same size the shared pagination uses', async () => {
    server.use(http.get(`${endpoint}/generated_structures`, ({ request }) => {
      const url = new URL(request.url);
      expect(url.searchParams.get('status')).toBe('eq.accepted');
      expect(url.searchParams.get('generated_by')).toBe('eq.facodi_deterministic_editorial_blueprint');
      expect(url.searchParams.get('offset')).toBe('12');
      expect(url.searchParams.get('limit')).toBe('12');
      return HttpResponse.json([], { headers: { 'Content-Range': '12-11/86' } });
    }));
    expect(await listBlueprints('accepted', 2)).toEqual({ items: [], total: 86 });
  });

  it('rejects malformed manual video IDs before calling the function', async () => {
    await expect(submitPlaylist({
      courseId: 'c', unitId: 'u', url: 'https://www.youtube.com/playlist?list=PL1234567890',
      title: '', description: '', language: 'pt', maxVideos: 50, manualIds: 'not-an-id',
    })).rejects.toThrow('invalid_youtube_video_ids');
  });
});
