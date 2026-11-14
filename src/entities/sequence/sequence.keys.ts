export const sequenceKeys = {
  list: (unitCode: string | null) => ['facodi', 'sequences', 'public', unitCode ?? 'all'] as const,
  detail: (slug: string) => ['facodi', 'sequence', slug] as const,
  progressAll: (userId: string) => ['facodi', 'private', userId, 'sequence-progress'] as const,
  progress: (userId: string, playlistId: string) => ['facodi', 'private', userId, 'sequence-progress', playlistId] as const,
  overview: (userId: string) => ['facodi', 'private', userId, 'sequence-progress', 'overview'] as const,
};
