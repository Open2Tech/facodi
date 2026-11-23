import { LEGAL_DOCUMENTS } from '../components/legal/legalDocuments';

/**
 * Server-side view of the React Router table in src/App.tsx, used by the Cloudflare Worker to
 * answer requests that match no static file. Kept in sync by routes.test.ts, which reads App.tsx.
 * Relative imports only: wrangler bundles this file without the Vite "@/" alias.
 */

/** Built by scripts/generate-seo-snapshots.mjs; served for "/" only. */
export const HOME_SNAPSHOT_FILE = '__home.html';

/** Permanently map retired public URLs to their current equivalents, without blanket SPA rewrites. */
const LEGACY_PUBLIC_REDIRECTS: Readonly<Record<string, string>> = {
  '/pt': '/',
  '/sobre': '/about',
  '/roadmap': '/about',
  '/unidades-curriculares': '/units',
  '/slides': '/sequences',
  '/pt/slides': '/sequences',
  '/explore/content': '/resources',
  '/explore': '/resources',
  '/infrastructure': '/about',
  '/academic-model': '/how-it-works',
};

export function legacyPublicRedirect(pathname: string): string | null {
  return LEGACY_PUBLIC_REDIRECTS[pathname.length > 1 ? pathname.replace(/[/]+$/, '') : pathname] ?? null;
}

const STATIC_ROUTES = new Set([
  '/', '/about', '/admin', '/auth', '/auth/callback', '/auth/reset-password', '/community', '/community/join',
  '/courses', '/dashboard', '/editor', '/editor/community', '/editor/course-quality', '/editor/email-templates',
  '/editor/playlists', '/editor/project-credits', '/editor/sequence-order', '/editor/study-paths', '/editor/suggestions',
  '/facodi', '/how-it-works', '/login', '/modules', '/notes', '/playlists/submit', '/profile', '/resources',
  '/sequences', '/suggest', '/units',
  ...LEGAL_DOCUMENTS.map(document => `/${document}`),
]);

/**
 * Content pages. A slug published after the last build has no snapshot yet, so these still get the
 * app shell with 200; the page itself marks a missing item noindex. Only paths outside every route
 * are answered with 404.
 */
const DYNAMIC_ROUTES = [
  /^\/courses\/[^/]+$/,
  /^\/courses\/[^/]+\/units\/[^/]+$/,
  /^\/modules\/[^/]+$/,
  /^\/resources\/[^/]+$/,
  /^\/sequences\/[^/]+$/,
];

/** Mirrors the noindex prefixes in public/_headers, which do not apply to Worker responses. */
const PRIVATE_PREFIXES = ['/login', '/auth', '/dashboard', '/profile', '/editor', '/admin', '/notes', '/suggest', '/playlists', '/community/join'];

const normalize = (pathname: string) => (pathname.length > 1 ? pathname.replace(/\/+$/, '') || '/' : pathname);

export function isAppRoute(pathname: string) {
  const path = normalize(pathname);
  return STATIC_ROUTES.has(path) || DYNAMIC_ROUTES.some(route => route.test(path));
}

export function isPrivateRoute(pathname: string) {
  return PRIVATE_PREFIXES.some(prefix => pathname.startsWith(prefix));
}

/** Same protections public/_headers gives to static files. */
export const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

export const NOINDEX = 'noindex, nofollow, noarchive';
