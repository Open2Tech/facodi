import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useOverview } from '@/features/courses/queries/useCourses';
import { PageState } from '@/components/layout/PageState';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function Admin() {
  const { t } = useTranslation();
  const query = useOverview();
  return <>
    <h1 className="text-3xl font-semibold">{t('admin.heading')}</h1><p className="mb-8 mt-4 max-w-prose text-muted-foreground">{t('admin.description')}</p>
    {query.isPending ? <PageState loading /> : query.error ? <PageState title={t('common.error')} description={query.error.message} retry={() => void query.refetch()} /> : <Table>
      <TableHeader><TableRow><TableHead>{t('admin.content')}</TableHead>{['total', 'draft', 'active', 'published', 'archived', 'other', 'flag'].map(state => <TableHead key={state}>{t(`admin.${state}`)}</TableHead>)}</TableRow></TableHeader>
      <TableBody>{query.data.map(row => <TableRow key={row.kind}><TableCell className="font-semibold">{t(`content.${row.kind}`)}</TableCell><TableCell>{row.total}</TableCell><TableCell>{row.draft}</TableCell><TableCell>{row.active}</TableCell><TableCell>{row.publishedState}</TableCell><TableCell>{row.archived}</TableCell><TableCell>{Math.max(0, row.total - row.draft - row.active - row.publishedState - row.archived)}</TableCell><TableCell>{row.published}</TableCell></TableRow>)}</TableBody>
    </Table>}
    <p className="my-5 text-sm text-muted-foreground">{t('admin.visibility')}</p>
    <Button className="mt-5" asChild><Link to="/editor">{t('nav.editor')}</Link></Button>
  </>;
}
