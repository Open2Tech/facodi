import assert from 'node:assert/strict';

const origin = (process.env.FACODI_WORKERS_ORIGIN ?? 'https://facodi.marcelo-0d6.workers.dev').replace(/\/$/, '');
const canonical = 'https://facodi.com';
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
  // Static SEO snapshots pre-render semantic content inside #root for crawlers; SPA-only
  // routes can still return an empty root. Both are valid React hydration shells.
  assert.match(text, /<div id="root">/i, `Missing React root at ${route}`);
  assert.match(response.headers.get('x-robots-tag') ?? '', /noindex/i,
    `Workers preview ${route} must not be indexed`);
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff',
    `Missing security headers at ${route}`);
  console.log('OK', route, response.status, '(noindex)');
}
// Regression guard for the Cloudflare Worker introduced in #107: unknown routes
// must return actual 404s, not an indexable SPA shell with status 200.
for (const route of ['/pagina-que-nao-existe', '/courses/lesti/extra', '/wp-admin']) {
  const { response, text } = await get(route);
  assert.equal(response.status, 404, `Unknown route ${route} must return HTTP 404`);
  assert.match(response.headers.get('content-type') ?? '', /text\\/html/i);
  assert.match(response.headers.get('x-robots-tag') ?? '', /noindex/i,
    `Unknown route ${route} must not be indexed`);
  assert.match(text, /<div id="root">/i, `Missing SPA error shell at ${route}`);
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


// Regression coverage for the FACODI brand asset release. Static resources
// are checked as bytes rather than only as URLs in rendered React or meta tags.
const pngCases = [
  ['/favicon-32x32.png', 32, 32],
  ['/apple-touch-icon.png', 180, 180],
  ['/pwa-192x192.png', 192, 192],
  ['/pwa-512x512.png', 512, 512],
  ['/social-preview-default.png?v=20261115', 1200, 630],
];
const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
for (const [path, width, height] of pngCases) {
  const response = await fetch(origin + path, {
    headers: { Accept: 'image/png' },
    signal: AbortSignal.timeout(15_000),
  });
  assert.equal(response.status, 200, 'Brand asset ' + path + ' returned ' + response.status);
  assert.match(response.headers.get('content-type') ?? '', /image\/png/i,
    'Brand asset ' + path + ' has the wrong content-type');
  const data = Buffer.from(await response.arrayBuffer());
  assert.ok(data.subarray(0, 8).equals(pngSignature), 'Invalid PNG at ' + path);
  assert.equal(data.readUInt32BE(16), width, 'Wrong width: ' + path);
  assert.equal(data.readUInt32BE(20), height, 'Wrong height: ' + path);
  console.log('OK', path, width, '×', height);
}

const icon = await get('/favicon.svg', 'image/svg+xml');
assert.equal(icon.response.status, 200, 'FACODI SVG favicon must exist');
assert.match(icon.response.headers.get('content-type') ?? '', /image\/svg\+xml/i);
assert.match(icon.text, /<svg\b/i, 'FACODI SVG favicon missing root element');
assert.doesNotMatch(icon.text, /o2t-logo|tube-o2/i, 'Legacy logo still in FACODI SVG');

const manifestResponse = await get('/site.webmanifest', 'application/manifest+json');
assert.equal(manifestResponse.response.status, 200);
const manifest = JSON.parse(manifestResponse.text);
assert.equal(manifest.name, 'FACODI');
for (const name of ['/favicon.svg', '/pwa-192x192.png', '/pwa-512x512.png']) {
  assert.ok(manifest.icons.some(icon => icon.src === name), 'Missing manifest icon ' + name);
}
assert.ok(manifest.icons.some(icon => icon.src === '/pwa-512x512.png' && icon.purpose.includes('maskable')),
  'PWA maskable icon must remain available');

const home = await get('/');
assert.match(home.text, /<main\\b/i,
  'Worker home must contain the pre-rendered main content, not just the empty SPA shell');
assert.match(home.text, /https:\/\/facodi\.com\/social-preview-default\.png\?v=20261115/,
  'Worker home shell does not advertise the current OG image');
assert.match(home.text, /twitter:card" content="summary_large_image"/,
  'Worker home shell does not advertise the Twitter summary card');

for (const route of ['/privacy', '/terms', '/cookies', '/copyright', '/accessibility', '/legal']) {
  const page = await get(route);
  assert.equal(page.response.status, 200, 'Legal snapshot not served at ' + route);
  assert.match(page.text, new RegExp('https://facodi[.]com' + route + '["<]'),
    'Missing canonical URL in static snapshot for ' + route);
  assert.match(page.response.headers.get('x-robots-tag') ?? '', /noindex/i,
    'Preview legal page must not be indexed: ' + route);
}
console.log('FACODI brand assets, Open Graph metadata, manifest and legal snapshots passed (read-only).');
