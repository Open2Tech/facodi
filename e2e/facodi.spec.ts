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
  // Read-only side panels call these on every visit; tests that need rows route them themselves.
  for (const rpc of ['list_public_sequences_for_video_v1', 'get_public_course_creator_video_study_v1', 'get_my_course_study_modules_v1', 'list_public_editorial_sequences_v1', 'list_public_resource_topics_v1']) {
    await page.route(`**/rest/v1/rpc/${rpc}`, async route => {
      expect(route.request().headers()['content-profile']).toBe('facodi');
      await route.fulfill({ json: [] });
    });
  }
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
    await expect(page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Explore courses' })).toBeVisible();
    await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Explore courses' }).click();
    await expect(page).toHaveURL(/\/courses$/);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.screenshot({ path: `test-results/facodi-catalog-${width}.png`, fullPage: true });
  });
}

test('course catalogue searches without accents, filters by language, institution and type, and paginates', async ({ page }) => {
  const requests: URL[] = [];
  const rows = Array.from({ length: 13 }, (_, index) => ({
    id: `test-${index}`, slug: `test-course-${index}`, code: `T${index}`, title: index === 0 ? 'Gestão de Sistemas' : `Test course ${String(index).padStart(2, '0')}`,
    language: index === 0 ? 'pt-BR' : 'en', summary: 'Test fixture only', institution: index < 3 ? 'Universidade do Algarve' : 'Test University',
    school: null, degree_type: index === 0 ? 'Licenciatura' : 'CTeSP', ects_total: 180, published: true, status: 'active',
    curricular_units: [{ count: index === 0 ? 43 : 1 }],
  }));
  await page.route('**/rest/v1/courses*', async route => {
    requests.push(new URL(route.request().url()));
    await route.fulfill({ json: rows });
  });
  await page.goto('/courses');
  await expect(page.getByText('Page 1 of 2 · 13 results')).toBeVisible();
  await expect(page.getByText('43 units')).toBeVisible();
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(page).toHaveURL(/page=2/);
  await expect(page.getByRole('heading', { name: 'Test course 12', exact: true })).toBeVisible();

  await page.getByRole('searchbox', { name: 'Search courses' }).pressSequentially('gestao');
  await expect(page).toHaveURL(/\/courses\?search=gestao$/);
  await expect(page.getByRole('heading', { name: 'Gestão de Sistemas', exact: true })).toBeVisible();
  await expect(page.getByText('1 result', { exact: true })).toBeVisible();
  await page.locator('main').getByRole('combobox').selectOption('pt');
  await expect(page).toHaveURL(/search=gestao&language=pt$/);
  await expect(page.getByRole('heading', { name: 'Gestão de Sistemas', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Clear filters' }).click();
  await expect(page).toHaveURL('/courses');

  await page.getByRole('button', { name: /^Universidade do Algarve/ }).click();
  await expect(page).toHaveURL(/institution=Universidade\+do\+Algarve/);
  await expect(page.getByRole('button', { name: /^Licenciatura/ })).toContainText('1');
  await page.getByRole('button', { name: /^Licenciatura/ }).click();
  await expect(page.getByRole('heading', { name: 'Gestão de Sistemas', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: /Test course/ })).toHaveCount(0);
  await page.getByRole('button', { name: 'Remove filter Institution: Universidade do Algarve' }).click();
  await expect(page).toHaveURL(/\/courses\?degree=Licenciatura$/);

  await page.getByRole('searchbox', { name: 'Search courses' }).fill('nothing here');
  await expect(page.getByRole('heading', { name: 'No courses match these filters.' })).toBeVisible();
  // Filtering, paging and facets reuse the one public load instead of querying per keystroke.
  expect(requests).toHaveLength(1);
  expect(requests[0].searchParams.get('curricular_units.status')).toBe('eq.active');
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

const LEGAL_PAGES = [
  ['/privacy', 'Privacy', 'Privacy Policy'],
  ['/terms', 'Terms of use', 'Terms of Use'],
  ['/cookies', 'Cookies and storage', 'Cookies and storage'],
  ['/copyright', 'Copyright', 'Copyright and content'],
  ['/accessibility', 'Accessibility', 'Accessibility'],
  ['/legal', 'Legal notice', 'Legal notice'],
] as const;

test('legal pages are reachable from the footer and carry their own metadata', async ({ page }) => {
  await page.goto('/');
  const footerLegal = page.getByRole('contentinfo').getByRole('navigation', { name: 'Legal information' });
  for (const [path, label, title] of LEGAL_PAGES) {
    await footerLegal.getByRole('link', { name: label, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`${path}$`));
    await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible();
    await expect(page).toHaveTitle(new RegExp(title));
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', new RegExp(`${path}$`));
  }
});

test('legal pages deep-link to sections and stay usable on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto('/privacy#deletion');
  await expect(page.getByRole('heading', { name: 'Deleting your account' })).toBeInViewport();
  await page.locator('summary', { hasText: 'On this page' }).click();
  await page.locator('details').getByRole('link', { name: /Your rights/ }).click();
  await expect(page.getByRole('heading', { name: 'Your rights' })).toBeInViewport();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.goto('/legal');
  const identity = page.getByRole('region', { name: 'Identification', exact: true });
  await expect(identity.getByText('Personal educational project', { exact: true })).toBeVisible();
  await expect(identity.getByText('UAlg tax identification', { exact: true })).toBeVisible();
  await expect(identity.getByText('UAlg institutional address', { exact: true })).toBeVisible();
  await expect(identity.getByText('UAlg legal status and registration', { exact: true })).toBeVisible();
});

test('language and theme persist across visits only after opting in, and withdrawing deletes them', async ({ page }) => {
  const persisted = () => page.evaluate(() => Object.fromEntries(Object.entries(localStorage)));
  await page.goto('/cookies#manage');
  // The language seeded in localStorage by beforeEach predates the opt-in, so it moves to the session.
  expect(await persisted()).toEqual({});
  await page.getByRole('button', { name: 'Switch to dark theme' }).click();
  await expect(page.locator('html')).toHaveClass(/dark/);
  expect(await persisted()).toEqual({});
  expect(await page.evaluate(() => sessionStorage.getItem('facodi-theme'))).toBe('dark');

  const remember = page.getByRole('checkbox', { name: 'Remember language and theme in this browser' });
  await remember.check();
  expect(await persisted()).toEqual({ 'facodi-remember-preferences': 'true', 'facodi-theme': 'dark', i18nextLng: 'en' });
  await page.evaluate(() => sessionStorage.clear());
  await page.reload();
  await expect(page.locator('html')).toHaveClass(/dark/);
  await expect(remember).toBeChecked();

  await remember.uncheck();
  expect(await persisted()).toEqual({});
  await expect(page.locator('html')).toHaveClass(/dark/);
  await expect(page.getByText('Off: the language and theme you choose last until you close the tab.')).toBeVisible();
});

for (const [path] of LEGAL_PAGES.filter(([path]) => ['/privacy', '/cookies', '/legal'].includes(path))) {
  test(`legal page ${path} has no critical accessibility or contrast violations`, async ({ page }) => {
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
    const violations = await page.evaluate(async () => {
      const axe = (window as typeof window & { axe: typeof import('axe-core') }).axe;
      return (await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] } })).violations;
    });
    expect(violations.map(item => ({ id: item.id, impact: item.impact, nodes: item.nodes.map(node => node.target) }))).toEqual([]);
  });
}

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

