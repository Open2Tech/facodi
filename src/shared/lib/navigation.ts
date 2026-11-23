const privateDestinations = [
  '/dashboard',
  '/profile',
  '/notes',
  '/playlists/submit',
  '/community/join',
  '/suggest',
  '/editor',
  '/editor/study-paths',
  '/editor/sequence-order',
  '/editor/course-quality',
  '/editor/project-credits',
  '/editor/email-templates',
  '/editor/community',
  '/editor/playlists',
  '/editor/suggestions',
  '/admin',
];
/** Public pages that invite signing in to save something (notes, sequence progress) and expect the learner back. */
const contentDestination = /^\/(?:modules|resources|sequences)\/[\w.-]+$|^\/courses\/[\w.-]+(?:\/units\/[\w.-]+)?$/;
const internalOrigin = 'https://internal.invalid';

function internalUrl(value: unknown): URL | null {
  if (typeof value !== 'string' || !value || /[\\\s]/.test(value) || [...value].some(char => char.charCodeAt(0) < 32) || !value.startsWith('/') || value.startsWith('//')) return null;
  const url = new URL(value, internalOrigin);
  return url.origin === internalOrigin ? url : null;
}

export function safeReturnPath(value: string | null | undefined): string {
  const url = internalUrl(value);
  return url && (privateDestinations.includes(url.pathname) || contentDestination.test(url.pathname))
    ? `${url.pathname}${url.search}${url.hash}`
    : '/dashboard';
}

/** Use a catalogue origin only when it points to the expected local listing. */
export function catalogReturnPath(state: unknown, fallback: string): string {
  const value = state && typeof state === 'object' && 'catalogReturn' in state ? state.catalogReturn : null;
  const url = internalUrl(value);
  return url && url.pathname === new URL(fallback, internalOrigin).pathname
    ? `${url.pathname}${url.search}${url.hash}`
    : fallback;
}

export function safeExternalUrl(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password ? url.href : undefined;
  } catch {
    return undefined;
  }
}
