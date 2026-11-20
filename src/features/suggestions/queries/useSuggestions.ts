import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { suggestionKeys } from '@/entities/suggestion/suggestion.keys';
import {
  listAutoPublishedSuggestions, listMySuggestions, listSuggestionQueue, listSuggestionUnits, parseAnalysis, retrySuggestionAnalysis, reviewSuggestion,
  submitSuggestion,
} from '@/entities/suggestion/suggestion.api';
import { fetchPublicMetadata } from '@/entities/suggestion/metadata';
import type { Recognition } from '@/entities/suggestion/recognition';
import type { SuggestionDecision, SuggestionSummary } from '@/entities/suggestion/suggestion.types';
import { canAccessFacodiRoute } from '@/entities/facodi/access';
import { courseKeys } from '@/entities/course/course.keys';
import { useAuth } from '@/features/auth/useAuth';

export function useSuggestionUnits(contextUnitId?: string) {
  return useQuery({
    queryKey: suggestionKeys.unitOptions(contextUnitId),
    queryFn: ({ signal }) => listSuggestionUnits(signal, contextUnitId),
    staleTime: 10 * 60_000,
  });
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

/** Polls only while an analysis is running; a job waiting for tomorrow's budget does not keep the page busy. */
const ANALYSIS_POLL_MS = 5_000;
const pollWhileAnalysing = ({ state }: { state: { data?: SuggestionSummary[] } }) =>
  state.data?.some(item => parseAnalysis(item.analysis_jobs)?.state === 'pending') ? ANALYSIS_POLL_MS : false;

export function useMySuggestions() {
  const { user } = useAuth();
  return useQuery({
    queryKey: suggestionKeys.mine(user?.id ?? ''),
    queryFn: ({ signal }) => listMySuggestions(user!.id, signal),
    enabled: !!user,
    refetchInterval: pollWhileAnalysing,
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
    refetchInterval: pollWhileAnalysing,
  });
}

export function useAutoPublishedSuggestions() {
  const { user, role } = useAuth();
  return useQuery({
    queryKey: suggestionKeys.autoPublished(user?.id ?? ''),
    queryFn: ({ signal }) => listAutoPublishedSuggestions(signal),
    enabled: !!user && canAccessFacodiRoute(role, 'editor'),
  });
}

export function useReviewSuggestion() {
  const { user } = useAuth();
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, decision, note, unitId }: { id: string; decision: SuggestionDecision; note: string; unitId?: string }) =>
      reviewSuggestion(id, decision, note, unitId),
    // Approval adds a draft learning object, so editorial lists are refreshed too.
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: suggestionKeys.all(user?.id ?? '') });
      void client.invalidateQueries({ queryKey: courseKeys.all });
    },
  });
}

export function useRetrySuggestionAnalysis() {
  const { user } = useAuth();
  const client = useQueryClient();
  return useMutation({
    mutationFn: retrySuggestionAnalysis,
    onSuccess: () => client.invalidateQueries({ queryKey: suggestionKeys.all(user?.id ?? '') }),
  });
}
