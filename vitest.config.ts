import { defineConfig, configDefaults } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['src/shared/test/setup.ts'],
    // Tests never reach a real Supabase project; keep them independent of .env and CI secrets.
    env: {
      VITE_SUPABASE_URL: 'https://test-project.supabase.co',
      VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test',
    },
    exclude: [...configDefaults.exclude, 'e2e/**', 'supabase/functions/**/*.test.ts'],
  },
});
