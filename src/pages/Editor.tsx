import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';
import type { Content, ContentKind } from '@/entities/course/course.types';
import { useContentMutations, useEditorial } from '@/features/courses/queries/useCourses';
import { ContentForm } from '@/components/editorial/ContentForm';
import { Pagination } from '@/components/course/Pagination';
import { PageState } from '@/components/layout/PageState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

const kinds: ContentKind[] = ['courses', 'curricular_units', 'learning_objects'];
export default function Editor() {
  const { t } = useTranslation();
  const [kind, setKind] = useState<ContentKind>('courses');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Content | 'new' | null>(null);
  const [confirmation, setConfirmation] = useState<{ item: Content; action: 'publish' | 'archive' | 'draft' } | null>(null);
  const query = useEditorial(kind, { page, search, language: '' });
  const { save, publish } = useContentMutations();
  function resetForm() { setEditing(null); save.reset(); }
  return <>
    <div className="mb-8 flex flex-wrap items-start justify-between gap-5">
      <div><h1 className="text-3xl font-semibold">{t('editor.heading')}</h1><p className="mt-3 max-w-prose text-muted-foreground">{t('editor.descriptionText')}</p></div>
      {!editing && <Button onClick={() => { save.reset(); setEditing('new'); }}><Plus />{t('editor.create')}</Button>}
    </div>
    <Tabs value={kind} onValueChange={value => {
      const selectedKind = kinds.find(kind => kind === value);
      if (selectedKind) { setKind(selectedKind); setPage(1); setSearch(''); resetForm(); publish.reset(); }
    }}>
      <TabsList className="h-auto flex-wrap justify-start gap-1">{kinds.map(item => <TabsTrigger key={item} value={item} disabled={save.isPending || publish.isPending}>{t(`content.${item}`)}</TabsTrigger>)}</TabsList>
    </Tabs>
    {editing ? <ContentForm key={`${kind}:${editing === 'new' ? 'new' : editing.id}`} kind={kind} content={editing === 'new' ? undefined : editing} saving={save.isPending} error={save.error?.message} onCancel={resetForm} onSave={async input => {
      try { await save.mutateAsync(input); resetForm(); }
      catch { /* The mutation error is rendered beside the form. */ }
    }} /> : <>
      <label className="my-7 block max-w-lg space-y-2 text-sm font-medium"><span>{t('catalog.search')}</span><Input type="search" value={search} onChange={event => { setSearch(event.target.value); setPage(1); }} /></label>
      {publish.error && <p role="alert" className="my-5 text-destructive">{publish.error.message}</p>}
      {publish.isSuccess && <p role="status" className="my-5 text-sm">{t('editor.updated')}</p>}
      {query.isPending ? <PageState loading /> : query.error ? <PageState title={t('common.error')} description={query.error.message} retry={() => void query.refetch()} /> : <>
        {!query.data.items.length ? <PageState title={t('editor.empty')} description={t('editor.emptyDescription')} /> : <ul className="divide-y divide-input border-y border-input">
          {query.data.items.map(item => <li key={item.id} className="flex flex-col justify-between gap-5 py-6 lg:flex-row lg:items-center">
            <div className="min-w-0"><h2 className="break-words text-xl font-semibold">{item.title}</h2><p className="mt-2 text-sm text-muted-foreground">{t(`states.${item.status}`, { defaultValue: item.status })} · {t(item.published ? 'editor.flagPublished' : 'editor.flagUnpublished')} · {item.language}</p></div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <Button variant="outline" onClick={() => { save.reset(); setEditing(item); }}>{t('common.edit')}</Button>
              <Button variant="outline" disabled={publish.isPending} onClick={() => setConfirmation({ item, action: 'publish' })}>{t('editor.publish')}</Button>
              <Button variant="outline" disabled={publish.isPending} onClick={() => setConfirmation({ item, action: 'draft' })}>{t('editor.unpublish')}</Button>
              <Button variant="outline" disabled={publish.isPending || item.status === 'archived'} onClick={() => setConfirmation({ item, action: 'archive' })}>{t('editor.archive')}</Button>
            </div>
          </li>)}
        </ul>}
        <Pagination page={page} total={query.data.total} onChange={setPage} />
      </>}
    </>}
    <AlertDialog open={!!confirmation} onOpenChange={open => { if (!open) setConfirmation(null); }}>
      <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{t(`editor.${confirmation?.action === 'draft' ? 'unpublish' : confirmation?.action ?? 'publish'}`)}</AlertDialogTitle><AlertDialogDescription>{confirmation?.item.title}. {t(kind === 'curricular_units' ? 'editor.unitVisibility' : 'editor.confirmChange')}</AlertDialogDescription></AlertDialogHeader>
        <AlertDialogFooter><AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel><AlertDialogAction onClick={() => { if (confirmation) publish.mutate({ kind, id: confirmation.item.id, action: confirmation.action }); }}>{t('common.confirm')}</AlertDialogAction></AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </>;
}
