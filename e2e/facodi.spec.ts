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
  const searches: string[] = [];
  await page.route('**/rest/v1/courses*', async route => {
    const url = new URL(route.request().url());
    const title = url.searchParams.get('title');
    if (title) searches.push(title);
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
  await page.getByRole('searchbox').pressSequentially('Test course');
  await expect(page.getByText('Page 1 of 1 · 1 results')).toBeVisible();
  await expect(page).toHaveURL(/search=Test\+course/);
  expect(searches).toEqual(['ilike.%Test course%']);
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

test('profile account centre: pending email change, translated errors, sessions and preferences', async ({ page }) => {
  await mockAuth(page);
  const session = authFixture();
  const calls: string[] = [];
  await page.route('**/auth/v1/{user,resend,logout}*', async route => {
    const request = route.request();
    const url = new URL(request.url());
    calls.push(`${request.method()} ${url.pathname.split('/').pop()}${url.search}`);
    if (url.pathname.endsWith('/logout')) return route.fulfill({ status: 204, body: '' });
    if (url.pathname.endsWith('/resend')) return route.fulfill({ json: {} });
    const body = request.method() === 'PUT' ? request.postDataJSON() as { email?: string; password?: string } : {};
    if (body.password) return route.fulfill({ status: 422, json: { code: 'same_password', error_code: 'same_password', msg: 'New password should be different from the old password.' } });
    return route.fulfill({ json: { ...session.user, ...(body.email ? { new_email: body.email } : {}) } });
  });
  await page.goto('/login?next=/profile');
  await page.getByLabel('Email', { exact: true }).fill('learner@example.test');
  await page.getByLabel('Password', { exact: true }).fill('test-password-123');
  await page.locator('main form').getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Profile', level: 1 })).toBeVisible();
  const save = page.getByRole('button', { name: 'Save changes', exact: true });
  await expect(save).toBeDisabled();
  await page.getByLabel('Email', { exact: true }).fill('new@example.test');
  await save.click();
  await expect(page.getByText('Name saved. To finish changing your email, open the confirmation links we sent.')).toBeVisible();
  await expect(page.getByText('The request to change to new@example.test is waiting for confirmation.', { exact: false })).toBeVisible();
  await expect(page.getByLabel('Email', { exact: true })).toHaveValue('learner@example.test');
  await page.getByRole('button', { name: 'Resend confirmation link' }).click();
  await expect(page.getByText('We sent a new confirmation link.')).toBeVisible();

  await page.getByLabel('New password', { exact: true }).fill('test-password-123');
  await page.getByLabel('Confirm new password', { exact: true }).fill('test-password-123');
  await page.getByRole('button', { name: 'Change password', exact: true }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'The new password must be different from the current one.' })).toBeVisible();

  await page.getByRole('button', { name: 'End other sessions' }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Confirm' }).click();
  await expect(page.getByText('The other sessions have ended.')).toBeVisible();
  expect(calls).toContain('POST logout?scope=others');
  expect(calls.some(call => call.startsWith('POST resend'))).toBe(true);

  await page.locator('#preferences').getByText('Português').click();
  await expect(page.getByRole('heading', { name: 'Perfil', level: 1 })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('i18nextLng'))).toBe('pt');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
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
  const listStatuses: (string | null)[] = [];
  await page.route('**/rest/v1/courses*', async route => {
    const request = route.request();
    const method = request.method();
    methods.push(method);
    if (method === 'GET') listStatuses.push(new URL(request.url()).searchParams.get('status'));
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
  await expect(page.getByRole('listitem').filter({ hasText: 'Edited test course' }).getByText('Active', { exact: true })).toBeVisible();
  await expect(page.getByText('published=true · pt')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Publish', exact: true })).toBeDisabled();
  await expect(page.getByRole('link', { name: 'View in catalogue: Edited test course' })).toHaveAttribute('href', '/courses/test-educational-course');
  await page.getByRole('button', { name: 'Archive', exact: true }).click();
  await page.getByRole('button', { name: 'Confirm', exact: true }).click();
  await expect(page.getByRole('listitem').filter({ hasText: 'Edited test course' }).getByText('Archived', { exact: true })).toBeVisible();
  await expect(page.getByText('published=false · pt')).toBeVisible();
  await page.getByRole('radio', { name: /^Archived/ }).click();
  await expect.poll(() => listStatuses.at(-1)).toBe('eq.archived');
  await expect(page).toHaveURL(/\/editor\?status=archived$/);
  await expect(page.getByRole('link', { name: /View in catalogue/ })).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole('radio', { name: /^Archived/ })).toBeChecked();
  expect(methods).not.toContain('DELETE');
  await page.goto('/admin');
  await expect(page.getByText('You do not have permission to access this area.')).toBeVisible();
});

test('admin can view real-response-shaped counts without user management', async ({ page }) => {
  await mockAuth(page, 'admin');
  await page.route('**/rest/v1/**', async route => {
    const request = route.request();
    if (request.method() === 'GET') return route.fulfill({ json: [], headers: { 'content-range': '*/0', 'access-control-expose-headers': 'content-range' } });
    expect(request.method()).toBe('HEAD');
    const drafts = new URL(request.url()).searchParams.get('status') === 'eq.draft';
    await route.fulfill({ body: '', headers: { 'content-range': `*/${drafts ? 2 : 0}`, 'access-control-expose-headers': 'content-range' } });
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
  await page.getByRole('link', { name: 'Educational objects · Draft: 2' }).click();
  await expect(page).toHaveURL(/\/editor\?kind=learning_objects&status=draft$/);
  await expect(page.getByRole('tab', { name: 'Educational objects' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('radio', { name: /^Draft/ })).toBeChecked();
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
  await expect(page).toHaveURL(/\/units\?search=logic$/);
  await page.goto('/');
  await page.getByRole('link', { name: /Logic/ }).click();
  await expect(page).toHaveURL(/\/resources\?tag=Logic$/);
  await expect(page.getByRole('heading', { name: 'Introduction to logic' })).toBeVisible();
});

test('unit catalogue facets drive the URL and open the unit page inside its course', async ({ page }) => {
  const course = { id: 'c1', slug: 'test-course', code: 'TST', title: 'Test course', institution: 'Test University', published: true, status: 'active' };
  const units = [
    { id: 'u1', slug: 'u-1', title: 'Logic I', code: '1001', ects: 6, year: 1, semester: 1, position: 1, language: 'en', courses: course },
    { id: 'u2', slug: 'u-2', title: 'Logic II', code: '1002', ects: 5, year: 1, semester: 1, position: 2, language: 'en', courses: course },
  ];
  const listRequests: URL[] = [];
  await page.route('**/rest/v1/courses*', route => route.fulfill({ json: course }));
  await page.route('**/rest/v1/curricular_units*', async route => {
    const url = new URL(route.request().url());
    const headers = { 'content-range': `0-1/${units.length}`, 'access-control-expose-headers': 'content-range' };
    if (url.searchParams.get('id')) return route.fulfill({ json: { ...units[0], summary: 'Test fixture only', description_html: null, learning_objects: null } });
    if (url.searchParams.get('course_id')) return route.fulfill({ json: units });
    if (url.searchParams.has('offset')) listRequests.push(url);
    await route.fulfill({ json: units, headers });
  });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/units');
  await page.getByRole('button', { name: /^TST/ }).click();
  await expect(page).toHaveURL(/course=test-course/);
  await page.getByRole('button', { name: /^Year 1/ }).click();
  await expect(page).toHaveURL(/year=1/);
  await expect.poll(() => listRequests.some(url => url.searchParams.get('courses.slug') === 'eq.test-course' && url.searchParams.get('year') === 'eq.1')).toBe(true);
  await page.getByRole('link', { name: 'Logic I', exact: true }).click();
  await expect(page).toHaveURL(/\/courses\/test-course\/units\/u-1$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Logic I' })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Breadcrumb' }).getByRole('link', { name: 'TST' })).toBeVisible();
  await expect(page.getByRole('link', { name: /Next unit/ })).toBeVisible();
});

test('video page loads YouTube only on demand and places the video in its unit trail', async ({ page }) => {
  const video = (id: string, slug: string, title: string, youtube: string, duration: number | null) => ({
    id, slug, title, object_type: 'video', language: 'pt', source_url: `https://www.youtube.com/watch?v=${youtube}`,
    metadata: { youtube_video_id: youtube, duration_seconds: duration, channel_name: 'Fixture Channel', review_scope: 'title_and_channel_only', full_video_reviewed: false, content_license_verified: false },
  });
  const sequence = [video('v1', 'limits', 'Limits', 'aaaaaaaaaaa', 600), video('v2', 'derivatives', 'Derivatives', 'bbbbbbbbbbb', 867), video('v3', 'integrals', 'Integrals', 'ccccccccccc', null)];
  const current = { ...sequence[1], description: '<p>Test fixture only</p>', objectives: ['Differentiate polynomials'], tags: ['Calculus'], keywords: [], status: 'active', published: true };
  const embeds: string[] = [];
  await page.route('https://i.ytimg.com/**', route => route.fulfill({ status: 404, body: '' }));
  await page.route('https://www.youtube-nocookie.com/**', route => { embeds.push(route.request().url()); return route.fulfill({ contentType: 'text/html', body: '<p>player</p>' }); });
  await page.route('**/rest/v1/learning_objects*', async route => {
    const url = new URL(route.request().url());
    if (url.searchParams.get('slug')) return route.fulfill({ json: url.searchParams.get('slug') === 'eq.derivatives' ? current : { ...current, ...sequence[2] } });
    if (url.searchParams.has('metadata->>channel_name')) return route.fulfill({ json: [video('v9', 'series', 'Series', 'ddddddddddd', 300)] });
    await route.fulfill({ json: [], headers: { 'content-range': '*/0', 'access-control-expose-headers': 'content-range' } });
  });
  await page.route('**/rest/v1/learning_object_relations*', async route => {
    const url = new URL(route.request().url());
    if (url.searchParams.get('child_object_id')) return route.fulfill({ json: [{ parent_object_id: 'unit-lo' }] });
    await route.fulfill({ json: sequence.map((child, index) => ({ position: index + 1, child })) });
  });
  await page.route('**/rest/v1/curricular_units*', route => route.fulfill({ json: [{
    id: 'u1', slug: 'calculus-1', title: 'Calculus I', code: '1001', ects: 6, year: 1, semester: 1, learning_object_id: 'unit-lo', courses: { slug: 'test-course', title: 'Test course', code: 'TST' },
  }] }));

  for (const width of [375, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/resources/derivatives');
    await expect(page.getByRole('heading', { level: 1, name: 'Derivatives' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Calculus I' }).first()).toBeVisible();
    await expect(page.getByText('Video 2 of 3')).toBeVisible();
    await expect(page.locator('[aria-current="true"]')).toContainText('Derivatives');
    await expect(page.getByRole('heading', { name: 'Curation status' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'More from Fixture Channel' })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.screenshot({ path: `test-results/facodi-video-${width}.png`, fullPage: true });
  }
  expect(embeds).toHaveLength(0);
  await page.getByRole('button', { name: 'Play video: Derivatives' }).click();
  await expect(page.locator('iframe[title="Derivatives"]')).toHaveAttribute('src', /^https:\/\/www\.youtube-nocookie\.com\/embed\/bbbbbbbbbbb\?autoplay=1&rel=0&enablejsapi=1&origin=http/);
  await expect.poll(() => embeds.length).toBe(1);
  await page.getByRole('link', { name: /Next video/ }).click();
  await expect(page).toHaveURL(/\/resources\/integrals$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Integrals' })).toBeVisible();
});

test('study notebook keeps private, timed notes beside the video and exports them', async ({ page }) => {
  const current = {
    id: 'v2', slug: 'derivatives', title: 'Derivatives', object_type: 'video', language: 'en', source_url: 'https://www.youtube.com/watch?v=bbbbbbbbbbb',
    metadata: { youtube_video_id: 'bbbbbbbbbbb', duration_seconds: 600, channel_name: 'Fixture Channel' },
    description: '<p>Test fixture only</p>', objectives: [], tags: [], keywords: [], status: 'active', published: true,
  };
  // Stand-in for the embed: reports a playback position and records the commands it receives.
  const embed = `<script>
    window.commands = [];
    const send = time => parent.postMessage(JSON.stringify({ event: 'infoDelivery', info: { currentTime: time } }), '*');
    addEventListener('message', event => {
      const data = JSON.parse(event.data);
      if (data.event === 'listening') send(200.4);
      if (data.event === 'command') window.commands.push([data.func, data.args]);
    });
  </script>`;
  await page.route('https://i.ytimg.com/**', route => route.fulfill({ status: 404, body: '' }));
  await page.route('https://www.youtube-nocookie.com/**', route => route.fulfill({ contentType: 'text/html', body: embed }));
  await page.route('**/rest/v1/learning_objects*', async route => {
    const url = new URL(route.request().url());
    if (url.searchParams.get('slug')) return route.fulfill({ json: current });
    await route.fulfill({ json: [], headers: { 'content-range': '*/0', 'access-control-expose-headers': 'content-range' } });
  });
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/resources/derivatives');
  await page.getByRole('button', { name: 'Study notebook' }).click();
  const drawer = page.getByRole('dialog', { name: 'Study notebook' });
  await expect(drawer.getByText('Start the video to tie each note to the moment you write it.')).toBeVisible();
  await expect(drawer.getByText('Without signing in, these notes are visible to anyone using this browser.')).toBeVisible();

  // The drawer is non-modal: the player stays usable and the drawer reflects its position.
  await page.getByRole('button', { name: 'Play video: Derivatives' }).click();
  await expect(drawer.getByText('Linked to the video at')).toBeVisible();
  await expect(drawer.getByText('03:20', { exact: true })).toBeVisible();

  await drawer.getByLabel('Title or concept').fill('Chain rule');
  await expect(drawer.getByRole('button', { name: 'Remove the 03:20 mark' })).toBeVisible();
  await drawer.getByLabel('Tags').fill('#Exam rules');
  await drawer.getByLabel('Note', { exact: true }).fill('Use the chain rule on f(g(x))');
  await drawer.getByLabel('Note', { exact: true }).selectText();
  await drawer.getByRole('button', { name: 'Inline code' }).click();
  await drawer.getByLabel('Note', { exact: true }).press('Control+Enter');
  await expect(drawer.getByRole('status').getByText('Note saved.')).toBeVisible();
  await expect(drawer.getByRole('heading', { name: 'Chain rule' })).toBeVisible();
  await expect(drawer.locator('code', { hasText: 'Use the chain rule on f(g(x))' })).toBeVisible();

  await drawer.getByLabel('Title or concept').fill('');
  await drawer.getByRole('button', { name: 'Save note' }).click();
  await expect(drawer.getByText('Complete this field.')).toBeVisible();
  await drawer.getByLabel('Title or concept').fill('General idea');
  await drawer.getByRole('button', { name: 'Remove the 03:20 mark' }).click();
  await drawer.getByRole('button', { name: 'Save note' }).click();
  await expect(drawer.getByText('2 notes')).toBeVisible();

  await drawer.getByRole('button', { name: /With a moment/ }).click();
  await expect(drawer.getByRole('heading', { name: 'General idea' })).toHaveCount(0);
  await drawer.getByRole('button', { name: /^All/ }).click();
  await drawer.getByRole('button', { name: '#exam' }).click();
  await expect(drawer.getByRole('heading', { name: 'General idea' })).toHaveCount(0);
  await drawer.getByRole('button', { name: 'Stop filtering by #exam' }).click();
  await expect(drawer.getByRole('heading', { name: 'General idea' })).toBeVisible();

  await drawer.getByRole('button', { name: 'Go to 03:20 in the video' }).click();
  const frame = page.frames().find(item => item.url().startsWith('https://www.youtube-nocookie.com/'))!;
  await expect.poll(() => frame.evaluate(() => (window as unknown as { commands: unknown[] }).commands)).toEqual([['seekTo', [200, true]], ['playVideo', []]]);
  await expect(page.getByRole('button', { name: 'Go to 03:20: Chain rule' })).toBeVisible();

  const download = page.waitForEvent('download');
  await drawer.getByRole('button', { name: 'Export Markdown (.md)' }).click();
  const file = await download;
  expect(file.suggestedFilename()).toBe('facodi-derivatives.md');
  const markdown = await (await import('node:fs/promises')).readFile(await file.path(), 'utf8');
  expect(markdown).toContain('## [03:20](http://');
  expect(markdown).toContain('/resources/derivatives?t=200) Chain rule');
  expect(markdown).toContain('#exam #rules');

  await drawer.getByRole('button', { name: 'Delete “General idea”' }).click();
  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(drawer.getByRole('heading', { name: 'General idea' })).toBeVisible();
  await drawer.getByRole('button', { name: 'Close' }).click();
  await expect(drawer).toBeHidden();
  await expect(page).not.toHaveURL(/notes=open/);

  // Notes persist in this browser and the URL can reopen the drawer.
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto('/resources/derivatives?notes=open');
  await expect(page.getByRole('dialog', { name: 'Study notebook' }).getByRole('heading', { name: 'Chain rule' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/facodi-notebook-375.png' });
});

test('editor reviews study paths and playlists through the review RPCs with state in the URL', async ({ page }) => {
  await mockAuth(page, 'editor');
  const blueprint = {
    id: 'b1', status: 'draft', structure_type: 'module', generated_by: 'facodi_deterministic_editorial_blueprint',
    created_at: '2026-11-14T10:00:00Z', updated_at: '2026-11-14T10:00:00Z', reviewed_at: null, reviewed_by: null, review_note: null,
    created_by: null, root_object_id: null, prompt: { editorial_kind: 'uc_study_path' },
    result: { unit_code: '19411006', unit_title: 'Object-Oriented Programming', course_code: 'LESTI', available_video_links: 2, available_reading_links: 1,
      steps: [{ order: 1, topic: 'Classes and objects', activity: 'Study the vocabulary' }] },
  };
  const playlist = {
    id: 'p1', title: 'OOP lectures', description: null, source_url: 'https://www.youtube.com/playlist?list=PL1234567890', status: 'pending',
    import_status: 'partial', language: 'en', submitted_at: '2026-11-14T10:00:00Z', review_note: null,
    courses: { code: 'LESTI', title: 'Systems Engineering' }, curricular_units: { code: '19411006', title: 'Object-Oriented Programming' },
  };
  const decisions: unknown[] = [];
  await page.route('**/rest/v1/**', async route => {
    const request = route.request();
    const url = new URL(request.url());
    expect(request.headers()['accept-profile'] ?? request.headers()['content-profile']).toBe('facodi');
    if (url.pathname.endsWith('/rpc/review_study_blueprint') || url.pathname.endsWith('/rpc/review_playlist')) {
      decisions.push({ fn: url.pathname.split('/').pop(), ...request.postDataJSON() });
      return route.fulfill({ status: 204, body: '' });
    }
    const headers = { 'access-control-expose-headers': 'content-range' };
    if (url.pathname.endsWith('/generated_structures')) {
      if (request.method() === 'HEAD') return route.fulfill({ body: '', headers: { ...headers, 'content-range': `*/${url.searchParams.get('status') === 'eq.draft' ? 1 : 0}` } });
      const draft = url.searchParams.get('status') === 'eq.draft';
      return route.fulfill({ json: draft ? [blueprint] : [], headers: { ...headers, 'content-range': draft ? '0-0/1' : '*/0' } });
    }
    if (url.pathname.endsWith('/playlists')) return route.fulfill({ json: [playlist] });
    if (url.pathname.endsWith('/playlist_items')) return route.fulfill({ json: [
      { id: 'i1', position: 0, youtube_video_id: 'dQw4w9WgXcQ', video_id: 'v1', review_status: 'pending' },
      { id: 'i2', position: 1, youtube_video_id: '9bZkp7q19f0', video_id: null, review_status: 'pending' },
    ] });
    return route.fulfill({ json: [], headers: { ...headers, 'content-range': '*/0' } });
  });
  await page.route('https://i.ytimg.com/**', route => route.fulfill({ status: 404, body: '' }));

  await page.goto('/login?next=/editor/study-paths');
  await page.getByLabel('Email', { exact: true }).fill('editor@example.test');
  await page.getByLabel('Password', { exact: true }).fill('test-password-123');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByRole('heading', { level: 2, name: 'Object-Oriented Programming' })).toBeVisible();
  await expect(page.getByText('2 videos · 1 readings available')).toBeVisible();
  await expect(page.getByRole('button', { name: /^Awaiting review/ })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Accept: Object-Oriented Programming' }).click();
  await page.getByLabel('Review notes').fill('Clear sequence');
  await page.getByRole('button', { name: 'Confirm' }).click();
  await expect(page.getByText('Review decision saved.')).toBeVisible();
  expect(decisions).toContainEqual({ fn: 'review_study_blueprint', p_id: 'b1', p_decision: 'accepted', p_note: 'Clear sequence' });
  await page.getByRole('button', { name: /^Accepted/ }).click();
  await expect(page).toHaveURL(/\/editor\/study-paths\?status=accepted$/);
  await expect(page.getByRole('heading', { name: 'No records' })).toBeVisible();

  await page.goto('/editor/playlists');
  await expect(page.getByRole('heading', { level: 2, name: 'OOP lectures' })).toBeVisible();
  await expect(page.getByText('Partial import')).toBeVisible();
  await expect(page.getByText('1 video(s) have not been resolved. Approval is blocked.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Approve and publish links' })).toBeDisabled();
  await page.getByRole('button', { name: /OOP lectures/ }).click();
  await expect(page).toHaveURL(/\/editor\/playlists\?playlist=p1$/);
  await page.getByRole('button', { name: 'Reject playlist' }).click();
  await page.getByRole('button', { name: 'Confirm' }).click();
  await expect(page.getByText('Playlist decision saved.')).toBeVisible();
  expect(decisions).toContainEqual({ fn: 'review_playlist', p_playlist_id: 'p1', p_decision: 'rejected', p_review_note: null });
});
