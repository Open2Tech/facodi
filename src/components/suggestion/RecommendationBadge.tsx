import { useTranslation } from 'react-i18next';
import { ArrowRightCircle, Ban, SearchCheck, type LucideIcon } from 'lucide-react';
import type { Recommendation } from '@/entities/suggestion/suggestion.types';
import { cn } from '@/lib/utils';

const TONES: Record<Recommendation, { icon: LucideIcon; fill: string }> = {
  fast_track: { icon: ArrowRightCircle, fill: 'bg-brand-mint' },
  review: { icon: SearchCheck, fill: 'bg-primary' },
  reject: { icon: Ban, fill: 'bg-brand-coral' },
};

/** The screening's recommendation to curators; it never decides on its own. */
export function RecommendationBadge({ recommendation, className }: { recommendation: Recommendation; className?: string }) {
  const { t } = useTranslation();
  const { icon: Icon, fill } = TONES[recommendation];
  return <span className={cn('inline-flex items-center gap-1.5 px-2 py-1 text-xs font-semibold text-ink', fill, className)}>
    <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />{t(`suggest.recommendation.${recommendation}`)}
  </span>;
}
