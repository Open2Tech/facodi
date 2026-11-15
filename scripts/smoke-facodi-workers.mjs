import assert from 'node:assert/strict';

const origin = 'https://facodi.marcelo-0d6.workers.dev';
const canonical = 'https://www.facodi.com';
const routes = ['/', '/about', '/community', '/courses', '/community/join',
  '/editor/email-templates', '/auth/callback', '/auth/reset-password'];

async function get(path, accept = 'text/html') {
  const response = await fetch(origin + path, {
    method: 'GET',
    redirect: 'follow',
    headers: { Accept: accept },
    signal: AbortSignal.timeout(15_000),
  });
  return { response, text: await response.text() };
}

for (const route of routes) {
  const { response, text } = await get(route);
  assert.equal(response.status, 200, `SPA route ${route} returned ${response.status}`);
  assert.match(response.headers.get('content-type') ?? '', /text\/html/i,
    `SPA route ${route} must serve the Vite HTML shell`);
  assert.match(text, /<div id="root"><\/div>/i, `Missing React root at ${route}`);
  assert.match(response.headers.get('x-robots-tag') ?? '', /noindex/i,
    `Workers preview ${route} must not be indexed`);
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff',
    `Missing security headers at ${route}`);
  console.log('OK', route, response.status, '(noindex)');
}
const robots = await get('/robots.txt','text/plain');
assert.equal(robots.response.status, 200);
assert.ok(robots.text.includes(`Sitemap: ${canonical}/sitemap.xml`));
const sitemap = await get('/sitemap.xml','application/xml');
assert.equal(sitemap.response.status, 200);
assert.match(sitemap.text, /<urlset/i);
assert.ok(sitemap.text.includes(`<loc>${canonical}/about</loc>`));
assert.ok(!sitemap.text.includes(origin), 'Preview URL must not appear in sitemap');

console.log('FACODI Workers smoke checks passed (read-only: no Auth, no email, no data mutation).');