// Regression: the signed-in header used to wrap even at 1920px because the
// account links expanded inside a fixed-width container.
for (const language of ['pt', 'en', 'es', 'fr']) {
  for (const width of [1280, 1536, 1920]) {
    test(`header stays on one row for an admin in ${language} at ${width}px`, async ({ page }) => {
      const session = authFixture('admin');
      await mockAuth(page, 'admin');
      await page.addInitScript(({ session, language }) => {
        localStorage.setItem('sb-wvkjainfwsyiyfcmbtid-auth-token', JSON.stringify(session));
        sessionStorage.setItem('i18nextLng', language);
      }, { session, language });
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/about');
      const header = page.getByRole('banner');
      await expect(header.getByRole('button', { name: /^(Account|Conta|Cuenta|Compte)$/ })).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      const bounds = await header.evaluate(element => {
        const brand = element.querySelector('a')!.getBoundingClientRect();
        const nav = element.querySelector('nav')!.getBoundingClientRect();
        const actions = element.querySelector('nav')!.nextElementSibling!.getBoundingClientRect();
        return { height: element.getBoundingClientRect().height, brandRight: brand.right, navLeft: nav.left, navRight: nav.right, actionsLeft: actions.left, actionsRight: actions.right };
      });
      expect(bounds.height).toBe(85);
      expect(bounds.brandRight).toBeLessThan(bounds.navLeft);
      expect(bounds.navRight).toBeLessThan(bounds.actionsLeft);
      expect(bounds.actionsRight).toBeLessThanOrEqual(width);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      if (language === 'pt' && width === 1920) await page.screenshot({ path: 'test-results/header-desktop.png' });
    });
  }
}

for (const role of [undefined, 'user', 'editor', 'admin']) {
  test(`account menu preserves permissions for ${role ?? 'visitor'}`, async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    if (role) {
      await mockAuth(page, role);
      await page.addInitScript(session => localStorage.setItem('sb-wvkjainfwsyiyfcmbtid-auth-token', JSON.stringify(session)), authFixture(role));
    }
    await page.goto('/about');
    const header = page.getByRole('banner');
    if (!role) {
      await expect(header.getByRole('link', { name: 'Sign in' })).toBeVisible();
      await expect(header.getByRole('button', { name: 'Account' })).toHaveCount(0);
      return;
    }
    await header.getByRole('button', { name: 'Account' }).click();
    for (const name of ['My space', 'Notebook', 'Profile', 'Suggest a resource', 'Contribute', 'Sign out']) {
      await expect(page.getByRole('menuitem', { name, exact: true })).toBeVisible();
    }
    await expect(page.getByRole('menuitem', { name: 'Editorial workspace' })).toHaveCount(role === 'editor' || role === 'admin' ? 1 : 0);
    await expect(page.getByRole('menuitem', { name: 'Administration' })).toHaveCount(role === 'admin' ? 1 : 0);
    await page.keyboard.press('Escape');
    await expect(header.getByRole('button', { name: 'Account' })).toBeFocused();
  });
}

for (const [width, height] of [[320, 568], [375, 667], [768, 500]]) {
  test(`mobile menu scrolls, traps focus and closes after navigation at ${width}px`, async ({ page }) => {
    await mockAuth(page, 'admin');
    await page.addInitScript(session => localStorage.setItem('sb-wvkjainfwsyiyfcmbtid-auth-token', JSON.stringify(session)), authFixture('admin'));
    await page.setViewportSize({ width, height });
    await page.goto('/about');
    const trigger = page.getByRole('button', { name: 'Open menu' });
    await trigger.click();
    const sheet = page.getByRole('dialog', { name: 'Main navigation' });
    await expect(sheet).toBeVisible();
    const language = sheet.getByRole('combobox', { name: 'Language' });
    await language.scrollIntoViewIfNeeded();
    await expect(language).toBeInViewport();
    await sheet.getByRole('button', { name: 'Switch to dark theme' }).click();
    await expect(page.locator('html')).toHaveClass(/dark/);
    await page.keyboard.press('Tab');
    expect(await sheet.evaluate(element => element.contains(document.activeElement))).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    if (width === 375) {
      await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
      const violations = await page.evaluate(async () => (await (window as typeof window & { axe: typeof import('axe-core') }).axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] } })).violations);
      expect(violations.map(item => item.id)).toEqual([]);
      await sheet.getByRole('navigation', { name: 'Main navigation' }).scrollIntoViewIfNeeded();
      await page.screenshot({ path: 'test-results/header-mobile-menu.png' });
    }
    await page.keyboard.press('Escape');
    await expect(sheet).toBeHidden();
    await expect(trigger).toBeFocused();
    await trigger.click();
    // Selecting the current route also dismisses the sheet.
    await sheet.getByRole('link', { name: 'About', exact: true }).click();
    await expect(sheet).toBeHidden();
    await trigger.click();
    await sheet.getByRole('searchbox').fill('partial derivatives');
    await sheet.getByRole('searchbox').press('Enter');
    await expect(page).toHaveURL('/resources?search=partial%20derivatives');
    await expect(sheet).toBeHidden();
  });
}

