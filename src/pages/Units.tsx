import { useEffect, useState } from 'react';
import { ArrowRight, SlidersHorizontal, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useUnitFacets, useUnits } from '@/features/courses/queries/useCourses';
import { useContributePath } from '@/features/auth/useContributePath';
import { Pagination } from '@/components/course/Pagination';
import { PageState } from '@/components/layout/PageState';
import { CatalogHeader } from '@/components/catalog/CatalogToolbar';
import { LearningContext } from '@/components/learning/LearningPathGuide';
import { FacetGroup } from '@/components/catalog/FacetFilters';
import { SearchInput } from '@/components/catalog/SearchInput';
import { Button } from '@/components/ui/button';
import { useCatalogParams } from '@/shared/hooks/useCatalogParams';
import { unitPath } from '@/entities/course/course.paths';
import type { UnitSort } from '@/entities/course/course.types';

const DESKTOP = '(min-width: 1024px)';
const SORTS: UnitSort[] = ['curriculum', 'title', 'ects'];

function UnitFilters() {
  const { t } = useTranslation();
  const { course, year, semester, filter, update } = useCatalogParams();
  const facets = useUnitFacets();
  if (facets.isPending) return <p className="text-sm text-muted-foreground">{t('common.loading')}</p>;
  if (facets.error) return <p className="text-sm text-muted-foreground">{t('units.filtersUnavailable')}</p>;
  const { courses, years, semesters, semesterYears } = facets.data;
  const visibleSemesters = year ? semesters.filter(option => semesterYears[option.value]?.includes(year)) : semesters;
  return <div className="space-y-7">
    <FacetGroup title={t('units.filterCourse')} value={course} onChange={value => filter('course', value)}
      options={courses} />
    <FacetGroup title={t('units.filterYear')} value={year ? String(year) : ''}
      onChange={value => {
        const keep = semester && value && semesterYears[semester]?.includes(Number(value));
        update({ year: value, semester: keep ? String(semester) : '' });
      }}
      options={years.map(option => ({ value: String(option.value), label: t('catalog.year', { value: option.value }), count: option.count }))} />
    <FacetGroup title={t('units.filterSemester')} value={semester ? String(semester) : ''} onChange={value => filter('semester', value)}
      options={visibleSemesters.map(option => ({ value: String(option.value), label: t('catalog.semester', { value: option.value }), count: option.count }))} />
  </div>;
}

