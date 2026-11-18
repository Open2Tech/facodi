import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Play } from 'lucide-react';
import { YOUTUBE_EMBED_ORIGIN } from './youtubeBridge';

/**
 * A public YouTube playlist, played on the publisher's own player.
 * The iframe is not mounted until the learner presses play, matching the consent
 * model of YouTubePlayer and avoiding requests/cookies during catalogue browsing.
 */
export function YouTubePlaylistPlayer({ playlistId, title }: { playlistId: string; title: string }) {
  const { t } = useTranslation();
  const [playing, setPlaying] = useState(false);

  // The id is independently validated by youtubePlaylistIdFromUrl before being passed here.
  const url = `${YOUTUBE_EMBED_ORIGIN}/embed/videoseries?list=${encodeURIComponent(playlistId)}&autoplay=1&rel=0`;

  return <div className="relative aspect-video w-full overflow-hidden bg-ink">
    {playing
      ? <iframe
        className="absolute inset-0 h-full w-full"
        src={url}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
      />
      : <button type="button" onClick={() => setPlaying(true)} aria-label={t('video.play', { title })}
        className="group absolute inset-0 block h-full w-full focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-primary">
        <span className="absolute left-1/2 top-1/2 grid h-16 w-16 -translate-x-1/2 -translate-y-1/2 place-items-center bg-primary text-primary-foreground shadow-[0_10px_30px_rgb(0_0_0/0.45)] transition-transform duration-200 ease-out group-hover:scale-105 sm:h-20 sm:w-20">
          <Play className="h-7 w-7 translate-x-0.5 fill-current sm:h-8 sm:w-8" aria-hidden="true" />
        </span>
        <span className="absolute inset-x-0 bottom-0 hidden bg-gradient-to-t from-ink/90 to-transparent px-4 pb-3 pt-10 text-left text-xs text-ink-foreground/85 sm:block">{t('video.privacyNote')}</span>
      </button>}
  </div>;
}
