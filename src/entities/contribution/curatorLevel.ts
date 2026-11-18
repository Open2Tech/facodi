/**
 * Curation levels earned from contributions the editorial team approved (resource suggestions and playlists).
 * Automatic levels only; becoming a guest editor stays an invitation from the team (app_metadata.role).
 */
export const CURATOR_LEVELS = [
  { key: 'collaboration', min: 1 },
  { key: 'curation', min: 5 },
] as const;

export type CuratorLevelKey = typeof CURATOR_LEVELS[number]['key'];

const APPROVED_SUGGESTION = new Set(['approved']);
const APPROVED_PLAYLIST = new Set(['approved', 'published']);

export function approvedContributions(suggestions: readonly { status: string }[], playlists: readonly { status: string }[]) {
  return suggestions.filter(item => APPROVED_SUGGESTION.has(item.status)).length
    + playlists.filter(item => APPROVED_PLAYLIST.has(item.status)).length;
}

export function curatorLevel(approved: number) {
  const reached = CURATOR_LEVELS.filter(level => approved >= level.min);
  const current = reached[reached.length - 1] ?? null;
  const next = CURATOR_LEVELS.find(level => approved < level.min) ?? null;
  return {
    approved,
    level: current ? { key: current.key as CuratorLevelKey, number: reached.length } : null,
    next: next ? { key: next.key as CuratorLevelKey, number: CURATOR_LEVELS.indexOf(next) + 1, remaining: next.min - approved } : null,
  };
}
