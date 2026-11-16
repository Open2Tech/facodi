import { expect, test, type Page } from '@playwright/test';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const module = { id: 'm1', slug: 'study-algebra', title: 'Algebra study module', description: 'Study notes and external references.', object_type: 'module', language: 'pt-PT', tags: ['Algebra'], metadata: {}, source_url: null };
const videos = Array.from({ length: 14 }, (_, index) => ({
  id: `v${index}`, slug: `lesson-${index}`, title: `Algebra lesson ${String(index + 1).padStart(2, '0')}`,
  description: '', object_type: 'video', language: 'pt-BR', tags: ['Algebra'], metadata: { channel_name: 'Test author' }, source_url: null,
}));
const course = { ...module, id: 'c1', slug: 'algebra-course', title: 'Algebra course', object_type: 'course' };
const rows = [module, ...videos, course];
const fold = (value: string) => value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

async function catalogue(page: Page) {
  const calls: { rpc: string; params: Record<string, string | number> }[] = [];
  await page.addInitScript(() => sessionStorage.setItem('i18nextLng', 'en'));
  await page.route('**/rest/v1/**', async route => {
    const request = route.request();
    const rpc = new URL(request.url()).pathname.split('/').at(-1)!;
    expect(request.headers()[request.method() === 'POST' ? 'content-profile' : 'accept-profile']).toBe('facodi');
    const params = request.method() === 'POST' ? request.postDataJSON() : {};
    calls.push({ rpc, params });
    if (rpc === 'search_public_resources_v4') {
      const scoped = rows.filter(row => (!params.p_search || fold(row.title).includes(fold(params.p_search)))
        && (!params.p_language || row.language.startsWith(params.p_language))
        && (!params.p_tag || row.tags.includes(params.p_tag))
        && (!params.p_area || params.p_area === 'mathematics'));
      const matching = scoped.filter(row => !params.p_object_type || row.object_type === params.p_object_type);
      const types = [...new Set(scoped.map(row => row.object_type))].map(value => ({ value, count: scoped.filter(row => row.object_type === value).length }));
      const offset = (params.p_page - 1) * 12;
      return route.fulfill({ json: { items: matching.slice(offset, offset + 12), total: matching.length, types } });
    }
    if (rpc === 'list_public_resource_topics_v1') return route.fulfill({ json: [
      { tag: 'Algebra', item_count: 16 }, { tag: 'Matemática', item_count: 2 }, { tag: 'Programming', item_count: 1 },
    ] });
    if (rpc === 'list_public_editorial_sequences_v1') return route.fulfill({ json: [
      { playlist_id: 's1', playlist_slug: 'algebra-sequence', playlist_title: 'Algebra lesson sequence', playlist_description: 'Ordered lessons by their original authors.', language: 'pt', item_count: 4, unit_codes: ['ALG1'], cover_youtube_id: null },
    ] });
    return route.fulfill({ json: [] });
  });
  return calls;
}

