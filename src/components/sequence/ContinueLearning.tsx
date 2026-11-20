import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/useAuth';
import { useMySequences, useSequence, useSequenceProgress } from '@/features/sequences/useSequences';
import { nextItem } from '@/entities/sequence/sequence';
import { cn } from '@/lib/utils';
import { SequenceProgress } from './SequenceProgress';

/** Same page size as the dashboard overview, so both read one cached query. */
const RECENT = 4;

/**
 * "Pick up where you left off": the most recently active sequence that is not finished, with its next
 * lesson. Renders nothing for visitors or for learners with nothing in progress. The sequence page opens
 * on the next unfinished lesson by itself, so the link needs no lesson parameter.
 */
export function ContinueLearning({ className }: { className?: string }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const mine = useMySequences(RECENT);
  const current = mine.data?.items.find(item => item.total > 0 && item.completed < item.total) ?? null;
  const sequence = useSequence(current?.slug ?? '', !!current);
  const progress = useSequenceProgress(sequence.data?.id);
  if (!user || !current) return null;
  const next = sequence.data && progress.data ? nextItem(sequence.data.items, progress.data) : null;
  return <section aria-labelledby="continue-learning" className={cn('grid gap-6 border border-foreground border-t-4 border-t-brand-pink bg-card p-6 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end sm:p-8', className)}>
    <div className="min-w-0">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="continue-learning" className="text-2xl font-semibold tracking-[-0.02em] [text-wrap:balance] sm:text-3xl">{current.title}</h2>
        <span className="border border-foreground bg-brand-pink px-2.5 py-0.5 font-mono text-xs font-semibold uppercase tracking-[0.08em] text-brand-ink">
          {t('continueLearning.eyebrow')}
        </span>
      </div>
      {next && <p className="mt-2 text-muted-foreground">{t('continueLearning.next', { title: next.title })}</p>}
      <SequenceProgress className="mt-5 max-w-md" completed={current.completed} total={current.total} label={t('sequences.progressLabel', { title: current.title })} />
    </div>
    <Button size="lg" asChild>
      <Link to={`/sequences/${encodeURIComponent(current.slug)}`}>{t('continueLearning.cta')}<ArrowRight /></Link>
    </Button>
  </section>;
}
