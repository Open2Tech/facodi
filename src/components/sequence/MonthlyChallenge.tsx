import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSequence } from '@/features/sequences/useSequences';
import { challengeFor, getCommunityCompletions, goalPercent } from '@/entities/sequence/monthlyChallenge';
import { cn } from '@/lib/utils';

/** The month's spotlight sequence with the community's anonymous total. Nothing renders off-calendar. */
export function MonthlyChallenge({ className, today = new Date() }: { className?: string; today?: Date }) {
  const challenge = challengeFor(today);
  const sequence = useSequence(challenge?.slug ?? '', !!challenge);
  const total = useQuery({
    queryKey: ['facodi', 'sequences', 'public', 'challenge', challenge?.slug ?? '', challenge?.month ?? ''],
    queryFn: ({ signal }) => getCommunityCompletions(challenge!, signal),
    enabled: !!challenge, staleTime: 10 * 60_000, retry: false,
  });
  if (!challenge || !sequence.data) return null;
  return <MonthlyChallengeView className={className} month={challenge.from} slug={challenge.slug} title={sequence.data.title}
    lessons={sequence.data.items.length} goal={challenge.goal} total={total.data ?? null} />;
}

export function MonthlyChallengeView({ className, month, slug, title, lessons, goal, total }: {
  className?: string; month: Date; slug: string; title: string; lessons: number; goal: number; total: number | null;
}) {
  const { t, i18n } = useTranslation();
  const monthName = new Intl.DateTimeFormat(i18n.language, { month: 'long' }).format(month);
  const percent = goalPercent(total, goal);
  return <section aria-labelledby="monthly-challenge" className={cn('border border-foreground bg-ink p-6 text-ink-foreground sm:p-8', className)}>
    <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.1em] text-ink-foreground/80">
      <span className="h-2.5 w-2.5 border border-ink-foreground bg-brand-pink" aria-hidden="true" />{t('monthlyChallenge.eyebrow', { month: monthName })}
    </p>
    <div className="mt-3 grid gap-6 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
      <div className="min-w-0">
        <h2 id="monthly-challenge" className="text-2xl font-semibold tracking-[-0.02em] [text-wrap:balance] sm:text-3xl">{title}</h2>
        <p className="mt-2 max-w-prose text-ink-foreground/80">{t('monthlyChallenge.text', { count: lessons, goal })}</p>
        <div className="mt-5 max-w-md">
          {total != null && <div className="mb-2 h-3 border border-ink-foreground" role="progressbar" aria-valuemin={0} aria-valuemax={goal} aria-valuenow={Math.min(goal, Math.max(0, total ?? 0))}
            aria-label={t('monthlyChallenge.progressLabel')}>
            <div className="h-full bg-primary" style={{ width: `${percent}%` }} />
          </div>}
          <p className="flex items-center gap-2 text-sm text-ink-foreground/80">
            <Users className="h-4 w-4 shrink-0" aria-hidden="true" />
            {total != null ? t('monthlyChallenge.total', { count: total, goal }) : t('monthlyChallenge.goal', { goal })}
          </p>
        </div>
      </div>
      <Button size="lg" asChild>
        <Link to={`/sequences/${encodeURIComponent(slug)}`}>{t('monthlyChallenge.cta')}<ArrowRight /></Link>
      </Button>
    </div>
  </section>;
}
