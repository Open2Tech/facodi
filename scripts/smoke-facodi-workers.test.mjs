import { afterEach, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

it.each([
  ['<div id="root"><main data-seo-shell><h1>FACODI</h1></main></div>', true],
  ['<main data-seo-shell><h1>FACODI</h1></main>', false],
])('checks the React mount point in the /about snapshot: %s', async (snapshot, hasRoot) => {
  const nextRoute = new Error('Reached the route after /about');
  const request = vi.fn(async url => {
    const { pathname } = new URL(url);
    if (pathname === '/community') throw nextRoute;
    expect(['/', '/about']).toContain(pathname);
    return new Response(pathname === '/' ? '<div id="root"></div>' : snapshot, {
      headers: {
        'content-type': 'text/html',
        'x-robots-tag': 'noindex',
        'x-content-type-options': 'nosniff',
      },
    });
  });
  vi.stubGlobal('fetch', request);

  const smoke = import('./smoke-facodi-workers.mjs');
  if (hasRoot) {
    await expect(smoke).rejects.toBe(nextRoute);
  } else {
    await expect(smoke).rejects.toThrow('Missing React root at /about');
  }
});
