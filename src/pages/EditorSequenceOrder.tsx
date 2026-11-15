import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowDown, ArrowLeft, ArrowUp, ArrowUpRight, GripVertical, RotateCcw, Save } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';
import { supabase } from '@/shared/api/supabase/supabaseClient';
import { getSupabaseErrorMessage } from '@/shared/api/supabase/supabaseErrors';
import { useSequences } from '@/features/sequences/useSequences';
import { sequenceKeys } from '@/entities/sequence/sequence.keys';
import { youtubeThumbnail } from '@/entities/sequence/sequence';
import { PageState } from '@/components/layout/PageState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type Lesson = { videoId: string; title: string; youtubeId: string; channel: string | null; position: number };
type Snapshot = { id: string; slug: string; title: string; revision: number; items: Lesson[] };

function parseSnapshot(raw: Json): Snapshot | null {
  if (raw === null) return null;
  if (!raw || Array.isArray(raw) || typeof raw !== 'object') throw new Error('invalid_sequence_snapshot');
  if (typeof raw.id !== 'string' || typeof raw.slug !== 'string' ||
      typeof raw.title !== 'string' || typeof raw.revision !== 'number' ||
      !Number.isInteger(raw.revision) || !Array.isArray(raw.items)) throw new Error('invalid_sequence_snapshot');
  const items = raw.items.map(entry => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry) ||
        typeof entry.videoId !== 'string' || typeof entry.title !== 'string' ||
        typeof entry.youtubeId !== 'string' || typeof entry.position !== 'number') throw new Error('invalid_sequence_item');
    return {
      videoId: entry.videoId, title: entry.title, youtubeId: entry.youtubeId,
      position: entry.position, channel: typeof entry.channel === 'string' ? entry.channel : null,
    };
  });
  return { id: raw.id, slug: raw.slug, title: raw.title, revision: raw.revision, items };
}

async function getOrder(slug: string, signal?: AbortSignal) {
  const { data, error } = await supabase.rpc('get_editorial_sequence_order_v1', { p_slug: slug }).abortSignal(signal);
  if (error) throw new Error(getSupabaseErrorMessage(error));
  return parseSnapshot(data);
}

function moveVideo(current: string[], from: string, to: string): string[] {
  const source = current.indexOf(from);
  const destination = current.indexOf(to);
  if (source < 0 || destination < 0 || source === destination) return current;
  const next = current.slice();
  next.splice(destination, 0, next.splice(source, 1)[0]);
  return next;
}

