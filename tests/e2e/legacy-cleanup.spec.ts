import { expect, test } from '@playwright/test';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const SOURCE_DIRS = ['components', 'contexts', 'data', 'hooks', 'services'];

function collectRuntimeFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    const stats = statSync(path);

    if (stats.isDirectory()) {
      if (['node_modules', 'dist', 'tests'].includes(entry)) {
        return [];
      }
      return collectRuntimeFiles(path);
    }

    if (entry === 'supabase.types.ts') {
      return [];
    }

    if (/\.(ts|tsx|js|jsx|toml)$/.test(entry)) {
      return [path];
    }

    return [];
  });
}

test('legacy manual routes are retired', async ({ page }) => {
  for (const route of ['/curator/submit', '/curator/submissions', '/curator/channel-curation', '/admin/conteudos']) {
    await page.goto(route);
    await expect(page.getByText('Página não encontrada')).toBeVisible();
  }
});

test('legacy catalog flags and mock sources are not referenced by runtime code', async () => {
  const runtimeFiles = [
    join(ROOT, 'App.tsx'),
    ...SOURCE_DIRS.flatMap((dir) => collectRuntimeFiles(join(ROOT, dir))),
  ];

  const forbidden = [
    'content_submissions',
    'video_submissions',
    'VITE_DATA_SOURCE',
    'VITE_CURATOR_MOCK',
    'VITE_VIDEO_ANALYSIS_PROVIDER',
    'tube.open2.tech',
    '../data/courses',
    '../data/degrees',
    '../data/playlists',
    'mockVideos',
    'mockAnalysis',
    'mockSuggestions',
    'falling back to mock',
  ];

  const combined = runtimeFiles
    .map((file) => `\n/* ${relative(ROOT, file)} */\n${readFileSync(file, 'utf8')}`)
    .join('\n');

  for (const token of forbidden) {
    expect(combined.includes(token), `${token} should not appear in runtime code`).toBe(false);
  }

  const legacyEdgeSlugs = [
    /(?<!v2_)fetch_youtube_channel/,
    /(?<!v2_)list_channel_videos/,
    /(?<!v2_)analyze_video_batch/,
    /(?<!v2_)generate_playlist_suggestions/,
    /(?<!v2_)publish_curated_videos/,
  ];

  for (const slug of legacyEdgeSlugs) {
    expect(slug.test(combined), `${slug} should not appear in runtime code`).toBe(false);
  }
});
