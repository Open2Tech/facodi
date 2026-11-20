import { ArrowRight, BookOpenCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useResources } from '@/features/courses/queries/useCourses';
import { useSequences } from '@/features/sequences/useSequences';
import { PageState } from '@/components/layout/PageState';
import { SequenceList } from '@/components/sequence/SequenceList';
import { plainText } from '@/shared/lib/text';

/** Entry points from the public catalogue, not recommendations or a second search index. */
export function ResourceDiscovery() {
  const { t } = useTranslation();
  const modules = useResources({ search: '', language: '', page: 1, objectType: 'module' });
  const sequences = useSequences();
  const module = modules.data?.items[0];
  const sequence = sequences.data?.find(item => item.itemCount > 0);

  return <section aria-labelledby="guided-discovery" className="my-9">
    <h2 id="guided-discovery" className="text-2xl font-semibold tracking-tight">{t('resourceExplorer.guidedTitle')}</h2>
    <p className="mt-2 max-w-prose text-sm text-muted-foreground">{t('resourceExplorer.guidedDescription')}</p>
    <div className="mt-5 grid gap-6 lg:grid-cols-2">
      <div className="min-w-0 border border-input border-t-4 border-t-brand-mint bg-card p-5">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-semibold">{t('studyModules.title')}</h3>
          <Link to="/resources?type=module" className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold underline underline-offset-4">
            {t('resourceExplorer.allModules')}<ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
        {modules.isPending ? <p role="status" className="py-5 text-sm text-muted-foreground">{t('common.loading')}</p>
          : modules.error ? <PageState level="h4" title={t('common.error')} description={modules.error.message} retry={() => void modules.refetch()} />
          : module ? <Link to={`/modules/${encodeURIComponent(module.slug)}`}
            className="group mt-2 flex gap-4 py-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <span className="grid h-11 w-11 shrink-0 place-items-center border border-foreground bg-brand-mint text-brand-ink">
              <BookOpenCheck className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="mb-1 block font-mono text-xs text-muted-foreground" lang={module.language}>{module.language}</span>
              <h4 className="text-lg font-semibold leading-snug group-hover:underline group-hover:underline-offset-4">{module.title}</h4>
              {module.description && <span className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{plainText(module.description)}</span>}
            </span>
          </Link>
          : <p className="py-5 text-sm text-muted-foreground">{t('resourceExplorer.noModules')}</p>}
      </div>
      <div className="min-w-0 border border-input border-t-4 border-t-brand-pink bg-card p-5">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-semibold">{t('sequences.title')}</h3>
          <Link to="/sequences" className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold underline underline-offset-4">
            {t('resourceExplorer.allSequences')}<ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
        {sequences.isPending ? <p role="status" className="py-5 text-sm text-muted-foreground">{t('common.loading')}</p>
          : sequences.error ? <PageState level="h4" title={t('common.error')} description={sequences.error.message} retry={() => void sequences.refetch()} />
          : sequence ? <SequenceList sequences={[sequence]} headingLevel={4} />
          : <p className="py-5 text-sm text-muted-foreground">{t('resourceExplorer.noSequences')}</p>}
      </div>
    </div>
    <p className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
      {t('resourceExplorer.academicContext')}
      <Link to="/courses" className="inline-flex min-h-10 items-center font-semibold text-foreground underline underline-offset-4">{t('nav.courses')}</Link>
      <Link to="/units" className="inline-flex min-h-10 items-center font-semibold text-foreground underline underline-offset-4">{t('units.title')}</Link>
    </p>
  </section>;
}
