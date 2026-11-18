import { useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Download, NotebookPen, X } from 'lucide-react';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { formatTimestamp, hasCode, notesToMarkdown, type NoteDraft, type NoteResource } from '@/entities/notes/notes';
import { useResourceNotes } from '@/features/notes/useNotebook';
import { useNoteActions } from '@/features/notes/useNoteActions';
import { cn } from '@/lib/utils';
import { NoteCard } from './NoteCard';
import { NoteComposer } from './NoteComposer';
import { GuestImport, NotebookStorage } from './NotebookStorage';

type Filter = 'all' | 'timed' | 'code';
// Keep feedback clear of the drawer, which owns the right edge while open.
const TOAST_POSITION = 'bottom-left';

/**
 * Side drawer with the learner's private notes for one resource. It is non-modal so the video
 * keeps playing and stays controllable while the learner writes.
 */
export function StudyNotebook({ resource, timed, playerTime, onSeek, open, onOpenChange }: {
  resource: NoteResource;
  timed: boolean;
  playerTime: number | null;
  onSeek: ((seconds: number) => void) | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const location = useLocation();
  const notebook = useResourceNotes(resource.id);
  const { notes } = notebook;
  const [filter, setFilter] = useState<Filter>('all');
  const [tag, setTag] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);

  const counts = useMemo(() => ({
    all: notes.length,
    timed: notes.filter(note => note.timestamp !== null).length,
    code: notes.filter(hasCode).length,
  }), [notes]);
  const visible = notes.filter(note => (filter === 'all' || (filter === 'timed' ? note.timestamp !== null : hasCode(note)))
    && (!tag || note.tags.includes(tag)));
  const filters: Filter[] = timed ? ['all', 'timed', 'code'] : ['all', 'code'];

  const { persist, remove } = useNoteActions(notebook, TOAST_POSITION);

  function exportMarkdown() {
    const url = `${window.location.origin}/resources/${resource.slug}`;
    const markdown = notesToMarkdown(resource, notes, url, { source: t('notes.exportSource'), exportedAt: t('notes.exportedAt') });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([markdown], { type: 'text/markdown;charset=utf-8' }));
    link.download = `facodi-${resource.slug}.md`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  return <Sheet open={open} onOpenChange={onOpenChange} modal={false}>
    <SheetContent side="right" hideClose onInteractOutside={event => event.preventDefault()}
      className="flex w-full flex-col gap-0 border-l border-foreground p-0 shadow-[-16px_0_40px_-12px_rgb(20_40_70/0.28)] sm:max-w-md">
      <header className="border-b border-foreground px-5 pb-4 pt-5">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center border border-foreground bg-primary text-primary-foreground" aria-hidden="true"><NotebookPen className="h-5 w-5" strokeWidth={1.75} /></span>
          <div className="min-w-0 flex-1">
            <SheetTitle className="text-xl tracking-[-0.02em]">{t('notes.title')}</SheetTitle>
            <SheetDescription className="mt-0.5 line-clamp-2">{resource.title}</SheetDescription>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)} className="shrink-0"><X />{t('notes.close')}</Button>
        </div>
        {timed && <p className="mt-4 flex items-center gap-2 border border-input bg-muted/60 px-3 py-2 text-xs">
          <span aria-hidden="true" className={cn('h-2 w-2 shrink-0', playerTime !== null ? 'bg-brand-mint ring-1 ring-foreground' : 'bg-muted-foreground/50')} />
          {playerTime !== null
            ? <>{t('notes.syncLive')}<span className="ml-auto border border-foreground bg-background px-1.5 py-0.5 font-mono tabular-nums">{formatTimestamp(playerTime)}</span></>
            : <span className="text-muted-foreground">{t('notes.syncIdle')}</span>}
        </p>}
      </header>

      <div className="flex-1 overflow-y-auto overscroll-contain">
        <section aria-labelledby="notebook-new" className="border-b border-input px-5 py-5">
          <h3 id="notebook-new" className="mb-4 text-sm font-semibold">{t('notes.composerNew')}</h3>
          <NoteComposer playerTime={playerTime} timed={timed}
            onSubmit={(draft: NoteDraft) => persist(() => notebook.add(resource, draft))} />
        </section>

        <section aria-labelledby="notebook-list" className="px-5 py-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 id="notebook-list" className="text-sm font-semibold">{t('notes.listTitle')}</h3>
            <p className="font-mono text-label tabular-nums text-muted-foreground">{t('notes.count', { count: notes.length })}</p>
          </div>
          {notes.length > 0 && <div role="group" aria-label={t('notes.filters')} className="mt-3 flex flex-wrap gap-2">
            {filters.map(key => <button key={key} type="button" aria-pressed={filter === key} onClick={() => setFilter(key)}
              className={cn('border px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                filter === key ? 'border-foreground bg-foreground text-background' : 'border-input hover:border-foreground')}>
              {t(`notes.filter.${key}`)} <span className="font-mono tabular-nums">({counts[key]})</span>
            </button>)}
            {tag && <button type="button" onClick={() => setTag(null)} aria-label={t('notes.clearTag', { tag })}
              className="inline-flex items-center gap-1 border border-foreground bg-primary px-2.5 py-1 font-mono text-label text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              #{tag}<X className="h-3 w-3" aria-hidden="true" />
            </button>}
          </div>}

          {notebook.failed ? <div role="alert" className="mt-4 border border-destructive px-4 py-4 text-sm">
            <p>{t('notes.loadFailed')}</p>
            <Button type="button" variant="outline" size="sm" className="mt-3" onClick={() => void notebook.retry()}>{t('common.retry')}</Button>
          </div>
            : !notebook.ready ? <p className="mt-6 text-sm text-muted-foreground">{t('common.loading')}</p>
            : notes.length === 0 ? <p className="mt-4 border border-dashed border-input px-4 py-6 text-sm text-muted-foreground">{t('notes.empty')}</p>
              : visible.length === 0 ? <p className="mt-4 text-sm text-muted-foreground">{t('notes.emptyFiltered')}</p>
                : <ul className="mt-4 space-y-3">{visible.map(note => <li key={note.id}>
                  {editing === note.id
                    ? <div className="border border-foreground p-4">
                      <h4 className="mb-4 text-sm font-semibold">{t('notes.composerEdit')}</h4>
                      <NoteComposer note={note} playerTime={playerTime} timed={timed} onCancel={() => setEditing(null)}
                        onSubmit={async draft => {
                          const saved = await persist(() => notebook.update(note.id, draft), t('notes.updated'));
                          if (saved) setEditing(null);
                          return saved;
                        }} />
                    </div>
                    : <NoteCard note={note} onSeek={timed ? onSeek : null} activeTag={tag}
                      onTag={value => setTag(current => current === value ? null : value)}
                      onEdit={() => setEditing(note.id)}
                      onTogglePin={() => void persist(() => notebook.togglePin(note.id))}
                      onDelete={() => void remove(note)} />}
                </li>)}</ul>}
        </section>
      </div>

      <footer className="space-y-3 border-t border-foreground bg-muted/40 px-5 py-4">
        <NotebookStorage isGuest={notebook.isGuest} />
        <GuestImport />
        {notebook.isGuest && <p className="text-xs">{t('notes.guestNotice')} <Link to={`/login?next=${encodeURIComponent(`${location.pathname}${location.search}${location.hash}`)}`} className="font-semibold underline underline-offset-4">{t('notes.signIn')}</Link></p>}
        <Button type="button" variant="outline" className="w-full" disabled={!notes.length} onClick={exportMarkdown}><Download />{t('notes.export')}</Button>
      </footer>
    </SheetContent>
  </Sheet>;
}
