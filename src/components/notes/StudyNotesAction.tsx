import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { NotebookPen } from 'lucide-react';
import { StudyNotebook } from '@/components/notes/StudyNotebook';
import { useResourceNotes } from '@/features/notes/useNotebook';
import type { NoteResource } from '@/entities/notes/notes';

/** The existing private notebook is shared by courses, UCs, modules and videos.
 * Use an explicit notes scope so a unit's notes never open the embedded video notebook.
 */
export function StudyNotesAction({ resource, scope }: {
  resource: NoteResource;
  scope: 'course' | 'unit' | 'module';
}) {
  const { t } = useTranslation();
  const [params, setParams] = useSearchParams();
  const notebook = useResourceNotes(resource.id);
  const open = params.get('notes') === scope;

  function setOpen(nextOpen: boolean) {
    setParams(previous => {
      const next = new URLSearchParams(previous);
      if (nextOpen) next.set('notes', scope);
      else if (next.get('notes') === scope) next.delete('notes');
      return next;
    }, { replace: true, preventScrollReset: true });
  }

  return <>
    <button type="button" onClick={() => setOpen(true)} aria-haspopup="dialog" aria-expanded={open}
      className="inline-flex min-h-11 items-center gap-2 border border-foreground bg-card px-4 py-2 text-sm font-semibold transition-colors hover:bg-brand-mint/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      <NotebookPen className="h-4 w-4 shrink-0" aria-hidden="true" />
      {t('notes.open')}
      {notebook.ready && notebook.notes.length > 0 && <span className="border border-foreground bg-brand-mint px-1.5 font-mono text-xs tabular-nums text-brand-ink">{notebook.notes.length}</span>}
    </button>
    <StudyNotebook resource={resource} timed={false} playerTime={null} onSeek={null}
      open={open} onOpenChange={setOpen} />
  </>;
}
