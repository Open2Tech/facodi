import appSource from '../App.tsx?raw';
import { describe, expect, it } from 'vitest';
import { isAppRoute, isPrivateRoute, legacyPublicRedirect } from './routes';
import worker from './index';

describe('isAppRoute', () => {
  it('covers every route declared in App.tsx', () => {
    const app = appSource;
    const paths = [...app.matchAll(/path="([^"]+)"/g)].map(match => match[1]).filter(path => path !== '*');
    expect(paths.length).toBeGreaterThan(20);
    for (const path of paths) expect(isAppRoute(path.replace(/:[a-z]+/gi, 'x')), path).toBe(true);
  });
  it('accepts legal pages, trailing slashes and content slugs', () => {
    for (const path of ['/privacy', '/courses/', '/courses/gestao', '/courses/gestao/units/14181086', '/resources/abc', '/sequences/s', '/modules/m']) {
      expect(isAppRoute(path), path).toBe(true);
    }
  });
  it('rejects paths outside every route', () => {
    for (const path of ['/pagina-que-nao-existe', '/courses/gestao/extra', '/courses/a/units', '/resources/a/b', '/wp-admin', '/index.php']) {
      expect(isAppRoute(path), path).toBe(false);
    }
  });
  it('marks the private areas like public/_headers does', () => {
    expect(isPrivateRoute('/dashboard')).toBe(true);
    expect(isPrivateRoute('/editor/playlists')).toBe(true);
    expect(isPrivateRoute('/courses/gestao')).toBe(false);
  });
});

describe('legacyPublicRedirect', () => {
  it('maps only documented retired public routes and never targets a private page', () => {
    expect(legacyPublicRedirect('/slides')).toBe('/sequences');
    expect(legacyPublicRedirect('/pt/slides/')).toBe('/sequences');
    expect(legacyPublicRedirect('/sobre')).toBe('/about');
    expect(legacyPublicRedirect('/infrastructure')).toBe('/about');
    expect(legacyPublicRedirect('/academic-model')).toBe('/how-it-works');
    expect(legacyPublicRedirect('/courses/ciencias-da-comunicacao')).toBeNull();
    expect(legacyPublicRedirect('/dashboard')).toBeNull();
    expect(legacyPublicRedirect('/pagina-que-nao-existe')).toBeNull();
  });
});

describe('worker', () => {
  const files: Record<string, string> = { '/': '<div id="root"></div>', '/__home': '<main>FACODI home</main>' };
  const env = { ASSETS: { fetch: async (request: Request) => {
    const body = files[new URL(request.url).pathname];
    return body ? new Response(body, { headers: { 'Content-Type': 'text/html' } }) : new Response('missing', { status: 404 });
  } } };
  const get = (path: string, host = 'https://facodi.com') => worker.fetch(new Request(host + path), env);

  it('sends permanent redirects for retired URLs and preserves query parameters', async () => {
    const response = await get('/slides?course=lcc');
    expect(response.status).toBe(301);
    expect(response.headers.get('Location')).toBe('https://facodi.com/sequences?course=lcc');
    expect(response.headers.get('X-Frame-Options')).toBe('DENY');
    const old = await get('/pt/slides/');
    expect(old.headers.get('Location')).toBe('https://facodi.com/sequences');
    const head = await worker.fetch(new Request('https://facodi.com/sobre', { method: 'HEAD' }), env);
    expect(head.status).toBe(301);
    expect(head.headers.get('Location')).toBe('https://facodi.com/about');
  });

  it('serves the home snapshot for "/"', async () => {
    const response = await get('/');
    expect(response.status).toBe(200);
    expect(await response.text()).toContain('FACODI home');
    expect(response.headers.get('X-Robots-Tag')).toBeNull();
    expect(response.headers.get('X-Frame-Options')).toBe('DENY');
  });
  it('falls back to the shell when the home snapshot is missing', async () => {
    const response = await worker.fetch(new Request('https://facodi.com/'), { ASSETS: { fetch: async (request: Request) =>
      new URL(request.url).pathname === '/' ? new Response('shell') : new Response('', { status: 404 }) } });
    expect(response.status).toBe(200);
    expect(await response.text()).toBe('shell');
  });
  it('serves the shell with 200 for app routes, noindex for private ones', async () => {
    const page = await get('/courses/new-course');
    expect(page.status).toBe(200);
    expect(page.headers.get('X-Robots-Tag')).toBeNull();
    const dashboard = await get('/dashboard');
    expect(dashboard.status).toBe(200);
    expect(dashboard.headers.get('X-Robots-Tag')).toContain('noindex');
  });
  it('answers unknown paths with a real 404 and noindex', async () => {
    const response = await get('/pagina-que-nao-existe');
    expect(response.status).toBe(404);
    expect(await response.text()).toContain('id="root"');
    expect(response.headers.get('X-Robots-Tag')).toContain('noindex');
  });
  it('keeps the workers.dev preview out of the index and rejects writes', async () => {
    expect((await get('/', 'https://facodi.marcelo-0d6.workers.dev')).headers.get('X-Robots-Tag')).toContain('noindex');
    expect((await worker.fetch(new Request('https://facodi.com/x', { method: 'POST' }), env)).status).toBe(405);
  });
});
