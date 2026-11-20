import { ArrowRight, BookOpen, BookOpenCheck, Layers, ListVideo, type LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

type LearningPart = 'course' | 'unit' | 'module' | 'sequence';
export type LearningFocus = LearningPart | 'resource';
const PARTS: { id: LearningPart; to: string; icon: LucideIcon; tone: string }[] = [
  { id: 'course', to: '/courses', icon: BookOpen, tone: 'bg-brand-cyan' },
  { id: 'unit', to: '/units', icon: Layers, tone: 'bg-brand-orange' },
  { id: 'module', to: '/resources?type=module', icon: BookOpenCheck, tone: 'bg-brand-mint' },
  { id: 'sequence', to: '/sequences', icon: ListVideo, tone: 'bg-brand-pink' },
];

/** A conceptual learning guide, not a strict database hierarchy. Editorial
 * playlists can be reused in multiple units, modules or courses. */
export function LearningPathGuide({ compact = false }: { compact?: boolean }) {
  const { t } = useTranslation();
  return <section aria-labelledby="learning-path-guide" className="border-t border-foreground pt-9">
    <div className="flex flex-wrap items-end justify-between gap-5">
      <div className="max-w-3xl">
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">{t('learningGuide.eyebrow')}</p>
        <h2 id="learning-path-guide" className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
          {t('learningGuide.title')}
        </h2>
        <p className="mt-3 max-w-prose text-sm leading-relaxed text-muted-foreground">{t('learningGuide.lead')}</p>
      </div>
      {compact && <Link to="/how-it-works" className="inline-flex items-center gap-2 text-sm font-semibold underline underline-offset-4">
        {t('learningGuide.more')}<ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Link>}
    </div>
    <ol className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {PARTS.map(({ id, to, icon: Icon, tone }) =>
        <li key={id}>
          <Link to={to} className="group flex h-full flex-col gap-3 border border-foreground bg-card p-5 text-card-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">
            <div className={`-mx-5 -mt-5 mb-1 flex items-center border-b border-brand-ink px-5 py-4 text-brand-ink ${tone}`}>
              <Icon className="h-8 w-8" strokeWidth={1.7} aria-hidden="true" />
            </div>
            <h3 className="text-xl font-semibold group-hover:underline group-hover:underline-offset-4">
              {t(`learningGuide.parts.${id}.title`)}
            </h3>
            <p className="flex-1 text-sm leading-relaxed text-muted-foreground">
              {t(`learningGuide.parts.${id}.short`)}
            </p>
            {!compact && <span className="text-xs leading-relaxed text-muted-foreground">
              {t(`learningGuide.parts.${id}.example`)}
            </span>}
            <span className="inline-flex items-center gap-1 text-sm font-semibold">
              {t('learningGuide.explore')}<ArrowRight className="h-4 w-4" aria-hidden="true" />
            </span>
          </Link>
        </li>,
      )}
    </ol>
    <p className="mt-5 max-w-4xl border-l-4 border-brand-cyan pl-4 text-sm leading-relaxed text-muted-foreground">
      {t('learningGuide.reuseNote')}
    </p>
  </section>;
}

/** Progressive disclosure: one context-aware sentence and a route to the full guide. */
export function LearningContext({ focus }: { focus: LearningFocus }) {
  const { t } = useTranslation();
  return <aside aria-label={t('learningGuide.contextLabel')} className="my-7 flex flex-col gap-3 border-l-4 border-brand-cyan bg-muted/40 p-4 sm:flex-row sm:items-center sm:justify-between">
    <p className="max-w-3xl text-sm leading-relaxed">
      <span className="font-semibold">{t(`learningGuide.parts.${focus}.title`)}: </span>
      {t(`learningGuide.context.${focus}`)}
    </p>
    <Link to="/how-it-works" className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold underline underline-offset-4">
      {t('learningGuide.more')}<ArrowRight className="h-4 w-4" aria-hidden="true" />
    </Link>
  </aside>;
}
