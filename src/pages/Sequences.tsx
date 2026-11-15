import { PageSeo } from '@/components/layout/PageSeo';
import { staticPageMeta } from '@/shared/seo/seo';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ActiveFilters } from '@/components/catalog/ActiveFilters';
import { useCatalogFilterChips } from '@/components/catalog/useCatalogFilterChips';
import { CatalogHeader, CatalogToolbar } from '@/components/catalog/CatalogToolbar';
import { LearningContext } from '@/components/learning/LearningPathGuide';
import { PageState } from '@/components/layout/PageState';
import { SequenceList } from '@/components/sequence/SequenceList';
import { useSequences } from '@/features/sequences/useSequences';
import { Pagination } from '@/components/course/Pagination';
import { PAGE_SIZE } from '@/entities/course/course.types';
import { filterSequences } from '@/entities/sequence/sequence';
import { useCatalogParams, type CatalogParamKey } from '@/shared/hooks/useCatalogParams';

export default function Sequences() {
  const { t } = useTranslation();
  const { page, search, language, filter, reset } = useCatalogParams();
  const query = useSequences();
  const results = useRef<HTMLDivElement>(null);
  const chips = useCatalogFilterChips({ search, language });
  const changePage = (value: number) => {
    filter('page', String(value));
    results.current?.scrollIntoView({ block: 'start' });
    results.current?.focus({ preventScroll: true });
  };
  const matching = filterSequences(query.data ?? [], search, language);
  const pageItems = matching.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  return <>
    <PageSeo {...staticPageMeta('/sequences', { title: t('sequences.title'), description: t('sequences.description') })} />
    <CatalogHeader title={t('sequences.title')} description={t('sequences.description')} total={query.data?.length} />
    <LearningContext focus="sequence" />
    <p className="mt-4 max-w-prose text-sm text-muted-foreground">{t('sequences.notice')}</p>
    <CatalogToolbar
      search={search}
      language={language}
      onFilter={filter}
      searchLabel={t('sequences.search')}
      searchPlaceholder={t('sequences.searchPlaceholder')}
    />
    <ActiveFilters count={query.data ? matching.length : undefined} filters={chips}
      onRemove={key => filter(key as CatalogParamKey, '')} onReset={reset} />
    <div ref={results} tabIndex={-1} aria-label={t('sequences.results')} className="scroll-mt-24 outline-none">
      {query.isPending ? <PageState loading />
        : query.error ? <PageState level="h2" title={t('common.error')} description={query.error.message} retry={() => void query.refetch()} />
        : matching.length ? <SequenceList sequences={pageItems} />
        : chips.length ? <PageState level="h2" title={t('sequences.noMatches')} description={t('sequences.noMatchesText')} />
        : <PageState level="h2" title={t('sequences.empty')} description={t('sequences.emptyText')} />}
      {matching.length > 0 && <Pagination page={page} total={matching.length} onChange={changePage} />}
    </div>
  </>;
}
