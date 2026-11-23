import { HOME_SNAPSHOT_FILE, isAppRoute, isPrivateRoute, legacyPublicRedirect, NOINDEX, SECURITY_HEADERS } from './routes';

/** Cloudflare Workers static assets binding (only the part this Worker uses). */
interface AssetsBinding { fetch(request: Request): Promise<Response> }
export interface Env { ASSETS: AssetsBinding }

const PREVIEW_HOST = /\.workers\.dev$/;

function respond(source: Response, status: number, url: URL, noindex: boolean) {
  const headers = new Headers(source.headers);
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) headers.set(name, value);
  if (noindex || PREVIEW_HOST.test(url.hostname)) headers.set('X-Robots-Tag', NOINDEX);
  return new Response(source.body, { status, statusText: status === 404 ? 'Not Found' : 'OK', headers });
}

const asset = (env: Env, request: Request, url: URL, pathname: string) =>
  env.ASSETS.fetch(new Request(new URL(pathname, url), { method: request.method, headers: request.headers }));

/**
 * Runs for "/" (run_worker_first) and for every request no static file matched
 * (assets.not_found_handling = "none"). Static files keep being served directly by Cloudflare.
 *
 * - "/" gets the home snapshot (plain HTML for crawlers; React replaces it on load).
 * - Known app routes get the SPA shell with 200, as the SPA fallback did.
 * - Anything else gets the same shell with a real 404, so typos and dead links stop being soft 404s.
 */
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'GET, HEAD', ...SECURITY_HEADERS } });
    }
    const url = new URL(request.url);
    const redirect = legacyPublicRedirect(url.pathname);
    if (redirect) {
      const target = new URL(redirect, url.origin);
      target.search = url.search;
      return new Response(null, {
        status: 301, headers: {
          Location: target.toString(), 'Cache-Control': 'public, max-age=3600', ...SECURITY_HEADERS,
        },
      });
    }
    if (url.pathname === '/') {
      const home = await asset(env, request, url, `/${HOME_SNAPSHOT_FILE.replace(/\.html$/, '')}`);
      if (home.ok) return respond(home, 200, url, false);
    }
    const shell = await asset(env, request, url, '/');
    const known = isAppRoute(url.pathname);
    return respond(shell, known ? 200 : 404, url, !known || isPrivateRoute(url.pathname));
  },
};
