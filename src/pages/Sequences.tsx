import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { CatalogHeader } from '@/components/catalog/CatalogToolbar';
import { LearningContext } from '@/components/learning/LearningPathGuide';
import { PageState } from '@/components/layout/PageState';
import { SequenceList } from '@/components/sequence/SequenceList';
import { useSequences } from '@/features/sequences/useSequences';

export default function Sequences() {
  const { t } = useTranslation();
  const query = useSequences();
  return <>
    <Helmet>
      <title>{`${t('sequences.title')} — FACODI`}</title>
      <meta name="description" content={t('sequences.description')} />
    </Helmet>
    <CatalogHeader title={t('sequences.title')} description={t('sequences.description')} total={query.data?.length} />
    <LearningContext focus="sequence" />
    <p className="mt-4 max-w-prose text-sm text-muted-foreground">{t('sequences.notice')}</p>
    <div className="mt-10">
      {query.isPending ? <PageState loading />
        : query.error ? <PageState level="h2" title={t('common.error')} description={query.error.message} retry={() => void query.refetch()} />
        : query.data.length ? <SequenceList sequences={query.data} />
        : <PageState level="h2" title={t('sequences.empty')} description={t('sequences.emptyText')} />}
    </div>
  </>;
}
