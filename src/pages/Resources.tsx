import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useResources, useResourceTypes } from '@/features/courses/queries/useCourses';
import { Pagination } from '@/components/course/Pagination';
import { PageState } from '@/components/layout/PageState';
import { CatalogHeader, CatalogToolbar } from '@/components/catalog/CatalogToolbar';
import { FacetGroup } from '@/components/catalog/FacetFilters';
import { videoInfo } from '@/entities/course/video';
import { VideoThumbnail } from '@/components/resource/VideoCard';
import { useCatalogParams } from '@/shared/hooks/useCatalogParams';
import { plainText } from '@/shared/lib/text';

export default function Resources() {
  const { t } = useTranslation();
  const { page, search, language, tag, type, filter, filtered } = useCatalogParams();
  const query = useResources({ page, search, language, tag, objectType: type });
  const types = useResourceTypes();
  const typeLabel = (value: string) => t(`objectTypes.${value}`, { defaultValue: value });
  return <>
    <CatalogHeader title={t('resources.title')} description={t('resources.description')} total={query.data?.total} />
    <CatalogToolbar search={search} language={language} onFilter={filter} />
    {!!types.data?.length && <div className="-mt-4 mb-8">
      <FacetGroup title={t('resources.filterType')} value={type} onChange={value => filter('type', value)}
        options={types.data.map(option => ({ ...option, label: typeLabel(option.value) }))} />
    </div>}
    {tag && <p className="-mt-4 mb-8 flex flex-wrap items-center gap-3 text-sm">{t('resources.taggedWith')}<span className="bg-primary px-2 py-1 font-semibold text-primary-foreground">{tag}</span>
      <button type="button" className="underline underline-offset-4" onClick={() => filter('tag', '')}>{t('resources.clearTag')}</button></p>}
    {query.isPending ? <PageState loading /> : query.error ? <PageState title={t('common.error')} description={query.error.message} retry={() => void query.refetch()} /> : <>
      {query.data.items.length ? <ul className="grid pl-px pt-px sm:grid-cols-2 lg:grid-cols-3">
        {query.data.items.map(resource => {
          const isVideo = resource.object_type === 'video';
          const info = videoInfo(resource.metadata, resource.source_url);
          const excerpt = isVideo ? null : plainText(resource.description);
          return <li key={resource.id} className="relative -ml-px -mt-px flex flex-col border border-input transition-colors hover:z-10 hover:border-foreground">
            {isVideo && <Link to={`/resources/${resource.slug}`} tabIndex={-1} aria-hidden="true" className="block"><VideoThumbnail info={info} /></Link>}
            <div className="flex flex-1 flex-col p-6">
              <p className="mb-3 flex flex-wrap gap-x-3 font-mono text-xs uppercase text-muted-foreground"><span>{typeLabel(resource.object_type)}</span><span lang={resource.language}>{resource.language}</span></p>
              <h2 className="text-lg font-semibold"><Link to={`/resources/${resource.slug}`} className="decoration-2 underline-offset-4 hover:underline">{resource.title}</Link></h2>
              {isVideo && info.channel && <p className="mt-2 truncate text-sm text-muted-foreground">{info.channel}</p>}
              {excerpt && <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{excerpt}</p>}
              {!!resource.tags.length && <p className="mt-4 text-sm">{resource.tags.slice(0, 3).join(' · ')}</p>}
              <Link to={`/resources/${resource.slug}`} aria-label={`${t('resources.open')}: ${resource.title}`} className="mt-auto inline-flex items-center gap-2 pt-5 text-sm font-semibold underline underline-offset-4">{t('resources.open')}<ArrowUpRight className="h-4 w-4" /></Link>
            </div>
          </li>;
        })}
      </ul> : <PageState title={t('resources.empty')} description={t(filtered ? 'resources.noResults' : 'resources.emptyDescription')} />}
      <Pagination page={page} total={query.data.total} onChange={value => filter('page', String(value))} />
    </>}
  </>;
}
