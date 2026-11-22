import { CampusDiscovery } from '@/components/discoveries/CampusDiscovery';
import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowUpRight, Download, NotebookPen, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SearchInput } from '@/components/catalog/SearchInput';
import { TypeBadge } from '@/components/catalog/TypeBadge';
import { NoteCard } from '@/components/notes/NoteCard';
import { NoteComposer } from '@/components/notes/NoteComposer';
import { GuestImport, NotebookStorage } from '@/components/notes/NotebookStorage';
import {
  countNoteViews, groupNotesByResource, NOTE_VIEWS, notebookToMarkdown, parseNoteView, searchNotes, tagCounts, type NoteView,
} from '@/entities/notes/notes';
import { useNotebook } from '@/features/notes/useNotebook';
import { useNoteActions } from '@/features/notes/useNoteActions';
import { cn } from '@/lib/utils';

const TAG_LIMIT = 16;
const chip = 'border px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

/** Every note the learner has written, searchable across resources. Visitors see this browser's notebook. */
export default function Notebook() {
  const { t } = useTranslation();
  const notebook = useNotebook();
  const { persist, remove } = useNoteActions(notebook);
  const [params, setParams] = useSearchParams();
  const [editing, setEditing] = useState<string | null>(null);
  const query = params.get('q') ?? '';
  const tag = params.get('tag') ?? '';
  const view = parseNoteView(params.get('view'));
  const filtered = Boolean(query.trim() || tag || view !== 'all');

  const counts = useMemo(() => countNoteViews(notebook.all), [notebook.all]);
  const tags = useMemo(() => tagCounts(notebook.all), [notebook.all]);
  const groups = useMemo(() => groupNotesByResource(searchNotes(notebook.all, { query, tag, view })), [notebook.all, query, tag, view]);
  const matches = groups.reduce((total, group) => total + group.notes.length, 0);
  const shownTags = tags.slice(0, TAG_LIMIT);
  if (tag && !shownTags.some(item => item.tag === tag)) shownTags.push({ tag, count: tags.find(item => item.tag === tag)?.count ?? 0 });

  function set(key: 'q' | 'tag' | 'view', value: string) {
    setParams(current => {
      const next = new URLSearchParams(current);
      if (value && !(key === 'view' && value === 'all')) next.set(key, value); else next.delete(key);
      return next;
    }, { replace: true });
  }

  function exportAll() {
    const markdown = notebookToMarkdown(groupNotesByResource(notebook.all), window.location.origin, {
      title: t('notebookPage.title'), source: t('notes.exportSource'), exportedAt: t('notes.exportedAt'), unavailable: t('notes.resourceUnavailable'),
    });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([markdown], { type: 'text/markdown;charset=utf-8' }));
    link.download = 'facodi-notebook.md';
    link.click();
    URL.revokeObjectURL(link.href);
  }

  return <>
    <header className="flex flex-wrap items-end justify-between gap-6 border-t-4 border-t-brand-mint pt-6">
      <div className="max-w-2xl">
        <h1 className="flex items-center gap-4 text-4xl font-semibold tracking-[-0.03em]">
          <span className="grid h-12 w-12 shrink-0 place-items-center border border-foreground bg-brand-mint text-brand-ink" aria-hidden="true"><NotebookPen className="h-6 w-6" strokeWidth={1.75} /></span>
          {t('notebookPage.title')}
        </h1>
        <p className="mt-4 text-muted-foreground">{t('notebookPage.description')}</p>
      </div>
      {notebook.ready && notebook.all.length > 0 && <Button type="button" variant="outline" onClick={exportAll}><Download />{t('notebookPage.exportAll')}</Button>}
    </header>
    <div className="mt-4"><CampusDiscovery discovery="margin" /></div>

    {notebook.failed ? <div role="alert" className="mt-10 border border-destructive px-5 py-5">
      <p>{t('notes.loadFailed')}</p>
      <Button type="button" variant="outline" size="sm" className="mt-3" onClick={() => void notebook.retry()}>{t('common.retry')}</Button>
    </div>
      : !notebook.ready ? <p className="mt-10 text-muted-foreground">{t('common.loading')}</p>
      : !notebook.all.length ? <div className="mt-10 border border-foreground bg-brand-mint px-6 py-10 text-brand-ink sm:px-8">
        <p className="max-w-prose text-base leading-relaxed text-brand-ink">{t('notes.overviewEmpty')}</p>
        <Link to="/resources?type=video" className="mt-5 inline-flex min-h-11 items-center gap-2 border border-brand-ink bg-brand-ink px-4 py-2 text-sm font-semibold text-ink-foreground transition-opacity hover:opacity-90">{t('notes.overviewBrowse')}<ArrowUpRight className="h-4 w-4" aria-hidden="true" /></Link>
      </div>
        : <>
          <div className="mb-8 mt-9 space-y-5 border-t border-input pt-5">
            <label className="block max-w-xl space-y-2 text-sm font-medium"><span className="block">{t('notebookPage.search')}</span>
              <SearchInput value={query} onSearch={value => set('q', value)} placeholder={t('notebookPage.searchPlaceholder')} />
            </label>
            <div role="group" aria-label={t('notes.filters')} className="flex flex-wrap gap-2">
              {NOTE_VIEWS.map((key: NoteView) => <button key={key} type="button" aria-pressed={view === key} onClick={() => set('view', key)}
                className={cn(chip, view === key ? 'border-foreground bg-primary font-semibold text-brand-ink' : 'border-input bg-card hover:border-foreground')}>
                {t(`notes.filter.${key}`)} <span className="font-mono tabular-nums">({counts[key]})</span>
              </button>)}
            </div>
            {shownTags.length > 0 && <div role="group" aria-label={t('notebookPage.tags')} className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <span className="text-sm font-medium">{t('notebookPage.tags')}</span>
              {shownTags.map(item => <button key={item.tag} type="button" aria-pressed={tag === item.tag} onClick={() => set('tag', tag === item.tag ? '' : item.tag)}
                className={cn('font-mono text-xs underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  tag === item.tag ? 'border border-foreground bg-brand-cyan px-1.5 py-0.5 font-semibold text-brand-ink' : 'text-muted-foreground hover:text-foreground hover:underline')}>
                #{item.tag} <span className="tabular-nums">{item.count}</span>
              </button>)}
            </div>}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-foreground pb-3">
            <p aria-live="polite" className="font-mono text-xs tabular-nums text-muted-foreground">
              {t('notes.overviewTotals', { notes: t('notes.count', { count: matches }), resources: t('notes.resourceCount', { count: groups.length }) })}
            </p>
            {filtered && <button type="button" onClick={() => setParams({}, { replace: true })} className="inline-flex items-center gap-1 text-sm font-semibold underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <X className="h-4 w-4" aria-hidden="true" />{t('notebookPage.clear')}
            </button>}
          </div>

          {!groups.length ? <p className="py-10 text-muted-foreground">{t('notes.emptyFiltered')}</p>
            : <div className="divide-y divide-input">
              {groups.map(group => {
                const href = group.slug ? `/resources/${group.slug}` : null;
                return <section key={group.resourceId} aria-labelledby={`group-${group.resourceId}`} className="py-8">
                  <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      {group.type && <TypeBadge type={group.type} label={t(`objectTypes.${group.type}`, { defaultValue: group.type })} className="mb-2" />}
                      <h2 id={`group-${group.resourceId}`} className="break-words text-xl font-semibold tracking-[-0.02em]">
                        {href ? <Link to={href} className="decoration-2 underline-offset-4 hover:underline">{group.title}</Link> : t('notes.resourceUnavailable')}
                      </h2>
                      <p className="mt-1 font-mono text-xs tabular-nums text-muted-foreground">{t('notes.count', { count: group.notes.length })}</p>
                    </div>
                    {href && <Link to={`${href}?notes=open`} className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold underline underline-offset-4">
                      {t('notebookPage.openNotebook')}<ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                    </Link>}
                  </header>
                  <ul className="grid items-start gap-3 lg:grid-cols-2">
                    {group.notes.map(note => <li key={note.id}>
                      {editing === note.id
                        ? <div className="border border-foreground p-4">
                          <h3 className="mb-4 text-sm font-semibold">{t('notes.composerEdit')}</h3>
                          <NoteComposer note={note} playerTime={null} timed={note.timestamp !== null} onCancel={() => setEditing(null)}
                            onSubmit={async draft => {
                              const saved = await persist(() => notebook.update(note.id, draft), t('notes.updated'));
                              if (saved) setEditing(null);
                              return saved;
                            }} />
                        </div>
                        : <NoteCard note={note} onSeek={null} seekHref={href && note.timestamp !== null ? `${href}?t=${note.timestamp}` : undefined}
                          activeTag={tag || null} onTag={value => set('tag', tag === value ? '' : value)}
                          onEdit={() => setEditing(note.id)}
                          onTogglePin={() => void persist(() => notebook.togglePin(note.id))}
                          onDelete={() => void remove(note)} />}
                    </li>)}
                  </ul>
                </section>;
              })}
            </div>}
        </>}

    <footer className="mt-10 space-y-3 border-t border-foreground pt-5">
      <NotebookStorage isGuest={notebook.isGuest} />
      <GuestImport />
      {notebook.isGuest && <p className="text-sm">{t('notes.guestNotice')} <Link to={`/login?next=${encodeURIComponent('/notes')}`} className="font-semibold underline underline-offset-4">{t('notes.signIn')}</Link></p>}
    </footer>
  </>;
}
