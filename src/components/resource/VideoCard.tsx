import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Film } from 'lucide-react';
import { formatDuration, isoDuration, videoInfo, type VideoInfo } from '@/entities/course/video';
import type { Json } from '@/integrations/supabase/types';

export interface VideoSummary {
  id: string; slug: string; title: string; metadata: Json; source_url: string | null;
}

/** 16:9 thumbnail with a duration badge; falls back to an icon when YouTube has no image. */
export function VideoThumbnail({ info, zoom = false }: { info: VideoInfo; zoom?: boolean }) {
  const [failed, setFailed] = useState(false);
  return <div className="relative aspect-video overflow-hidden bg-muted">
    {info.thumbnail && !failed
      ? <img src={info.thumbnail} alt="" onError={() => setFailed(true)} loading="lazy" decoding="async"
        className={zoom ? 'h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]' : 'h-full w-full object-cover'} />
      : <span className="grid h-full place-items-center text-muted-foreground"><Film className="h-8 w-8" aria-hidden="true" /></span>}
    {info.durationSeconds && <time dateTime={isoDuration(info.durationSeconds)} className="absolute bottom-2 right-2 bg-ink px-1.5 py-0.5 font-mono text-label tabular-nums text-ink-foreground">{formatDuration(info.durationSeconds)}</time>}
  </div>;
}

/** Thumbnail-first link to a published video resource. */
export function VideoCard({ video, headingLevel = 3 }: { video: VideoSummary; headingLevel?: 2 | 3 }) {
  const info = videoInfo(video.metadata, video.source_url);
  const Heading = headingLevel === 2 ? 'h2' : 'h3';
  return <Link to={`/resources/${video.slug}`}
    className="group flex h-full flex-col border border-input bg-background transition-colors hover:border-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
    <VideoThumbnail info={info} zoom />
    <div className="flex flex-1 flex-col gap-2 p-4">
      <Heading className="line-clamp-2 font-semibold leading-snug decoration-2 underline-offset-4 group-hover:underline">{video.title}</Heading>
      {info.channel && <p className="mt-auto truncate text-sm text-muted-foreground">{info.channel}</p>}
    </div>
  </Link>;
}
