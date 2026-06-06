import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const localPreviewHosts = ['localhost', '127.0.0.1', '0.0.0.0'];

function hostFromUrl(value: string | undefined) {
  if (!value) {
    return undefined;
  }

  try {
    return new URL(value).hostname;
  } catch {
    return value.split('/')[0]?.split(':')[0];
  }
}

function getPreviewAllowedHosts() {
  const coolifyHosts = process.env.COOLIFY_FQDN
    ?.split(',')
    .map((host) => hostFromUrl(host.trim()))
    .filter(Boolean) ?? [];

  return Array.from(new Set([
    ...localPreviewHosts,
    ...coolifyHosts,
    hostFromUrl(process.env.COOLIFY_URL),
    hostFromUrl(process.env.VITE_SITE_URL),
    hostFromUrl(process.env.SITE_URL),
  ].filter((host): host is string => Boolean(host))));
}

export default defineConfig(() => {
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      preview: {
        allowedHosts: getPreviewAllowedHosts(),
      },
      plugins: [react()],
      build: {
        rollupOptions: {
          output: {
            manualChunks: {
              react: ['react', 'react-dom'],
              markdown: ['marked'],
            },
          },
        },
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
