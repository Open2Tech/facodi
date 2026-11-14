import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { videoInfo } from '@/entities/course/video';
import { VideoThumbnail, type VideoSummary } from '@/components/resource/VideoCard';
import { cn } from '@/lib/utils';

interface VideoMosaicProps {
  id: string;
  title: string;
  description: string;
  videos: VideoSummary[];
  action?: ReactNode;
  headingLevel?: 2 | 3;
  className?: string;
}

/** Navy banner pairing a heading with a mosaic of real video thumbnails, each linking to its resource. */
export function VideoMosaic({ id, title, description, videos, action, headingLevel = 2, className }: VideoMosaicProps) {
  if (!videos.length) return null;
  const Heading = headingLevel === 2 ? 'h2' : 'h3';
  return <section aria-labelledby={id} className={cn('border-t-4 border-primary bg-ink text-ink-foreground', className)}>
    <div className="grid gap-8 px-6 py-10 sm:px-10 sm:py-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.8fr)] lg:gap-12">
      <div className="flex flex-col">
        <Heading id={id} className="max-w-sm text-3xl font-semibold leading-tight tracking-[-0.02em] sm:text-4xl">{title}</Heading>
        <p className="mt-4 max-w-prose leading-relaxed text-ink-foreground/75">{description}</p>
        {action && <div className="mt-8 lg:mt-auto lg:pt-8">{action}</div>}
      </div>
      <ul className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3">
        {videos.map(video => {
          const info = videoInfo(video.metadata, video.source_url);
          return <li key={video.id} className="min-w-0">
            <Link to={`/resources/${video.slug}`} className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4 focus-visible:ring-offset-ink">
              <span className="block ring-1 ring-ink-foreground/15 transition-shadow group-hover:ring-2 group-hover:ring-primary"><VideoThumbnail info={info} zoom /></span>
              <span className="mt-2 line-clamp-2 text-sm font-medium leading-snug decoration-primary decoration-2 underline-offset-4 group-hover:underline">{video.title}</span>
              {info.channel && <span className="mt-1 block truncate text-xs text-ink-foreground/70">{info.channel}</span>}
            </Link>
          </li>;
        })}
      </ul>
    </div>
  </section>;
}
