import { useRef, useState } from 'react';
import { ArrowDown, ArrowUpRight, BookOpenCheck, ChevronDown, Search, SlidersHorizontal } from 'lucide-react';
import { PageSeo } from '@/components/layout/PageSeo';
import { staticPageMeta } from '@/shared/seo/seo';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useResources } from '@/features/courses/queries/useCourses';
import { Pagination } from '@/components/course/Pagination';
import { PageState } from '@/components/layout/PageState';
import { SearchInput } from '@/components/catalog/SearchInput';
import { ResourceDiscovery } from '@/components/catalog/ResourceDiscovery';
import { ResourceAdvancedFilters } from '@/components/catalog/ResourceAdvancedFilters';
import { SuggestResourceCallout } from '@/components/suggestion/SuggestResourceCallout';
import { ActiveFilters } from '@/components/catalog/ActiveFilters';
import { useCatalogFilterChips } from '@/components/catalog/useCatalogFilterChips';
import { TypeBadge } from '@/components/catalog/TypeBadge';
import { FacetGroup } from '@/components/catalog/FacetFilters';
import { STUDY_AREAS } from '@/shared/catalog/studyAreas';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { moduleResourcePath } from '@/entities/module/module.api';
import { videoInfo } from '@/entities/course/video';
import { VideoThumbnail } from '@/components/resource/VideoCard';
import { useCatalogParams, type CatalogParamKey } from '@/shared/hooks/useCatalogParams';
import { plainText } from '@/shared/lib/text';
import { cn } from '@/lib/utils';
import { studyTopics } from '@/shared/lib/topicTags';

const AREA_POSTER_TONES = [
  'bg-primary',
  'bg-brand-cyan',
  'bg-brand-mint',
  'bg-brand-orange',
  'bg-brand-pink',
  'bg-brand-coral',
] as const;

