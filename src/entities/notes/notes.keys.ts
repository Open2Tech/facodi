export const notesKeys = {
  mine: (userId: string) => ['facodi', 'private', userId, 'notes'] as const,
};
