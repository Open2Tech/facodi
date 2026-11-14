import { useTranslation } from 'react-i18next';
import { formatTimestamp, type StudyNote } from '@/entities/notes/notes';

/** Learner's timed notes as markers along the video's length; each marker seeks the player. */
export function NoteTimeline({ notes, duration, playerTime, onSeek }: {
  notes: StudyNote[]; duration: number; playerTime: number | null; onSeek: (seconds: number) => void;
}) {
  const { t } = useTranslation();
  const timed = notes.filter((note): note is StudyNote & { timestamp: number } => note.timestamp !== null && note.timestamp <= duration);
  if (!timed.length) return null;
  const position = (seconds: number) => `${Math.min(100, (seconds / duration) * 100)}%`;
  return <div className="border-t border-ink-foreground/15 bg-ink px-4 pb-3 pt-2">
    <p className="mb-1.5 font-mono text-[11px] text-ink-foreground/70">{t('notes.timeline')}</p>
    <div className="relative h-5">
      <div aria-hidden="true" className="absolute inset-x-0 top-1/2 h-px bg-ink-foreground/30" />
      {playerTime !== null && <div aria-hidden="true" className="absolute top-1/2 h-px bg-primary" style={{ width: position(playerTime) }} />}
      <ul>{timed.map(note => <li key={note.id}>
        <button type="button" onClick={() => onSeek(note.timestamp)} title={`${formatTimestamp(note.timestamp)} · ${note.title}`}
          aria-label={t('notes.timelineMarker', { time: formatTimestamp(note.timestamp), title: note.title })}
          className="absolute top-0 grid h-5 w-5 -translate-x-1/2 place-items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          style={{ left: position(note.timestamp) }}>
          <span className="h-3 w-3 rotate-45 border border-ink bg-primary transition-transform hover:scale-125" />
        </button>
      </li>)}</ul>
    </div>
  </div>;
}
