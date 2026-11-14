import { useTranslation } from 'react-i18next';
import { ArrowRight, Pencil, Pin, PinOff, Timer, Trash2 } from 'lucide-react';
import { formatTimestamp, type StudyNote } from '@/entities/notes/notes';
import { cn } from '@/lib/utils';
import { NoteBody } from './NoteBody';

const iconButton = 'grid h-8 w-8 place-items-center border border-transparent text-muted-foreground transition-colors hover:border-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

export function NoteCard({ note, onSeek, onEdit, onTogglePin, onDelete, onTag, activeTag }: {
  note: StudyNote;
  onSeek: ((seconds: number) => void) | null;
  onEdit: () => void;
  onTogglePin: () => void;
  onDelete: () => void;
  onTag: (tag: string) => void;
  activeTag: string | null;
}) {
  const { t, i18n } = useTranslation();
  const time = note.timestamp === null ? null : formatTimestamp(note.timestamp);
  const edited = new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(note.updatedAt));
  return <article aria-labelledby={`note-${note.id}`} className={cn('border bg-card', note.pinned ? 'border-foreground' : 'border-input')}>
    <header className="flex items-start gap-3 px-4 pt-4">
      {time && <button type="button" disabled={!onSeek} onClick={() => onSeek?.(note.timestamp!)} aria-label={t('notes.jumpAria', { time })}
        className="inline-flex shrink-0 items-center gap-1 border border-foreground bg-primary px-2 py-1 font-mono text-xs tabular-nums text-primary-foreground transition-colors enabled:hover:bg-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60">
        <Timer className="h-3.5 w-3.5" aria-hidden="true" />{time}
      </button>}
      <div className="min-w-0 flex-1">
        <h3 id={`note-${note.id}`} className="break-words font-semibold leading-snug">{note.title}</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          {note.pinned && <span className="mr-2 inline-flex items-center gap-1 font-medium text-foreground"><Pin className="h-3 w-3" aria-hidden="true" />{t('notes.pinned')}</span>}
          <time dateTime={note.updatedAt}>{edited}</time>
        </p>
      </div>
      <div className="-mr-1 -mt-1 flex shrink-0">
        <button type="button" onClick={onTogglePin} className={iconButton} aria-pressed={note.pinned} aria-label={t(note.pinned ? 'notes.unpin' : 'notes.pin')} title={t(note.pinned ? 'notes.unpin' : 'notes.pin')}>
          {note.pinned ? <PinOff className="h-4 w-4" aria-hidden="true" /> : <Pin className="h-4 w-4" aria-hidden="true" />}
        </button>
        <button type="button" onClick={onEdit} className={iconButton} aria-label={t('notes.editNamed', { title: note.title })} title={t('common.edit')}><Pencil className="h-4 w-4" aria-hidden="true" /></button>
        <button type="button" onClick={onDelete} className={cn(iconButton, 'hover:text-destructive')} aria-label={t('notes.deleteNamed', { title: note.title })} title={t('notes.delete')}><Trash2 className="h-4 w-4" aria-hidden="true" /></button>
      </div>
    </header>
    {note.body && <div className="break-words px-4 pt-3"><NoteBody text={note.body} /></div>}
    {(note.tags.length > 0 || (time && onSeek)) && <footer className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-input px-4 py-3">
      {note.tags.length > 0 && <ul className="flex flex-1 flex-wrap gap-x-3 gap-y-1">
        {note.tags.map(tag => <li key={tag}><button type="button" onClick={() => onTag(tag)} aria-pressed={activeTag === tag}
          className={cn('font-mono text-xs underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring', activeTag === tag ? 'bg-primary px-1 text-primary-foreground' : 'text-muted-foreground')}>#{tag}</button></li>)}
      </ul>}
      {time && onSeek && <button type="button" onClick={() => onSeek(note.timestamp!)} className="ml-auto inline-flex items-center gap-1 text-xs font-semibold underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        {t('notes.jumpTo', { time })}<ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
      </button>}
    </footer>}
  </article>;
}
