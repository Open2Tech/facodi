import { ArrowUpRight, BookOpenCheck } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useResources, useResourceTypes } from '@/features/courses/queries/useCourses';
import { Pagination } from '@/components/course/Pagination';
import { PageState } from '@/components/layout/PageState';
import { CatalogHeader, CatalogToolbar } from '@/components/catalog/CatalogToolbar';
import { LearningContext } from '@/components/learning/LearningPathGuide';
import { TypeBadge } from '@/components/catalog/TypeBadge';
import { FacetGroup } from '@/components/catalog/FacetFilters';
import { moduleResourcePath } from '@/entities/module/module.api';
import { videoInfo } from '@/entities/course/video';
import { VideoThumbnail } from '@/components/resource/VideoCard';
import { useCatalogParams } from '@/shared/hooks/useCatalogParams';
import { plainText } from '@/shared/lib/text';

export default function Resources() {
  const { t } = useTranslation();
  const { page, search, language, tag, type, filter, filtered } = useCatalogParams();
  const query = useResources({ page, search, language, tag, objectType: type });
  const types = useResourceTypes();
  const moduleOnly = type === 'module';
  const typeLabel = (value: string) => t('objectTypes.' + value, { defaultValue: value });
  // Put study modules first, even when videos account for most of the catalogue.
  const options = (types.data ?? []).map(option => ({ ...option, label: typeLabel(option.value) }))
    .sort((a, b) => a.value === 'module' ? -1 : b.value === 'module' ? 1 : b.count - a.count || a.label.localeCompare(b.label));

  return <>
    <Helmet>
      <title>{t('resources.title') + ' — FACODI'}</title>
      <meta name="description" content={t('resources.description')} />
    </Helmet>
    <CatalogHeader title={t('resources.title')} description={t('resources.description')} total={query.data?.total} />
    <LearningContext focus="resource" />
    <CatalogToolbar search={search} language={language} onFilter={filter} />
    {!!options.length && <div className="-mt-4 mb-8">
      <FacetGroup title={t('resources.filterType')} value={type} onChange={value => filter('type', value)}
        allLabel={t('resources.allTypes')} allCount={types.data?.reduce((sum, item) => sum + item.count, 0)}
        options={options} />
    </div>}
    {tag && <p className="-mt-4 mb-8 flex flex-wrap items-center gap-3 text-sm">
      {t('resources.taggedWith')}
      <span className="bg-primary px-2 py-1 font-semibold text-primary-foreground">{tag}</span>
      <button type="button" className="underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2" onClick={() => filter('tag', '')}>
        {t('resources.clearTag')}
      </button>
    </p>}
    {moduleOnly && <div className="mb-6 max-w-prose">
      <h2 className="text-2xl font-semibold tracking-tight">{t('studyModules.title')}</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t('studyModules.description')}</p>
    </div>}
    {query.isPending
      ? <PageState loading />
      : query.error
        ? <PageState title={t('common.error')} description={query.error.message} retry={() => void query.refetch()} />
        : <>
          {query.data.items.length ? moduleOnly ? (
            <ul className="divide-y divide-input border-y border-input" aria-label={t('studyModules.title')}>
              {query.data.items.map(module => <li key={module.id}>
                <Link to={moduleResourcePath(module.object_type, module.slug)}
                  className="group flex items-start gap-4 px-2 py-5 transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                  <span className="grid h-11 w-11 shrink-0 place-items-center border border-foreground bg-brand-mint text-ink">
                    <BookOpenCheck className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="mb-2 flex flex-wrap items-center gap-3 font-mono text-xs text-muted-foreground">
                      <span>{t('objectTypes.module')}</span>
                      <span lang={module.language}>{module.language}</span>
                    </span>
                    <span className="block text-lg font-semibold leading-snug group-hover:underline group-hover:underline-offset-4">{module.title}</span>
                    {module.description && <span className="mt-2 line-clamp-2 block max-w-3xl text-sm leading-relaxed text-muted-foreground">
                      {plainText(module.description)}
                    </span>}
                  </span>
                  <ArrowUpRight className="mt-1 h-5 w-5 shrink-0" aria-hidden="true" />
                </Link>
              </li>)}
            </ul>
          ) : (
            <ul className="grid pl-px pt-px sm:grid-cols-2 lg:grid-cols-3">
              {query.data.items.map(resource => {
                const isVideo = resource.object_type === 'video';
                const href = moduleResourcePath(resource.object_type, resource.slug);
                const info = videoInfo(resource.metadata, resource.source_url);
                const excerpt = isVideo ? null : plainText(resource.description);
                const action = resource.object_type === 'module' ? t('studyModules.open') : t('resources.open');
                return <li key={resource.id} className="relative -ml-px -mt-px flex flex-col border border-input transition-colors hover:z-10 hover:border-foreground">
                  {isVideo && <Link to={href} tabIndex={-1} aria-hidden="true" className="block"><VideoThumbnail info={info} /></Link>}
                  <div className="flex flex-1 flex-col p-6">
                    <p className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-2 font-mono text-xs uppercase text-muted-foreground">
                      <TypeBadge type={resource.object_type} label={typeLabel(resource.object_type)} />
                      <span lang={resource.language}>{resource.language}</span>
                    </p>
                    <h2 className="text-lg font-semibold"><Link to={href} className="decoration-2 underline-offset-4 hover:underline">{resource.title}</Link></h2>
                    {isVideo && info.channel && <p className="mt-2 truncate text-sm text-muted-foreground">{info.channel}</p>}
                    {excerpt && <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{excerpt}</p>}
                    {!!resource.tags.length && <p className="mt-4 text-sm">{resource.tags.slice(0, 3).join(' · ')}</p>}
                    <Link to={href} aria-label={action + ': ' + resource.title}
                      className="mt-auto inline-flex items-center gap-2 pt-5 text-sm font-semibold underline underline-offset-4">
                      {action}<ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                  </div>
                </li>;
              })}
            </ul>
          ) : <PageState title={t('resources.empty')} description={t(filtered ? 'resources.noResults' : 'resources.emptyDescription')} />}
          <Pagination page={page} total={query.data.total} onChange={value => filter('page', String(value))} />
        </>}
    {moduleOnly && <p className="mt-9 max-w-prose border-t border-input pt-5 text-sm leading-relaxed text-muted-foreground">
      {t('studyModules.disclaimer')}
    </p>}
  </>;
}
