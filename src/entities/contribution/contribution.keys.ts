import type { BlueprintStatus } from '@/entities/contribution/contribution.types';

export const contributionKeys = {
  courseOptions: () => ['facodi', 'contribution', 'courses', 'public'] as const,
  unitOptions: (courseId: string) => ['facodi', 'contribution', 'units', 'public', courseId] as const,
  playlists: (userId: string) => ['facodi', 'private', userId, 'playlists'] as const,
  myPlaylists: (userId: string) => ['facodi', 'private', userId, 'playlists', 'mine'] as const,
  pendingPlaylists: (userId: string) => ['facodi', 'private', userId, 'playlists', 'pending'] as const,
  playlistItems: (userId: string, playlistId: string) => ['facodi', 'private', userId, 'playlists', 'items', playlistId] as const,
  blueprints: (userId: string) => ['facodi', 'private', userId, 'blueprints'] as const,
  blueprintPage: (userId: string, status: BlueprintStatus, page: number) => ['facodi', 'private', userId, 'blueprints', status, page] as const,
  blueprintCounts: (userId: string) => ['facodi', 'private', userId, 'blueprints', 'counts'] as const,
};
