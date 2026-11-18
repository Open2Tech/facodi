import { useTranslation } from 'react-i18next';
import { ThumbsDown, ThumbsUp } from 'lucide-react';
import { toast } from 'sonner';
import { useResourceFeedback } from '@/features/feedback/useResourceFeedback';
import { cn } from '@/lib/utils';

/** "Did this help?" for signed-in learners; answers stay private and feed the editorial review. */
export function ResourceFeedback({ resourceId, isVideo }: { resourceId: string; isVideo: boolean }) {
  const { t } = useTranslation();
  const { signedIn, value, ready, answer } = useResourceFeedback(resourceId);
  if (!signedIn || !ready) return null;
  return <ResourceFeedbackView isVideo={isVideo} value={value} pending={answer.isPending}
    onAnswer={helpful => answer.mutate(helpful, { onError: () => toast.error(t('resourceFeedback.failed')) })} />;
}

export function ResourceFeedbackView({ isVideo, value, pending, onAnswer }: {
  isVideo: boolean; value: boolean | null; pending: boolean; onAnswer: (helpful: boolean) => void;
}) {
  const { t } = useTranslation();
  const option = (helpful: boolean) => {
    const Icon = helpful ? ThumbsUp : ThumbsDown;
    const chosen = value === helpful;
    return <button type="button" aria-pressed={chosen} disabled={pending} onClick={() => onAnswer(helpful)}
      className={cn('inline-flex min-h-11 items-center gap-2 border px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-60',
        chosen ? 'border-foreground bg-primary text-primary-foreground' : 'border-input hover:border-foreground')}>
      <Icon className="h-4 w-4" aria-hidden="true" />{t(helpful ? 'resourceFeedback.yes' : 'resourceFeedback.no')}
    </button>;
  };
  return <section aria-labelledby="resource-feedback" className="flex flex-wrap items-center gap-x-5 gap-y-3 border border-input p-4">
    <h2 id="resource-feedback" className="text-base font-semibold">{t(isVideo ? 'resourceFeedback.questionVideo' : 'resourceFeedback.questionResource')}</h2>
    <div className="flex gap-2">{option(true)}{option(false)}</div>
    {value !== null && <p className="w-full text-sm text-muted-foreground" aria-live="polite">{t('resourceFeedback.thanks')}</p>}
  </section>;
}
