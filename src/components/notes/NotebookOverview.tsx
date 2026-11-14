import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, NotebookPen } from 'lucide-react';
import { useNotebook } from '@/features/notes/useNotebook';
import type { StudyNote } from '@/entities/notes/notes';

const LIMIT = 5;

/** Resources the learner has annotated on this device, most recently edited first. */
export function NotebookOverview() {
  const { t, i18n } = useTranslation();
  const { all, ready } = useNotebook();
  const groups = useMemo(() => {
    const byResource = new Map<string, StudyNote[]>();
    for (const note of all) byResource.set(note.resourceId, [...(byResource.get(note.resourceId) ?? []), note]);
    return [...byResource.values()]
      .map(notes => {
        const latest = notes.reduce((a, b) => (a.updatedAt > b.updatedAt ? a : b));
        return { latest, count: notes.length };
      })
      .sort((a, b) => b.latest.updatedAt.localeCompare(a.latest.updatedAt));
  }, [all]);
  const date = new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium' });

  return <section aria-labelledby="dashboard-notebook" className="mt-12">
    <div className="flex flex-wrap items-end justify-between gap-3 border-b border-foreground pb-3">
      <h2 id="dashboard-notebook" className="flex items-center gap-3 text-2xl font-semibold tracking-[-0.02em]">
        <span className="grid h-9 w-9 place-items-center border border-foreground bg-primary text-primary-foreground" aria-hidden="true"><NotebookPen className="h-5 w-5" strokeWidth={1.75} /></span>
        {t('notes.overviewTitle')}
      </h2>
      {ready && all.length > 0 && <p className="font-mono text-xs tabular-nums text-muted-foreground">{t('notes.overviewTotals', { notes: t('notes.count', { count: all.length }), resources: t('notes.resourceCount', { count: groups.length }) })}</p>}
    </div>
    {!ready ? <p className="py-6 text-sm text-muted-foreground">{t('common.loading')}</p>
      : !groups.length ? <div className="py-6">
        <p className="max-w-prose text-muted-foreground">{t('notes.overviewEmpty')}</p>
        <Link to="/resources?type=video" className="mt-3 inline-flex items-center gap-2 text-sm font-semibold underline underline-offset-4">{t('notes.overviewBrowse')}<ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
      </div>
        : <ul className="divide-y divide-input border-b border-input">
          {groups.slice(0, LIMIT).map(({ latest, count }) => <li key={latest.resourceId}>
            <Link to={`/resources/${latest.resourceSlug}?notes=open`} className="group flex items-center gap-4 py-4 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:px-3">
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold decoration-2 underline-offset-4 group-hover:underline">{latest.resourceTitle}</span>
                <span className="mt-1 block truncate text-sm text-muted-foreground">{t('notes.overviewLatest', { title: latest.title })}</span>
              </span>
              <span className="hidden shrink-0 text-right text-xs text-muted-foreground sm:block">
                <span className="block font-mono tabular-nums text-foreground">{t('notes.count', { count })}</span>
                <time dateTime={latest.updatedAt}>{date.format(new Date(latest.updatedAt))}</time>
              </span>
              <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
            </Link>
          </li>)}
        </ul>}
    {groups.length > LIMIT && <p className="mt-3 text-sm text-muted-foreground">{t('notes.overviewMore', { count: groups.length - LIMIT })}</p>}
    <p className="mt-4 text-xs text-muted-foreground">{t('notes.storedLocally')}</p>
  </section>;
}
