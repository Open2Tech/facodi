import assert from 'node:assert/strict';

const origin = (process.env.FACODI_WORKERS_ORIGIN ?? 'https://facodi.marcelo-0d6.workers.dev').replace(/\/$/, '');
const canonical = 'https://www.facodi.com';
const routes = ['/', '/about', '/community', '/courses', '/modules', '/how-it-works', '/community/join',
  '/editor/email-templates', '/auth/callback', '/auth/reset-password',
  // The Workers build must support the real FACODI SPA deep links, not just its home page.
  '/courses/ifes-cariacica-administracao-integrado-2026',
  '/modules/ifes-adm26-estudo-3-matematica',
  '/sequences/facodi-playlist-ifes-aladim-historia-brasil',
  '/resources/youtube-I8sRO8QlN4c',
  '/editor/course-quality',
  '/courses/lesti',
  '/courses/ufes-letras-ingles',
  '/resources/facodi-oito-canais-guto',
  '/resources/facodi-oito-canais-aline',
  '/resources/facodi-oito-canais-playlist-PLdsnXVqbHDUcQIuiH9b-i9A85H3A2ZW5W'];

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

console.log('FACODI Workers SPA-shell smoke checks passed (read-only, no Auth, no email, no data mutation).');
console.log('Note: HTML-shell checks do not prove that Supabase data rendered; validate representative routes in a browser separately.');