test('header search restores focus and mobile navigation releases the page after resizing', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('/about');
  const header = page.getByRole('banner');
  const search = header.getByRole('button', { name: 'Search the library' });
  await search.click();
  await expect(header.getByRole('searchbox')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(search).toBeFocused();
  await page.getByRole('button', { name: 'Open menu' }).click();
  await page.setViewportSize({ width: 1280, height: 900 });
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(header.getByRole('navigation', { name: 'Main navigation' })).toBeVisible();
  await expect(page.locator('body')).not.toHaveAttribute('data-scroll-locked');
});

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
  await page.locator('header').getByRole('button', { name: 'Account', exact: true }).click();
  await page.getByRole('menuitem', { name: 'Sign out', exact: true }).click();
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
  expect(await page.evaluate(() => [sessionStorage.getItem('i18nextLng'), localStorage.getItem('i18nextLng')])).toEqual(['pt', null]);
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
  // Several full-page loads at two widths: give the walk-through room on busy CI runners.
  test.slow();
  const resource = { id: 'r1', slug: 'intro-logic', title: 'Introduction to logic', description: '<p>Test fixture only</p>', object_type: 'article', language: 'en', tags: ['Logic', 'Ethics'] };
  await page.route('**/rest/v1/rpc/list_public_resource_topics_v1', route =>
    route.fulfill({ json: resource.tags.map(tag => ({ tag, item_count: 1 })) }));
  await page.route('**/rest/v1/learning_objects*', async route => {
    const head = route.request().method() === 'HEAD';
    await route.fulfill({ status: 200, json: head ? undefined : [resource], headers: { 'content-range': head ? '*/1' : '0-0/1', 'access-control-expose-headers': 'content-range' } });
  });
  await page.route('**/rest/v1/rpc/search_public_resources_v4', route => {
    const moduleOnly = route.request().postDataJSON().p_object_type === 'module';
    return route.fulfill({ json: { total: moduleOnly ? 0 : 1, items: moduleOnly ? [] : [resource], types: [{ value: 'article', count: 1 }] } });
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
    for (const [path, heading] of [['/units', 'Curricular units'], ['/resources', 'What would you like to learn today?'], ['/about', 'One open tab became a bigger idea.']]) {
      await page.goto(path);
      await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      await page.screenshot({ path: `test-results/facodi${path.replace('/', '-')}-${width}.png`, fullPage: true });
    }
  }
  await page.goto('/');
  await page.getByRole('searchbox', { name: 'What do you want to understand next?' }).fill('logic');
  await page.getByRole('button', { name: 'Search the catalogue' }).click();
  await expect(page).toHaveURL('/resources?search=logic');
  await page.goto('/');
  await page.getByRole('link', { name: /Logic/ }).click();
  await expect(page).toHaveURL(/\/resources\?tag=Logic$/);
  await expect(page.getByRole('heading', { name: 'Introduction to logic' })).toBeVisible();
  await page.goto('/');
  const invitation = page.getByRole('region', { name: 'Know a resource worth sharing?' });
  await invitation.getByRole('link', { name: 'Suggest a resource' }).click();
  await expect(page).toHaveURL('/login?next=%2Fsuggest');
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
  const sequenceUnits: unknown[] = [];
  await page.route('**/rest/v1/rpc/list_public_editorial_sequences_v1', route => {
    expect(route.request().headers()['content-profile']).toBe('facodi');
    sequenceUnits.push(route.request().postDataJSON());
    return route.fulfill({ json: [{ playlist_id: 'p1', playlist_slug: 'logic-path', playlist_title: 'Logic in practice', playlist_description: null,
      language: 'en', item_count: 3, unit_codes: ['1001'], cover_youtube_id: null }] });
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
  await expect(page.getByRole('button', { name: 'Share' })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Breadcrumb' }).getByRole('link', { name: 'TST' })).toBeVisible();
  await expect(page.getByRole('link', { name: /Next unit/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /Logic in practice/ })).toHaveAttribute('href', '/sequences/logic-path');
  expect(sequenceUnits).toEqual([{ p_unit_code: '1001' }]);
  await page.getByRole('navigation', { name: 'Breadcrumb' }).getByRole('link', { name: 'TST' }).click();
  await expect(page).toHaveURL(/\/courses\/test-course$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Test course' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Share' })).toBeVisible();
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
  const sequenceLookups: unknown[] = [];
  await page.route('**/rest/v1/rpc/list_public_sequences_for_video_v1', route => {
    sequenceLookups.push(route.request().postDataJSON());
    if (sequenceLookups.length <= 2) return route.fulfill({ status: 500, json: { message: 'temporarily unavailable' } });
    return route.fulfill({ json: [{ playlist_id: 'p1', playlist_slug: 'calculus-path', playlist_title: 'Calculus step by step', lesson_position: 4, item_count: 9 }] });
  });

  for (const width of [375, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/resources/derivatives');
    await expect(page.getByRole('heading', { level: 1, name: 'Derivatives' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Share' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Calculus I' }).first()).toBeVisible();
    await expect(page.getByText('Video 2 of 3')).toBeVisible();
    await expect(page.locator('[aria-current="true"]')).toContainText('Derivatives');
    await expect(page.getByRole('heading', { name: 'Curation status' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'More from Fixture Channel' })).toBeVisible();
    if (width === 375) {
      await expect(page.getByRole('alert')).toContainText('Could not load the study sequences for this video.');
      await page.getByRole('button', { name: 'Try again' }).click();
    }
    const inSequences = page.getByRole('region', { name: 'In study sequences' });
    await expect(inSequences.getByRole('link', { name: /Calculus step by step/ })).toHaveAttribute('href', '/sequences/calculus-path?v=v2');
    await expect(inSequences).toContainText('Lesson 4 of 9');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.screenshot({ path: `test-results/facodi-video-${width}.png`, fullPage: true });
  }
  expect(embeds).toHaveLength(0);
  expect(sequenceLookups.length).toBeGreaterThanOrEqual(3);
  expect(sequenceLookups[2]).toEqual({ p_video_id: 'v2' });
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
    metadata: { youtube_video_id: 'bbbbbbbbbbb', duration_seconds: 600, channel_name: 'Fixture Channel', facodi_review_scope: 'canonical_watch_url_and_og_presence_not_content' },
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
  await drawer.getByLabel('Tags', { exact: true }).fill('#Exam rules');
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

test('signed-in notebook syncs to the account, moves browser notes and rolls back failed saves', async ({ page }) => {
  await mockAuth(page);
  const userId = authFixture().user.id;
  const resource = { id: 'v2', slug: 'derivatives', title: 'Derivatives' };
  const stored = (id: string, title: string) => ({
    id, resourceId: 'v2', resourceSlug: 'derivatives', resourceTitle: 'Derivatives', title, body: '', tags: [], timestamp: 30,
    pinned: false, createdAt: '2026-11-01T10:00:00.000Z', updatedAt: '2026-11-01T10:00:00.000Z',
  });
  await page.addInitScript(({ userId, account, guest }) => {
    if (sessionStorage.getItem('seeded')) return;
    sessionStorage.setItem('seeded', '1');
    localStorage.setItem(`facodi-notes:v1:${userId}`, JSON.stringify([account]));
    localStorage.setItem('facodi-notes:v1:guest', JSON.stringify([guest]));
  }, { userId, account: stored('aaaaaaaa-0000-4000-8000-000000000001', 'Device note'), guest: stored('aaaaaaaa-0000-4000-8000-000000000002', 'Visitor note') });

  type Row = Record<string, unknown> & { id: string };
  let rows: Row[] = [];
  let failNextSave = false;
  await page.route('**/rest/v1/study_notes*', async route => {
    const request = route.request();
    const embed = (row: Row) => ({ ...row, learning_object: { slug: resource.slug, title: resource.title } });
    if (request.method() === 'GET') return route.fulfill({ json: rows.map(embed) });
    if (request.method() === 'POST') {
      if (failNextSave) {
        failNextSave = false;
        return route.fulfill({ status: 403, json: { code: '42501', message: 'permission denied' } });
      }
      const sent = request.postDataJSON() as Row[];
      expect(sent.every(row => !('owner_id' in row))).toBe(true);
      rows = [...rows.filter(row => !sent.some(item => item.id === row.id)), ...sent];
      return route.fulfill({ json: sent.map(embed) });
    }
    throw new Error(`Unexpected ${request.method()} on study_notes`);
  });
  await page.route('**/rest/v1/learning_objects*', async route => {
    const url = new URL(route.request().url());
    if (url.searchParams.get('slug')) return route.fulfill({ json: { ...resource, object_type: 'article', language: 'en', source_url: null, metadata: {}, description: null, objectives: [], tags: [], keywords: [], status: 'active', published: true } });
    await route.fulfill({ json: [], headers: { 'content-range': '*/0', 'access-control-expose-headers': 'content-range' } });
  });

  await page.goto('/login?next=/dashboard');
  await page.getByLabel('Email', { exact: true }).fill('learner@example.test');
  await page.getByLabel('Password', { exact: true }).fill('test-password-123');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  const notebook = page.getByRole('region', { name: 'Your notebook' });
  // Notes this account kept in the browser before sync move to the account on their own.
  await expect(notebook.getByText('Latest: Device note')).toBeVisible();
  await expect.poll(() => page.evaluate(id => localStorage.getItem(`facodi-notes:v1:${id}`), userId)).toBeNull();
  await expect(notebook.getByText('Synced with your FACODI account. Only you can see them, on any device.')).toBeVisible();

  // Visitor notes may belong to someone else on a shared computer, so moving them is a choice.
  await expect(notebook.getByText('There is 1 visitor note in this browser.')).toBeVisible();
  await notebook.getByRole('button', { name: 'Move to my account' }).click();
  await expect(page.getByText('1 note moved to your account.')).toBeVisible();
  await expect(notebook.getByText('There is 1 visitor note in this browser.')).toBeHidden();
  expect(rows.map(row => row.title).sort()).toEqual(['Device note', 'Visitor note']);

  await page.goto('/resources/derivatives?notes=open');
  const drawer = page.getByRole('dialog', { name: 'Study notebook' });
  await expect(drawer.getByText('2 notes')).toBeVisible();
  failNextSave = true;
  await drawer.getByLabel('Title or concept').fill('Lost idea');
  await drawer.getByRole('button', { name: 'Save note' }).click();
  await expect(page.getByText('The change could not be saved. Check your connection and try again.')).toBeVisible();
  await expect(drawer.getByRole('heading', { name: 'Lost idea' })).toHaveCount(0);
  await expect(drawer.getByLabel('Title or concept')).toHaveValue('Lost idea');
  await drawer.getByRole('button', { name: 'Save note' }).click();
  await expect(drawer.getByRole('heading', { name: 'Lost idea' })).toBeVisible();
  expect(rows).toHaveLength(3);
});

test('notebook page searches every note across resources with filters kept in the URL', async ({ page }) => {
  const stored = (id: string, resource: [string, string, string, string?], patch: Record<string, unknown>) => ({
    id, resourceId: resource[0], resourceSlug: resource[1], resourceTitle: resource[2], ...(resource[3] ? { resourceType: resource[3] } : {}),
    title: 'Note', body: '', tags: [], timestamp: null, pinned: false, createdAt: '2026-11-01T10:00:00.000Z', updatedAt: '2026-11-01T10:00:00.000Z', ...patch,
  });
  const regression: [string, string, string, string] = ['v1', 'linear-regression', 'Regressão linear', 'video'];
  const pipelines: [string, string, string] = ['d1', 'pipelines', 'Pipelines'];
  await page.addInitScript(notes => {
    if (sessionStorage.getItem('seeded')) return;
    sessionStorage.setItem('seeded', '1');
    localStorage.setItem('facodi-notes:v1:guest', JSON.stringify(notes));
  }, [
    stored('n1', regression, { title: 'Mínimos quadrados', body: 'Função de custo', tags: ['exam'], timestamp: 95, updatedAt: '2026-11-03T10:00:00.000Z' }),
    stored('n2', pipelines, { title: 'Fit on train only', body: 'Avoid `leakage`', tags: ['exam', 'sklearn'], pinned: true }),
    stored('n3', pipelines, { title: 'Column transformer', tags: ['sklearn'], timestamp: 12 }),
  ]);

  await page.goto('/notes');
  await expect(page.getByRole('heading', { level: 1, name: 'Study notebook' })).toBeVisible();
  await expect(page.getByText('3 notes · 2 resources')).toBeVisible();
  const sections = page.locator('main section[aria-labelledby^="group-"]');
  await expect(sections.first().getByRole('heading', { level: 2 })).toHaveText('Regressão linear');
  await expect(sections.first().getByText('Video', { exact: true })).toBeVisible();
  await expect(sections.first().getByRole('link', { name: 'Open the resource at 01:35' })).toHaveAttribute('href', '/resources/linear-regression?t=95');

  // Search ignores accents and case, and survives a reload through the URL.
  await page.getByLabel('Search your notes').fill('minimos CUSTO');
  await expect(page).toHaveURL(/q=minimos\+CUSTO/);
  await expect(page.getByText('1 note · 1 resource')).toBeVisible();
  await page.reload();
  await expect(page.getByLabel('Search your notes')).toHaveValue('minimos CUSTO');
  await expect(page.getByRole('heading', { name: 'Mínimos quadrados' })).toBeVisible();
  await page.getByRole('button', { name: 'Clear filters' }).click();
  await expect(page.getByText('3 notes · 2 resources')).toBeVisible();

  const tags = page.getByRole('group', { name: 'Tags' });
  await tags.getByRole('button', { name: '#sklearn 2' }).click();
  await expect(page).toHaveURL(/tag=sklearn/);
  await page.getByRole('group', { name: 'Filter notes' }).getByRole('button', { name: /Pinned/ }).click();
  await expect(page).toHaveURL(/view=pinned/);
  await expect(page.getByText('1 note · 1 resource')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Fit on train only' })).toBeVisible();
  await page.getByRole('group', { name: 'Filter notes' }).getByRole('button', { name: /With code/ }).click();
  await expect(page.getByRole('heading', { name: 'Fit on train only' })).toBeVisible();
  await page.getByLabel('Search your notes').fill('nothing like this');
  await expect(page.getByText('No notes match this filter.')).toBeVisible();
  await page.getByRole('button', { name: 'Clear filters' }).click();

  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export all (.md)' }).click();
  const file = await download;
  expect(file.suggestedFilename()).toBe('facodi-notebook.md');
  const markdown = await (await import('node:fs/promises')).readFile(await file.path(), 'utf8');
  expect(markdown).toContain('## Regressão linear');
  expect(markdown).toMatch(/### \[01:35\]\(http:\/\/[^)]+\/resources\/linear-regression\?t=95\) Mínimos quadrados/);

  await page.getByRole('button', { name: 'Delete “Column transformer”' }).click();
  await expect(page.getByText('2 notes · 2 resources')).toBeVisible();
  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(page.getByText('3 notes · 2 resources')).toBeVisible();

  // Editing away from the video keeps the note's moment.
  await page.getByRole('button', { name: 'Edit “Mínimos quadrados”' }).click();
  await page.getByLabel('Title or concept').fill('Least squares');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByRole('link', { name: 'Open the resource at 01:35' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Least squares' })).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow, noarchive');
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

test('a curricular unit stays selected after sign-in and can be changed before suggesting a resource', async ({ page }) => {
  await mockAuth(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const course = { id: '0b5f4f8e-8f0e-4d55-9c55-1f1f81907e03', slug: 'test-course', code: 'TST', title: 'Test course' };
  const unit = { id: '0b5f4f8e-8f0e-4d55-9c55-1f1f81907e01', slug: 'calculus', code: '101', title: 'Calculus' };
  const otherUnit = { id: '0b5f4f8e-8f0e-4d55-9c55-1f1f81907e02', slug: 'linear-algebra', code: '102', title: 'Linear Algebra' };
  const path = '/courses/test-course/units/calculus';
  await page.route('**/rest/v1/**', route => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith('/courses')) return route.fulfill({ json: [course] });
    if (url.pathname.endsWith('/curricular_units')) {
      if (url.searchParams.get('courses.published')) {
        // Simulate a unit beyond the first page of picker options.
        if (!url.searchParams.has('id')) return route.fulfill({ json: [{ ...otherUnit, courses: course }] });
        expect(url.searchParams.get('id')).toBe(`eq.${unit.id}`);
        expect(url.searchParams.get('status')).toBe('eq.active');
        expect(url.searchParams.get('courses.status')).toBe('eq.active');
        return route.fulfill({ json: [{ ...unit, courses: course }] });
      }
      return route.fulfill({ json: url.searchParams.has('id') ? [unit] : [unit, otherUnit] });
    }
    return route.fulfill({ json: [] });
  });
  await page.route('https://www.youtube.com/oembed**', route => route.fulfill({ json: { title: 'Linear Algebra', author_name: 'Open Lessons' } }));
  await page.route('https://i.ytimg.com/**', route => route.fulfill({ status: 404, body: '' }));

  await page.goto(path);
  const invitation = page.getByRole('region', { name: 'What helped you study this unit?' });
  await invitation.getByRole('link', { name: 'Suggest a resource' }).click();
  await expect(page).toHaveURL(`/login?next=${encodeURIComponent(`/suggest?unit=${unit.id}`)}`);
  await page.getByLabel('Email', { exact: true }).fill('learner@example.test');
  await page.getByLabel('Password', { exact: true }).fill('test-password-123');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page).toHaveURL(`/suggest?unit=${unit.id}`);
  await expect(page.getByRole('link', { name: 'Back to the curricular unit' })).toHaveAttribute('href', path);
  await page.getByLabel('Resource address').fill('https://youtu.be/dQw4w9WgXcQ');
  await page.getByRole('button', { name: 'Analyse' }).click();
  await expect(page.getByLabel('Title *')).toHaveValue('Linear Algebra');
  await expect(page.getByRole('combobox', { name: 'Course', exact: true })).toHaveValue(course.id);
  const picker = page.getByRole('combobox', { name: 'Curricular unit (optional)' });
  await expect(picker).toHaveValue(unit.id);
  await picker.selectOption(otherUnit.id);
  await expect(picker).toHaveValue(otherUnit.id);
});

test('learner submits the analysed link and can follow its screening verdict in their history', async ({ page }) => {
  await mockAuth(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 375, height: 900 });
  const posted: Record<string, unknown>[] = [];
  let submitted: Record<string, unknown> | undefined;
  const unit = { id: '0b5f4f8e-8f0e-4d55-9c55-1f1f81907e01', code: '19411006', title: 'Programação Orientada a Objetos', slug: 'poo',
    courses: { id: '0b5f4f8e-8f0e-4d55-9c55-1f1f81907e02', code: 'LESTI', title: 'Systems Engineering', slug: 'lesti' } };
  await page.route('**/rest/v1/**', async route => {
    const request = route.request();
    const url = new URL(request.url());
    expect(request.headers()['accept-profile'] ?? request.headers()['content-profile']).toBe('facodi');
    expect(url.pathname).not.toContain('/rpc/');
    if (url.pathname.endsWith('/curricular_units')) return route.fulfill({ json: [unit] });
    if (url.pathname.endsWith('/resource_suggestions') && request.method() === 'POST') {
      const body = request.postDataJSON() as Record<string, unknown>;
      posted.push(body);
      submitted = {
        ...body, id: 's1', provider: 'youtube', status: 'pending', review_note: null, reviewed_at: null, learning_object_id: null,
        created_at: '2026-11-14T10:00:00Z', curricular_units: { code: unit.code, title: unit.title, slug: unit.slug, courses: { code: 'LESTI', slug: 'lesti' } },
        screening: { provider_recognized: true, secure_source: true, license: 'open', unit_selected: true, duplicate: null, recommendation: 'fast_track' },
      };
      return route.fulfill({ status: 201, json: submitted });
    }
    if (url.pathname.endsWith('/resource_suggestions')) return route.fulfill({ json: submitted ? [submitted] : [] });
    return route.fulfill({ json: [] });
  });
  await page.route('https://www.youtube.com/oembed**', route => {
    const address = new URL(route.request().url()).searchParams.get('url');
    const title = address?.includes('9bZkp7q19f0') ? 'First video' : 'Programação orientada a objetos em Java';
    return route.fulfill({ json: { title, author_name: 'Canal Aberto' } });
  });
  await page.route('https://i.ytimg.com/**', route => route.fulfill({ status: 404, body: '' }));

  await page.goto('/login?next=/suggest');
  await page.getByLabel('Email', { exact: true }).fill('learner@example.test');
  await page.getByLabel('Password', { exact: true }).fill('test-password-123');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Suggest a resource' })).toBeVisible();
  await expect(page.getByText('You have not suggested any resources yet.')).toBeVisible();

  await page.getByLabel('Resource address').fill('javascript:alert(1)');
  await page.getByRole('button', { name: 'Analyse' }).click();
  await expect(page.getByText('Enter a valid HTTP or HTTPS address.')).toBeVisible();

  await page.getByLabel('Resource address').fill('https://youtu.be/9bZkp7q19f0');
  await page.getByRole('button', { name: 'Analyse' }).click();
  await expect(page.getByLabel('Title *')).toHaveValue('First video');
  await page.getByLabel('Title *').fill('A title for the first video only');

  await page.getByLabel('Resource address').fill('https://youtu.be/dQw4w9WgXcQ?si=share');
  await expect(page.getByText('Analyse the new link to fill in the resource details.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Send for curation' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Analyse' }).click();
  await expect(page.getByText('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBeVisible();
  await expect(page.getByText('Title and authorship read from the source.', { exact: true })).toBeVisible();
  await expect(page.getByLabel('Title *')).toHaveValue('Programação orientada a objetos em Java');
  await expect(page.getByLabel('Author or channel')).toHaveValue('Canal Aberto');
  await expect(page.getByRole('radio', { name: /Programação Orientada a Objetos/ })).toBeChecked();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

  await page.getByLabel('Licence', { exact: true }).fill('CC BY-NC 4.0');
  await expect(page.getByText('Restricted', { exact: true })).toBeVisible();
  await page.getByLabel('Licence', { exact: true }).fill('CC BY 4.0');
  await page.getByLabel('Tags', { exact: true }).fill('#Java, java, OOP');
  await page.getByRole('button', { name: 'Send for curation' }).click();
  await expect(page.getByText('Confirm both declarations to send.')).toBeVisible();
  expect(posted).toHaveLength(0);
  await page.getByLabel('I confirm the licence allows educational use of this resource.').check();
  await page.getByLabel('I confirm the authorship stated is that of the original source.').check();
  await page.getByRole('button', { name: 'Send for curation' }).click();

  await expect(page.getByRole('heading', { name: 'Suggestion received' })).toBeVisible();
  await expect(page.getByRole('status').getByText('Fast track')).toBeVisible();
  await expect(page.getByText('Recognised source: YouTube.')).toBeVisible();
  expect(posted).toEqual([expect.objectContaining({
    url: 'https://youtu.be/dQw4w9WgXcQ?si=share', canonical_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    title: 'Programação orientada a objetos em Java', license: 'CC BY 4.0', object_type: 'video', tags: ['java', 'oop'],
    course_id: unit.courses.id, curricular_unit_id: unit.id, license_declared: true, attribution_declared: true,
  })]);
  expect(posted[0]).not.toHaveProperty('status');
  await page.getByRole('link', { name: 'View history' }).click();
  await expect(page).toHaveURL('/suggest#suggest-history');
  const history = page.getByRole('region', { name: 'My suggestions' });
  await expect(history.getByRole('heading')).toBeFocused();
  await expect(history.getByRole('heading')).toBeInViewport();
  await expect(history.getByText('Programação orientada a objetos em Java')).toBeVisible();
});

test('the personal area opens the suggestions history directly', async ({ page }) => {
  await mockAuth(page);
  await page.addInitScript(session => localStorage.setItem('sb-wvkjainfwsyiyfcmbtid-auth-token', JSON.stringify(session)), authFixture());
  await page.goto('/dashboard');
  await page.getByRole('link', { name: /My suggestions/ }).click();
  await expect(page).toHaveURL('/suggest#suggest-history');
  await expect(page.getByRole('heading', { name: 'My suggestions' })).toBeFocused();
  await expect(page.getByText('You have not suggested any resources yet.')).toBeVisible();
});

test('editor reads the advisory analysis and approves a suggestion as a draft with a proposed unit', async ({ page }) => {
  await mockAuth(page, 'editor');
  const decisions: unknown[] = [];
  const suggestion = {
    id: 's1', url: 'https://github.com/numpy/numpy', canonical_url: 'https://github.com/numpy/numpy', provider: 'github', title: 'numpy',
    author: 'numpy', thumbnail_url: null, license: 'BSD-3-Clause', object_type: 'external_resource', language: 'en', tags: ['python'],
    note: 'Great for the arrays chapter', status: 'pending', review_note: null, reviewed_at: null, learning_object_id: null,
    created_at: '2026-11-14T10:00:00Z', curricular_units: { id: 'u1', code: '101', title: 'Scientific Computing', slug: 'sc', courses: { code: 'LESTI', slug: 'lesti' } },
    screening: { provider_recognized: true, secure_source: true, license: 'open', unit_selected: true, duplicate: null, recommendation: 'fast_track' },
    analysis_jobs: [{ status: 'succeeded', error_code: null, result_payload: { matching: { topics: ['Arrays'], matches: [
      { unit_id: 'u2', code: '102', title: 'Numerical Methods', slug: 'nm', course_code: 'LESTI', course_slug: 'lesti', fit: 'strong', reason: 'Trata vetores e matrizes.' },
    ] } } }],
  };
  await page.route('**/rest/v1/**', async route => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.pathname.endsWith('/rpc/review_resource_suggestion')) {
      decisions.push(request.postDataJSON());
      return route.fulfill({ json: 'lo-1' });
    }
    expect(url.pathname).not.toContain('/rpc/');
    if (url.pathname.endsWith('/resource_suggestions')) return route.fulfill({ json: decisions.length ? [] : [suggestion] });
    return route.fulfill({ json: [], headers: { 'content-range': '*/0', 'access-control-expose-headers': 'content-range' } });
  });

  await page.goto('/login?next=/editor/suggestions');
  await page.getByLabel('Email', { exact: true }).fill('editor@example.test');
  await page.getByLabel('Password', { exact: true }).fill('test-password-123');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByRole('heading', { level: 2, name: 'numpy' })).toBeVisible();
  await expect(page.getByText('Recognised source: GitHub.')).toBeVisible();
  await expect(page.getByText('Great for the arrays chapter')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Numerical Methods' })).toHaveAttribute('href', '/courses/lesti/units/nm');
  await expect(page.getByText('Trata vetores e matrizes.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Analyse again' })).toBeVisible();
  await page.getByRole('button', { name: 'Approve as draft' }).click();
  const dialog = page.getByRole('alertdialog');
  await expect(dialog.getByRole('radio', { name: /Scientific Computing/ })).toBeChecked();
  await dialog.getByRole('radio', { name: /Numerical Methods/ }).check();
  await page.getByLabel('Editorial reasoning (optional)').fill('Linked to arrays');
  await page.getByRole('button', { name: 'Confirm' }).click();
  await expect(page.getByText('Draft created. Review and publish it in the editor.')).toBeVisible();
  expect(decisions).toEqual([{ p_suggestion_id: 's1', p_decision: 'approved', p_review_note: 'Linked to arrays', p_curricular_unit_id: 'u2' }]);
  await expect(page.getByRole('heading', { name: 'No pending suggestions' })).toBeVisible();
});

test('guest browses study sequences, picks a lesson through the URL and is invited to save progress', async ({ page }) => {
  const item = (position: number, id: string, title: string) => ({
    position, video_id: id, youtube_id: `abcdefghij${position}`, title, channel: 'Canal Aberto', language: 'pt',
    youtube_url: `https://www.youtube.com/watch?v=abcdefghij${position}`, thumbnail_url: null, metadata_verified: true,
  });
  await page.route('https://i.ytimg.com/**', route => route.fulfill({ status: 404, body: '' }));
  await page.route('**/rest/v1/**', async route => {
    const request = route.request();
    const url = new URL(request.url());
    expect(request.headers()['accept-profile'] ?? request.headers()['content-profile']).toBe('facodi');
    if (url.pathname.endsWith('/rpc/list_public_editorial_sequences_v1')) return route.fulfill({ json: [{
      playlist_id: 'p1', playlist_slug: 'python-basics', playlist_title: 'Python from scratch', playlist_description: 'Variables to functions.',
      language: 'pt', item_count: 2, unit_codes: ['101', '102'], cover_youtube_id: 'abcdefghij1',
    }] });
    if (url.pathname.endsWith('/rpc/get_public_editorial_playlist_v2')) {
      expect(request.postDataJSON()).toEqual({ p_slug: 'python-basics' });
      return route.fulfill({ json: [{
        playlist_id: 'p1', playlist_slug: 'python-basics', playlist_title: 'Python from scratch', playlist_description: 'Variables to functions.',
        language: 'pt', verified_metadata_count: 2, items: [item(1, 'v1', 'Variables'), item(2, 'v2', 'Functions')],
        curricular_units: [{ unit_code: '101', unit_slug: 'programming-i', unit_title: 'Programming I', course_code: 'LESTI', course_slug: 'lesti' }],
      }] });
    }
    expect(url.pathname).not.toContain('/rpc/');
    if (url.pathname.endsWith('/learning_objects')) return route.fulfill({ json: [{ id: 'v1', slug: 'variables' }, { id: 'v2', slug: 'functions' }] });
    return route.fulfill({ json: [], headers: { 'content-range': '*/0', 'access-control-expose-headers': 'content-range' } });
  });

  await page.goto('/sequences');
  await expect(page.getByRole('heading', { level: 1, name: 'Study sequences' })).toBeVisible();
  await expect(page.getByText('2 lessons')).toBeVisible();
  await page.getByRole('link', { name: /Python from scratch/ }).click();
  await expect(page).toHaveURL(/\/sequences\/python-basics$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Python from scratch' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Share' })).toBeVisible();
  await expect(page.getByText('Lesson 1 of 2')).toBeVisible();
  await page.getByRole('list', { name: 'Lessons in this sequence' }).getByRole('button', { name: /Functions/ }).click();
  await expect(page).toHaveURL(/\?v=v2$/);
  await expect(page.getByText('Lesson 2 of 2')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Sign in to save progress' })).toHaveAttribute('href', '/login?next=%2Fsequences%2Fpython-basics');
  await expect(page.getByRole('link', { name: /Programming I/ })).toHaveAttribute('href', '/courses/lesti/units/programming-i');
  await expect(page.getByRole('checkbox')).toHaveCount(0);
});

for (const surface of ['sequence', 'unit'] as const) {
  for (const width of [375, 1280]) {
    test(`embedded ${surface} notebook saves to the video and seeks locally at ${width}px`, async ({ page }) => {
      test.slow();
      const videos = [
        { id: 'v1', slug: 'variables', title: 'Variables', object_type: 'video', source_url: 'https://youtu.be/abcdefghij1',
          metadata: { youtube_video_id: 'abcdefghij1', duration_seconds: 600 }, language: 'en' },
        { id: 'v2', slug: 'functions', title: 'Functions', object_type: 'video', source_url: 'https://youtu.be/abcdefghij2',
          metadata: { youtube_video_id: 'abcdefghij2', duration_seconds: 600 }, language: 'en' },
      ];
      const course = { id: 'c1', slug: 'test-course', code: 'TST', title: 'Test course', published: true, status: 'active' };
      const unit = { id: 'u1', slug: 'programming', title: 'Programming', code: '101', learning_object_id: 'unit-lo',
        course_id: 'c1', year: 1, semester: 1, position: 1, learning_objects: null };
      const embed = `<script>
        window.commands = [];
        addEventListener('message', event => {
          const data = JSON.parse(event.data);
          if (data.event === 'listening') parent.postMessage(JSON.stringify({ event: 'infoDelivery', info: { currentTime: 83.7 } }), '*');
          if (data.event === 'command') window.commands.push([data.func, data.args]);
        });
      </script>`;
      let embeds = 0;
      await page.route('https://i.ytimg.com/**', route => route.fulfill({ status: 404, body: '' }));
      await page.route('https://www.youtube-nocookie.com/**', route => {
        embeds += 1;
        return route.fulfill({ contentType: 'text/html', body: embed });
      });
      await page.route('**/rest/v1/**', async route => {
        const url = new URL(route.request().url());
        if (url.pathname.endsWith('/rpc/get_public_editorial_playlist_v2')) return route.fulfill({ json: [{
          playlist_id: 'p1', playlist_slug: 'python-basics', playlist_title: 'Python from scratch', language: 'en',
          items: videos.map((video, index) => ({ position: index + 1, video_id: video.id, title: video.title,
            youtube_id: video.metadata.youtube_video_id, youtube_url: video.source_url })),
          curricular_units: [], verified_metadata_count: 2,
        }] });
        if (url.pathname.endsWith('/courses')) return route.fulfill({ json: course });
        if (url.pathname.endsWith('/curricular_units')) {
          return route.fulfill({ json: url.searchParams.get('id') ? unit : [unit] });
        }
        if (url.pathname.endsWith('/learning_objects')) return route.fulfill({
          json: url.searchParams.get('slug') ? { ...videos[0], published: true, status: 'active', tags: [], keywords: [], objectives: [] } : videos,
        });
        if (url.pathname.endsWith('/learning_object_relations')) return route.fulfill({
          json: url.searchParams.get('child_object_id') ? [] : videos.map(child => ({ child })),
        });
        return route.fulfill({ json: [], headers: { 'content-range': '*/0', 'access-control-expose-headers': 'content-range' } });
      });
      const path = surface === 'sequence' ? '/sequences/python-basics' : '/courses/test-course/units/programming';
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`${path}?v=v1&t=12`);
      await page.getByRole('button', { name: 'Study notebook', exact: true }).click();
      const drawer = page.getByRole('dialog', { name: 'Study notebook' });
      await expect(drawer.getByText('Start the video to tie each note to the moment you write it.')).toBeVisible();
      expect(embeds).toBe(0);
      await drawer.getByRole('button', { name: 'Close', exact: true }).click();
      await page.getByRole('button', { name: 'Play video: Variables' }).click();
      await expect(page.locator('iframe[title="Variables"]')).toHaveAttribute('src', /start=12/);
      await page.getByRole('button', { name: 'Study notebook', exact: true }).click();
      await expect(drawer.getByText('01:23', { exact: true })).toBeVisible();
      await drawer.getByLabel('Title or concept').focus();
      await expect(drawer.getByRole('button', { name: 'Remove the 01:23 mark' })).toBeVisible();
      await drawer.getByLabel('Title or concept').fill('Variable scope');
      await drawer.getByLabel('Note', { exact: true }).fill('This note belongs to Variables.');
      await expect(drawer.getByLabel('Title or concept')).toHaveValue('Variable scope');
      await drawer.getByRole('button', { name: 'Save note', exact: true }).click();
      await expect(drawer.getByRole('heading', { name: 'Variable scope' })).toBeVisible();
      await expect(page).toHaveURL(new RegExp(`${path.replaceAll('/', '\\/')}\\?v=v1&t=12&notes=open$`));
      await expect(drawer.getByRole('link', { name: 'Sign in for your own notebook' }))
        .toHaveAttribute('href', `/login?next=${encodeURIComponent(`${path}?v=v1&t=12&notes=open`)}`);
      await page.screenshot({ path: `test-results/notebook-${surface}-${width}.png` });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

      await drawer.getByRole('button', { name: 'Go to 01:23 in the video' }).click();
      const frame = page.frames().find(item => item.url().startsWith('https://www.youtube-nocookie.com/'))!;
      await expect.poll(() => frame.evaluate(() => (window as unknown as { commands: unknown[] }).commands))
        .toEqual([['seekTo', [83, true]], ['playVideo', []]]);
      if (width === 375) await expect(drawer).toBeHidden();
      else await drawer.getByRole('button', { name: 'Close', exact: true }).click();
      await expect(drawer).toBeHidden();
      const lessons = page.getByRole('list', { name: surface === 'sequence' ? 'Lessons in this sequence' : 'Video lessons for this unit' });
      await lessons.getByRole('button', { name: /Functions/ }).click();
      await expect(page).toHaveURL(`${path}?v=v2`);
      await page.getByRole('button', { name: 'Study notebook', exact: true }).click();
      await expect(drawer.getByRole('heading', { name: 'Variable scope' })).toHaveCount(0);
      await expect(drawer.getByLabel('Title or concept')).toHaveValue('');
      await drawer.getByRole('button', { name: 'Close', exact: true }).click();

      await page.goto(`${path}?v=v1&notes=open`);
      await expect(drawer.getByRole('heading', { name: 'Variable scope' })).toBeVisible();
      await page.goto('/resources/variables?notes=open');
      await expect(drawer.getByRole('heading', { name: 'Variable scope' })).toBeVisible();
      expect(await page.evaluate(() => JSON.parse(localStorage.getItem('facodi-notes:v1:guest') ?? '[]')))
        .toEqual([expect.objectContaining({ resourceId: 'v1', resourceSlug: 'variables', resourceType: 'video', timestamp: 83 })]);
    });
  }
}

test('study sequence catalogue searches, filters regional languages and paginates through the URL', async ({ page }) => {
  const rows = Array.from({ length: 13 }, (_, index) => ({
    playlist_id: `p${index + 1}`,
    playlist_slug: `sequence-${index + 1}`,
    playlist_title: index === 0 ? 'Análise de dados com Python' : `Study sequence ${index + 1}`,
    playlist_description: index === 0 ? '<p>Estatística exploratória</p>' : '',
    language: index === 12 ? 'en' : 'pt-BR',
    item_count: 3,
    unit_codes: index === 0 ? ['19411021'] : [],
    cover_youtube_id: '',
  }));
  await page.route('**/rest/v1/rpc/list_public_editorial_sequences_v1', async route => {
    expect(route.request().headers()['content-profile']).toBe('facodi');
    return route.fulfill({ json: rows });
  });

  await page.goto('/sequences');
  await expect(page.getByRole('heading', { level: 1, name: 'Study sequences' })).toBeVisible();
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page).toHaveURL('/sequences?page=2');
  await expect(page.getByRole('link', { name: /Study sequence 13/ })).toBeVisible();

  await page.getByRole('searchbox', { name: 'Search sequences' }).fill('analise');
  await expect(page).toHaveURL(/search=analise/);
  await expect(page.getByRole('link', { name: /Análise de dados com Python/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /Study sequence 13/ })).toHaveCount(0);

  await page.getByRole('main').getByRole('combobox').selectOption('pt');
  await expect(page).toHaveURL(/search=analise.*language=pt/);
  await expect(page.getByRole('link', { name: /Análise de dados com Python/ })).toBeVisible();
  await expect(page.getByText('1 result', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Remove filter Language: Português' }).click();
  await expect(page).toHaveURL('/sequences?search=analise');
  await page.getByRole('searchbox', { name: 'Search sequences' }).fill('zzz');
  await expect(page.getByRole('heading', { name: 'No study sequences match your search.' })).toBeVisible();
  await page.getByRole('button', { name: 'Clear filters' }).first().click();
  await expect(page).toHaveURL('/sequences');
  await expect(page.getByRole('navigation', { name: 'Pagination' })).toBeVisible();
});

test('unified resources catalogue searches every type with contextual facets, tag chips and legacy module URLs', async ({ page }) => {
  test.slow();
  const module = {
    id: 'module-1', slug: 'intro-algebra', title: 'Introduction to algebra',
    description: 'An independent study guide with practice activities.',
    language: 'en', object_type: 'module', tags: ['Algebra'], metadata: {}, source_url: null,
  };
  const video = {
    id: 'video-1', slug: 'algebra-video', title: 'Álgebra em vídeo',
    description: 'Short video explanation.', language: 'pt-BR', object_type: 'video',
    tags: ['Algebra', 'Matemática'], metadata: {}, source_url: 'https://www.youtube.com/watch?v=abc',
  };
  const fold = (value: string) => value.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
  const calls: Record<string, unknown>[] = [];
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: async (data: ShareData) => sessionStorage.setItem('test:module-share', JSON.stringify(data)),
    });
  });
  await page.route('**/rest/v1/rpc/search_public_resources_v4', async route => {
    expect(route.request().headers()['content-profile']).toBe('facodi');
    const body = route.request().postDataJSON() as Record<string, string | undefined>;
    calls.push(body);
    const scoped = [module, video].filter(item =>
      (!body.p_search || fold(item.title).includes(fold(body.p_search))) &&
      (!body.p_language || item.language === body.p_language || item.language.startsWith(body.p_language + '-')) &&
      (!body.p_tag || item.tags.includes(body.p_tag)));
    const items = scoped.filter(item => !body.p_object_type || item.object_type === body.p_object_type);
    const types = ['module', 'video'].map(value => ({ value, count: scoped.filter(item => item.object_type === value).length }))
      .filter(facet => facet.count);
    await route.fulfill({ json: { total: items.length, items, types } });
  });
  await page.route('**/rest/v1/learning_objects*', route =>
    route.fulfill({ json: new URL(route.request().url()).searchParams.has('slug') ? module : [] }));

  await page.goto('/resources?search=algebra');
  await expect(page.getByRole('link', { name: 'Introduction to algebra', exact: true })).toHaveAttribute('href', '/modules/intro-algebra');
  await expect(page.getByRole('link', { name: 'Álgebra em vídeo', exact: true })).toBeVisible();
  await expect(page.getByText('2 results', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Study module/ })).toContainText('1');

  await page.getByRole('button', { name: 'More filters' }).click();
  await page.getByRole('main').getByRole('combobox', { name: 'Language', exact: true }).selectOption('pt');
  await page.getByRole('button', { name: /More filters/ }).click();
  await expect(page).toHaveURL(/search=algebra&language=pt$/);
  await expect(page.getByRole('link', { name: 'Introduction to algebra', exact: true })).toHaveCount(0);
  await expect(page.getByText('1 result', { exact: true })).toBeVisible();
  // Selecting a card topic narrows the list and shows up as a removable chip.
  await page.getByRole('button', { name: 'Matemática', exact: true }).click();
  await expect(page).toHaveURL(/tag=Matem%C3%A1tica/);
  await expect.poll(() => calls.at(-1)).toMatchObject({ p_search: 'algebra', p_language: 'pt', p_tag: 'Matemática' });
  await page.getByRole('button', { name: 'Remove filter Language: Português' }).click();
  await expect(page).toHaveURL(/search=algebra&tag=Matem%C3%A1tica$/);

  await page.getByRole('searchbox').fill('nothing here');
  await expect(page.getByRole('heading', { name: 'No resources match these filters.' })).toBeVisible();
  await page.getByRole('button', { name: 'Clear filters' }).first().click();
  await expect(page).toHaveURL('/resources');
  await expect(page.getByRole('button', { name: /^All/ })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('list', { name: 'Active filters' })).toHaveCount(0);

  await page.getByRole('button', { name: /^Study module/ }).click();
  await expect(page).toHaveURL(/\/resources\?type=module$/);
  await expect(page.getByRole('heading', { name: 'Study modules', level: 2 })).toBeVisible();
  await expect(page.getByRole('link', { name: /Álgebra em vídeo/ })).toHaveCount(0);

  await page.goto('/modules?search=Algebra&language=en&page=2');
  await expect(page).toHaveURL(/\/resources\?search=Algebra&language=en&page=2&type=module$/);
  await page.goto('/resources?type=module');
  await page.getByRole('link', { name: /Introduction to algebra/ }).click();
  await expect(page).toHaveURL(/\/modules\/intro-algebra$/);
  await expect(page.getByRole('heading', { name: 'Introduction to algebra', level: 1 })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Study modules' })).toHaveAttribute('href', '/resources?type=module');
  await page.goto('/modules/intro-algebra?utm_source=test#practice');
  for (const width of [375, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(page.getByRole('button', { name: 'Share' })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
  await page.getByRole('button', { name: 'Share' }).click();
  await expect.poll(() => page.evaluate(() => sessionStorage.getItem('test:module-share'))).toBe(JSON.stringify({
    title: 'Introduction to algebra', url: 'https://facodi.com/modules/intro-algebra#practice',
  }));
});
