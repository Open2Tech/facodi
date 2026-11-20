import { ArrowRight, BookOpen, BookOpenCheck, Layers, ListVideo, Shapes, type LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

type LearningPart = 'course' | 'unit' | 'module' | 'sequence';
export type LearningFocus = LearningPart | 'resource';
const PARTS: { id: LearningPart; to: string; icon: LucideIcon; tone: string; topRule: string; hoverTint: string }[] = [
  { id: 'course', to: '/courses', icon: BookOpen, tone: 'bg-brand-cyan', topRule: 'border-t-brand-cyan', hoverTint: 'hover:bg-brand-cyan/10' },
  { id: 'unit', to: '/units', icon: Layers, tone: 'bg-brand-orange', topRule: 'border-t-brand-orange', hoverTint: 'hover:bg-brand-orange/10' },
  { id: 'module', to: '/resources?type=module', icon: BookOpenCheck, tone: 'bg-brand-mint', topRule: 'border-t-brand-mint', hoverTint: 'hover:bg-brand-mint/20' },
  { id: 'sequence', to: '/sequences', icon: ListVideo, tone: 'bg-brand-pink', topRule: 'border-t-brand-pink', hoverTint: 'hover:bg-brand-pink/10' },
];

const FOCUS_META: Record<LearningFocus, { icon: LucideIcon; tone: string }> = {
  course: { icon: BookOpen, tone: 'bg-primary' },
  unit: { icon: Layers, tone: 'bg-brand-orange' },
  module: { icon: BookOpenCheck, tone: 'bg-brand-mint' },
  sequence: { icon: ListVideo, tone: 'bg-brand-pink' },
  resource: { icon: Shapes, tone: 'bg-brand-cyan' },
};

/** A conceptual learning guide, not a strict database hierarchy. Editorial
 * playlists can be reused in multiple units, modules or courses. */
export function LearningPathGuide({ compact = false }: { compact?: boolean }) {
  const { t } = useTranslation();
  return <section aria-labelledby="learning-path-guide" className="border-t border-foreground pt-9">
    <div className="flex flex-wrap items-end justify-between gap-5">
      <div className="max-w-3xl">
        <h2 id="learning-path-guide" className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {t('learningGuide.title')}
        </h2>
        <p className="mt-3 max-w-prose text-sm leading-relaxed text-muted-foreground">{t('learningGuide.lead')}</p>
      </div>
      {compact && <Link to="/how-it-works" className="inline-flex items-center gap-2 border border-foreground bg-card px-3.5 py-2 text-sm font-semibold transition-colors hover:bg-brand-cyan hover:text-brand-ink">
        {t('learningGuide.more')}<ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Link>}
    </div>
    <ol className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {PARTS.map(({ id, to, icon: Icon, tone, topRule, hoverTint }, index) =>
        <li key={id}>
          <Link to={to} className={cn(
            'group flex h-full flex-col gap-3 border border-input border-t-4 bg-card p-5 transition-colors hover:border-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
            topRule,
            hoverTint,
          )}>
            <div className="flex items-center justify-between">
              <span className={cn('grid h-10 w-10 place-items-center border border-foreground text-brand-ink', tone)}>
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="font-mono text-xs tabular-nums text-muted-foreground">{String(index + 1).padStart(2, '0')}</span>
            </div>
            <h3 className="text-lg font-semibold group-hover:underline group-hover:underline-offset-4">
              {t(`learningGuide.parts.${id}.title`)}
            </h3>
            <p className="flex-1 text-sm leading-relaxed text-muted-foreground">
              {t(`learningGuide.parts.${id}.short`)}
            </p>
            {!compact && <span className="text-xs leading-relaxed text-muted-foreground">
              {t(`learningGuide.parts.${id}.example`)}
            </span>}
            <span className="inline-flex items-center gap-1 text-sm font-semibold">
              {t('learningGuide.explore')}<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </span>
          </Link>
        </li>,
      )}
    </ol>
    <p className="mt-5 flex items-start gap-3 border border-input bg-card px-4 py-3 text-sm leading-relaxed text-muted-foreground">
      <span className="mt-1 h-2.5 w-2.5 shrink-0 border border-foreground bg-brand-cyan" aria-hidden="true" />
      <span>{t('learningGuide.reuseNote')}</span>
    </p>
  </section>;
}

/** Progressive disclosure: one context-aware sentence and a route to the full guide. */
export function LearningContext({ focus }: { focus: LearningFocus }) {
  const { t } = useTranslation();
  const { icon: Icon, tone } = FOCUS_META[focus];
  return <aside aria-label={t('learningGuide.contextLabel')} className="my-7 flex flex-col gap-3 border border-foreground bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
    <div className="flex items-start gap-3 sm:items-center">
      <span className={cn('grid h-9 w-9 shrink-0 place-items-center border border-foreground text-brand-ink', tone)} aria-hidden="true">
        <Icon className="h-4 w-4" />
      </span>
      <p className="max-w-3xl text-sm leading-relaxed">
        <span className="font-semibold">{t(`learningGuide.parts.${focus}.title`)}: </span>
        {t(`learningGuide.context.${focus}`)}
      </p>
    </div>
    <Link to="/how-it-works" className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold underline underline-offset-4 hover:text-foreground">
      {t('learningGuide.more')}<ArrowRight className="h-4 w-4" aria-hidden="true" />
    </Link>
  </aside>;
}
