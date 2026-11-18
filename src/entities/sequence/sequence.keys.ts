export const sequenceKeys = {
  list: (unitCode: string | null) => ['facodi', 'sequences', 'public', unitCode ?? 'all'] as const,
  detail: (slug: string) => ['facodi', 'sequence', slug] as const,
  forVideo: (videoId: string) => ['facodi', 'sequences', 'public', 'video', videoId] as const,
  videoCompletion: (userId: string, videoId: string) => ['facodi', 'private', userId, 'sequence-progress', 'video', videoId] as const,
  progressAll: (userId: string) => ['facodi', 'private', userId, 'sequence-progress'] as const,
  progress: (userId: string, playlistId: string) => ['facodi', 'private', userId, 'sequence-progress', playlistId] as const,
  overview: (userId: string) => ['facodi', 'private', userId, 'sequence-progress', 'overview'] as const,
  milestones: (userId: string) => ['facodi', 'private', userId, 'sequence-progress', 'milestones'] as const,
};
