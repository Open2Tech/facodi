export const feedbackKeys = {
  mine: (userId: string, learningObjectId: string) => ['facodi', 'private', userId, 'resource-feedback', learningObjectId] as const,
};
