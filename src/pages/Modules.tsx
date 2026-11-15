import { ArrowRight, BookOpenCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { useModules } from '@/features/modules/useModules';
import { useCatalogParams } from '@/shared/hooks/useCatalogParams';
import { Pagination } from '@/components/course/Pagination';
import { PageState } from '@/components/layout/PageState';
import { CatalogHeader, CatalogToolbar } from '@/components/catalog/CatalogToolbar';
import { LearningContext } from '@/components/learning/LearningPathGuide';
import { plainText } from '@/shared/lib/text';

export default function Modules() {
  const { t } = useTranslation();
  const { page, search, filter } = useCatalogParams();
  const query = useModules(page, search);
  return <>
    <Helmet>
      <title>{`${t('studyModules.title')} — FACODI`}</title>
      <meta name="description" content={t('studyModules.description')} />
    </Helmet>
    <CatalogHeader title={t('studyModules.title')} description={t('studyModules.description')} total={query.data?.total} />
    <LearningContext focus="module" />
    <CatalogToolbar search={search} language="" withLanguage={false}
      onFilter={(key, value) => { if (key === 'search') filter('search', value); }} />
    {query.isPending ? <PageState loading />
      : query.error ? <PageState title={t('common.error')} description={query.error.message} retry={() => void query.refetch()} />
      : <>
        {query.data.items.length ? <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {query.data.items.map(module => <li key={module.id}>
            <Link to={`/modules/${encodeURIComponent(module.slug)}`}
              className="group flex h-full flex-col gap-4 border border-input p-6 transition-colors hover:border-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">
              <span className="flex items-center justify-between gap-4">
                <span className="grid h-11 w-11 place-items-center border border-foreground bg-brand-mint text-ink">
                  <BookOpenCheck className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="font-mono text-xs uppercase text-muted-foreground">{t('objectTypes.module')}</span>
              </span>
              <h2 className="text-xl font-semibold leading-snug group-hover:underline group-hover:underline-offset-4">{module.title}</h2>
              {module.description && <p className="line-clamp-3 flex-1 text-sm leading-relaxed text-muted-foreground">
                {plainText(module.description)}
              </p>}
              <span className="mt-auto inline-flex items-center gap-2 text-sm font-semibold">
                {t('studyModules.open')}<ArrowRight className="h-4 w-4" aria-hidden="true" />
              </span>
            </Link>
          </li>)}
        </ul> : <PageState title={t('studyModules.empty')} description={t('studyModules.emptyDescription')} />}
        <Pagination page={page} total={query.data.total} onChange={value => filter('page',String(value))} />
      </>}
    <p className="mt-10 max-w-prose border-t border-input pt-5 text-sm leading-relaxed text-muted-foreground">
      {t('studyModules.disclaimer')}
    </p>
  </>;
}
