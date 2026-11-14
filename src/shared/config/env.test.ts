import { afterEach, expect, it, vi } from 'vitest';
import { getEnv } from '@/shared/config/env';

afterEach(() => vi.unstubAllEnvs());
it('requires the two declared variables without legacy alternatives', () => {
  vi.stubEnv('VITE_SUPABASE_URL', '');
  vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', '');
  vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'legacy-key');
  expect(() => getEnv()).toThrow();
  vi.stubEnv('VITE_SUPABASE_URL', 'https://project.example.test');
  vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_test');
  expect(getEnv()).toEqual({ VITE_SUPABASE_URL: 'https://project.example.test', VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test' });
});
