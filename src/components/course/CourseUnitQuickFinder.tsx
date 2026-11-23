import { useId, useRef, useState } from 'react';
import { ArrowRight, BookOpen, Search, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { courseMaterialsPath, unitPath } from '@/entities/course/course.paths';
import { findCourseUnits, type StudyEntryCoverage, type StudyEntryUnit } from '@/entities/course/courseStudyEntry';

const MIN_UNITS_FOR_SEARCH = 13;

/** Find any real curricular unit by title/code, including electives and unknown year placements.
 * This is only a navigation aid: it does not alter specialisations or the official study plan.
 */
export function CourseUnitQuickFinder({
  courseSlug, units, coverage, coverageLoading = false, coverageError = false,
}: {
  courseSlug: string;
  units: readonly StudyEntryUnit[];
  coverage: readonly StudyEntryCoverage[];
  coverageLoading?: boolean;
  coverageError?: boolean;
}) {
  const { t } = useTranslation();
  const { state } = useLocation();
  const searchId = useId();
  const searchInput = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState('');
  const [onlyWithMaterials, setOnlyWithMaterials] = useState(false);
  const canFilterMaterials = !coverageLoading && !coverageError;
  const active = Boolean(search.trim() || (onlyWithMaterials && canFilterMaterials));
  const { total, results } = active ? findCourseUnits(units, coverage, search, onlyWithMaterials && canFilterMaterials) : { total: 0, results: [] };
  if (units.length < MIN_UNITS_FOR_SEARCH) return null;

  return <section aria-labelledby="course-unit-finder-title" className="mb-12 border-t-4 border-t-brand-orange bg-card p-4 sm:p-6">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="max-w-2xl">
        <h2 id="course-unit-finder-title" className="flex items-center gap-2 text-xl font-semibold tracking-tight sm:text-2xl">
          <Search className="h-5 w-5 shrink-0" aria-hidden="true" />{t('courseUnitFinder.title')}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t('courseUnitFinder.description', { count: units.length })}</p>
      </div>
      <Link to={`/units?course=${encodeURIComponent(courseSlug)}`}
        className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        {t('courseUnitFinder.fullList')}<ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </div>

    <div role="search" aria-label={t('courseUnitFinder.title')} className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-5">
      <div className="min-w-0 flex-1">
        <label htmlFor={searchId} className="mb-2 block text-sm font-semibold">{t('courseUnitFinder.searchLabel')}</label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <input id={searchId} ref={searchInput} type="search" autoComplete="off" value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder={t('courseUnitFinder.searchPlaceholder')}
            className="min-h-11 w-full min-w-0 border border-input bg-background py-2 pl-10 pr-10 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring" />
          {search && <button type="button" onClick={() => { setSearch(''); searchInput.current?.focus(); }}
            aria-label={t('courseUnitFinder.clear')}
            className="absolute right-1 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <X className="h-4 w-4" aria-hidden="true" />
          </button>}
        </div>
      </div>
      <label className="inline-flex min-h-11 cursor-pointer items-center gap-3 text-sm font-medium">
        <input type="checkbox" checked={onlyWithMaterials && canFilterMaterials} disabled={!canFilterMaterials}
          onChange={event => setOnlyWithMaterials(event.target.checked)}
          className="h-5 w-5 shrink-0 accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
        {t('courseUnitFinder.onlyWithMaterials')}
      </label>
    </div>

    {(coverageLoading || coverageError) && <p role={coverageError ? 'alert' : 'status'} className="mt-3 text-xs text-muted-foreground">
      {t(coverageError ? 'courseUnitFinder.coverageUnavailable' : 'courseUnitFinder.coverageLoading')}
    </p>}

    {active && <div className="mt-5 border-t border-input pt-4">
      <p role="status" className="text-sm text-muted-foreground">
        {total ? t('courseUnitFinder.matches', { count: total }) : t('courseUnitFinder.noMatches')}
      </p>
      {!!results.length && <ul className="mt-3 divide-y divide-input border-y border-input">
        {results.map(({ unit, videoCount, readingCount, playlistCount, guideCount }) => <li key={unit.id} className="flex flex-col justify-between gap-2 py-3 sm:flex-row sm:items-center sm:gap-5">
          <div className="min-w-0">
            <Link to={unitPath(courseSlug, unit.slug)} state={state}
              className="font-semibold underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{unit.title}</Link>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {[unit.code, unit.year != null ? t('catalog.year', { value: unit.year }) : null,
                unit.semester != null ? t('catalog.semester', { value: unit.semester }) : null].filter(Boolean).join(' · ')}
              {canFilterMaterials && (videoCount > 0 || readingCount > 0 || playlistCount > 0 || guideCount > 0) && <>
                {' · '}{[
                  videoCount && t('courseUnitFinder.videoCount', { count: videoCount }),
                  playlistCount && t('courseUnitFinder.playlistCount', { count: playlistCount }),
                  readingCount && t('courseUnitFinder.readingCount', { count: readingCount }),
                  guideCount && t('courseUnitFinder.guideCount', { count: guideCount }),
                ].filter(Boolean).join(' · ')}
              </>}
            </p>
          </div>
          <Link to={courseMaterialsPath(courseSlug, unit.slug)} state={state}
            className="inline-flex min-h-11 shrink-0 items-center gap-2 self-start text-sm font-semibold underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:self-auto">
            <BookOpen className="h-4 w-4" aria-hidden="true" />
            {t('courseUnitFinder.viewMaterials')}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </li>)}
      </ul>}
      {total > results.length && <p className="mt-4 text-xs text-muted-foreground">
        {t('courseUnitFinder.limited', { shown: results.length, total })}
      </p>}
    </div>}
  </section>;
}
