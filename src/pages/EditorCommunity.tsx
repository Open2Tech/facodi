import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ExternalLink, HeartHandshake, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/shared/api/supabase/supabaseClient';
import { getSupabaseErrorMessage } from '@/shared/api/supabase/supabaseErrors';
import { safeExternalUrl } from '@/shared/lib/navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

type Decision = 'accepted' | 'rejected';

async function fetchPending() {
  const { data, error } = await supabase.from('community_participation_requests')
    .select('id,submitted_by,interest,motivation,portfolio_url,consent_to_contact,created_at')
    .eq('review_status','pending')
    .order('created_at', { ascending: true })
    .limit(75);
  if (error) throw new Error(getSupabaseErrorMessage(error));
  return data ?? [];
}

export default function EditorCommunity() {
  const { t } = useTranslation();
  const client = useQueryClient();
  const [selectedId, setSelectedId] = useState('');
  const [note, setNote] = useState('');
  const [decision, setDecision] = useState<Decision | null>(null);
  const requests = useQuery({
    queryKey: ['facodi','community-participation','editor-pending'],
    queryFn: fetchPending,
  });
  const selected = requests.data?.find(item => item.id === selectedId)
    ?? requests.data?.[0];
  const moderation = useMutation({
    mutationFn: async ({ id, action, explanation }: { id: string; action: Decision; explanation: string }) => {
      const { data, error } = await supabase.from('community_participation_requests')
        .update({ review_status: action, review_note: explanation.trim() || null })
        .eq('id',id).eq('review_status','pending').select('id');
      if (error) throw new Error(getSupabaseErrorMessage(error));
      if (!data || data.length !== 1) throw new Error(t('communityJoin.reviewNotApplied'));
    },
    onSuccess: async () => {
      setDecision(null);
      setSelectedId('');
      setNote('');
      await client.invalidateQueries({ queryKey: ['facodi','community-participation'] });
      toast.success(t('communityJoin.reviewSaved'));
    },
  });
  const source = safeExternalUrl(selected?.portfolio_url ?? null);
  return <article>
    <Link to="/editor" className="mb-8 inline-flex items-center gap-2 text-sm font-semibold underline underline-offset-4">
      <ArrowLeft className="h-4 w-4" />{t('communityJoin.backEditor')}
    </Link>
    <header className="mb-10 border-b border-foreground pb-9">
      <div className="mb-5 grid h-12 w-12 place-items-center border border-foreground bg-brand-mint text-ink">
        <HeartHandshake className="h-6 w-6" aria-hidden="true" />
      </div>
      <h1 className="text-3xl font-semibold sm:text-4xl">{t('communityJoin.reviewTitle')}</h1>
      <p className="mt-4 max-w-2xl leading-relaxed text-muted-foreground">
        {t('communityJoin.reviewDescription')}
      </p>
    </header>
    {requests.isPending && <p role="status" className="text-sm">{t('common.loading')}</p>}
    {requests.error && <p role="alert" className="text-sm text-destructive">{requests.error.message}</p>}
    {!requests.isPending && !requests.error && !requests.data?.length &&
      <p className="text-sm text-muted-foreground">{t('communityJoin.reviewEmpty')}</p>}
    {!!requests.data?.length && <div className="grid gap-8 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)]">
      <aside>
        <h2 className="mb-4 font-mono text-label uppercase tracking-widest">
          {t('communityJoin.queueCount',{count:requests.data.length})}
        </h2>
        <ul className="divide-y divide-input border-y border-input">
          {requests.data.map(item => <li key={item.id}>
            <button type="button" className={`w-full px-4 py-4 text-left hover:bg-muted ${selected?.id===item.id?'bg-muted':''}`}
              aria-pressed={selected?.id===item.id}
              onClick={() => { setSelectedId(item.id);setDecision(null);setNote(''); }}>
              <span className="block font-semibold">{t(`communityJoin.interests.${item.interest}`)}</span>
              <span className="mt-1 block font-mono text-label text-muted-foreground">
                {new Date(item.created_at).toLocaleDateString()}
              </span>
            </button>
          </li>)}
        </ul>
      </aside>
      {selected && <section className="space-y-5">
        <div>
          <p className="font-mono text-label uppercase text-muted-foreground">
            {t('communityJoin.interest')} / {selected.id.slice(0,8)}
          </p>
          <h2 className="mt-2 text-2xl font-semibold">{t(`communityJoin.interests.${selected.interest}`)}</h2>
        </div>
        <p className="whitespace-pre-wrap leading-relaxed">{selected.motivation}</p>
        {source && <a href={source} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm font-semibold underline underline-offset-4">
          {t('communityJoin.portfolio')}<ExternalLink className="h-4 w-4" aria-hidden="true" />
        </a>}
        <p className="flex gap-2 border-l-4 border-input pl-4 text-sm leading-relaxed text-muted-foreground">
          <ShieldCheck className="h-5 w-5 shrink-0" aria-hidden="true" />
          {t('communityJoin.reviewPrivacy')}
        </p>
        <label className="block space-y-2 text-sm font-semibold">
          <span>{t('communityJoin.reviewNote')}</span>
          <Textarea maxLength={1200} rows={4} value={note} disabled={moderation.isPending}
            onChange={event => setNote(event.target.value)} />
        </label>
        {moderation.error && <p role="alert" className="text-sm text-destructive">{moderation.error.message}</p>}
        <div className="flex flex-wrap gap-3">
          <Button type="button" variant="outline" disabled={moderation.isPending}
            onClick={() => setDecision('rejected')}>{t('communityJoin.reject')}</Button>
          <Button type="button" disabled={moderation.isPending}
            onClick={() => setDecision('accepted')}>{t('communityJoin.accept')}</Button>
        </div>
        {decision && <div className="space-y-4 border border-input bg-muted/30 p-5">
          <p className="text-sm font-semibold">{t('communityJoin.confirmReview')}</p>
          <p className="text-sm text-muted-foreground">
            {decision==='accepted' ? t('communityJoin.acceptNote') : t('communityJoin.rejectNote')}
          </p>
          <div className="flex flex-wrap gap-3">
            <Button type="button" disabled={moderation.isPending}
              onClick={() => moderation.mutate({id:selected.id,action:decision,explanation:note})}>
              {t('common.confirm')}
            </Button>
            <Button type="button" variant="outline" disabled={moderation.isPending}
              onClick={() => setDecision(null)}>{t('common.cancel')}</Button>
          </div>
        </div>}
      </section>}
    </div>}
  </article>;
}
