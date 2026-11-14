import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useUnits } from '@/features/courses/queries/useCourses';
import { Pagination } from '@/components/course/Pagination';
import { PageState } from '@/components/layout/PageState';
import { CatalogHeader, CatalogToolbar } from '@/components/catalog/CatalogToolbar';
import { useCatalogParams } from '@/shared/hooks/useCatalogParams';

export default function Units() {
  const { t } = useTranslation();
  const { page, search, filter, filtered } = useCatalogParams();
  const query = useUnits({ page, search, language: '' });
  return <>
    <CatalogHeader title={t('units.title')} description={t('units.description')} total={query.data?.total} />
    <CatalogToolbar search={search} language="" onFilter={filter} withLanguage={false} />
    {query.isPending ? <PageState loading /> : query.error ? <PageState title={t('common.error')} description={query.error.message} retry={() => void query.refetch()} /> : <>
      {query.data.items.length ? <ul className="divide-y divide-input border-y border-input">
        {query.data.items.map(unit => <li key={unit.id} className="grid gap-3 py-6 sm:grid-cols-[1fr_auto] sm:items-start">
          <div className="min-w-0">
            <p className="mb-2 flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs uppercase text-muted-foreground">
              {unit.code && <span>{unit.code}</span>}
              {unit.ects != null && <span>{unit.ects} ECTS</span>}
              {unit.year != null && <span>{t('catalog.year', { value: unit.year })}</span>}
              {unit.semester != null && <span>{t('catalog.semester', { value: unit.semester })}</span>}
            </p>
            <h2 className="text-xl font-semibold">{unit.title}</h2>
            {unit.summary && <p className="mt-2 max-w-prose text-muted-foreground">{unit.summary}</p>}
          </div>
          <Link to={`/courses/${unit.courses.slug}`} className="inline-flex items-center gap-2 text-sm font-semibold underline underline-offset-4">
            {t('units.inCourse', { course: unit.courses.title })}<ArrowUpRight className="h-4 w-4 shrink-0" />
          </Link>
        </li>)}
      </ul> : <PageState title={t('units.empty')} description={t(filtered ? 'units.noResults' : 'units.emptyDescription')} />}
      <Pagination page={page} total={query.data.total} onChange={value => filter('page', String(value))} />
    </>}
  </>;
}
