import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Check, ExternalLink, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/shared/api/supabase/supabaseClient';
import { getSupabaseErrorMessage } from '@/shared/api/supabase/supabaseErrors';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { PageState } from '@/components/layout/PageState';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type Decision = 'approved' | 'rejected';
const PENDING_KEY = ['facodi', 'editor', 'pending-playlists'];
const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;

async function listPendingPlaylists() {
  const { data, error } = await supabase.from('playlists')
    .select('id,title,description,course_id,curricular_unit_id,source_url,submitted_at,import_status,status')
    .eq('status', 'pending').order('submitted_at', { ascending: true }).limit(80);
  if (error) throw new Error(getSupabaseErrorMessage(error));
  return data ?? [];
}
async function listPlaylistVideos(playlistId: string) {
  const { data, error } = await supabase.from('playlist_items')
    .select('id,playlist_id,position,youtube_video_id,video_id,review_status')
    .eq('playlist_id', playlistId).order('position').limit(100);
  if (error) throw new Error(getSupabaseErrorMessage(error));
  return data ?? [];
}

export default function EditorPlaylists() {
  const { t } = useTranslation();
  const client = useQueryClient();
  const [selectedId, setSelectedId] = useState('');
  const [decision, setDecision] = useState<Decision | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const pending = useQuery({ queryKey: PENDING_KEY, queryFn: listPendingPlaylists });
  const selected = pending.data?.find(p => p.id === selectedId) ?? pending.data?.[0] ?? null;
  const items = useQuery({
    queryKey: [...PENDING_KEY, 'items', selected?.id ?? ''],
    queryFn: () => listPlaylistVideos(selected!.id),
    enabled: !!selected,
  });
  const accepted = items.data?.filter(i => i.review_status !== 'rejected') ?? [];
  const unresolved = accepted.filter(i => !i.video_id);
  const canApprove = !items.isPending && !items.error && accepted.length > 0 && unresolved.length === 0;
  const review = useMutation({
    mutationFn: async ({ action, note }: { action: Decision; note: string }) => {
      if (!selected) throw new Error('No playlist selected');
      const { error } = await supabase.rpc('review_playlist', {
        p_playlist_id: selected.id,
        p_decision: action,
        p_review_note: note.trim() || null,
      });
      if (error) throw new Error(getSupabaseErrorMessage(error));
    },
    onSuccess: async () => {
      setDecision(null);
      setReviewNote('');
      await client.invalidateQueries({ queryKey: ['facodi'] });
      toast.success(t('playlistReview.saved'));
    },
  });
  return <div>
    <Link to="/editor" className="mb-8 inline-flex items-center gap-2 text-sm font-semibold underline underline-offset-4">
      <ArrowLeft className="h-4 w-4" />{t('playlistReview.back')}
    </Link>
    <header className="mb-8 max-w-3xl">
      <h1 className="text-3xl font-semibold sm:text-4xl">{t('playlistReview.title')}</h1>
      <p className="mt-4 text-muted-foreground">{t('playlistReview.description')}</p>
    </header>
    <div className="grid gap-8 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)]">
      <aside>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold">{t('playlistReview.queue', { count: pending.data?.length ?? 0 })}</h2>
          <Button type="button" variant="outline" size="sm" onClick={() => void pending.refetch()} disabled={pending.isFetching}>
            {t('playlistReview.refresh')}
          </Button>
        </div>
        {pending.isPending ? <PageState loading /> : pending.error
          ? <PageState title={t('common.error')} description={pending.error.message} retry={() => void pending.refetch()} />
          : !pending.data?.length ? <p className="text-sm text-muted-foreground">{t('playlistReview.empty')}</p>
          : <ul className="divide-y divide-input border-y border-input">
            {pending.data.map(p => <li key={p.id}>
              <button type="button" onClick={() => { setSelectedId(p.id); review.reset(); }}
                aria-pressed={selected?.id === p.id}
                className={`w-full p-4 text-left hover:bg-muted ${selected?.id === p.id ? 'bg-muted' : ''}`}>
                <span className="block break-words font-medium">{p.title}</span>
                <span className="mt-2 block font-mono text-xs text-muted-foreground">{t('playlistReview.import')}: {p.import_status}</span>
              </button>
            </li>)}
          </ul>}
      </aside>
      <section className="min-w-0">
        {!selected ? <PageState title={t('playlistReview.empty')} description={t('playlistReview.emptyDescription')} /> : <>
          <h2 className="break-words text-2xl font-semibold">{selected.title}</h2>
          {selected.description && <p className="mt-3 max-w-prose text-sm text-muted-foreground">{selected.description}</p>}
          {selected.source_url.startsWith('https://www.youtube.com/playlist?list=') && <a
            href={selected.source_url} target="_blank" rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 text-sm font-semibold underline underline-offset-4">
            {t('playlistReview.source')}<ExternalLink className="h-4 w-4" />
          </a>}
          <p className="mt-5 text-sm text-muted-foreground">{t('playlistReview.scope')}</p>
          {items.isPending ? <PageState loading /> : items.error
            ? <PageState title={t('common.error')} description={items.error.message} retry={() => void items.refetch()} />
            : <div className="mt-6">
              <h3 className="font-semibold">{t('playlistReview.videos', { count: items.data.length })}</h3>
              {unresolved.length > 0 && <p role="status" className="mt-2 text-sm text-destructive">
                {t('playlistReview.unresolved', { count: unresolved.length })}
              </p>}
              <ol className="mt-3 max-h-[32rem] divide-y divide-input overflow-y-auto border-y border-input">
                {items.data.map(item => <li key={item.id} className="flex flex-wrap items-center gap-3 py-3">
                  <span className="w-8 shrink-0 text-right font-mono text-xs text-muted-foreground">{item.position + 1}.</span>
                  {VIDEO_ID.test(item.youtube_video_id)
                    ? <a href={`https://www.youtube.com/watch?v=${item.youtube_video_id}`}
                      target="_blank" rel="noopener noreferrer" className="min-w-0 break-all text-sm underline underline-offset-4">
                      {item.youtube_video_id}<ExternalLink className="ml-1 inline h-3 w-3" />
                    </a>
                    : <span className="text-sm">{item.youtube_video_id}</span>}
                  <span className="ml-auto text-xs text-muted-foreground">
                    {item.video_id ? t('playlistReview.linked') : t('playlistReview.missing')}
                  </span>
                </li>)}
              </ol>
            </div>}
          {review.error && <p role="alert" className="mt-4 border border-destructive p-3 text-sm text-destructive">{review.error.message}</p>}
          <div className="mt-6 flex flex-wrap gap-3">
            <Button variant="outline" disabled={review.isPending || items.isPending}
              onClick={() => { setDecision('rejected'); setReviewNote(''); }}>
              <X className="h-4 w-4" />{t('playlistReview.reject')}
            </Button>
            <Button disabled={!canApprove || review.isPending}
              onClick={() => { setDecision('approved'); setReviewNote(''); }}>
              <Check className="h-4 w-4" />{t('playlistReview.approve')}
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
        <label className="block space-y-2 text-sm font-medium"><span>{t('playlistReview.note')}</span>
          <Textarea maxLength={2000} rows={3} value={reviewNote}
            onChange={event => setReviewNote(event.target.value)} />
        </label>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={review.isPending}>{t('common.cancel')}</AlertDialogCancel>
          <AlertDialogAction disabled={review.isPending || !decision} onClick={event => {
            event.preventDefault();
            if (decision) review.mutate({ action: decision, note: reviewNote });
          }}>{t('common.confirm')}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>;
}
