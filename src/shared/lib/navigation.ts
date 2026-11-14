const privateDestinations = ['/dashboard', '/profile', '/notes', '/playlists/submit', '/suggest', '/editor', '/editor/study-paths', '/editor/playlists', '/editor/suggestions', '/admin'];
/** Public pages that invite signing in to save something (notes, sequence progress) and expect the learner back. */
const contentDestination = /^\/(?:resources|sequences)\/[\w.-]+$/;

export function safeReturnPath(value: string | null | undefined): string {
  if (!value || /[\\\s]/.test(value) || [...value].some(char => char.charCodeAt(0) < 32) || !value.startsWith('/') || value.startsWith('//')) return '/dashboard';
  const url = new URL(value, 'https://internal.invalid');
  return url.origin === 'https://internal.invalid' && (privateDestinations.includes(url.pathname) || contentDestination.test(url.pathname))
    ? `${url.pathname}${url.search}`
    : '/dashboard';
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
