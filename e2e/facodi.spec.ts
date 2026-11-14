import { expect, test, type Page } from '@playwright/test';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('i18nextLng', 'en'));
  await page.route('**/rest/v1/**', async route => {
    expect(route.request().headers()['accept-profile']).toBe('facodi');
    expect(route.request().url()).not.toContain('/rpc/');
    await route.fulfill({ json: [], headers: { 'content-range': '0-0/0', 'access-control-expose-headers': 'content-range' } });
  });
});

for (const width of [375, 768, 1280, 1440]) {
  test(`FACODI layout and navigation at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Knowledge is everywhere. Find your next step.' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'FACODI — home' })).toBeVisible();
    await expect(page.getByText('No courses to show yet.')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.screenshot({ path: `test-results/facodi-home-${width}.png`, fullPage: true });
    if (width < 1280) await page.getByRole('button', { name: 'Open menu' }).click();
    await expect(page.locator('header').getByRole('link', { name: 'Explore courses' })).toBeVisible();
    await page.locator('header').getByRole('link', { name: 'Explore courses' }).click();
    await expect(page).toHaveURL(/\/courses$/);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.screenshot({ path: `test-results/facodi-catalog-${width}.png`, fullPage: true });
  });
}

test('public search, language, pagination and query-state links', async ({ page }) => {
  await page.route('**/rest/v1/courses*', async route => {
    const url = new URL(route.request().url());
    const offset = Number(url.searchParams.get('offset') ?? '0');
    const filtered = url.searchParams.has('title') || url.searchParams.has('language');
    const total = filtered ? 1 : 13;
    const items = Array.from({ length: filtered || offset ? 1 : 12 }, (_, index) => ({
      id: `test-${offset + index}`, slug: `test-course-${offset + index}`, title: `Test course ${offset + index}`,
      language: 'en', summary: 'Test fixture only', published: true, status: 'active',
    }));
    await route.fulfill({ json: items, headers: { 'content-range': `${offset}-${offset + items.length - 1}/${total}`, 'access-control-expose-headers': 'content-range' } });
  });
  await page.goto('/courses');
  await expect(page.getByText('Page 1 of 2 · 13 results')).toBeVisible();
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Test course 12', exact: true })).toBeVisible();
  await expect(page).toHaveURL(/page=2/);
  await page.getByRole('searchbox').fill('Test course');
  await expect(page.getByText('Page 1 of 1 · 1 results')).toBeVisible();
  await expect(page).not.toHaveURL(/page=2/);
  await page.locator('main').getByRole('combobox').selectOption('en');
  await expect(page).toHaveURL(/language=en/);
});

test('private direct entry retains destination and obsolete social routes do not resolve', async ({ page }) => {
  await page.goto('/editor');
  await expect(page).toHaveURL(/\/login\?next=%2Feditor$/);
  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
  await page.goto('/auth');
  await expect(page).toHaveURL(/\/login$/);
  await page.goto('/facodi');
  await expect(page).toHaveURL(/\/courses$/);
  for (const route of ['/videos', '/playlists', '/messages', '/someone']) {
    await page.goto(route);
    await expect(page.getByRole('heading', { name: 'This path does not lead anywhere yet.' })).toBeVisible();
  }
});

test('empty campus has no critical accessibility or contrast violations', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('No courses to show yet.')).toBeVisible();
  await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
  const violations = await page.evaluate(async () => {
    const axe = (window as typeof window & { axe: typeof import('axe-core') }).axe;
    return (await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] } })).violations;
  });
  expect(violations.map(item => ({ id: item.id, impact: item.impact, nodes: item.nodes.map(node => node.target) }))).toEqual([]);
});

function authFixture(role?: string) {
  const now = Math.floor(Date.now() / 1000);
  const user = { id: '11111111-1111-4111-8111-111111111111', email: 'learner@example.test', aud: 'authenticated', role: 'authenticated', created_at: '2026-01-01T00:00:00Z', app_metadata: role ? { role } : {}, user_metadata: { full_name: 'Test Learner' }, identities: [] };
  const payload = { sub: user.id, aud: 'authenticated', role: 'authenticated', exp: now + 3600, iat: now, app_metadata: user.app_metadata };
  const token = `${Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')}.${Buffer.from(JSON.stringify(payload)).toString('base64url')}.test-signature`;
  return { access_token: token, refresh_token: 'test-refresh-token', token_type: 'bearer', expires_in: 3600, expires_at: now + 3600, user };
}

async function mockAuth(page: Page, role?: string) {
  const session = authFixture(role);
  await page.route('**/auth/v1/**', async route => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith('/signup')) return route.fulfill({ json: { user: session.user, session: null } });
    if (url.pathname.endsWith('/recover') || url.pathname.endsWith('/logout')) return route.fulfill({ json: {} });
    if (url.pathname.endsWith('/user')) return route.fulfill({ json: session.user });
    if (url.pathname.endsWith('/token')) return route.fulfill({ json: session });
    throw new Error(`Unexpected Auth request ${url.pathname}`);
  });
}

