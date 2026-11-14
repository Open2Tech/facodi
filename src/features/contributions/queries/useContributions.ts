import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { contributionKeys } from '@/entities/contribution/contribution.keys';
import {
  countBlueprints, listBlueprints, listCourseOptions, listMyPlaylists, listPendingPlaylists,
  listPlaylistItems, listUnitOptions, reviewBlueprint, reviewPlaylist, submitPlaylist,
} from '@/entities/contribution/contribution.api';
import type { BlueprintDecision, BlueprintStatus, PlaylistDecision } from '@/entities/contribution/contribution.types';
import { canAccessFacodiRoute } from '@/entities/facodi/access';
import { courseKeys } from '@/entities/course/course.keys';
import { useAuth } from '@/features/auth/useAuth';

function useEditorAccess() {
  const { user, role } = useAuth();
  return { userId: user?.id ?? '', allowed: !!user && canAccessFacodiRoute(role, 'editor') };
}

export function useCourseOptions() {
  return useQuery({ queryKey: contributionKeys.courseOptions(), queryFn: ({ signal }) => listCourseOptions(signal) });
}
export function useUnitOptions(courseId: string) {
  return useQuery({
    queryKey: contributionKeys.unitOptions(courseId),
    queryFn: ({ signal }) => listUnitOptions(courseId, signal),
    enabled: !!courseId,
  });
}

export function useMyPlaylists() {
  const { user } = useAuth();
  return useQuery({
    queryKey: contributionKeys.myPlaylists(user?.id ?? ''),
    queryFn: ({ signal }) => listMyPlaylists(user!.id, signal),
    enabled: !!user,
  });
}
export function useSubmitPlaylist() {
  const { user } = useAuth();
  const client = useQueryClient();
  return useMutation({
    mutationFn: submitPlaylist,
    onSuccess: () => client.invalidateQueries({ queryKey: contributionKeys.playlists(user?.id ?? '') }),
  });
}

export function usePendingPlaylists() {
  const { userId, allowed } = useEditorAccess();
  return useQuery({ queryKey: contributionKeys.pendingPlaylists(userId), queryFn: ({ signal }) => listPendingPlaylists(signal), enabled: allowed });
}
export function usePlaylistItems(playlistId: string | undefined) {
  const { userId, allowed } = useEditorAccess();
  return useQuery({
    queryKey: contributionKeys.playlistItems(userId, playlistId ?? ''),
    queryFn: ({ signal }) => listPlaylistItems(playlistId!, signal),
    enabled: allowed && !!playlistId,
  });
}
export function useReviewPlaylist() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, decision, note }: { id: string; decision: PlaylistDecision; note: string }) => reviewPlaylist(id, decision, note),
    // Approval publishes catalogue resources, so public lists are refreshed too.
    onSuccess: () => client.invalidateQueries({ queryKey: courseKeys.all }),
  });
}

export function useBlueprints(status: BlueprintStatus, page: number) {
  const { userId, allowed } = useEditorAccess();
  return useQuery({
    queryKey: contributionKeys.blueprintPage(userId, status, page),
    queryFn: ({ signal }) => listBlueprints(status, page, signal),
    placeholderData: (previous, previousQuery) => previousQuery?.queryKey[2] === userId && previousQuery.queryKey[4] === status ? previous : undefined,
    enabled: allowed,
  });
}
export function useBlueprintCounts() {
  const { userId, allowed } = useEditorAccess();
  return useQuery({ queryKey: contributionKeys.blueprintCounts(userId), queryFn: ({ signal }) => countBlueprints(signal), enabled: allowed });
}
export function useReviewBlueprint() {
  const { userId } = useEditorAccess();
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, decision, note }: { id: string; decision: BlueprintDecision; note: string }) => reviewBlueprint(id, decision, note),
    onSuccess: () => client.invalidateQueries({ queryKey: contributionKeys.blueprints(userId) }),
  });
}
