import { execFile } from 'node:child_process';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { afterEach, describe, expect, it } from 'vitest';

const execFileAsync = promisify(execFile);
const script = path.resolve('scripts/generate-seo-snapshots.mjs');
const shell = '<head><!-- seo:start -->old<!-- seo:end --></head><body><div id="root"></div></body>';
let directory;
let server;

async function prepare() {
  directory = await mkdtemp(path.join(tmpdir(), 'facodi-seo-snapshots-'));
  await mkdir(path.join(directory, 'dist'));
  await writeFile(path.join(directory, 'dist', 'index.html'), shell);
}

function run(url, key = 'test-key') {
  return execFileAsync('bun', [script], {
    cwd: directory,
    env: { ...process.env, VITE_SUPABASE_URL: url, VITE_SUPABASE_PUBLISHABLE_KEY: key },
  });
}

async function serveSequences(rows, contentRange, resources = []) {
  server = createServer((request, response) => {
    const url = new URL(request.url, 'http://127.0.0.1');
    const pathname = url.pathname;
    response.setHeader('content-type', 'application/json');
    if (request.headers.prefer !== 'count=exact') {
      response.writeHead(400).end(JSON.stringify({ error: 'Exact count required' }));
      return;
    }
    if (pathname === '/rest/v1/rpc/list_public_editorial_sequences_v1') {
      response.setHeader('content-range', contentRange);
      response.end(JSON.stringify(rows));
      return;
    }
    if (pathname === '/rest/v1/learning_objects' && resources.length) {
      const offset = Number(url.searchParams.get('offset'));
      const page = resources.slice(offset, offset + 1);
      response.setHeader('content-range', `${offset}-${offset + page.length - 1}/${resources.length}`);
      response.end(JSON.stringify(page));
      return;
    }
    if (['/rest/v1/courses', '/rest/v1/curricular_units', '/rest/v1/learning_objects'].includes(pathname)) {
      response.setHeader('content-range', '*/0');
      response.end('[]');
      return;
    }
    response.writeHead(404).end(JSON.stringify({ error: 'Unexpected request' }));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  return `http://127.0.0.1:${server.address().port}`;
}

afterEach(async () => {
  if (server) await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  server = undefined;
  if (directory) await rm(directory, { recursive: true, force: true });
  directory = undefined;
});

describe('SEO snapshot build', () => {
  it('only treats an explicit .invalid URL as an offline CI build', async () => {
    await prepare();
    await expect(run('https://ci-build-only.invalid')).resolves.toMatchObject({ stderr: expect.stringContaining('static pages only') });
    await expect(run('')).rejects.toMatchObject({ stderr: expect.stringContaining('are required') });
    await expect(run('not-a-url')).rejects.toMatchObject({ stderr: expect.stringContaining('valid HTTP(S) URL') });
    await expect(run('https://project.example', '')).rejects.toMatchObject({ stderr: expect.stringContaining('are required') });
  });

  it('writes a public sequence only after verifying the exact response count', async () => {
    await prepare();
    const url = await serveSequences([{
      playlist_slug: 'história', playlist_title: 'História', playlist_description: 'Sequência pública',
      language: 'pt', item_count: 1, cover_youtube_id: null,
    }], '0-0/1');
    await run(url);
    const html = await readFile(path.join(directory, 'dist', 'sequences', 'história.html'), 'utf8');
    const sitemap = await readFile(path.join(directory, 'dist', 'sitemap.xml'), 'utf8');
    expect(html).toContain('<title data-seo-shell>História — FACODI</title>');
    expect(sitemap).toContain('<loc>https://facodi.com/sequences/hist%C3%B3ria</loc>');
  });

  it('continues pagination when the API returns fewer rows than requested', async () => {
    await prepare();
    const url = await serveSequences([], '*/0', [
      { id: 'one', slug: 'primeiro', title: 'Primeiro', object_type: 'article' },
      { id: 'two', slug: 'segundo', title: 'Segundo', object_type: 'article' },
    ]);
    await run(url);
    const sitemap = await readFile(path.join(directory, 'dist', 'sitemap.xml'), 'utf8');
    expect(sitemap).toContain('<loc>https://facodi.com/resources/primeiro</loc>');
    expect(sitemap).toContain('<loc>https://facodi.com/resources/segundo</loc>');
  });

  it.each([
    [Array(500).fill({}), '0-499/500', '500-row limit'],
    [[{}], '0-0/90', 'response is incomplete'],
    [[{}], '0-0/*', 'exact count'],
  ])('refuses to publish incomplete sequence snapshots', async (rows, range, message) => {
    await prepare();
    const url = await serveSequences(rows, range);
    await expect(run(url)).rejects.toMatchObject({ stderr: expect.stringContaining(message) });
    await expect(readFile(path.join(directory, 'dist', 'sitemap.xml'), 'utf8')).rejects.toMatchObject({ code: 'ENOENT' });
  });
});
