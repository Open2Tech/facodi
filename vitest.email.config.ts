import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['supabase/functions/facodi-email-notifications/*.test.ts'],
  },
});
