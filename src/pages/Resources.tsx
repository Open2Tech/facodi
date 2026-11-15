import { useRef } from 'react';
import { ArrowUpRight, BookOpenCheck } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useResources } from '@/features/courses/queries/useCourses';
import { Pagination } from '@/components/course/Pagination';
import { PageState } from '@/components/layout/PageState';
import { CatalogHeader, CatalogToolbar } from '@/components/catalog/CatalogToolbar';
import { ActiveFilters } from '@/components/catalog/ActiveFilters';
import { useCatalogFilterChips } from '@/components/catalog/useCatalogFilterChips';
import { LearningContext } from '@/components/learning/LearningPathGuide';
import { TypeBadge } from '@/components/catalog/TypeBadge';
import { FacetGroup } from '@/components/catalog/FacetFilters';
import { moduleResourcePath } from '@/entities/module/module.api';
import { videoInfo } from '@/entities/course/video';
import { VideoThumbnail } from '@/components/resource/VideoCard';
import { useCatalogParams, type CatalogParamKey } from '@/shared/hooks/useCatalogParams';
import { plainText } from '@/shared/lib/text';
import { cn } from '@/lib/utils';

export default function Resources() {
  const { t } = useTranslation();
  const { page, search, language, tag, type, filter, reset } = useCatalogParams();
  const query = useResources({ page, search, language, tag, objectType: type });
  const results = useRef<HTMLDivElement>(null);
  const moduleOnly = type === 'module';
  const typeLabel = (value: string) => t('objectTypes.' + value, { defaultValue: value });
  const chips = useCatalogFilterChips({ search, language, tag, type: type && typeLabel(type) });
  const facets = query.data?.types ?? [];
  // Keep the selected type reachable even when the other filters leave it with no matches.
  const withSelected = type && !facets.some(facet => facet.value === type) ? [...facets, { value: type, count: 0 }] : facets;
  // Study modules lead, even when videos account for most of the catalogue.
  const options = withSelected.map(option => ({ ...option, label: typeLabel(option.value) }))
    .sort((a, b) => a.value === 'module' ? -1 : b.value === 'module' ? 1 : b.count - a.count || a.label.localeCompare(b.label));
  const changePage = (value: number) => {
    filter('page', String(value));
    results.current?.scrollIntoView({ block: 'start' });
    results.current?.focus({ preventScroll: true });
  };
  const tagButton = (value: string) => <button key={value} type="button" aria-pressed={value === tag}
    onClick={() => filter('tag', value === tag ? '' : value)}
    className={cn('min-h-7 px-2 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      value === tag ? 'bg-primary font-semibold text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-foreground hover:text-background')}>
    {value}
  </button>;

  return <>
    <Helmet>
      <title>{t('resources.title') + ' — FACODI'}</title>
      <meta name="description" content={t('resources.description')} />
    </Helmet>
    <CatalogHeader title={t('resources.title')} description={t('resources.description')} total={chips.length ? undefined : query.data?.total} />
    <LearningContext focus="resource" />
    <CatalogToolbar search={search} language={language} onFilter={filter} searchPlaceholder={t('resources.searchPlaceholder')} />
    {!!options.length && <div className="-mt-2 mb-8">
      <FacetGroup title={t('resources.filterType')} value={type} onChange={value => filter('type', value)} scroll
        allLabel={t('resources.allTypes')} allCount={facets.reduce((sum, item) => sum + item.count, 0)} options={options} />
    </div>}
    <ActiveFilters count={query.isPlaceholderData ? undefined : query.data?.total} filters={chips}
      onRemove={key => filter(key as CatalogParamKey, '')} onReset={reset} />
    {moduleOnly && <div className="mb-6 max-w-prose">
      <h2 className="text-2xl font-semibold tracking-tight">{t('studyModules.title')}</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t('studyModules.description')}</p>
    </div>}
    <div ref={results} tabIndex={-1} aria-label={t('resources.results')} className="scroll-mt-24 outline-none"
      aria-busy={query.isFetching || undefined}>
      {query.isPending
        ? <PageState loading />
        : query.error
          ? <PageState level="h2" title={t('common.error')} description={query.error.message} retry={() => void query.refetch()} />
          : <div className={cn('transition-opacity motion-reduce:transition-none', query.isPlaceholderData && 'opacity-60')}>
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
                      {!!resource.tags.length && <div className="mt-4 flex flex-wrap gap-1.5" role="group" aria-label={t('resources.filterByTag')}>
                        {resource.tags.slice(0, 3).map(tagButton)}
                      </div>}
                      <Link to={href} aria-label={action + ': ' + resource.title}
                        className="mt-auto inline-flex items-center gap-2 pt-5 text-sm font-semibold underline underline-offset-4">
                        {action}<ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                      </Link>
                    </div>
                  </li>;
                })}
              </ul>
            ) : chips.length
              ? <PageState level="h2" title={t('resources.noMatches')} description={t('resources.noResults')} />
              : <PageState level="h2" title={t('resources.empty')} description={t('resources.emptyDescription')} />}
            {!!query.data.items.length && <Pagination page={page} total={query.data.total} onChange={changePage} />}
          </div>}
    </div>
    {moduleOnly && <p className="mt-9 max-w-prose border-t border-input pt-5 text-sm leading-relaxed text-muted-foreground">
      {t('studyModules.disclaimer')}
    </p>}
  </>;
}
