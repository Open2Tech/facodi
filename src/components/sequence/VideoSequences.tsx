import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, ListOrdered } from 'lucide-react';
import { useVideoSequences } from '@/features/sequences/useSequences';

/** On a video page: the editorial sequences this lesson belongs to, opened at this lesson. */
export function VideoSequences({ videoId }: { videoId: string }) {
  const { t } = useTranslation();
  const { sequences, completed } = useVideoSequences(videoId);
  const items = sequences.data ?? [];
  if (sequences.isPending) return <section aria-labelledby="video-sequences" aria-busy="true" className="border border-input">
    <h2 id="video-sequences" className="flex items-center gap-2 border-b border-input bg-muted px-5 py-3 text-sm font-semibold">
      <ListOrdered className="h-4 w-4" aria-hidden="true" />{t('sequences.inSequences')}
    </h2>
    <p role="status" className="px-5 py-3 text-sm text-muted-foreground">{t('common.loading')}</p>
  </section>;
  if (sequences.isError) return <section aria-labelledby="video-sequences" className="border border-input">
    <h2 id="video-sequences" className="flex items-center gap-2 border-b border-input bg-muted px-5 py-3 text-sm font-semibold">
      <ListOrdered className="h-4 w-4" aria-hidden="true" />{t('sequences.inSequences')}
    </h2>
    <div className="px-5 py-3 text-sm">
      <p role="alert">{t('sequences.videoSequencesLoadFailed')}</p>
      <button type="button" className="mt-2 font-semibold underline underline-offset-4" onClick={() => void sequences.refetch()}>{t('common.retry')}</button>
    </div>
  </section>;
  if (!items.length) return null;
  return <section aria-labelledby="video-sequences" className="border border-input">
    <h2 id="video-sequences" className="flex items-center gap-2 border-b border-input bg-muted px-5 py-3 text-sm font-semibold">
      <ListOrdered className="h-4 w-4" aria-hidden="true" />{t('sequences.inSequences')}
    </h2>
    <ul className="divide-y divide-input">
      {items.map(item => {
        const done = completed.data?.has(item.id);
        return <li key={item.id}>
          <Link to={`/sequences/${encodeURIComponent(item.slug)}?v=${encodeURIComponent(videoId)}`}
            className="group flex items-start gap-3 px-5 py-3 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring">
            <span className="min-w-0 flex-1">
              <span className="line-clamp-2 text-sm font-medium leading-snug group-hover:underline group-hover:underline-offset-4">{item.title}</span>
              <span className="mt-1 flex flex-wrap items-center gap-x-3 font-mono text-xs tabular-nums text-muted-foreground">
                {t('sequences.position', { current: item.position, total: item.total })}
                {done && <span className="inline-flex items-center gap-1 text-foreground"><Check className="h-3.5 w-3.5" aria-hidden="true" />{t('sequences.completed')}</span>}
              </span>
            </span>
            <ArrowRight className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          </Link>
        </li>;
      })}
    </ul>
    {completed.isError && <div className="border-t border-input px-5 py-3 text-sm">
      <p role="alert">{t('sequences.videoProgressLoadFailed')}</p>
      <button type="button" className="mt-2 font-semibold underline underline-offset-4" onClick={() => void completed.refetch()}>{t('common.retry')}</button>
    </div>}
  </section>;
}