function OrderEditor({ slug }: { slug: string }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const snapshot = useQuery({
    queryKey: ['facodi', 'editor', 'sequence-order', slug],
    queryFn: ({ signal }) => getOrder(slug, signal),
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });
  const [draft, setDraft] = useState<string[]>([]);
  const [confirm, setConfirm] = useState(false);
  useEffect(() => {
    setDraft(snapshot.data?.items.map(item => item.videoId) ?? []);
  }, [snapshot.data]);

  const current = snapshot.data?.items ?? [];
  const original = current.map(item => item.videoId);
  const lessonById = useMemo(() => new Map(current.map(item => [item.videoId, item])), [current]);
  const originalPosition = useMemo(() => new Map(original.map((id, i) => [id, i + 1])), [current]);
  const dirty = draft.length === original.length && draft.some((id, index) => id !== original[index]);
  const movedCount = draft.filter((id, index) => id !== original[index]).length;

  const mutation = useMutation({
    mutationFn: async () => {
      if (!snapshot.data || !dirty) throw new Error('sequence_not_modified');
      const { data, error } = await supabase.rpc('reorder_editorial_sequence_v1', {
        p_playlist_id: snapshot.data.id,
        p_expected_revision: snapshot.data.revision,
        p_expected_order: original,
        p_new_order: draft,
      });
      if (error) throw new Error(getSupabaseErrorMessage(error));
      return data;
    },
    onSuccess: async () => {
      setConfirm(false);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['facodi', 'editor', 'sequence-order', slug] }),
        queryClient.invalidateQueries({ queryKey: sequenceKeys.detail(slug) }),
        queryClient.invalidateQueries({ queryKey: sequenceKeys.list(null) }),
      ]);
      toast.success(t('editorSequenceOrder.saved'));
    },
  });
  const conflict = mutation.error && /order_conflict|sequence_membership_changed|40001/i.test(mutation.error.message);
  const busy = mutation.isPending;

  if (snapshot.isPending) return <PageState loading />;
  if (snapshot.error) return <PageState level="h2" title={t('common.error')} description={snapshot.error.message} retry={() => void snapshot.refetch()} />;
  if (!snapshot.data) return <PageState level="h2" title={t('common.notFound')} description={t('editorSequenceOrder.notFound')} />;
  const source = snapshot.data;

  return <section aria-label={source.title} className="min-w-0">
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h2 className="text-2xl font-semibold">{source.title}</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {t('editorSequenceOrder.lessonCount', { count: current.length })} · {t('editorSequenceOrder.revision', { count: source.revision })}
        </p>
      </div>
      <Link to={`/sequences/${encodeURIComponent(source.slug)}`} target="_blank" rel="noopener noreferrer"
        className="inline-flex items-center gap-2 text-sm font-medium underline underline-offset-4">
        {t('editorSequenceOrder.viewPublic')}<ArrowUpRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </div>
    <p className="mb-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">{t('editorSequenceOrder.instructions')}</p>
    {mutation.error && <div role="alert" className="mb-4 border border-destructive p-4 text-sm">
      <p className="font-medium">{conflict ? t('editorSequenceOrder.conflict') : mutation.error.message}</p>
      {conflict && <Button className="mt-3" variant="outline" size="sm" onClick={() => {
        mutation.reset();
        void snapshot.refetch();
      }}>{t('editorSequenceOrder.reload')}</Button>}
    </div>}
    <ol aria-label={t('editorSequenceOrder.proposedOrder')} className="divide-y divide-input border-y border-input">
      {draft.map((id, index) => {
        const item = lessonById.get(id);
        if (!item) return null;
        const originalIndex = originalPosition.get(id) ?? index + 1;
        const image = youtubeThumbnail(item.youtubeId);
        return <li key={id} draggable={!busy} onDragStart={event => {
          event.dataTransfer.effectAllowed = 'move';
          event.dataTransfer.setData('text/plain', id);
        }} onDragOver={event => { if (!busy) event.preventDefault(); }}
          onDrop={event => {
            event.preventDefault();
            if (busy) return;
            const incoming = event.dataTransfer.getData('text/plain');
            if (draft.includes(incoming)) setDraft(old => moveVideo(old, incoming, id));
          }}
          className="flex items-center gap-3 px-2 py-3 transition-colors hover:bg-muted/50">
          <GripVertical aria-hidden="true" className="hidden h-5 w-5 shrink-0 cursor-grab text-muted-foreground sm:block" />
          <span className="w-8 shrink-0 text-right font-mono text-sm tabular-nums">{String(index + 1).padStart(2, '0')}</span>
          {image && <img src={image} alt="" loading="lazy" decoding="async"
            className="hidden aspect-video w-20 shrink-0 bg-muted object-cover sm:block" />}
          <div className="min-w-0 flex-1">
            <p className="break-words text-sm font-medium">{item.title}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {item.channel ?? t('editorSequenceOrder.unknownChannel')}
              {originalIndex !== index + 1 && <span className="ml-2 font-mono">
                {t('editorSequenceOrder.movedFrom', { position: originalIndex })}
              </span>}
            </p>
          </div>
          <div className="flex shrink-0 gap-1">
            <Button aria-label={t('editorSequenceOrder.moveUp', { title: item.title })} variant="outline"
              size="icon" disabled={busy || index === 0}
              onClick={() => setDraft(old => moveVideo(old, id, old[index - 1]))}>
              <ArrowUp className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button aria-label={t('editorSequenceOrder.moveDown', { title: item.title })} variant="outline"
              size="icon" disabled={busy || index === draft.length - 1}
              onClick={() => setDraft(old => moveVideo(old, id, old[index + 1]))}>
              <ArrowDown className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </li>;
      })}
    </ol>
    {dirty && <section className="mt-6 border border-input p-4" aria-labelledby="editor-sequence-preview">
      <h3 id="editor-sequence-preview" className="font-semibold">{t('editorSequenceOrder.preview')}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{t('editorSequenceOrder.changedCount', { count: movedCount })}</p>
      <ul className="mt-3 max-h-48 divide-y divide-input overflow-y-auto">
        {draft.map((id, index) => {
          const from = originalPosition.get(id);
          return from === index + 1 ? null : <li key={id} className="flex items-start gap-3 py-2 text-sm">
            <span className="w-24 shrink-0 font-mono tabular-nums">{from} → {index + 1}</span>
            <span>{lessonById.get(id)?.title}</span>
          </li>;
        })}
      </ul>
    </section>}
    <div className="mt-6 flex flex-wrap gap-3">
      <Button onClick={() => { mutation.reset(); setConfirm(true); }} disabled={!dirty || busy}>
        <Save className="h-4 w-4" aria-hidden="true" />{t('editorSequenceOrder.save')}
      </Button>
      <Button variant="outline" disabled={!dirty || busy}
        onClick={() => { setDraft(original); mutation.reset(); }}>
        <RotateCcw className="h-4 w-4" aria-hidden="true" />{t('editorSequenceOrder.discard')}
      </Button>
    </div>
    <AlertDialog open={confirm} onOpenChange={open => { if (!busy) setConfirm(open); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('editorSequenceOrder.confirmTitle')}</AlertDialogTitle>
          <AlertDialogDescription>{t('editorSequenceOrder.confirmDescription', { count: movedCount })}</AlertDialogDescription>
        </AlertDialogHeader>
        {mutation.error && <p role="alert" className="text-sm text-destructive">{mutation.error.message}</p>}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>{t('common.cancel')}</AlertDialogCancel>
          <AlertDialogAction disabled={busy || !dirty} onClick={event => {
            event.preventDefault();
            mutation.mutate();
          }}>{busy ? t('common.working') : t('common.confirm')}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </section>;
}