test('signup confirmation, safe return path, profile and logout', async ({ page }) => {
  await mockAuth(page);
  await page.goto('/login?next=//evil.test');
  await page.getByRole('button', { name: 'Create an account', exact: true }).click();
  await page.getByLabel('Name', { exact: true }).fill('Test Learner');
  await page.getByLabel('Email', { exact: true }).fill('learner@example.test');
  await page.getByLabel('Password', { exact: true }).fill('test-password-123');
  await page.getByRole('button', { name: 'Create account', exact: true }).click();
  await expect(page.getByText('Check your email.')).toBeVisible();
  await page.goto('/auth/callback?code=test-confirmation&next=//evil.test');
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole('heading', { name: 'Hello, Test Learner.' })).toBeVisible();
  await page.goto('/profile');
  await page.getByLabel('Name', { exact: true }).fill('New Name');
  await page.getByRole('button', { name: 'Save changes', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Changes saved.' })).toBeVisible();
  await page.goto('/admin');
  await expect(page.getByText('You do not have permission to access this area.')).toBeVisible();
  await page.locator('header').getByRole('button', { name: 'Sign out', exact: true }).click();
  await expect(page).toHaveURL(/\/login\?next=%2Fadmin$/);
});

test('password recovery exchanges PKCE code once and handles expired links', async ({ page }) => {
  await mockAuth(page);
  await page.goto('/auth/reset-password');
  await page.getByLabel('Email', { exact: true }).fill('learner@example.test');
  await page.getByRole('button', { name: 'Send recovery link' }).click();
  await expect(page.getByText('If an account exists for this email, you will receive recovery instructions.')).toBeVisible();
  const exchanges: string[] = [];
  page.on('request', request => { if (request.url().includes('/auth/v1/token')) exchanges.push(request.url()); });
  await page.goto('/auth/reset-password?code=test-recovery');
  await page.getByLabel('New password', { exact: true }).fill('new-password-123');
  await page.getByLabel('Confirm new password', { exact: true }).fill('new-password-123');
  await page.getByRole('button', { name: 'Change password', exact: true }).click();
  await expect(page.getByText('Your password has been changed.')).toBeVisible();
  expect(exchanges).toHaveLength(1);
  await expect(page).not.toHaveURL(/code=/);
  await page.goto('/auth/callback?error=access_denied&error_code=otp_expired');
  await expect(page.getByRole('heading', { name: 'Invalid or expired authentication link.' })).toBeVisible();
});

test('editor creates a manual draft, validates, edits, publishes and archives without deletion', async ({ page }) => {
  await mockAuth(page, 'editor');
  let content: Record<string, unknown> | null = null;
  const methods: string[] = [];
  await page.route('**/rest/v1/courses*', async route => {
    const request = route.request();
    const method = request.method();
    methods.push(method);
    if (method === 'POST') {
      content = { ...request.postDataJSON(), id: '22222222-2222-4222-8222-222222222222' };
      expect(content.status).toBe('draft');
      expect(content.published).toBe(false);
      expect(content.external_source).toBe('manual');
      return route.fulfill({ json: { id: content.id }, status: 201 });
    }
    if (method === 'PATCH') {
      content = { ...content, ...request.postDataJSON() };
      return route.fulfill({ json: { id: content.id } });
    }
    return route.fulfill({ json: content ? [content] : [], headers: { 'content-range': content ? '0-0/1' : '0-0/0', 'access-control-expose-headers': 'content-range' } });
  });
  await page.goto('/login?next=/editor');
  await page.getByLabel('Email', { exact: true }).fill('editor@example.test');
  await page.getByLabel('Password', { exact: true }).fill('test-password-123');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page).toHaveURL(/\/editor$/);
  await page.getByRole('button', { name: 'Create content', exact: true }).click();
  await page.getByRole('button', { name: 'Save changes', exact: true }).click();
  await expect(page.getByText('Complete this field.').first()).toBeVisible();
  expect(methods).not.toContain('POST');
  await page.getByLabel('Title', { exact: true }).fill('Test educational course');
  await page.getByLabel('URL identifier', { exact: true }).fill('test-educational-course');
  await page.getByRole('button', { name: 'Save changes', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Test educational course', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Edit', exact: true }).click();
  await page.getByLabel('Title', { exact: true }).fill('Edited test course');
  await page.getByRole('button', { name: 'Save changes', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Edited test course', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Publish', exact: true }).click();
  await page.getByRole('button', { name: 'Confirm', exact: true }).click();
  await expect(page.getByText('Active · published=true · pt')).toBeVisible();
  await page.getByRole('button', { name: 'Archive', exact: true }).click();
  await page.getByRole('button', { name: 'Confirm', exact: true }).click();
  await expect(page.getByText('Archived · published=false · pt')).toBeVisible();
  expect(methods).not.toContain('DELETE');
  await page.goto('/admin');
  await expect(page.getByText('You do not have permission to access this area.')).toBeVisible();
});

