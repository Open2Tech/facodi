import { ArrowRight, BookOpen, Layers3, PlayCircle } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SectionLink } from '@/components/layout/SectionLink';
import { unitPath } from '@/entities/course/course.paths';
import { suggestStudyUnits, type StudyEntryCoverage, type StudyEntryUnit } from '@/entities/course/courseStudyEntry';

const TONES = [
  'border-t-brand-cyan hover:bg-brand-cyan/10',
  'border-t-brand-mint hover:bg-brand-mint/10',
  'border-t-brand-pink hover:bg-brand-pink/10',
] as const;

/** A small, truthful starting point for every public course.
 * No invented course prerequisites, recommended order or resource counts. */
export function CourseStudyEntry({
  courseSlug, units, coverage, loading = false, hasError = false,
}: {
  courseSlug: string;
  units: readonly StudyEntryUnit[];
  coverage: readonly StudyEntryCoverage[];
  loading?: boolean;
  hasError?: boolean;
}) {
  const { t } = useTranslation();
  const { state } = useLocation();
  if (!units.length) return null;
  const suggestions = suggestStudyUnits(units, coverage);
  const hasResources = suggestions.some(item => item.videoCount > 0 || item.readingCount > 0 || item.playlistCount > 0 || item.guideCount > 0);
  const videoUnits = coverage.filter(item => item.video_count > 0).length;
  const readingUnits = coverage.filter(item => item.reading_count > 0).length;
  const playlistUnits = coverage.filter(item => (item.playlist_count ?? 0) > 0).length;
  const guideUnits = coverage.filter(item => (item.guide_count ?? 0) > 0).length;

  return <section aria-labelledby="course-study-entry-title" className="mb-12 border border-foreground border-t-4 border-t-primary bg-card p-4 sm:p-6">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
      <div className="max-w-2xl">
        <p className="font-mono text-xs font-semibold uppercase tracking-widest text-muted-foreground">{t('courseStart.eyebrow')}</p>
        <h2 id="course-study-entry-title" className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
          {t('courseStart.title')}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {t(loading ? 'courseStart.loading' : hasError ? 'courseStart.unavailable' : hasResources ? 'courseStart.description' : 'courseStart.noCoverage')}
        </p>
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        <SectionLink hash="#course-materials" className="inline-flex min-h-11 items-center gap-2 border border-foreground bg-brand-cyan px-4 py-2 text-sm font-semibold text-brand-ink transition-colors hover:bg-brand-cyan/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <BookOpen className="h-4 w-4" aria-hidden="true" />
          {t('courseStart.materials')}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </SectionLink>
        <SectionLink hash="#units" className="inline-flex min-h-11 items-center gap-2 border border-foreground px-4 py-2 text-sm font-semibold transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <Layers3 className="h-4 w-4" aria-hidden="true" />
          {t('courseStart.plan')}
        </SectionLink>
      </div>
    </div>

    {!loading && !hasError && hasResources && <p className="mt-4 text-xs text-muted-foreground" aria-label={t('courseStart.coverage')}>
      {[
        videoUnits && t('courseStart.videoUnits', { count: videoUnits }),
        playlistUnits && t('courseStart.playlistUnits', { count: playlistUnits }),
        readingUnits && t('courseStart.readingUnits', { count: readingUnits }),
        guideUnits && t('courseStart.guideUnits', { count: guideUnits }),
      ].filter(Boolean).join(' · ')}
    </p>}

    <ol className="mt-5 grid gap-3 md:grid-cols-3">
      {suggestions.map(({ unit, videoCount, readingCount, playlistCount, guideCount }, index) => <li key={unit.id} className="min-w-0">
        <Link to={unitPath(courseSlug, unit.slug)} state={state}
          className={`group flex h-full min-h-40 flex-col gap-3 border border-input border-t-4 bg-background p-4 transition-colors hover:border-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${TONES[index % TONES.length]}`}>
          <span className="flex items-center justify-between gap-3">
            <span className="font-mono text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {unit.year != null ? t('catalog.year', { value: unit.year }) : t('courseStart.unitLabel')}
              {unit.semester != null && <> · {t('catalog.semester', { value: unit.semester })}</>}
            </span>
            <span className="font-mono text-xs font-semibold text-muted-foreground" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
          </span>
          <span className="text-base font-semibold leading-snug group-hover:underline group-hover:underline-offset-4">{unit.title}</span>
          {!loading && !hasError && (videoCount > 0 || readingCount > 0 || playlistCount > 0 || guideCount > 0) && <span className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {videoCount > 0 && <span className="inline-flex items-center gap-1.5">
              <PlayCircle className="h-3.5 w-3.5" aria-hidden="true" />
              {t('courseStart.videoCount', { count: videoCount })}
            </span>}
            {readingCount > 0 && <span className="inline-flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
              {t('courseStart.readingCount', { count: readingCount })}
            </span>}
            {playlistCount > 0 && <span className="inline-flex items-center gap-1.5">
              <PlayCircle className="h-3.5 w-3.5" aria-hidden="true" />
              {t('courseStart.playlistCount', { count: playlistCount })}
            </span>}
            {guideCount > 0 && <span className="inline-flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
              {t('courseStart.guideCount', { count: guideCount })}
            </span>}
          </span>}
          <span className="mt-auto inline-flex items-center gap-2 pt-2 text-sm font-semibold">
            {t('courseStart.openUnit')} <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </span>
        </Link>
      </li>)}
    </ol>
    <p className="mt-4 text-xs leading-relaxed text-muted-foreground">{t('courseStart.disclaimer')}</p>
  </section>;
}