export default function EditorSequenceOrder() {
  const { t } = useTranslation();
  const [params, setParams] = useSearchParams();
  const sequences = useSequences();
  const [search, setSearch] = useState('');
  const all = sequences.data ?? [];
  const chosen = params.get('slug') || all[0]?.slug || '';
  const filtered = all.filter(item => (item.title + ' ' + item.slug + ' ' + item.unitCodes.join(' '))
    .toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()));
  return <article>
    <Link to="/editor" className="mb-8 inline-flex items-center gap-2 text-sm font-semibold underline underline-offset-4">
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />{t('editorSequenceOrder.back')}
    </Link>
    <header className="mb-8 max-w-3xl">
      <h1 className="text-3xl font-semibold sm:text-4xl">{t('editorSequenceOrder.title')}</h1>
      <p className="mt-4 text-muted-foreground">{t('editorSequenceOrder.description')}</p>
    </header>
    {sequences.isPending ? <PageState loading /> : sequences.error
      ? <PageState title={t('common.error')} description={sequences.error.message} retry={() => void sequences.refetch()} />
      : all.length === 0 ? <PageState title={t('editorSequenceOrder.empty')} />
      : <>
        <div className="mb-8 grid max-w-3xl gap-3">
          <label className="block space-y-2 text-sm font-medium">
            <span>{t('editorSequenceOrder.search')}</span>
            <Input value={search} onChange={event => setSearch(event.target.value)}
              placeholder={t('editorSequenceOrder.searchPlaceholder')} />
          </label>
          <label className="block space-y-2 text-sm font-medium">
            <span>{t('editorSequenceOrder.chooseSequence')}</span>
            <select value={chosen} onChange={event => {
              setParams({ slug: event.target.value }, { replace: true });
              setSearch('');
            }} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
              {!filtered.some(item => item.slug === chosen) && <option value={chosen}>
                {all.find(item => item.slug === chosen)?.title ?? chosen}
              </option>}
              {filtered.map(item => <option key={item.id} value={item.slug}>
                {item.title} ({item.itemCount})
              </option>)}
            </select>
          </label>
        </div>
        <OrderEditor key={chosen} slug={chosen} />
      </>}
  </article>;
}
