import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight } from 'lucide-react';
import { useOverview } from '@/features/courses/queries/useCourses';
import { kindTone } from '@/components/catalog/contentTone';
import { StateSwatch } from '@/components/editorial/StatusBadge';
import { stateSwatch } from '@/components/editorial/statusTone';
import { PageState } from '@/components/layout/PageState';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

const BAR_STATES = ['active', 'published', 'draft', 'archived', 'other'] as const;
const COLUMNS = ['total', 'draft', 'active', 'published', 'archived', 'other', 'flag'] as const;

export default function Admin() {
  const { t } = useTranslation();
  const query = useOverview();
  const rows = query.data?.map(row => {
    const other = Math.max(0, row.total - row.draft - row.active - row.publishedState - row.archived);
    return { ...row, other, states: { active: row.active, published: row.publishedState, draft: row.draft, archived: row.archived, other } };
  });
  return <>
    <h1 className="text-3xl font-semibold">{t('admin.heading')}</h1><p className="mb-8 mt-4 max-w-prose text-muted-foreground">{t('admin.description')}</p>
    {query.isPending ? <PageState loading /> : query.error || !rows ? <PageState title={t('common.error')} description={query.error?.message} retry={() => void query.refetch()} /> : <>
      <section aria-labelledby="admin-composition" className="mb-12">
        <h2 id="admin-composition" className="mb-4 text-xl font-semibold">{t('admin.composition')}</h2>
        <ul className="divide-y divide-input border-y border-input">
          {rows.map(row => {
            const { icon: Icon, fill } = kindTone(row.kind);
            const summary = BAR_STATES.filter(state => row.states[state]).map(state => `${t(state === 'other' ? 'admin.other' : `states.${state}`)}: ${row.states[state]}`).join(', ');
            return <li key={row.kind} className="grid gap-4 py-5 sm:grid-cols-[minmax(0,16rem)_1fr] sm:items-center sm:gap-8">
              <div className="flex items-center gap-3">
                <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center border border-foreground text-ink', fill)}><Icon className="h-5 w-5" aria-hidden="true" /></span>
                <div className="min-w-0">
                  <p className="font-semibold">{t(`content.${row.kind}`)}</p>
                  <p className="font-mono text-sm tabular-nums text-muted-foreground">{t('admin.items', { count: row.total })}</p>
                </div>
              </div>
              <div role="img" aria-label={summary || t('admin.empty')} className="flex h-4 w-full overflow-hidden border border-input bg-muted/40">
                {row.total > 0 && BAR_STATES.map(state => row.states[state] > 0 && <span key={state} className={cn('h-full', stateSwatch(state))} style={{ width: `${(row.states[state] / row.total) * 100}%` }} />)}
              </div>
            </li>;
          })}
        </ul>
        <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
          {BAR_STATES.map(state => <li key={state} className="inline-flex items-center gap-2"><StateSwatch status={state} />{t(state === 'other' ? 'admin.other' : `states.${state}`)}</li>)}
        </ul>
      </section>
      <h2 id="admin-table" className="mb-4 text-xl font-semibold">{t('admin.table')}</h2>
      <Table containerProps={{ role: 'region', 'aria-labelledby': 'admin-table', tabIndex: 0, className: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring' }}>
        <TableHeader><TableRow><TableHead>{t('admin.content')}</TableHead>{COLUMNS.map(column => <TableHead key={column} className="text-right">{t(`admin.${column}`)}</TableHead>)}</TableRow></TableHeader>
        <TableBody>{rows.map(row => {
          const { icon: Icon } = kindTone(row.kind);
          const values = [row.total, row.draft, row.active, row.publishedState, row.archived, row.other, row.published];
          return <TableRow key={row.kind}>
            <TableCell className="font-semibold"><span className="inline-flex items-center gap-2"><Icon className="h-4 w-4 shrink-0" aria-hidden="true" />{t(`content.${row.kind}`)}</span></TableCell>
            {values.map((value, index) => <TableCell key={COLUMNS[index]} className="text-right font-mono tabular-nums">{value}</TableCell>)}
          </TableRow>;
        })}</TableBody>
      </Table>
    </>}
    <p className="mt-6 max-w-prose text-sm text-muted-foreground">{t('admin.visibility')}</p>
    <Button className="mt-8" asChild><Link to="/editor">{t('nav.editor')}<ArrowRight /></Link></Button>
  </>;
}
