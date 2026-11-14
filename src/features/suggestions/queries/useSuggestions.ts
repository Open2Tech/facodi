import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { suggestionKeys } from '@/entities/suggestion/suggestion.keys';
import {
  listMySuggestions, listSuggestionQueue, listSuggestionUnits, reviewSuggestion, submitSuggestion,
} from '@/entities/suggestion/suggestion.api';
import { fetchPublicMetadata } from '@/entities/suggestion/metadata';
import type { Recognition } from '@/entities/suggestion/recognition';
import type { SuggestionDecision } from '@/entities/suggestion/suggestion.types';
import { canAccessFacodiRoute } from '@/entities/facodi/access';
import { courseKeys } from '@/entities/course/course.keys';
import { useAuth } from '@/features/auth/useAuth';

export function useSuggestionUnits() {
  return useQuery({ queryKey: suggestionKeys.unitOptions(), queryFn: ({ signal }) => listSuggestionUnits(signal), staleTime: 10 * 60_000 });
}

/** Public metadata for an analysed URL; a failed lookup is not retried, the form stays editable. */
export function usePublicMetadata(recognition: Recognition | null) {
  return useQuery({
    queryKey: suggestionKeys.metadata(recognition?.canonicalUrl ?? ''),
    queryFn: ({ signal }) => fetchPublicMetadata(recognition!, signal),
    enabled: !!recognition,
    retry: false,
    staleTime: Infinity,
  });
}

export function useMySuggestions() {
  const { user } = useAuth();
  return useQuery({
    queryKey: suggestionKeys.mine(user?.id ?? ''),
    queryFn: ({ signal }) => listMySuggestions(user!.id, signal),
    enabled: !!user,
  });
}

export function useSubmitSuggestion() {
  const { user } = useAuth();
  const client = useQueryClient();
  return useMutation({
    mutationFn: submitSuggestion,
    onSuccess: () => client.invalidateQueries({ queryKey: suggestionKeys.all(user?.id ?? '') }),
  });
}

export function useSuggestionQueue() {
  const { user, role } = useAuth();
  return useQuery({
    queryKey: suggestionKeys.queue(user?.id ?? ''),
    queryFn: ({ signal }) => listSuggestionQueue(signal),
    enabled: !!user && canAccessFacodiRoute(role, 'editor'),
  });
}

export function useReviewSuggestion() {
  const { user } = useAuth();
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, decision, note }: { id: string; decision: SuggestionDecision; note: string }) => reviewSuggestion(id, decision, note),
    // Approval adds a draft learning object, so editorial lists are refreshed too.
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: suggestionKeys.all(user?.id ?? '') });
      void client.invalidateQueries({ queryKey: courseKeys.all });
    },
  });
}
