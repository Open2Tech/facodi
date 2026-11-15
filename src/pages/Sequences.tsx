import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { CatalogHeader, CatalogToolbar } from '@/components/catalog/CatalogToolbar';
import { LearningContext } from '@/components/learning/LearningPathGuide';
import { PageState } from '@/components/layout/PageState';
import { SequenceList } from '@/components/sequence/SequenceList';
import { useSequences } from '@/features/sequences/useSequences';
import { Pagination } from '@/components/course/Pagination';
import { PAGE_SIZE } from '@/entities/course/course.types';
import { filterSequences } from '@/entities/sequence/sequence';
import { useCatalogParams } from '@/shared/hooks/useCatalogParams';

export default function Sequences() {
  const { t } = useTranslation();
  const { page, search, language, filter, filtered, reset } = useCatalogParams();
  const query = useSequences();
  const matching = filterSequences(query.data ?? [], search, language);
  const pageItems = matching.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  return <>
    <Helmet>
      <title>{`${t('sequences.title')} — FACODI`}</title>
      <meta name="description" content={t('sequences.description')} />
    </Helmet>
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
    <div className="mt-10">
      {filtered && matching.length > 0 && <div className="mb-5 flex justify-end">
        <button type="button" className="text-sm font-semibold underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2" onClick={reset}>
          {t('sequences.clearFilters')}
        </button>
      </div>}
      {query.isPending ? <PageState loading />
        : query.error ? <PageState level="h2" title={t('common.error')} description={query.error.message} retry={() => void query.refetch()} />
        : matching.length ? <SequenceList sequences={pageItems} />
        : filtered ? <div>
          <PageState level="h2" title={t('sequences.noMatches')} description={t('catalog.noResults')} />
          <button type="button" className="mt-5 text-sm font-semibold underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2" onClick={reset}>
            {t('sequences.clearFilters')}
          </button>
        </div>
        : <PageState level="h2" title={t('sequences.empty')} description={t('sequences.emptyText')} />}
      {!query.isPending && !query.error && matching.length > 0 && <Pagination page={page} total={matching.length} onChange={value => filter('page', String(value))} />}
    </div>
  </>;
}
