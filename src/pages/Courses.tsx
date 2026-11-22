import { Link } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import { useRef } from 'react';
import { PageSeo } from '@/components/layout/PageSeo';
import { staticPageMeta } from '@/shared/seo/seo';
import { useTranslation } from 'react-i18next';
import { useCommunityCourses, usePublicCourses } from '@/features/courses/queries/useCourses';
import { CourseList } from '@/components/course/CourseList';
import { Pagination } from '@/components/course/Pagination';
import { PageState } from '@/components/layout/PageState';
import { CatalogHeader, CatalogToolbar } from '@/components/catalog/CatalogToolbar';
import { ActiveFilters } from '@/components/catalog/ActiveFilters';
import { FacetGroup } from '@/components/catalog/FacetFilters';
import { useCatalogFilterChips } from '@/components/catalog/useCatalogFilterChips';
import { LearningContext } from '@/components/learning/LearningPathGuide';
import { courseFacets, filterCourses } from '@/entities/course/course.catalog';
import { PAGE_SIZE } from '@/entities/course/course.types';
import { useCatalogParams, type CatalogParamKey } from '@/shared/hooks/useCatalogParams';

export default function Courses() {
  const { t } = useTranslation();
  const { page, search, language, institution, degree, filter, reset } = useCatalogParams();
  const query = usePublicCourses();
  const community = useCommunityCourses();
  const editions = (community.data ?? []).filter(item =>
    (!language || item.language === language) && (!search || item.title.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase())));
  const results = useRef<HTMLDivElement>(null);
  const filters = { search, language, institution, degree };
  const courses = query.data ?? [];
  const matching = filterCourses(courses, filters);
  const pageItems = matching.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const { institutions, degrees } = courseFacets(courses, filters);
  const degreeLabel = (value: string) => t(`course.degreeTypes.${value}`, { defaultValue: value });
  const chips = [
    ...useCatalogFilterChips({ search, language }),
    ...(institution ? [{ key: 'institution', label: t('catalog.filterInstitution'), value: institution }] : []),
    ...(degree ? [{ key: 'degree', label: t('catalog.filterDegree'), value: degreeLabel(degree) }] : []),
  ];
  const changePage = (value: number) => {
    filter('page', String(value));
    results.current?.scrollIntoView({ block: 'start' });
    results.current?.focus({ preventScroll: true });
  };
  // A facet with a single choice and nothing selected filters nothing, so it stays hidden.
  const showFacet = (options: unknown[], value: string) => options.length > 1 || Boolean(value);

  return <>
    <PageSeo {...staticPageMeta('/courses', { title: t('nav.courses'), description: t('catalog.description') })} />
    <CatalogHeader title={t('catalog.title')} description={t('catalog.description')} total={chips.length ? undefined : query.data?.length} />
    {page === 1 && !institution && !degree && editions.length > 0 && <section className="mb-6 rounded-lg border border-input bg-card p-4">
      <h2 className="flex items-center gap-2 font-semibold"><BookOpen size={18} aria-hidden="true" />{t('reader.community')}</h2>
      <ul className="mt-2 flex flex-wrap gap-x-5">{editions.map(item => <li key={item.id}>
        <Link lang={item.language} className="inline-flex min-h-11 items-center gap-2 underline underline-offset-4" to={`/resources/${item.slug}`}>
          {item.title}<span className="font-mono text-xs">{item.language.toUpperCase()}</span></Link>
      </li>)}</ul>
    </section>}
    <LearningContext focus="course" />
    <CatalogToolbar search={search} language={language} onFilter={filter}
      searchLabel={t('catalog.searchCourses')} searchPlaceholder={t('catalog.searchCoursesPlaceholder')} />
    {(showFacet(institutions, institution) || showFacet(degrees, degree)) && <div className="-mt-2 mb-8 grid gap-6 lg:grid-cols-2">
      {showFacet(institutions, institution) && <FacetGroup title={t('catalog.filterInstitution')} value={institution} scroll
        onChange={value => filter('institution', value)} allLabel={t('catalog.allInstitutions')}
        allCount={filterCourses(courses, { ...filters, institution: '' }).length}
        options={institutions.map(option => ({ ...option, label: option.value }))} />}
      {showFacet(degrees, degree) && <FacetGroup title={t('catalog.filterDegree')} value={degree} scroll
        onChange={value => filter('degree', value)} allLabel={t('catalog.allDegrees')}
        allCount={filterCourses(courses, { ...filters, degree: '' }).length}
        options={degrees.map(option => ({ ...option, label: degreeLabel(option.value) }))} />}
    </div>}
    <ActiveFilters count={query.data ? matching.length : undefined} filters={chips}
      onRemove={key => filter(key as CatalogParamKey, '')} onReset={reset} />
    <div ref={results} tabIndex={-1} aria-label={t('catalog.courseResults')} className="scroll-mt-24 outline-none">
      {query.isPending ? <PageState loading />
        : query.error ? <PageState level="h2" title={t('common.error')} description={query.error.message} retry={() => void query.refetch()} />
        : pageItems.length ? <CourseList courses={pageItems} className={chips.length ? 'border-t-0' : undefined} />
        : chips.length || page > 1 ? <PageState level="h2" title={t('catalog.noMatches')} description={t('catalog.noMatchesText')} />
        : <PageState level="h2" title={t('catalog.empty')} description={t('catalog.emptyDescription')} />}
      {pageItems.length > 0 && <Pagination page={page} total={matching.length} onChange={changePage} />}
    </div>
  </>;
}
