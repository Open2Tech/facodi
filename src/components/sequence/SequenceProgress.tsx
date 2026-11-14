import { useTranslation } from 'react-i18next';
import { completionPercent } from '@/entities/sequence/sequence';
import { cn } from '@/lib/utils';

/** Square progress track; the visible text carries the numbers, the bar only illustrates them. */
export function SequenceProgress({ completed, total, label, className }: { completed: number; total: number; label: string; className?: string }) {
  const { t } = useTranslation();
  const percent = completionPercent(completed, total);
  return <div className={className}>
    <div className="flex items-baseline justify-between gap-3 text-sm">
      <span className="font-medium">{t('sequences.progressCount', { completed, total })}</span>
      <span className="font-mono tabular-nums text-muted-foreground">{percent}%</span>
    </div>
    <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={total} aria-valuenow={completed}
      aria-valuetext={t('sequences.progressCount', { completed, total })} className="mt-2 h-2.5 border border-foreground bg-background">
      <div className={cn('h-full transition-[width] duration-500 ease-out motion-reduce:transition-none', percent === 100 ? 'bg-brand-mint' : 'bg-primary')}
        style={{ width: `${percent}%` }} />
    </div>
  </div>;
}
