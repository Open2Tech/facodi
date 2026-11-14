import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabase/supabaseClient';
import { getSupabaseErrorMessage } from '@/shared/api/supabase/supabaseErrors';

/** Editorial study objectives: explicitly not institutional learning outcomes.
 * The Supabase RLS policy returns only proposals attached to published UCs. */
export interface UnitOutcome {
  id: string;
  statement: string;
  position: number | null;
}

async function loadUnitOutcomes(learningObjectId: string, signal?: AbortSignal): Promise<UnitOutcome[]> {
  const { data, error } = await supabase.from('learning_outcomes')
    .select('id, statement, position')
    .eq('learning_object_id', learningObjectId)
    .order('position', { nullsFirst: false })
    .order('id')
    .limit(12)
    .abortSignal(signal);
  if (error) throw new Error(getSupabaseErrorMessage(error));
  return data ?? [];
}

export function useUnitOutcomes(learningObjectId: string | null | undefined) {
  return useQuery({
    queryKey: ['facodi', 'published-study-outcomes', learningObjectId ?? ''],
    queryFn: ({ signal }) => loadUnitOutcomes(learningObjectId!, signal),
    enabled: Boolean(learningObjectId),
    staleTime: 5 * 60 * 1000,
  });
}