export default function Resources() {
  const { t } = useTranslation();
  const { page, search, language, tag, area, type, filter, reset } = useCatalogParams();
  const query = useResources({ page, search, language, tag, area, objectType: type });
  const [filtersOpen, setFiltersOpen] = useState(false);
  const results = useRef<HTMLDivElement>(null);
  const moduleOnly = type === 'module';
  const typeLabel = (value: string) => t('objectTypes.' + value, { defaultValue: value });
  const chips = useCatalogFilterChips({ search, language, tag, area, type: type && typeLabel(type) });
  const discovering = !chips.length && page === 1;
  const advancedCount = [language, tag, area].filter(Boolean).length;
  const facets = query.data?.types ?? [];
  // Keep the selected type reachable even when the other filters leave it with no matches.
  const withSelected = type && !facets.some(facet => facet.value === type) ? [...facets, { value: type, count: 0 }] : facets;
  // Study modules lead, even when videos account for most of the catalogue.
  const options = withSelected.map(option => ({ ...option, label: typeLabel(option.value) }))
    .sort((a, b) => a.value === 'module' ? -1 : b.value === 'module' ? 1 : b.count - a.count || a.label.localeCompare(b.label));
  const quickOptions = options.filter(option => ['module', 'video', 'document', 'external_resource', type].includes(option.value));
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
    <PageSeo {...staticPageMeta('/resources', { title: t('resources.title'), description: t('resources.description') })} />
    <header className="border-t-4 border-t-brand-mint pt-6">
      <h1 className="max-w-3xl text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">{t('resourceExplorer.title')}</h1>
      <div className="mt-4 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <p className="max-w-prose text-lg text-muted-foreground">{t('resourceExplorer.description')}</p>
        <a href="#resource-library" className="inline-flex min-h-10 items-center gap-2 border border-foreground bg-card px-3.5 py-2 text-sm font-semibold transition-colors hover:bg-brand-mint hover:text-brand-ink">
          {t('resourceExplorer.skipToLibrary')}<ArrowDown className="h-4 w-4" aria-hidden="true" />
        </a>
      </div>
    </header>
    <div className="my-6">
      <label htmlFor="resource-search" className="mb-2 block text-sm font-medium">{t('resourceExplorer.searchLabel')}</label>
      <div className="relative max-w-3xl">
        <Search className="pointer-events-none absolute left-4 top-4 h-5 w-5 text-muted-foreground" aria-hidden="true" />
        <SearchInput id="resource-search" value={search} onSearch={value => filter('search', value)}
          placeholder={t('resourceExplorer.searchPlaceholder')} className="h-14 pl-12 text-base" />
      </div>
    </div>
    <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen} className="border-b border-input pb-5">
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          {!!options.length && <FacetGroup title={t('resources.filterType')} value={type} onChange={value => filter('type', value)} scroll
            allLabel={t('resources.allTypes')} allCount={facets.reduce((sum, item) => sum + item.count, 0)} options={quickOptions} />}
        </div>
        <CollapsibleTrigger asChild>
          <Button variant="outline" className="min-h-11 shrink-0 self-start gap-2 sm:self-end">
            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
            {t('resourceExplorer.filters')}{advancedCount > 0 && <span className="font-mono">({advancedCount})</span>}
            <ChevronDown className={cn('h-4 w-4', filtersOpen && 'rotate-180')} aria-hidden="true" />
          </Button>
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent className="mt-4">
        <ResourceAdvancedFilters search={search} language={language} type={type} tag={tag} area={area} options={options} onFilter={filter} />
      </CollapsibleContent>
    </Collapsible>
    <div className="mt-5">
      <ActiveFilters count={query.isPlaceholderData ? undefined : query.data?.total} filters={chips}
        onRemove={key => filter(key as CatalogParamKey, '')} onReset={reset} />
    </div>
    {discovering && <>
      <ResourceDiscovery />
      <nav aria-label={t('catalog.browseByArea')} className="my-9">
        <h2 className="text-lg font-semibold">{t('catalog.browseByArea')}</h2>
        <div className="mt-3 flex gap-2.5 overflow-x-auto pb-1 sm:grid sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
          {STUDY_AREAS.map((studyArea, index) => <Link key={studyArea.key} to={`?area=${studyArea.key}`}
            className={cn(
              'inline-flex min-h-12 min-w-[11rem] shrink-0 items-center justify-between gap-2 border border-foreground px-3.5 py-2.5 text-sm font-semibold text-brand-ink transition-[filter] hover:brightness-95 sm:min-w-0',
              AREA_POSTER_TONES[index % AREA_POSTER_TONES.length],
            )}>
            {t('catalog.studyAreas.' + studyArea.key)}<ArrowUpRight className="h-4 w-4 shrink-0" aria-hidden="true" />
          </Link>)}
        </div>
      </nav>
    </>}
    <div id="resource-library" ref={results} tabIndex={-1} aria-label={t('resources.results')} className="scroll-mt-24 outline-none"
      aria-busy={query.isFetching || undefined}>
      <div className="mb-6 flex flex-wrap items-baseline justify-between gap-x-5 gap-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">{moduleOnly ? t('studyModules.title') : t('resourceExplorer.library')}</h2>
        <p className="text-sm text-muted-foreground">{search.trim() ? t('resourceExplorer.ranked') : t('resourceExplorer.alphabetical')}</p>
        {!chips.length && !query.error && <p className="w-full font-mono text-sm tabular-nums text-muted-foreground" role="status">
          {query.data ? t('catalog.results', { count: query.data.total }) : t('common.loading')}
        </p>}
      </div>
      {moduleOnly && <p className="mb-6 max-w-prose text-sm leading-relaxed text-muted-foreground">{t('studyModules.description')}</p>}
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
                  // Phones get a compact row (thumbnail beside the text) so several results fit on one screen.
                  return <li key={resource.id} className="relative -ml-px -mt-px flex border border-input transition-colors hover:z-10 hover:border-foreground sm:flex-col">
                    {isVideo && <Link to={href} tabIndex={-1} aria-hidden="true" className="block w-32 shrink-0 self-start p-3 pr-0 sm:w-auto sm:self-auto sm:p-0"><VideoThumbnail info={info} /></Link>}
                    <div className="flex min-w-0 flex-1 flex-col p-3 sm:p-6">
                      <p className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-2 font-mono text-xs uppercase text-muted-foreground sm:mb-3">
                        <TypeBadge type={resource.object_type} label={typeLabel(resource.object_type)} />
                        <span lang={resource.language}>{resource.language}</span>
                      </p>
                      <h3 className="text-base font-semibold leading-snug sm:text-lg"><Link to={href} className="decoration-2 underline-offset-4 hover:underline">{resource.title}</Link></h3>
                      {isVideo && info.channel && <p className="mt-1 truncate text-sm text-muted-foreground sm:mt-2">{info.channel}</p>}
                      {excerpt && <p className="mt-2 line-clamp-2 text-sm text-muted-foreground sm:line-clamp-3">{excerpt}</p>}
                      {!!studyTopics(resource.tags).length && <div className="mt-4 hidden flex-wrap gap-1.5 sm:flex" role="group" aria-label={t('resources.filterByTag')}>
                        {studyTopics(resource.tags).slice(0, 3).map(tagButton)}
                      </div>}
                      <Link to={href} aria-label={action + ': ' + resource.title}
                        className="mt-auto hidden items-center gap-2 pt-5 text-sm font-semibold underline underline-offset-4 sm:inline-flex">
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
    {query.isSuccess && !query.isPlaceholderData && <div className="mt-8">
      <SuggestResourceCallout context={chips.length && !query.data.items.length ? 'search' : 'library'} />
    </div>}
    {moduleOnly && <p className="mt-9 max-w-prose border-t border-input pt-5 text-sm leading-relaxed text-muted-foreground">
      {t('studyModules.disclaimer')}
    </p>}
  </>;
}
