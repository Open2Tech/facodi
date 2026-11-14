import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Play } from 'lucide-react';

/**
 * Click-to-load YouTube player: no third-party iframe, cookies or scripts until the learner asks
 * to play, then the privacy-enhanced embed starts immediately.
 */
export function YouTubePlayer({ videoId, title, thumbnail, autoPlay = false, onPlay }: {
  videoId: string; title: string; thumbnail: string | null;
  /** Start in the embedded state, for when the learner already chose to play a previous video. */
  autoPlay?: boolean; onPlay?: () => void;
}) {
  const { t } = useTranslation();
  const [playing, setPlaying] = useState(autoPlay);
  const [imageFailed, setImageFailed] = useState(false);
  return <div className="relative aspect-video w-full overflow-hidden bg-neutral-950">
    {playing
      ? <iframe
        className="absolute inset-0 h-full w-full"
        src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`}
        title={title}
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
        <span className="absolute inset-x-0 bottom-0 hidden bg-gradient-to-t from-black/80 to-transparent px-4 pb-3 pt-10 text-left text-xs text-white/85 sm:block">{t('video.privacyNote')}</span>
      </button>}
  </div>;
}
