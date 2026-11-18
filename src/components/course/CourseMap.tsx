import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react';

/** Square marker on a curriculum row the learner has explored (a lesson done in one of its sequences). */
export function ExploredMark() {
  const { t } = useTranslation();
  return <span className="ml-2 inline-grid h-5 w-5 place-items-center border border-foreground bg-primary align-middle text-ink" title={t('courseMap.exploredUnit')}>
    <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden="true" /><span className="sr-only">{t('courseMap.exploredUnit')}</span>
  </span>;
}

/** One line above the plan: how much of the course map the learner has painted so far. */
export function CourseMapSummary({ explored, total }: { explored: number; total: number }) {
  const { t } = useTranslation();
  return <p className="mt-3 flex items-center gap-2 text-sm" aria-live="polite">
    <span className="h-2.5 w-2.5 shrink-0 border border-foreground bg-primary" aria-hidden="true" />
    {explored ? t('courseMap.summary', { count: explored, total }) : t('courseMap.start')}
  </p>;
}
