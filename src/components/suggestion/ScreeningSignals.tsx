import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Check, X, type LucideIcon } from 'lucide-react';
import type { Screening } from '@/entities/suggestion/suggestion.types';
import { cn } from '@/lib/utils';

type Level = 'ok' | 'attention' | 'blocked';
const LEVELS: Record<Level, { icon: LucideIcon; fill: string }> = {
  ok: { icon: Check, fill: 'bg-brand-mint' },
  attention: { icon: AlertTriangle, fill: 'bg-primary' },
  blocked: { icon: X, fill: 'bg-brand-coral' },
};

/** The database's screening of a suggestion, as a short list of named signals. */
export function ScreeningSignals({ screening, provider, className }: { screening: Screening; provider: string; className?: string }) {
  const { t } = useTranslation();
  const providerName = t(`suggest.providers.${provider}`, { defaultValue: provider });
  const signals: { key: string; level: Level; text: React.ReactNode }[] = [
    { key: 'source', level: screening.providerRecognized ? 'ok' : 'attention',
      text: screening.providerRecognized ? t('suggest.signals.sourceKnown', { provider: providerName }) : t('suggest.signals.sourceGeneric') },
    { key: 'license', level: screening.license === 'open' ? 'ok' : screening.license === 'restricted' ? 'blocked' : 'attention',
      text: t(`suggest.signals.license.${screening.license}`) },
    { key: 'unit', level: screening.unitSelected ? 'ok' : 'attention',
      text: screening.unitSelected ? t('suggest.signals.unitSelected') : t('suggest.signals.unitMissing') },
    { key: 'duplicate', level: screening.duplicate ? 'blocked' : 'ok',
      text: screening.duplicate
        ? <>{t('suggest.signals.duplicate')} <Link className="font-semibold underline underline-offset-4" to={`/resources/${encodeURIComponent(screening.duplicate.slug)}`}>{t('suggest.signals.openExisting')}</Link></>
        : t('suggest.signals.unique') },
  ];
  return <ul className={cn('space-y-2', className)}>
    {signals.map(({ key, level, text }) => {
      const { icon: Icon, fill } = LEVELS[level];
      return <li key={key} className="flex items-start gap-2.5 text-sm">
        <span className={cn('mt-0.5 grid h-5 w-5 shrink-0 place-items-center text-ink', fill)}>
          <Icon className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="sr-only">{t(`suggest.signals.level.${level}`)}</span>
        </span>
        <span className="min-w-0">{text}</span>
      </li>;
    })}
  </ul>;
}
