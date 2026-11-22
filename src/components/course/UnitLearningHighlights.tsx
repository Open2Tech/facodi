import { ArrowRight, BookOpen, Layers3, ListVideo, PlayCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { UnitHighlight } from '@/entities/course/unitHighlights';
import { courseMaterialsPath } from '@/entities/course/course.paths';

const STYLES: Record<UnitHighlight['kind'], { line: string; icon: typeof BookOpen }> = {
  path: { line: 'border-t-brand-cyan hover:bg-brand-cyan/10', icon: ListVideo },
  sequence: { line: 'border-t-brand-cyan hover:bg-brand-cyan/10', icon: ListVideo },
  video: { line: 'border-t-brand-pink hover:bg-brand-pink/10', icon: PlayCircle },
  playlist: { line: 'border-t-brand-pink hover:bg-brand-pink/10', icon: ListVideo },
  module: { line: 'border-t-brand-mint hover:bg-brand-mint/10', icon: Layers3 },
  reading: { line: 'border-t-brand-orange hover:bg-brand-orange/10', icon: BookOpen },
};

/** Short navigation to the already published content of this specific UC.
 * No additional network requests, new content entities or inferred learning order.
 */
export function UnitLearningHighlights({
  courseSlug, unitSlug, highlights, loading = false, hasError = false,
}: {
  courseSlug: string;
  unitSlug: string;
  highlights: readonly UnitHighlight[];
  loading?: boolean;
  hasError?: boolean;
}) {
  const { t } = useTranslation();

  return <section aria-labelledby="unit-learning-highlights" className="mb-10 border border-foreground border-t-4 border-t-primary bg-card p-4 sm:p-6">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="max-w-prose">
        <p className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('unitHighlights.eyebrow')}</p>
        <h2 id="unit-learning-highlights" className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">{t('unitHighlights.title')}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t('unitHighlights.description')}</p>
      </div>
      <Link to={courseMaterialsPath(courseSlug, unitSlug)}
        className="inline-flex min-h-11 shrink-0 items-center gap-2 text-sm font-semibold underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        {t('unitHighlights.allMaterials')}<ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </div>

    {!!highlights.length && <ul className="mt-5 grid gap-3 md:grid-cols-3">
      {highlights.map(item => {
        const { icon: Icon, line } = STYLES[item.kind];
        return <li key={item.kind} className="min-w-0">
          <Link to={item.href} className={`group flex h-full min-h-36 flex-col gap-3 border border-input border-t-4 bg-background p-4 transition-colors hover:border-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${line}`}>
            <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              {t(`unitHighlights.kinds.${item.kind}`)}
              {item.kind === 'sequence' && !!item.count && <span className="font-mono">{t('unitHighlights.lessons', { count: item.count })}</span>}
            </span>
            <span className="font-semibold leading-snug group-hover:underline group-hover:underline-offset-4">
              {item.title ?? t('unitHighlights.curatedPath')}
            </span>
            {(item.language || item.level || item.publicationYear) && <span className="flex flex-wrap gap-x-3 gap-y-1 text-xs leading-relaxed text-muted-foreground">
              {item.language && <span>{t('unitHighlights.catalogLanguage', { language: t(`unitHighlights.languages.${item.language}`) })}</span>}
              {item.level && <span>{t('unitHighlights.catalogLevel', { level: t(`unitHighlights.levels.${item.level}`) })}</span>}
              {item.publicationYear && <span>{t('unitHighlights.publicationYear', { year: item.publicationYear })}</span>}
            </span>}
            {item.learningGoal && <span className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
              {t('unitHighlights.editorialGoal', { goal: item.learningGoal })}
            </span>}
            {!!item.sourceHost && <span className="break-all text-xs text-muted-foreground">
              {t('unitHighlights.sourceHost', { host: item.sourceHost })}
            </span>}
            <span className="mt-auto inline-flex items-center gap-2 pt-1 text-xs font-semibold">
              {t('unitHighlights.open')}<ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
            </span>
          </Link>
        </li>;
      })}
    </ul>}

    {!highlights.length && loading && <p className="mt-5 text-sm text-muted-foreground" role="status">{t('common.loading')}</p>}
    {!highlights.length && !loading && hasError && <p className="mt-5 text-sm text-muted-foreground" role="status">{t('unitHighlights.unavailable')}</p>}
    {!highlights.length && !loading && !hasError && <p className="mt-5 text-sm text-muted-foreground">{t('unitHighlights.empty')}</p>}
    {!!highlights.length && <p className="mt-4 text-xs leading-relaxed text-muted-foreground">{t('unitHighlights.notice')}</p>}
  </section>;
}