export default function Units() {
  const { t } = useTranslation();
  const params = useCatalogParams();
  const { page, search, course, year, semester, sort, filter, reset, faceted } = params;
  const query = useUnits({ page, search, language: '', course, year, semester, sort });
  const contribute = useContributePath();
  const activeCount = [course, year, semester].filter(Boolean).length;
  const [filtersOpen, setFiltersOpen] = useState(() => typeof window === 'undefined' || !window.matchMedia || window.matchMedia(DESKTOP).matches);
  useEffect(() => {
    // The desktop sidebar has no toggle, so re-open the filters when the viewport grows.
    const media = window.matchMedia?.(DESKTOP);
    const sync = () => { if (media?.matches) setFiltersOpen(true); };
    media?.addEventListener('change', sync);
    return () => media?.removeEventListener('change', sync);
  }, []);
  return <>
    <CatalogHeader title={t('units.title')} description={t('units.description')} total={query.data?.total} />
    <LearningContext focus="unit" />
    <div className="mt-10 grid gap-10 border-t border-foreground pt-8 lg:grid-cols-[17rem_minmax(0,1fr)]">
      <aside aria-label={t('units.filters')} className="lg:sticky lg:top-28 lg:self-start">
        <details className="group border-b border-input pb-6 lg:border-0 lg:pb-0" open={filtersOpen} onToggle={event => setFiltersOpen(event.currentTarget.open)}>
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold lg:hidden">
            <span className="inline-flex items-center gap-2"><SlidersHorizontal className="h-4 w-4" aria-hidden="true" />{t('units.filters')}{activeCount > 0 && <span className="font-mono tabular-nums text-muted-foreground">({activeCount})</span>}</span>
            <span className="text-muted-foreground group-open:hidden">{t('units.showFilters')}</span>
            <span className="hidden text-muted-foreground group-open:inline">{t('units.hideFilters')}</span>
          </summary>
          <div className="mt-6 lg:mt-0"><UnitFilters /></div>
        </details>
        <section aria-labelledby="units-how" className="mt-10 hidden border-t border-input pt-6 lg:block">
          <h2 id="units-how" className="text-sm font-semibold">{t('units.howTitle')}</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t('units.howText')}</p>
          <Link to={contribute} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold underline underline-offset-4">{t('units.contribute')}<ArrowRight className="h-4 w-4" /></Link>
        </section>
      </aside>
      <div className="min-w-0">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <label className="flex-1 space-y-2 text-sm font-medium"><span className="block">{t('units.search')}</span>
            <SearchInput value={search} onSearch={value => filter('search', value)} placeholder={t('units.searchPlaceholder')} />
          </label>
          <label className="space-y-2 text-sm font-medium"><span className="block">{t('units.sort')}</span>
            <select className="h-10 w-full rounded-md border border-input bg-background px-3 sm:w-52" value={sort} onChange={event => filter('sort', event.target.value === 'curriculum' ? '' : event.target.value)}>
              {SORTS.map(option => <option key={option} value={option}>{t(`units.sorts.${option}`)}</option>)}
            </select>
          </label>
        </div>
        {faceted && <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
          <span className="text-muted-foreground" aria-live="polite">{query.data ? t('units.matching', { count: query.data.total }) : t('common.loading')}</span>
          <Button variant="ghost" size="sm" className="h-8 px-2" onClick={reset}><X className="mr-1 h-4 w-4" />{t('units.clearFilters')}</Button>
        </div>}
        {query.isPending ? <PageState loading /> : query.error ? <PageState level="h2" title={t('common.error')} description={query.error.message} retry={() => void query.refetch()} /> : <>
          {query.data.items.length ? <ol className="mt-6 divide-y divide-input border-y border-input">
            {query.data.items.map(unit => {
              const href = unitPath(unit.courses.slug, unit.slug);
              return <li key={unit.id} className="group relative grid gap-x-8 gap-y-3 py-6 sm:grid-cols-[minmax(0,1fr)_auto]">
                <div className="min-w-0">
                  <p className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs uppercase tracking-wide text-muted-foreground">
                    {unit.code && <span>{unit.code}</span>}
                    <span className="text-foreground">{unit.courses.code || unit.courses.title}</span>
                  </p>
                  <h2 className="text-xl font-semibold leading-snug">
                    <Link to={href} className="decoration-2 underline-offset-4 after:absolute after:inset-0 group-hover:underline focus-visible:outline-none">{unit.title}</Link>
                  </h2>
                </div>
                <dl className="flex flex-wrap items-start gap-2 text-sm sm:max-w-56 sm:justify-end">
                  {unit.year != null && <div className="border border-input px-3 py-1"><dt className="sr-only">{t('course.yearLabel')}</dt><dd>{t('catalog.year', { value: unit.year })}</dd></div>}
                  {unit.semester != null && <div className="border border-input px-3 py-1"><dt className="sr-only">{t('course.semesterLabel')}</dt><dd>{t('catalog.semester', { value: unit.semester })}</dd></div>}
                  {unit.ects != null && <div className="bg-brand-orange px-3 py-1 text-ink"><dt className="sr-only">{t('course.ects')}</dt><dd className="font-mono tabular-nums">{unit.ects} ECTS</dd></div>}
                </dl>
              </li>;
            })}
          </ol> : <PageState level="h2" title={t('units.empty')} description={t(faceted || page > 1 ? 'units.noResults' : 'units.emptyDescription')} />}
          <Pagination page={page} total={query.data.total} onChange={value => filter('page', String(value))} />
        </>}
        <section aria-labelledby="units-contribute" className="mt-12 flex flex-col gap-6 border border-foreground bg-primary px-6 py-8 text-primary-foreground sm:flex-row sm:items-end sm:justify-between lg:hidden">
          <div><h2 id="units-contribute" className="text-2xl font-semibold tracking-[-0.02em]">{t('units.howTitle')}</h2>
            <p className="mt-2 max-w-prose text-sm leading-relaxed">{t('units.howText')}</p></div>
          <Link to={contribute} className="inline-flex shrink-0 items-center gap-2 font-semibold underline underline-offset-4">{t('units.contribute')}<ArrowRight className="h-4 w-4" /></Link>
        </section>
      </div>
    </div>
  </>;
}