for (const width of [375, 1280]) {
  test(`resource explorer offers distinct study entry points and accessible themes at ${width}px`, async ({ page }) => {
    test.slow();
    const calls = await catalogue(page);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/resources');
    await expect(page.getByRole('heading', { name: 'What would you like to learn today?' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Algebra study module', level: 4 })).toBeVisible();
    await expect(page.getByRole('link', { name: /Algebra lesson sequence/ })).toHaveAttribute('href', '/sequences/algebra-sequence');
    await expect(page.getByRole('button', { name: 'More filters' })).toHaveAttribute('aria-expanded', 'false');
    expect(calls.some(call => call.rpc === 'list_public_resource_topics_v1')).toBe(false);
    await page.getByRole('link', { name: 'Skip to the full library' }).click();
    await expect(page.getByRole('heading', { name: 'Full library' })).toBeInViewport();

    for (const dark of [false, true]) {
      if (dark) {
        if (width < 1280) await page.getByRole('button', { name: 'Open menu' }).click();
        await page.getByRole('button', { name: 'Switch to dark theme' }).click();
        if (width < 1280) await page.getByRole('button', { name: 'Close menu' }).click();
        await page.reload();
        await expect(page.locator('html')).toHaveClass(/dark/);
        await expect(page.getByRole('heading', { name: 'Algebra study module', level: 4 })).toBeVisible();
      }
      await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      const violations = await page.evaluate(async () => {
        const axe = (window as typeof window & { axe: typeof import('axe-core') }).axe;
        return (await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] } })).violations;
      });
      expect(violations.map(item => ({ id: item.id, nodes: item.nodes.map(node => node.target) }))).toEqual([]);
    }
    await page.getByRole('navigation', { name: 'Browse by area' }).getByRole('link', { name: /Mathematics/ }).click();
    await expect(page).toHaveURL(/area=mathematics/);
    await expect(page.getByRole('heading', { name: 'Learn step by step' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Remove filter Area: Mathematics and statistics' })).toBeVisible();
  });
}

test('progressive filters preserve deep links, search topics without accents, and reset pagination', async ({ page }) => {
  test.slow();
  const calls = await catalogue(page);
  await page.goto('/resources?type=video&language=pt&page=2');
  await expect(page.getByRole('heading', { name: 'Algebra lesson 13' })).toBeVisible();
  await expect(page.getByRole('button', { name: /More filters/ })).toHaveAttribute('aria-expanded', 'false');
  await page.getByRole('button', { name: /More filters/ }).click();
  await expect(page.getByRole('main').getByRole('combobox', { name: 'Language', exact: true })).toHaveValue('pt');
  await page.getByRole('searchbox', { name: 'Search topics' }).fill('matematica');
  await expect(page.getByRole('button', { name: 'Matemática 2', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Programming 1', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Matemática 2', exact: true }).click();
  await expect(page).not.toHaveURL(/page=/);
  await expect(page.getByRole('heading', { name: 'No resources match these filters.' })).toBeVisible();
  await page.getByRole('button', { name: /More filters/ }).click();
  await expect(page.getByRole('button', { name: 'Remove filter Topic: Matemática' })).toBeVisible();
  await page.getByRole('button', { name: 'Remove filter Topic: Matemática' }).click();
  await expect(page.getByRole('heading', { name: 'Algebra lesson 01' })).toBeVisible();
  await page.getByRole('searchbox', { name: 'Search the library' }).pressSequentially('lesson 14', { delay: 10 });
  await expect(page.getByRole('searchbox', { name: 'Search the library' })).toHaveValue('lesson 14');
  await expect(page).toHaveURL(/search=lesson\+14/);
  await expect(page.getByRole('heading', { name: 'Algebra lesson 14' })).toBeVisible();
  expect(calls.filter(call => call.rpc === 'search_public_resources_v4').at(-1)?.params).toMatchObject({ p_search: 'lesson 14', p_language: 'pt', p_object_type: 'video', p_page: 1 });
  await page.getByRole('button', { name: 'Clear filters' }).click();
  await expect(page.getByRole('searchbox', { name: 'Search the library' })).toHaveValue('');
  await expect(page).toHaveURL('/resources');

  await page.goto('/resources?type=course');
  await expect(page.getByRole('button', { name: 'Course 1', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('searchbox', { name: 'Search the library' }).fill('nonexistent');
  await expect(page.getByRole('button', { name: 'Course 0', exact: true })).toHaveAttribute('aria-pressed', 'true');
});

test('optional discovery and topic failures remain visible and retryable without hiding the library', async ({ page }) => {
  await catalogue(page);
  await page.route('**/rest/v1/rpc/list_public_editorial_sequences_v1', route => route.fulfill({ status: 500, json: { message: 'Sequence service unavailable' } }));
  await page.goto('/resources');
  await expect(page.getByText('Sequence service unavailable')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole('heading', { name: 'Algebra lesson 01' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible();
  await page.route('**/rest/v1/rpc/list_public_editorial_sequences_v1', route => route.fulfill({ json: [] }));
  await page.getByRole('button', { name: 'Try again' }).click();
  await expect(page.getByText('No sequences with published lessons yet.')).toBeVisible();
  await page.route('**/rest/v1/rpc/list_public_resource_topics_v1', route => route.fulfill({ status: 500, json: { message: 'Topics service unavailable' } }));
  await page.getByRole('button', { name: 'More filters' }).click();
  await expect(page.getByText('Topics service unavailable')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole('heading', { name: 'Algebra lesson 01' })).toBeVisible();
});
