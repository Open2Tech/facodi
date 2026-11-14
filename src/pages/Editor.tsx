import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowUpRight, BookOpenCheck, Lightbulb, ListVideo, UsersRound, Plus } from 'lucide-react';
import { EDITORIAL_STATUSES, type Content, type ContentKind, type EditorialStatus } from '@/entities/course/course.types';
import { useContentMutations, useEditorial, useObjectTypeFacets } from '@/features/courses/queries/useCourses';
import { ContentForm } from '@/components/editorial/ContentForm';
import { StateSwatch, StatusBadge } from '@/components/editorial/StatusBadge';
import { kindTone } from '@/components/catalog/contentTone';
import { TypeBadge } from '@/components/catalog/TypeBadge';
import { Pagination } from '@/components/course/Pagination';
import { SearchInput } from '@/components/catalog/SearchInput';
import { PageState } from '@/components/layout/PageState';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

const kinds: ContentKind[] = ['courses', 'curricular_units', 'learning_objects'];
type EditorParam = 'kind' | 'status' | 'type' | 'search' | 'page';

/** Public route of an item the catalogue already shows; units are reached through their course page. */
function publicPath(kind: ContentKind, item: Content) {
  if (!item.published) return null;
  if (kind === 'courses' && item.status === 'active') return `/courses/${item.slug}`;
  if (kind === 'learning_objects' && (item.status === 'active' || item.status === 'published')) return `/resources/${item.slug}`;
  return null;
}

