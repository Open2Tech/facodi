import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/useAuth';
import { getMyFeedback, saveMyFeedback } from '@/entities/feedback/feedback.api';
import { feedbackKeys } from '@/entities/feedback/feedback.keys';

export function useResourceFeedback(learningObjectId: string | null | undefined) {
  const { user } = useAuth();
  const client = useQueryClient();
  const key = feedbackKeys.mine(user?.id ?? '', learningObjectId ?? '');
  const query = useQuery({
    queryKey: key,
    queryFn: ({ signal }) => getMyFeedback(learningObjectId!, signal),
    enabled: !!user && !!learningObjectId,
  });
  const answer = useMutation({
    mutationFn: (helpful: boolean) => saveMyFeedback(learningObjectId!, helpful),
    onSuccess: helpful => client.setQueryData(key, helpful),
  });
  return { signedIn: !!user, value: query.data ?? null, ready: !user || query.isSuccess, answer };
}
