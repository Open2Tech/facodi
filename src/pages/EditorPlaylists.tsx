import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Check, ExternalLink, RefreshCw, X } from 'lucide-react';
import { toast } from 'sonner';
import { isYoutubePlaylistUrl, isYoutubeVideoId } from '@/entities/facodi-playlists/playlistUtils';
import type { PlaylistDecision } from '@/entities/contribution/contribution.types';
import { usePendingPlaylists, usePlaylistItems, useReviewPlaylist } from '@/features/contributions/queries/useContributions';
import { LANGUAGES } from '@/components/catalog/CatalogToolbar';
import { StatusBadge } from '@/components/editorial/StatusBadge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { PageState } from '@/components/layout/PageState';
import { cn } from '@/lib/utils';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function EditorPlaylists() {
  const { t, i18n } = useTranslation();
  const [params, setParams] = useSearchParams();
  const [decision, setDecision] = useState<PlaylistDecision | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const pending = usePendingPlaylists();
  const selected = pending.data?.find(p => p.id === params.get('playlist')) ?? pending.data?.[0] ?? null;
  const items = usePlaylistItems(selected?.id);
  const review = useReviewPlaylist();
  const accepted = items.data?.filter(i => i.review_status !== 'rejected') ?? [];
  const unresolved = accepted.filter(i => !i.video_id);
  const canApprove = !items.isPending && !items.error && accepted.length > 0 && unresolved.length === 0;
  const dateFormat = new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium' });
  const languageName = (code: string) => LANGUAGES.find(([value]) => value === code)?.[1] ?? code;

  const select = (id: string) => {
    review.reset();
    setParams(previous => { const next = new URLSearchParams(previous); next.set('playlist', id); return next; }, { replace: true });
  };
  const confirm = () => {
    if (!selected || !decision) return;
    review.mutate({ id: selected.id, decision, note: reviewNote }, {
      onSuccess: () => {
        setDecision(null);
        setReviewNote('');
        toast.success(t('playlistReview.saved'));
      },
    });
  };

  return <div>
    <Link to="/editor" className="mb-8 inline-flex items-center gap-2 text-sm font-semibold underline underline-offset-4">
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />{t('playlistReview.back')}
    </Link>
    <header className="mb-8 max-w-3xl">
      <h1 className="text-3xl font-semibold sm:text-4xl">{t('playlistReview.title')}</h1>
      <p className="mt-4 text-muted-foreground">{t('playlistReview.description')}</p>
    </header>
    <div className="grid gap-8 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
      <aside aria-labelledby="playlist-queue">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 id="playlist-queue" className="font-semibold">{t('playlistReview.queue', { count: pending.data?.length ?? 0 })}</h2>
          <Button type="button" variant="outline" size="sm" onClick={() => void pending.refetch()} disabled={pending.isFetching}>
            <RefreshCw className={cn('h-4 w-4', pending.isFetching && 'motion-safe:animate-spin')} aria-hidden="true" />{t('playlistReview.refresh')}
          </Button>
        </div>
        {pending.isPending ? <PageState loading /> : pending.error
          ? <PageState level="h3" title={t('common.error')} description={pending.error.message} retry={() => void pending.refetch()} />
          : !!pending.data.length && <ul className="divide-y divide-input border-y border-input">
            {pending.data.map(p => <li key={p.id}>
              <button type="button" onClick={() => select(p.id)} aria-pressed={selected?.id === p.id}
                className={cn('w-full p-4 text-left transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  selected?.id === p.id && 'bg-muted')}>
                <span className="block break-words font-medium">{p.title}</span>
                <span className="mt-1 block text-sm text-muted-foreground">{[p.courses?.code, p.curricular_units?.code].filter(Boolean).join(' · ')}</span>
                <span className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <time dateTime={p.submitted_at} className="text-xs text-muted-foreground">{dateFormat.format(new Date(p.submitted_at))}</time>
                  <StatusBadge status={p.import_status} label={t(`playlistReview.importStatus.${p.import_status}`, { defaultValue: p.import_status })} />
                </span>
              </button>
            </li>)}
          </ul>}
      </aside>
      <section className="min-w-0" aria-live="polite">
        {!selected ? pending.isSuccess && <PageState level="h2" title={t('playlistReview.empty')} description={t('playlistReview.emptyDescription')} /> : <>
          <h2 className="break-words text-2xl font-semibold">{selected.title}</h2>
          <dl className="mt-4 grid gap-x-6 gap-y-3 border-y border-input py-4 text-sm sm:grid-cols-2">
            <div><dt className="text-muted-foreground">{t('playlistSubmit.course')}</dt><dd className="font-medium">{selected.courses ? `${selected.courses.code} · ${selected.courses.title}` : '—'}</dd></div>
            <div><dt className="text-muted-foreground">{t('playlistSubmit.unit')}</dt><dd className="font-medium">{selected.curricular_units ? `${selected.curricular_units.code} · ${selected.curricular_units.title}` : '—'}</dd></div>
            <div><dt className="text-muted-foreground">{t('playlistSubmit.language')}</dt><dd className="font-medium">{languageName(selected.language)}</dd></div>
            <div><dt className="text-muted-foreground">{t('playlistReview.submitted')}</dt><dd className="font-medium"><time dateTime={selected.submitted_at}>{dateFormat.format(new Date(selected.submitted_at))}</time></dd></div>
          </dl>
          {selected.description && <p className="mt-4 max-w-prose whitespace-pre-line text-sm text-muted-foreground">{selected.description}</p>}
          {selected.source_url && isYoutubePlaylistUrl(selected.source_url) && <a href={selected.source_url} target="_blank" rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 text-sm font-semibold underline underline-offset-4">
            {t('playlistReview.source')}<ExternalLink className="h-4 w-4" aria-hidden="true" />
          </a>}
          <p className="mt-5 max-w-prose text-sm text-muted-foreground">{t('playlistReview.scope')}</p>
          {items.isPending ? <PageState loading /> : items.error
            ? <PageState level="h3" title={t('common.error')} description={items.error.message} retry={() => void items.refetch()} />
            : <div className="mt-6">
              <h3 className="font-semibold">{t('playlistReview.videos', { count: items.data.length })}</h3>
              {unresolved.length > 0 && <p role="status" className="mt-2 text-sm text-destructive">
                {t('playlistReview.unresolved', { count: unresolved.length })}
              </p>}
              <ol className="mt-3 max-h-[36rem] divide-y divide-input overflow-y-auto border-y border-input">
                {items.data.map(item => {
                  const valid = isYoutubeVideoId(item.youtube_video_id);
                  return <li key={item.id} className="flex items-center gap-3 py-3">
                    <span className="w-7 shrink-0 text-right font-mono text-xs tabular-nums text-muted-foreground">{item.position + 1}</span>
                    <span className="aspect-video w-24 shrink-0 overflow-hidden bg-muted sm:w-28">
                      {valid && <img src={`https://i.ytimg.com/vi/${item.youtube_video_id}/mqdefault.jpg`} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      {valid
                        ? <a href={`https://www.youtube.com/watch?v=${item.youtube_video_id}`} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 break-all font-mono text-sm underline underline-offset-4">
                          {item.youtube_video_id}<ExternalLink className="h-3 w-3 shrink-0" aria-hidden="true" />
                        </a>
                        : <span className="break-all font-mono text-sm">{item.youtube_video_id}</span>}
                    </span>
                    <StatusBadge status={item.video_id ? 'completed' : 'failed'} label={item.video_id ? t('playlistReview.linked') : t('playlistReview.missing')} />
                  </li>;
                })}
              </ol>
            </div>}
          <div className="mt-6 flex flex-wrap gap-3">
            <Button variant="outline" disabled={review.isPending || items.isPending} onClick={() => { review.reset(); setDecision('rejected'); setReviewNote(''); }}>
              <X className="h-4 w-4" aria-hidden="true" />{t('playlistReview.reject')}
            </Button>
            <Button disabled={!canApprove || review.isPending} onClick={() => { review.reset(); setDecision('approved'); setReviewNote(''); }}>
              <Check className="h-4 w-4" aria-hidden="true" />{t('playlistReview.approve')}
            </Button>
          </div>
        </>}
      </section>
    </div>
    <AlertDialog open={!!decision} onOpenChange={open => { if (!open && !review.isPending) setDecision(null); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{decision === 'approved' ? t('playlistReview.approve') : t('playlistReview.reject')}</AlertDialogTitle>
          <AlertDialogDescription>{t('playlistReview.confirm')}</AlertDialogDescription>
        </AlertDialogHeader>
        <label className="block space-y-2 text-sm font-medium"><span className="block">{t('playlistReview.note')}</span>
          <Textarea maxLength={2000} rows={3} value={reviewNote} onChange={event => setReviewNote(event.target.value)} />
        </label>
        {review.error && <p role="alert" className="border border-destructive p-3 text-sm text-destructive">{review.error.message}</p>}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={review.isPending}>{t('common.cancel')}</AlertDialogCancel>
          <AlertDialogAction disabled={review.isPending || !decision} onClick={event => { event.preventDefault(); confirm(); }}>
            {review.isPending ? t('common.working') : t('common.confirm')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>;
}
