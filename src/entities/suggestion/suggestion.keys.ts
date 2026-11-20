export const suggestionKeys = {
  unitOptions: (contextUnitId?: string) => ['facodi', 'suggestion', 'units', 'public', contextUnitId ?? null] as const,
  metadata: (canonicalUrl: string) => ['facodi', 'suggestion', 'metadata', canonicalUrl] as const,
  all: (userId: string) => ['facodi', 'private', userId, 'suggestions'] as const,
  mine: (userId: string) => ['facodi', 'private', userId, 'suggestions', 'mine'] as const,
  queue: (userId: string) => ['facodi', 'private', userId, 'suggestions', 'queue'] as const,
  autoPublished: (userId: string) => ['facodi', 'private', userId, 'suggestions', 'auto-published'] as const,
};
