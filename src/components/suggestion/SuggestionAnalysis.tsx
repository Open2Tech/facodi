import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Clock, Loader2, SearchX } from 'lucide-react';
import type { SuggestionAnalysis as Analysis } from '@/entities/suggestion/suggestion.types';
import { cn } from '@/lib/utils';

/** Advisory result of the automatic analysis: proposed units with the reason, never a decision. */
export function SuggestionAnalysis({ analysis, className }: { analysis: Analysis; className?: string }) {
  const { t } = useTranslation();
  const status = (icon: React.ReactNode, text: string) => <p className="flex items-start gap-2 text-sm text-muted-foreground">
    {icon}<span>{text}</span>
  </p>;
  return <div className={cn('space-y-3', className)}>
    {analysis.state === 'pending' && status(<Loader2 className="mt-0.5 h-4 w-4 shrink-0 motion-safe:animate-spin" aria-hidden="true" />, t('suggest.analysis.pending'))}
    {analysis.state === 'waiting' && status(<Clock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />, t('suggest.analysis.waiting'))}
    {analysis.state === 'failed' && status(<AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />, t('suggest.analysis.failed'))}
    {analysis.state === 'done' && !analysis.matches.length && status(<SearchX className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />, t('suggest.analysis.none'))}
    {!!analysis.matches.length && <ul className="divide-y divide-input border-y border-input">
      {analysis.matches.map(match => <li key={match.unitId} className="py-3">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <Link className="font-medium underline underline-offset-4"
            to={`/courses/${encodeURIComponent(match.courseSlug)}/units/${encodeURIComponent(match.unitSlug)}`}>{match.title}</Link>
          {match.courseCode && <span className="font-mono text-xs text-muted-foreground">{match.courseCode}</span>}
          <span className={cn('px-1.5 py-0.5 text-xs font-semibold text-ink', match.fit === 'strong' ? 'bg-brand-mint' : 'bg-primary')}>
            {t(`suggest.analysis.fit.${match.fit}`)}
          </span>
        </div>
        <p lang="pt" className="mt-1 max-w-prose text-sm">{match.reason}</p>
      </li>)}
    </ul>}
    {!!analysis.topics.length && <p className="text-sm">
      <span className="text-muted-foreground">{t('suggest.analysis.topics')}: </span><span lang="pt">{analysis.topics.join(' · ')}</span>
    </p>}
    {(analysis.state === 'done' || analysis.state === 'pending') && <p className="max-w-prose text-xs text-muted-foreground">{t('suggest.analysis.disclaimer')}</p>}
  </div>;
}
