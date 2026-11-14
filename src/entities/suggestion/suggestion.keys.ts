export const suggestionKeys = {
  unitOptions: () => ['facodi', 'suggestion', 'units', 'public'] as const,
  metadata: (canonicalUrl: string) => ['facodi', 'suggestion', 'metadata', canonicalUrl] as const,
  all: (userId: string) => ['facodi', 'private', userId, 'suggestions'] as const,
  mine: (userId: string) => ['facodi', 'private', userId, 'suggestions', 'mine'] as const,
  queue: (userId: string) => ['facodi', 'private', userId, 'suggestions', 'queue'] as const,
};