test('admin can view real-response-shaped counts without user management', async ({ page }) => {
  await mockAuth(page, 'admin');
  await page.route('**/rest/v1/**', async route => {
    expect(route.request().method()).toBe('HEAD');
    await route.fulfill({ body: '', headers: { 'content-range': '*/0', 'access-control-expose-headers': 'content-range' } });
  });
  await page.goto('/login?next=/admin');
  await page.getByLabel('Email', { exact: true }).fill('admin@example.test');
  await page.getByLabel('Password', { exact: true }).fill('test-password-123');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByRole('heading', { name: 'The catalogue, in perspective.' })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'Courses', exact: true })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'Curricular units', exact: true })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'Educational objects', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: /promote|delete user|manage user/i })).toHaveCount(0);
});

test('home search, entry paths and new public catalogues render without overflow', async ({ page }) => {
  const resource = { id: 'r1', slug: 'intro-logic', title: 'Introduction to logic', description: '<p>Test fixture only</p>', object_type: 'article', language: 'en', tags: ['Logic', 'Ethics'] };
  await page.route('**/rest/v1/learning_objects*', async route => {
    const head = route.request().method() === 'HEAD';
    await route.fulfill({ status: 200, json: head ? undefined : [resource], headers: { 'content-range': head ? '*/1' : '0-0/1', 'access-control-expose-headers': 'content-range' } });
  });
  await page.route('**/rest/v1/curricular_units*', async route => {
    const unit = { id: 'u1', slug: 'logic-1', title: 'Logic I', summary: 'Test fixture only', code: 'L1', ects: 6, year: 1, semester: 1, language: 'en', courses: { slug: 'test-course', title: 'Test course', published: true, status: 'active' } };
    await route.fulfill({ json: [unit], headers: { 'content-range': '0-0/1', 'access-control-expose-headers': 'content-range' } });
  });
  for (const width of [375, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await expect(page.getByRole('link', { name: /Logic/ })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.screenshot({ path: `test-results/facodi-home-filled-${width}.png`, fullPage: true });
    for (const [path, heading] of [['/units', 'Curricular units'], ['/resources', 'Educational resources'], ['/about', 'An open campus to follow the thread of knowledge.']]) {
      await page.goto(path);
      await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      await page.screenshot({ path: `test-results/facodi${path.replace('/', '-')}-${width}.png`, fullPage: true });
    }
  }
  await page.goto('/');
  await page.getByRole('searchbox', { name: 'What do you want to understand next?' }).fill('logic');
  await page.getByRole('button', { name: 'Search the catalogue' }).click();
  await expect(page).toHaveURL(/\/courses\?search=logic$/);
  await page.goto('/');
  await page.getByRole('link', { name: /Logic/ }).click();
  await expect(page).toHaveURL(/\/resources\?tag=Logic$/);
  await expect(page.getByRole('heading', { name: 'Introduction to logic' })).toBeVisible();
});
