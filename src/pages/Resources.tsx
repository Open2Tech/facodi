import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useResources } from '@/features/courses/queries/useCourses';
import { Pagination } from '@/components/course/Pagination';
import { PageState } from '@/components/layout/PageState';
import { CatalogHeader, CatalogToolbar } from '@/components/catalog/CatalogToolbar';
import { useCatalogParams } from '@/shared/hooks/useCatalogParams';
import { plainText } from '@/shared/lib/text';

export default function Resources() {
  const { t } = useTranslation();
  const { page, search, language, tag, filter, filtered } = useCatalogParams();
  const query = useResources({ page, search, language, tag });
  return <>
    <CatalogHeader title={t('resources.title')} description={t('resources.description')} total={query.data?.total} />
    <CatalogToolbar search={search} language={language} onFilter={filter} />
    {tag && <p className="-mt-4 mb-8 flex flex-wrap items-center gap-3 text-sm">{t('resources.taggedWith')}<span className="bg-primary px-2 py-1 font-semibold text-primary-foreground">{tag}</span>
      <button type="button" className="underline underline-offset-4" onClick={() => filter('tag', '')}>{t('resources.clearTag')}</button></p>}
    {query.isPending ? <PageState loading /> : query.error ? <PageState title={t('common.error')} description={query.error.message} retry={() => void query.refetch()} /> : <>
      {query.data.items.length ? <ul className="grid pl-px pt-px sm:grid-cols-2 lg:grid-cols-3">
        {query.data.items.map(resource => {
          const excerpt = plainText(resource.description);
          return <li key={resource.id} className="-ml-px -mt-px flex flex-col border border-input p-6 transition-colors hover:border-foreground hover:z-10 relative">
            <p className="mb-3 flex flex-wrap gap-x-3 font-mono text-xs uppercase text-muted-foreground"><span>{t(`objectTypes.${resource.object_type}`, { defaultValue: resource.object_type })}</span><span lang={resource.language}>{resource.language}</span></p>
            <h2 className="text-lg font-semibold"><Link to={`/resources/${resource.slug}`} className="decoration-2 underline-offset-4 hover:underline">{resource.title}</Link></h2>
            {excerpt && <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{excerpt}</p>}
            {!!resource.tags.length && <p className="mt-4 text-sm">{resource.tags.slice(0, 3).join(' · ')}</p>}
            <Link to={`/resources/${resource.slug}`} aria-label={`${t('resources.open')}: ${resource.title}`} className="mt-auto inline-flex items-center gap-2 pt-5 text-sm font-semibold underline underline-offset-4">{t('resources.open')}<ArrowUpRight className="h-4 w-4" /></Link>
          </li>;
        })}
      </ul> : <PageState title={t('resources.empty')} description={t(filtered ? 'resources.noResults' : 'resources.emptyDescription')} />}
      <Pagination page={page} total={query.data.total} onChange={value => filter('page', String(value))} />
    </>}
  </>;
}
