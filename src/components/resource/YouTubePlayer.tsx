import { useEffect, useImperativeHandle, useRef, useState, type Ref } from 'react';
import { useTranslation } from 'react-i18next';
import { Play } from 'lucide-react';
import { commandMessage, embedUrl, isYouTubeOrigin, listeningMessage, readCurrentTime, YOUTUBE_EMBED_ORIGIN } from './youtubeBridge';

export type YouTubePlayerHandle = {
  /** Jump to a position, loading the embed first when the learner has not pressed play yet. */
  seekTo: (seconds: number) => void;
};

/**
 * Click-to-load YouTube player: no third-party iframe, cookies or scripts until the learner asks
 * to play, then the privacy-enhanced embed starts immediately.
 */
export function YouTubePlayer({ videoId, title, thumbnail, autoPlay = false, onPlay, start = null, onTime, ref }: {
  videoId: string; title: string; thumbnail: string | null;
  /** Start in the embedded state, for when the learner already chose to play a previous video. */
  autoPlay?: boolean; onPlay?: () => void;
  /** Initial position in seconds, e.g. from a `?t=` link. */
  start?: number | null;
  /** Called with the playback position while the embed is playing. */
  onTime?: (seconds: number) => void;
  ref?: Ref<YouTubePlayerHandle>;
}) {
  const { t } = useTranslation();
  const [playing, setPlaying] = useState(autoPlay);
  const [startAt, setStartAt] = useState(start);
  const [imageFailed, setImageFailed] = useState(false);
  const frame = useRef<HTMLIFrameElement>(null);
  const onTimeRef = useRef(onTime);
  useEffect(() => { onTimeRef.current = onTime; }, [onTime]);

  useImperativeHandle(ref, () => ({
    seekTo(seconds) {
      if (!playing) {
        setStartAt(Math.floor(seconds));
        setPlaying(true);
        onPlay?.();
        return;
      }
      const target = frame.current?.contentWindow;
      target?.postMessage(commandMessage('seekTo', [seconds, true]), YOUTUBE_EMBED_ORIGIN);
      target?.postMessage(commandMessage('playVideo'), YOUTUBE_EMBED_ORIGIN);
    },
  }), [playing, onPlay]);

  useEffect(() => {
    if (!playing) return;
    const handler = (event: MessageEvent) => {
      if (event.source !== frame.current?.contentWindow || !isYouTubeOrigin(event.origin)) return;
      const time = readCurrentTime(event.data);
      if (time !== null) onTimeRef.current?.(time);
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [playing]);

  return <div className="relative aspect-video w-full overflow-hidden bg-ink">
    {playing
      ? <iframe
        ref={frame}
        className="absolute inset-0 h-full w-full"
        src={embedUrl(videoId, window.location.origin, startAt)}
        title={title}
        onLoad={event => event.currentTarget.contentWindow?.postMessage(listeningMessage(), YOUTUBE_EMBED_ORIGIN)}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
      />
      : <button type="button" onClick={() => { setPlaying(true); onPlay?.(); }} aria-label={t('video.play', { title })}
        className="group absolute inset-0 block h-full w-full focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-primary">
        {thumbnail && !imageFailed && <img src={thumbnail} alt="" decoding="async" onError={() => setImageFailed(true)} className="h-full w-full object-cover opacity-75 transition-opacity duration-300 group-hover:opacity-95" />}
        <span className="absolute left-1/2 top-1/2 grid h-16 w-16 -translate-x-1/2 -translate-y-1/2 place-items-center bg-primary text-primary-foreground shadow-[0_10px_30px_rgb(0_0_0/0.45)] transition-transform duration-200 ease-out group-hover:scale-105 sm:h-20 sm:w-20">
          <Play className="h-7 w-7 translate-x-0.5 fill-current sm:h-8 sm:w-8" aria-hidden="true" />
        </span>
        <span className="absolute inset-x-0 bottom-0 hidden bg-gradient-to-t from-ink/90 to-transparent px-4 pb-3 pt-10 text-left text-xs text-ink-foreground/85 sm:block">{t('video.privacyNote')}</span>
      </button>}
  </div>;
}
