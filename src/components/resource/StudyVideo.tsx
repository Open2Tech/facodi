import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { NotebookPen } from 'lucide-react';
import { YouTubePlayer, type YouTubePlayerHandle } from '@/components/resource/YouTubePlayer';
import { StudyNotebook } from '@/components/notes/StudyNotebook';
import { NoteTimeline } from '@/components/notes/NoteTimeline';
import { useResourceNotes } from '@/features/notes/useNotebook';
import { formatTimestamp, parseStartParam, type NoteResource } from '@/entities/notes/notes';
import type { VideoInfo } from '@/entities/course/video';
import { useContextSearchParams } from '@/shared/hooks/useContextSearchParams';

/** Mount with the resource id as its key so playback and composer state never cross lessons. */
export function StudyVideo({ resource, videoId, info, start, autoPlay, onPlay, onTime, signInReturn }: {
  resource: NoteResource;
  videoId: string;
  info: VideoInfo;
  start?: number | null;
  autoPlay?: boolean;
  onPlay?: () => void;
  onTime?: (seconds: number) => void;
  signInReturn?: string;
}) {
  const { t } = useTranslation();
  const [params, setParams] = useContextSearchParams();
  const player = useRef<YouTubePlayerHandle>(null);
  const section = useRef<HTMLDivElement>(null);
  const [time, setTime] = useState<number | null>(null);
  const { notes } = useResourceNotes(resource.id);
  const open = params.get('notes') === 'open';

  function setOpen(value: boolean) {
    setParams(next => {
      if (value) next.set('notes', 'open');
      else next.delete('notes');
      return next;
    });
  }

  function seek(seconds: number) {
    player.current?.seekTo(seconds);
    if (!window.matchMedia('(min-width: 640px)').matches) setOpen(false);
    section.current?.scrollIntoView({
      block: 'nearest',
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
    });
  }

  return <>
    <div ref={section} className="scroll-mt-24 border border-foreground">
      <YouTubePlayer ref={player} videoId={videoId} title={resource.title} thumbnail={info.thumbnail}
        start={parseStartParam(params.get('t')) ?? start} autoPlay={autoPlay} onPlay={onPlay}
        onTime={seconds => { setTime(Math.floor(seconds)); onTime?.(seconds); }} />
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-input bg-muted px-4 py-3">
        <button type="button" onClick={() => setOpen(true)} aria-haspopup="dialog" aria-expanded={open}
          className="inline-flex min-h-8 items-center gap-2 text-sm font-semibold underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <NotebookPen className="h-4 w-4 shrink-0" aria-hidden="true" />{t('notes.open')}
          {notes.length > 0 && <span className="border border-input px-1.5 font-mono text-xs tabular-nums">{notes.length}</span>}
        </button>
        <button type="button" onClick={() => setOpen(true)}
          className="min-h-8 text-left text-xs underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          {time === null ? t('notes.quickAdd') : t('notes.quickAddAt', { time: formatTimestamp(time) })}
        </button>
      </div>
      {info.durationSeconds && <NoteTimeline notes={notes} duration={info.durationSeconds} playerTime={time} onSeek={seek} />}
    </div>
    <StudyNotebook resource={resource} timed playerTime={time} onSeek={seek} open={open} onOpenChange={setOpen} signInReturn={signInReturn} />
  </>;
}