export default function Editor() {
  const { t } = useTranslation();
  const [params, setParams] = useSearchParams();
  const kind = kinds.find(value => value === params.get('kind')) ?? 'courses';
  const status: EditorialStatus | undefined = EDITORIAL_STATUSES.find(value => value === params.get('status'));
  const objectType = kind === 'learning_objects' ? params.get('type') || undefined : undefined;
  const search = params.get('search') ?? '';
  const page = Math.max(1, Math.floor(Number(params.get('page'))) || 1);
  function update(values: Partial<Record<EditorParam, string | undefined>>, base = params) {
    const next = new URLSearchParams(base);
    for (const [key, value] of Object.entries(values)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    if (!('page' in values)) next.delete('page');
    setParams(next, { replace: true });
  }
  const setPage = (value: number) => update({ page: value > 1 ? String(value) : undefined });
  const [editing, setEditing] = useState<Content | 'new' | null>(null);
  const [confirmation, setConfirmation] = useState<{ item: Content; action: 'publish' | 'archive' | 'draft' } | null>(null);
  const query = useEditorial(kind, { page, search, language: '', status, objectType });
  const objectTypes = useObjectTypeFacets(kind === 'learning_objects');
  const { save, publish } = useContentMutations();
  function resetForm() { setEditing(null); save.reset(); }
  return <>
    <div className="mb-8 flex flex-wrap items-start justify-between gap-5">
      <div><h1 className="text-3xl font-semibold">{t('editor.heading')}</h1><p className="mt-3 max-w-prose text-muted-foreground">{t('editor.descriptionText')}</p></div>
      {!editing && <div className="flex flex-wrap gap-2"><Button variant="outline" asChild><Link to="/editor/study-paths"><BookOpenCheck className="h-4 w-4" />{t('studyReview.open')}</Link></Button><Button variant="outline" asChild><Link to="/editor/playlists"><ListVideo className="h-4 w-4" />{t('playlistReview.open')}</Link></Button><Button variant="outline" asChild><Link to="/editor/suggestions"><Lightbulb className="h-4 w-4" />{t('suggestReview.open')}</Link></Button><Button variant="outline" asChild><Link to="/editor/project-credits"><UsersRound className="h-4 w-4" />{t('projectCredits.open')}</Link></Button><Button onClick={() => { save.reset(); setEditing('new'); }}><Plus />{t('editor.create')}</Button></div>}
    </div>
    <Tabs value={kind} onValueChange={value => {
      const selectedKind = kinds.find(kind => kind === value);
      if (selectedKind) { update({ kind: selectedKind === 'courses' ? undefined : selectedKind }, new URLSearchParams()); resetForm(); publish.reset(); }
    }}>
      <TabsList className="h-auto flex-wrap justify-start gap-1">{kinds.map(item => {
        const { icon: Icon } = kindTone(item);
        return <TabsTrigger key={item} value={item} className="gap-2" disabled={save.isPending || publish.isPending}><Icon className="h-4 w-4" aria-hidden="true" />{t(`content.${item}`)}</TabsTrigger>;
      })}</TabsList>
    <TabsContent value={kind} className="mt-0 focus-visible:ring-offset-4">
    {editing ? <ContentForm key={`${kind}:${editing === 'new' ? 'new' : editing.id}`} kind={kind} content={editing === 'new' ? undefined : editing} saving={save.isPending} error={save.error?.message} onCancel={resetForm} onSave={async input => {
      try { await save.mutateAsync(input); resetForm(); }
      catch { /* The mutation error is rendered beside the form. */ }
    }} /> : <>
      <div className="mt-7 flex flex-wrap items-end gap-x-6 gap-y-4">
        <label className="block w-full max-w-lg space-y-2 text-sm font-medium"><span>{t('catalog.search')}</span><SearchInput value={search} onSearch={value => update({ search: value })} /></label>
        {kind === 'learning_objects' && <div className="w-full space-y-2 text-sm font-medium sm:w-64">
          <span id="editor-type-label">{t('editor.typeFilter')}</span>
          <Select value={objectType ?? 'all'} onValueChange={value => update({ type: value === 'all' ? undefined : value })}>
            <SelectTrigger aria-labelledby="editor-type-label"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('editor.allTypes')}</SelectItem>
              {objectTypes.data?.map(option => <SelectItem key={option.value} value={option.value}>{t(`objectTypes.${option.value}`, { defaultValue: option.value })} <span className="font-mono tabular-nums text-muted-foreground">{option.count}</span></SelectItem>)}
            </SelectContent>
          </Select>
        </div>}
      </div>
      <div className="mb-7 mt-5 space-y-2">
        <p id="editor-status-label" className="text-sm font-medium">{t('editor.statusFilter')}</p>
        <ToggleGroup type="single" aria-labelledby="editor-status-label" variant="outline" className="flex-wrap justify-start" value={status ?? 'all'} onValueChange={value => {
          if (!value) return;
          update({ status: value === 'all' ? undefined : value });
        }}>
          <ToggleGroupItem value="all">{t('editor.allStates')}</ToggleGroupItem>
          {EDITORIAL_STATUSES.map(state => <ToggleGroupItem key={state} value={state} className="gap-2">
            <StateSwatch status={state} />{t(`states.${state}`)}
            {query.data && <span className="font-mono text-xs tabular-nums text-muted-foreground">{query.data.statusCounts[state]}</span>}
          </ToggleGroupItem>)}
        </ToggleGroup>
      </div>
      {publish.error && <p role="alert" className="my-5 text-destructive">{publish.error.message}</p>}
      {publish.isSuccess && <p role="status" className="my-5 text-sm">{t('editor.updated')}</p>}
      {query.isPending ? <PageState loading /> : query.error ? <PageState title={t('common.error')} description={query.error.message} retry={() => void query.refetch()} /> : <>
        {!query.data.items.length ? <PageState title={t('editor.empty')} description={t('editor.emptyDescription')} /> : <ul className="divide-y divide-input border-y border-input">
          {query.data.items.map(item => <li key={item.id} className="flex flex-col justify-between gap-5 py-6 lg:flex-row lg:items-center">
            <div className="min-w-0">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                {'object_type' in item
                  ? <TypeBadge type={item.object_type} label={t(`objectTypes.${item.object_type}`, { defaultValue: item.object_type })} />
                  : <TypeBadge type={kind === 'courses' ? 'course' : 'curricular_unit'} label={t(`objectTypes.${kind === 'courses' ? 'course' : 'curricular_unit'}`)} />}
                <StatusBadge status={item.status} label={t(`states.${item.status}`, { defaultValue: item.status })} />
              </div>
              <h2 className="break-words text-xl font-semibold">{item.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{t(item.published ? 'editor.flagPublished' : 'editor.flagUnpublished')} · {item.language}{'source_type' in item && <> · {t('editor.origin', { source: item.source_type })}</>}</p>
              {(() => {
                const path = publicPath(kind, item);
                return path && <Link to={path} aria-label={`${t('editor.viewPublic')}: ${item.title}`} className="mt-3 inline-flex items-center gap-1 text-sm font-medium underline decoration-foreground/40 underline-offset-4 hover:decoration-foreground">{t('editor.viewPublic')}<ArrowUpRight className="h-4 w-4" aria-hidden="true" /></Link>;
              })()}
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <Button variant="outline" onClick={() => { save.reset(); setEditing(item); }}>{t('common.edit')}</Button>
              <Button variant="outline" disabled={publish.isPending || (item.status === 'active' && item.published)} onClick={() => setConfirmation({ item, action: 'publish' })}>{t('editor.publish')}</Button>
              <Button variant="outline" disabled={publish.isPending || (item.status === 'draft' && !item.published)} onClick={() => setConfirmation({ item, action: 'draft' })}>{t('editor.unpublish')}</Button>
              <Button variant="outline" disabled={publish.isPending || item.status === 'archived'} onClick={() => setConfirmation({ item, action: 'archive' })}>{t('editor.archive')}</Button>
            </div>
          </li>)}
        </ul>}
        <Pagination page={page} total={query.data.total} onChange={setPage} />
      </>}
    </>}
    </TabsContent>
    </Tabs>
    <AlertDialog open={!!confirmation} onOpenChange={open => { if (!open) setConfirmation(null); }}>
      <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{t(`editor.${confirmation?.action === 'draft' ? 'unpublish' : confirmation?.action ?? 'publish'}`)}</AlertDialogTitle><AlertDialogDescription>{confirmation?.item.title}. {t(kind === 'curricular_units' ? 'editor.unitVisibility' : 'editor.confirmChange')}</AlertDialogDescription></AlertDialogHeader>
        <AlertDialogFooter><AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel><AlertDialogAction onClick={() => { if (confirmation) publish.mutate({ kind, id: confirmation.item.id, action: confirmation.action }); }}>{t('common.confirm')}</AlertDialogAction></AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </>;
}
