import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/useAuth';
import { useSequences } from '@/features/sequences/useSequences';
import { listMyCompletions } from '@/entities/sequence/sequence.api';
import { sequenceKeys } from '@/entities/sequence/sequence.keys';
import { exploredUnitCodes } from '@/entities/sequence/courseMap';

const NONE: ReadonlySet<string> = new Set();

/** Codes of the units the signed-in learner has explored; empty for visitors. Shares the milestones cache. */
export function useExploredUnits() {
  const { user } = useAuth();
  const completions = useQuery({
    queryKey: sequenceKeys.milestones(user?.id ?? ''),
    queryFn: ({ signal }) => listMyCompletions(user!.id, signal),
    enabled: !!user,
  });
  const sequences = useSequences(null, !!user);
  const explored = useMemo(() => (completions.data && sequences.data
    ? exploredUnitCodes(completions.data, sequences.data) : NONE), [completions.data, sequences.data]);
  return { signedIn: !!user, ready: !!user && completions.isSuccess && sequences.isSuccess, explored };
}
