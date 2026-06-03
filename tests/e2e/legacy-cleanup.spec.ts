import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();

test('legacy manual routes are retired', async ({ page }) => {
  for (const route of ['/curator/submit', '/curator/submissions', '/curator/channel-curation', '/admin/conteudos']) {
    await page.goto(route);
    await expect(page.getByText('Página não encontrada')).toBeVisible();
  }
});

test('legacy catalog flags and mock sources are not referenced by runtime code', async () => {
  const runtimeFiles = [
    'App.tsx',
    'services/catalogSource.ts',
    'services/channelCurationSource.ts',
    'services/videoSource.ts',
    'components/Layout.tsx',
  ];

  const forbidden = [
    'VITE_DATA_SOURCE',
    'VITE_CURATOR_MOCK',
    'VITE_VIDEO_ANALYSIS_PROVIDER',
    '../data/courses',
    '../data/degrees',
    '../data/playlists',
    'mockVideos',
    'mockAnalysis',
    'mockSuggestions',
    'falling back to mock',
  ];

  const combined = runtimeFiles
    .map((file) => readFileSync(join(ROOT, file), 'utf8'))
    .join('\n');

  for (const token of forbidden) {
    expect(combined.includes(token), `${token} should not appear in runtime code`).toBe(false);
  }
});
