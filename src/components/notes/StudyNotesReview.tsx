import { useId, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Clock3, NotebookPen, Pin } from 'lucide-react';
import { formatTimestamp } from '@/entities/notes/notes';
import { contextualStudyNotes, contextNoteHref, type StudyNoteContextResource } from '@/entities/notes/studyNoteContext';
import { useNotebook } from '@/features/notes/useNotebook';

const PREVIEW_LIMIT = 4;

/** Personal review across existing public learning resources; does not create or duplicate notes.
 * Uses the same owner-scoped/guest notebook as the video player and /notes.
 */
export function StudyNotesReview({ kind, resources }: {
  kind: 'unit' | 'sequence' | 'course';
  resources: readonly StudyNoteContextResource[];
}) {
  const { t } = useTranslation();
  const id = useId();
  const notebook = useNotebook();
  const notes = useMemo(() => contextualStudyNotes(notebook.all, resources), [notebook.all, resources]);
  const preview = notes.slice(0, PREVIEW_LIMIT);
  const first = resources[0];

  return <section aria-labelledby={id} className="border border-foreground border-t-4 border-t-brand-mint bg-card p-4 sm:p-6">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="max-w-prose">
        <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-wide text-muted-foreground">
          <NotebookPen className="h-4 w-4 shrink-0" aria-hidden="true" />{t('studyNotesReview.eyebrow')}
        </p>
        <h2 id={id} className="mt-2 text-2xl font-semibold tracking-tight">{t(`studyNotesReview.${kind}Title`)}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t(`studyNotesReview.${kind}Description`)}</p>
      </div>
      {notebook.ready && notes.length > 0 && <span className="border border-input px-2 py-1 font-mono text-xs tabular-nums" aria-label={t('studyNotesReview.total', { count: notes.length })}>{t('notes.count', { count: notes.length })}</span>}
    </div>
    {notebook.failed ? <div role="alert" className="mt-5 text-sm">
      <p>{t('notes.loadFailed')}</p>
      <button type="button" onClick={() => void notebook.retry()} className="mt-2 font-semibold underline underline-offset-4">{t('common.retry')}</button>
    </div> : !notebook.ready ? <p role="status" className="mt-5 text-sm text-muted-foreground">{t('common.loading')}</p>
      : preview.length > 0 ? <>
        <ul className="mt-5 divide-y divide-input border-y border-input">
          {preview.map(({ note, resource, href }) => <li key={note.id} className="py-3">
            <Link to={href} aria-label={t('studyNotesReview.openNote', { title: note.title })}
              className="group flex min-h-11 items-start gap-3 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <span className="mt-1 grid h-7 w-7 shrink-0 place-items-center border border-foreground bg-brand-mint text-brand-ink" aria-hidden="true"><NotebookPen className="h-3.5 w-3.5" /></span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2 font-semibold leading-snug group-hover:underline group-hover:underline-offset-4">
                  {note.title}
                  {note.pinned && <Pin className="h-3.5 w-3.5 shrink-0" aria-label={t('notes.pinned')} />}
                </span>
                <span className="mt-1 block truncate text-xs text-muted-foreground">{resource.title}</span>
                {note.body.trim() && <span className="mt-1 block line-clamp-2 whitespace-pre-line break-words text-xs leading-relaxed text-muted-foreground">{note.body}</span>}
                {resource.timed && note.timestamp !== null && <span className="mt-1 inline-flex items-center gap-1 font-mono text-xs tabular-nums text-muted-foreground">
                  <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />{formatTimestamp(note.timestamp)}
                </span>}
              </span>
              <ArrowRight className="mt-1 h-4 w-4 shrink-0" aria-hidden="true" />
            </Link>
          </li>)}
        </ul>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
          {notes.length > PREVIEW_LIMIT && <p className="text-muted-foreground">{t('studyNotesReview.more', { count: notes.length - PREVIEW_LIMIT })}</p>}
          <Link to="/notes" className="inline-flex min-h-11 items-center gap-2 font-semibold underline underline-offset-4">
            {t('notebookPage.openAll')}<ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </> : <div className="mt-5 text-sm">
        <p className="text-muted-foreground">{t('studyNotesReview.empty')}</p>
        {first ? <Link to={contextNoteHref(first, null)} className="mt-3 inline-flex min-h-11 items-center gap-2 font-semibold underline underline-offset-4">
          {t('studyNotesReview.start')}<ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link> : <Link to="/notes" className="mt-3 inline-flex min-h-11 items-center gap-2 font-semibold underline underline-offset-4">
          {t('notebookPage.openAll')}<ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>}
      </div>}
  </section>;
}
