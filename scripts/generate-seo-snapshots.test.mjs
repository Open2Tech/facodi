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

async function serveSequences(rows, contentRange, resources = [], catalogue = {}) {
  const tables = { courses: catalogue.courses ?? [], curricular_units: catalogue.units ?? [], learning_object_relations: catalogue.relations ?? [] };
  server = createServer(async (request, response) => {
    const url = new URL(request.url, 'http://127.0.0.1');
    const pathname = url.pathname;
    response.setHeader('content-type', 'application/json');
    if (pathname === '/rest/v1/rpc/get_public_editorial_playlist_v2') {
      let body = '';
      for await (const chunk of request) body += chunk;
      const slug = JSON.parse(body).p_slug;
      response.end(JSON.stringify(catalogue.playlists?.[slug] ? [{ playlist_slug: slug, items: catalogue.playlists[slug] }] : []));
      return;
    }
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
    const table = pathname.replace('/rest/v1/', '');
    if (table in tables || table === 'learning_objects') {
      const list = tables[table] ?? [];
      response.setHeader('content-range', list.length ? `0-${list.length - 1}/${list.length}` : '*/0');
      response.end(JSON.stringify(list));
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
    expect(html).toContain('<h1>História</h1>');
    expect(sitemap).toContain('<loc>https://facodi.com/sequences/hist%C3%B3ria</loc>');
    const index = await readFile(path.join(directory, 'dist', 'sequences.html'), 'utf8');
    expect(index).toContain('<li><a href="/sequences/hist%C3%B3ria">História</a></li>');
    const llms = await readFile(path.join(directory, 'dist', 'llms.txt'), 'utf8');
    expect(llms).toMatch(/^# FACODI\n/);
    expect(llms).toContain('- [História](https://facodi.com/sequences/hist%C3%B3ria): Sequência pública');
  });

  it('links units, videos and sequences to each other in plain HTML, in curated order', async () => {
    await prepare();
    const url = await serveSequences([{
      playlist_slug: 'calculo-derivadas', playlist_title: 'Cálculo — derivadas', playlist_description: 'Vídeos externos ordenados por tema.',
      language: 'pt', item_count: 2, unit_codes: ['101'], cover_youtube_id: null,
    }], '0-0/1', [
      { id: 'v1', slug: 'limites', title: 'Limites', object_type: 'video', description: 'Vídeo externo do canal X.', metadata: { youtube_video_id: 'aaaaaaaaaaa' } },
      { id: 'v2', slug: 'derivadas', title: 'Derivadas', object_type: 'video', description: 'Vídeo externo do canal X.', metadata: { youtube_video_id: 'bbbbbbbbbbb' } },
      { id: 'draft-link', slug: 'pendente', title: 'Pendente', object_type: 'video', metadata: {} },
    ], {
      courses: [{ slug: 'lesti', title: 'LESTI', learning_object_id: 'course-lo' }],
      units: [{ slug: '101', code: '101', title: 'Análise I', learning_object_id: 'unit-lo', courses: { slug: 'lesti', title: 'LESTI' } }],
      relations: [
        { parent_object_id: 'unit-lo', child_object_id: 'v2', position: 2, review_status: 'approved' },
        { parent_object_id: 'unit-lo', child_object_id: 'v1', position: 1, review_status: 'approved' },
        { parent_object_id: 'unit-lo', child_object_id: 'draft-link', position: 3, review_status: 'pending' },
      ],
      playlists: { 'calculo-derivadas': [
        { position: 2, video_id: 'v2', title: 'Derivadas', youtube_id: 'bbbbbbbbbbb' },
        { position: 1, video_id: 'v1', title: 'Limites', youtube_id: 'aaaaaaaaaaa' },
      ] },
    });
    await run(url);
    const read = file => readFile(path.join(directory, 'dist', ...file.split('/')), 'utf8');
    const unit = await read('courses/lesti/units/101.html');
    expect(unit).toContain('<h2>Recursos abertos</h2><ol><li><a href="/resources/limites">Limites</a></li><li><a href="/resources/derivadas">Derivadas</a></li></ol>');
    expect(unit).not.toContain('/resources/pendente');
    expect(unit).toContain('<h2>Sequências de estudo</h2><ul><li><a href="/sequences/calculo-derivadas">Cálculo — derivadas</a></li></ul>');
    const video = await read('resources/derivadas.html');
    expect(video).toContain('<h2>Unidade curricular associada</h2><ul><li><a href="/courses/lesti/units/101">Análise I · LESTI</a></li></ul>');
    expect(video).toContain('<h2>Nas sequências de estudo</h2><ul><li><a href="/sequences/calculo-derivadas">Cálculo — derivadas</a></li></ul>');
    // Shared boilerplate descriptions lead with the subject, so each page has its own snippet.
    expect(video).toContain('name="description" content="Derivadas. Vídeo externo do canal X."');
    const sequence = await read('sequences/calculo-derivadas.html');
    expect(sequence).toContain('<h2>2 aulas</h2><ol><li><a href="/resources/limites">Limites</a></li><li><a href="/resources/derivadas">Derivadas</a></li></ol>');
    expect(sequence).toContain('<h2>Unidades curriculares relacionadas</h2><ul><li><a href="/courses/lesti/units/101">Análise I · LESTI</a></li></ul>');
    expect(sequence).toContain('"itemListElement":[{"@type":"ListItem","position":1,"name":"Limites","url":"https://facodi.com/resources/limites"}');
    const course = await read('courses/lesti.html');
    expect(course).toContain('<h2>Unidades curriculares</h2><ul><li><a href="/courses/lesti/units/101">Análise I</a></li></ul>');
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
