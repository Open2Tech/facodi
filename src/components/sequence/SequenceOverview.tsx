import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, ListVideo } from 'lucide-react';
import { useMySequences } from '@/features/sequences/useSequences';
import { SequenceProgress } from './SequenceProgress';

const LIMIT = 4;

/** Sequences the learner is following, most recently active first. */
export function SequenceOverview() {
  const { t } = useTranslation();
  const query = useMySequences(LIMIT);
  return <section aria-labelledby="dashboard-sequences" className="mt-12">
    <div className="flex flex-wrap items-end justify-between gap-3 border-b border-foreground pb-3">
      <h2 id="dashboard-sequences" className="flex items-center gap-3 text-2xl font-semibold tracking-[-0.02em]">
        <span className="grid h-9 w-9 place-items-center border border-foreground bg-brand-pink text-ink" aria-hidden="true"><ListVideo className="h-5 w-5" strokeWidth={1.75} /></span>
        {t('sequences.overviewTitle')}
      </h2>
      {!!query.data?.total && <p className="font-mono text-xs tabular-nums text-muted-foreground">{t('sequences.overviewTotal', { count: query.data.total })}</p>}
    </div>
    {query.isError ? <div role="alert" className="py-6 text-sm">
      <p>{t('sequences.loadFailed')}</p>
      <button type="button" onClick={() => void query.refetch()} className="mt-2 font-semibold underline underline-offset-4">{t('common.retry')}</button>
    </div>
      : query.isPending ? <p className="py-6 text-sm text-muted-foreground">{t('common.loading')}</p>
      : !query.data.items.length ? <div className="py-6">
        <p className="max-w-prose text-muted-foreground">{t('sequences.overviewEmpty')}</p>
        <Link to="/sequences" className="mt-3 inline-flex items-center gap-2 text-sm font-semibold underline underline-offset-4">{t('sequences.browse')}<ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
      </div>
        : <ul className="divide-y divide-input border-b border-input">
          {query.data.items.map(item => <li key={item.slug}>
            <Link to={`/sequences/${encodeURIComponent(item.slug)}`} className="group grid gap-x-8 gap-y-3 py-4 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:grid-cols-[minmax(0,1fr)_16rem] sm:items-center sm:px-3">
              <span className="min-w-0 font-semibold decoration-2 underline-offset-4 group-hover:underline">{item.title}</span>
              <SequenceProgress completed={item.completed} total={item.total} label={t('sequences.progressLabel', { title: item.title })} />
            </Link>
          </li>)}
        </ul>}
    {!!query.data?.items.length && <p className="mt-3 text-sm">
      <Link to="/sequences" className="inline-flex items-center gap-2 font-semibold underline underline-offset-4">{t('sequences.browse')}<ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
    </p>}
  </section>;
}
