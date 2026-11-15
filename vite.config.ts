import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'node:path';
import { visualizer } from 'rollup-plugin-visualizer';
import { VitePWA } from 'vite-plugin-pwa';
import { z } from 'zod';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_SUPABASE_');
  z.object({
    VITE_SUPABASE_URL: z.url(),
    VITE_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  }).parse(env);
  return {
    envPrefix: ['VITE_SUPABASE_URL', 'VITE_SUPABASE_PUBLISHABLE_KEY'],
    server: { host: '::', port: 8080 },
    plugins: [
      react(),
      visualizer({ open: false, brotliSize: true, filename: 'dist/stats.html' }),
      VitePWA({
        registerType: 'autoUpdate',
        manifest: false,
        workbox: {
          navigateFallback: '/index.html',
          cleanupOutdatedCaches: true,
          globPatterns: ['**/*.{js,css,html,svg,woff2}'],
          globIgnores: [
            'stats.html',
            'courses/**/*.html',
            'resources/**/*.html',
            'modules/**/*.html',
            'sequences/**/*.html',
          ],
          // Auth and database responses must never be persisted in an HTTP cache.
          runtimeCaching: [],
        },
      }),
    ],
    resolve: { alias: { '@': path.resolve(__dirname, './src') } },
    build: { rollupOptions: { output: {
      manualChunks(id: string) {
        if (!id.includes('node_modules')) return;
        if (id.includes('@supabase/')) return 'supabase';
        if (id.includes('i18next')) return 'i18n';
      },
    } } },
  };
});
