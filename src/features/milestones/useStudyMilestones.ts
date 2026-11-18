import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/useAuth';
import { useNotebook } from '@/features/notes/useNotebook';
import { useSequences } from '@/features/sequences/useSequences';
import { listMyCompletions } from '@/entities/sequence/sequence.api';
import { sequenceKeys } from '@/entities/sequence/sequence.keys';
import { studyMilestones } from '@/entities/sequence/milestones';

/** The signed-in learner's private milestones and weekly streak. */
export function useStudyMilestones() {
  const { user } = useAuth();
  const completions = useQuery({
    queryKey: sequenceKeys.milestones(user?.id ?? ''),
    queryFn: ({ signal }) => listMyCompletions(user!.id, signal),
    enabled: !!user,
  });
  const sequences = useSequences(null, !!user);
  const notebook = useNotebook();
  const data = useMemo(() => (completions.data && sequences.data
    ? studyMilestones({
      completions: completions.data,
      itemCounts: new Map(sequences.data.map(sequence => [sequence.id, sequence.itemCount])),
      notes: notebook.all.length,
    })
    : undefined), [completions.data, sequences.data, notebook.all.length]);
  return {
    data,
    isPending: completions.isPending || sequences.isPending,
    isError: completions.isError || sequences.isError,
    retry: () => { void completions.refetch(); void sequences.refetch(); },
  };
}
