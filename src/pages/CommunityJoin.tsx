import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ArrowUpRight, HeartHandshake, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/features/auth/useAuth';
import { supabase } from '@/shared/api/supabase/supabaseClient';
import { getSupabaseErrorMessage } from '@/shared/api/supabase/supabaseErrors';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { LegalRichText } from '@/components/legal/LegalRichText';

const interests = ['learner','educator','curator','developer','designer','translator','organization'] as const;
type Interest = typeof interests[number];

export default function CommunityJoin() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const client = useQueryClient();
  const [interest, setInterest] = useState<Interest>('developer');
  const [motivation, setMotivation] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [consent, setConsent] = useState(false);
  const [success, setSuccess] = useState(false);

  const history = useQuery({
    queryKey: ['facodi','community-participation','mine',user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from('community_participation_requests')
        .select('id,interest,review_status,created_at,review_note')
        .eq('submitted_by', user!.id)
        .order('created_at', { ascending: false }).limit(25);
      if (error) throw new Error(getSupabaseErrorMessage(error));
      return data ?? [];
    },
  });
  const [withdrawId, setWithdrawId] = useState<string | null>(null);
  const withdrawal = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error(t('communityJoin.consentRequired'));
      const { data, error } = await supabase.from('community_participation_requests')
        .delete().eq('id', id).eq('submitted_by', user.id).select('id');
      if (error) throw new Error(getSupabaseErrorMessage(error));
      if (!data || data.length !== 1) throw new Error(t('communityJoin.withdrawUnavailable'));
    },
    onSuccess: async () => {
      setWithdrawId(null);
      await client.invalidateQueries({ queryKey: ['facodi','community-participation'] });
    },
  });
  const submit = useMutation({
    mutationFn: async () => {
      if (!user || !consent) throw new Error(t('communityJoin.consentRequired'));
      const { error } = await supabase.from('community_participation_requests').insert({
        submitted_by: user.id,
        interest,
        motivation: motivation.trim(),
        portfolio_url: portfolioUrl.trim() || null,
        consent_to_contact: true,
      });
      if (error) throw new Error(getSupabaseErrorMessage(error));
    },
    onSuccess: async () => {
      setSuccess(true);
      setMotivation('');
      setPortfolioUrl('');
      setConsent(false);
      await client.invalidateQueries({ queryKey: ['facodi','community-participation'] });
    },
  });
  const send = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSuccess(false);
    submit.mutate();
  };

  return <article className="mx-auto max-w-3xl">
    <Link to="/community" className="mb-8 inline-flex items-center gap-2 text-sm font-semibold underline underline-offset-4">
      <ArrowLeft className="h-4 w-4" />{t('communityJoin.back')}
    </Link>
    <header className="border-b border-foreground border-t-4 border-t-brand-mint pb-9 pt-6">
      <div className="flex items-center gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center border border-foreground bg-brand-mint text-brand-ink">
          <HeartHandshake className="h-6 w-6" aria-hidden="true" />
        </span>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">{t('communityJoin.title')}</h1>
      </div>
      <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">{t('communityJoin.description')}</p>
    </header>
    <form onSubmit={send} className="my-9 space-y-6 border border-foreground border-t-4 border-t-brand-mint bg-card p-6 sm:p-8">
      <label className="block space-y-2 text-sm font-semibold">
        <span>{t('communityJoin.interest')}</span>
        <select required className="h-11 w-full border border-input bg-background px-3"
          value={interest} disabled={submit.isPending}
          onChange={event => setInterest(event.target.value as Interest)}>
          {interests.map(item => <option key={item} value={item}>{t(`communityJoin.interests.${item}`)}</option>)}
        </select>
      </label>
      <label className="block space-y-2 text-sm font-semibold">
        <span>{t('communityJoin.motivation')}</span>
        <Textarea required minLength={30} maxLength={1200} rows={6} value={motivation}
          disabled={submit.isPending} onChange={event => setMotivation(event.target.value)}
          placeholder={t('communityJoin.motivationPlaceholder')} />
        <span className="block font-normal text-muted-foreground">{t('communityJoin.motivationHint')}</span>
      </label>
      <label className="block space-y-2 text-sm font-semibold">
        <span>{t('communityJoin.portfolio')}</span>
        <Input type="url" maxLength={500} placeholder="https://..."
          value={portfolioUrl} disabled={submit.isPending}
          onChange={event => setPortfolioUrl(event.target.value)} />
      </label>
      <label className="flex items-start gap-4 border border-input bg-muted/40 p-4 text-sm">
        <input className="mt-1 h-4 w-4 shrink-0" type="checkbox" required
          checked={consent} disabled={submit.isPending}
          onChange={event => setConsent(event.target.checked)} />
        <span>{t('communityJoin.consent')}</span>
      </label>
      <p className="flex gap-2 text-sm text-muted-foreground">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
        <span>{t('communityJoin.privacy')} <LegalRichText text={t('communityJoin.legalNote')} /></span>
      </p>
      {submit.error && <p role="alert" className="text-sm text-destructive">{submit.error.message}</p>}
      {success && <p role="status" className="border border-foreground bg-brand-mint p-4 font-semibold text-brand-ink">
        {t('communityJoin.success')}
      </p>}
      <Button size="lg" disabled={submit.isPending || !consent || motivation.trim().length < 30}>
        {submit.isPending ? t('common.working') : t('communityJoin.send')}
        <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
      </Button>
    </form>
    <section className="border-t border-foreground pt-9" aria-labelledby="community-my-requests">
      <h2 id="community-my-requests" className="text-2xl font-semibold">{t('communityJoin.history')}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{t('communityJoin.historyDescription')}</p>
      {history.isPending && <p className="mt-5 text-sm" role="status">{t('common.loading')}</p>}
      {history.error && <p role="alert" className="mt-4 text-sm text-destructive">{history.error.message}</p>}
      {!history.isPending && !history.error && !history.data?.length &&
        <p className="mt-5 text-sm text-muted-foreground">{t('communityJoin.empty')}</p>}
      {!!history.data?.length && <ul className="mt-5 divide-y divide-input border-y border-input">
        {history.data.map(item => <li key={item.id} className="flex flex-wrap items-start justify-between gap-4 py-4">
          <div>
            <p className="font-semibold">{t(`communityJoin.interests.${item.interest}`)}</p>
            <p className="mt-1 font-mono text-xs text-muted-foreground">{new Date(item.created_at).toLocaleDateString()}</p>
            {item.review_note && <p className="mt-2 text-sm text-muted-foreground">{item.review_note}</p>}
            <div className="mt-3">
              {withdrawId === item.id ? <div className="space-y-3 border border-input p-3">
                <p className="text-sm">{t('communityJoin.withdrawConfirm')}</p>
                {withdrawal.error && <p role="alert" className="text-sm text-destructive">{withdrawal.error.message}</p>}
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" type="button" disabled={withdrawal.isPending}
                    onClick={() => withdrawal.mutate(item.id)}>{t('communityJoin.withdrawConfirmButton')}</Button>
                  <Button size="sm" variant="outline" type="button" disabled={withdrawal.isPending}
                    onClick={() => setWithdrawId(null)}>{t('common.cancel')}</Button>
                </div>
              </div> : <Button type="button" size="sm" variant="outline"
                onClick={() => {withdrawal.reset();setWithdrawId(item.id);}}>
                  {t('communityJoin.withdraw')}
              </Button>}
            </div>
          </div>
          <span className="font-mono text-xs uppercase">{t(`communityJoin.status.${item.review_status}`)}</span>
        </li>)}
      </ul>}
    </section>
  </article>;
}
