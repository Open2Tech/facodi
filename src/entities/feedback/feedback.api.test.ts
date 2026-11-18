import { describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/shared/test/mswServer';
import { getEnv } from '@/shared/config/env';
import { getMyFeedback, saveMyFeedback } from './feedback.api';

const endpoint = `${getEnv().VITE_SUPABASE_URL}/rest/v1/resource_feedback`;

describe('resource feedback API', () => {
  it('reads the learner answer from facodi, or null when there is none', async () => {
    server.use(http.get(endpoint, ({ request }) => {
      expect(request.headers.get('Accept-Profile')).toBe('facodi');
      expect(new URL(request.url).searchParams.get('learning_object_id')).toBe('eq.lo1');
      return HttpResponse.json(null);
    }));
    expect(await getMyFeedback('lo1')).toBeNull();
  });

  it('upserts one answer per learner and resource without sending an owner', async () => {
    server.use(http.post(endpoint, async ({ request }) => {
      expect(new URL(request.url).searchParams.get('on_conflict')).toBe('owner_id,learning_object_id');
      expect(request.headers.get('Content-Profile')).toBe('facodi');
      expect(await request.json()).toEqual({ learning_object_id: 'lo1', helpful: false });
      return HttpResponse.json([{ helpful: false }], { status: 201 });
    }));
    expect(await saveMyFeedback('lo1', false)).toBe(false);
  });

  it('fails loudly when RLS saves nothing', async () => {
    server.use(http.post(endpoint, () => HttpResponse.json([], { status: 201 })));
    await expect(saveMyFeedback('lo1', true)).rejects.toThrow('feedback_not_saved');
  });
});
