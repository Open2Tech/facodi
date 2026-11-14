import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ShieldCheck, UsersRound } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/shared/api/supabase/supabaseClient';
import { getSupabaseErrorMessage } from '@/shared/api/supabase/supabaseErrors';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { PageState } from '@/components/layout/PageState';

type Candidate = {
  id: string;
  slug: string;
  display_name: string;
  role_label: string;
  headline: string;
  description: string;
};

const queueKey = ['facodi', 'project-credit-candidates'];
async function listCandidates(): Promise<Candidate[]> {
  const { data, error } = await supabase.from('project_profiles')
    .select('id,slug,display_name,role_label,headline,description')
    .eq('publication_state', 'draft')
    .eq('relationship_kind', 'candidate_contributor')
    .order('sort_order').order('slug');
  if (error) throw new Error(getSupabaseErrorMessage(error));
  return data ?? [];
}

function CreditForm({ candidate, onReviewed }: { candidate: Candidate; onReviewed: () => void }) {
  const { t } = useTranslation();
  const [roleLabel,setRoleLabel] = useState(candidate.role_label.replace(/\s*[·—-]\s*a confirmar$/i,''));
  const [headline,setHeadline] = useState('');
  const [description,setDescription] = useState('');
  const [publicSource,setPublicSource] = useState('');
  const [consentBasis,setConsentBasis] = useState('direct_written_confirmation');
  const [note,setNote] = useState('');
  const [ack,setAck] = useState(false);
  const mutation = useMutation({
    mutationFn: async () => {
      if (!ack) throw new Error(t('projectCredits.ackRequired'));
      const { error } = await supabase.rpc('review_project_credit', {
        p_profile_id: candidate.id,
        p_role_label: roleLabel.trim(),
        p_headline: headline.trim(),
        p_description: description.trim(),
        p_public_source_url: publicSource.trim(),
        p_consent_basis: consentBasis,
        p_review_note: note.trim(),
      });
      if (error) throw new Error(getSupabaseErrorMessage(error));
    },
    onSuccess: () => { toast.success(t('projectCredits.saved')); onReviewed(); },
  });

  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); mutation.mutate(); };
  return <form onSubmit={submit} className="space-y-5 border border-input p-6 sm:p-8">
    <div>
      <p className="font-mono text-xs uppercase text-muted-foreground">{candidate.slug}</p>
      <h2 className="mt-2 text-2xl font-semibold">{candidate.display_name}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{t('projectCredits.unverified')}</p>
    </div>
    <label className="block space-y-2 text-sm font-medium">
      <span>{t('projectCredits.role')}</span>
      <Input required minLength={3} maxLength={150} value={roleLabel} onChange={e => setRoleLabel(e.target.value)} />
    </label>
    <label className="block space-y-2 text-sm font-medium">
      <span>{t('projectCredits.headline')}</span>
      <Input required minLength={10} maxLength={320} value={headline} onChange={e => setHeadline(e.target.value)} />
    </label>
    <label className="block space-y-2 text-sm font-medium">
      <span>{t('projectCredits.description')}</span>
      <Textarea required minLength={20} maxLength={1800} rows={4}
        value={description} onChange={e => setDescription(e.target.value)} />
    </label>
    <label className="block space-y-2 text-sm font-medium">
      <span>{t('projectCredits.publicSource')}</span>
      <Input type="url" required pattern="https://.*" maxLength={1000}
        placeholder="https://..." value={publicSource} onChange={e => setPublicSource(e.target.value)} />
      <span className="block text-xs font-normal text-muted-foreground">{t('projectCredits.sourceHint')}</span>
    </label>
    <label className="block space-y-2 text-sm font-medium">
      <span>{t('projectCredits.consent')}</span>
      <select className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
        value={consentBasis} onChange={e => setConsentBasis(e.target.value)} required>
        <option value="direct_written_confirmation">{t('projectCredits.written')}</option>
        <option value="public_self_identification">{t('projectCredits.publicIdentification')}</option>
      </select>
    </label>
    <label className="block space-y-2 text-sm font-medium">
      <span>{t('projectCredits.reviewNote')}</span>
      <Textarea required minLength={20} maxLength={500} rows={3}
        value={note} onChange={e => setNote(e.target.value)}
        placeholder={t('projectCredits.reviewNoteHint')} />
      <span className="block text-xs font-normal text-muted-foreground">{t('projectCredits.privateNote')}</span>
    </label>
    <label className="flex items-start gap-3 border border-input bg-muted/40 p-4 text-sm">
      <input type="checkbox" checked={ack} onChange={e => setAck(e.target.checked)}
        className="mt-1 h-4 w-4 shrink-0" required />
      <span>{t('projectCredits.ack')}</span>
    </label>
    {mutation.error && <p className="text-sm text-destructive" role="alert">{mutation.error.message}</p>}
    <Button type="submit" disabled={mutation.isPending || !ack}>
      <ShieldCheck className="h-4 w-4" />
      {mutation.isPending ? t('projectCredits.saving') : t('projectCredits.publish')}
    </Button>
  </form>;
}

export default function EditorProjectCredits() {
  const { t } = useTranslation();
  const [selectedId,setSelectedId] = useState('');
  const client = useQueryClient();
  const queue = useQuery({ queryKey: queueKey, queryFn: listCandidates });
  const selected = queue.data?.find(c => c.id === selectedId) ?? queue.data?.[0];

  return <article>
    <Link to="/editor" className="mb-8 inline-flex items-center gap-2 text-sm font-semibold underline underline-offset-4">
      <ArrowLeft className="h-4 w-4" />{t('projectCredits.back')}
    </Link>
    <header className="mb-10 grid gap-5 border-b border-foreground pb-8 md:grid-cols-[1fr_auto] md:items-end">
      <div>
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">FACODI / CREDITS</p>
        <h1 className="mt-3 flex items-center gap-3 text-3xl font-semibold sm:text-4xl">
          <UsersRound className="h-8 w-8" aria-hidden="true" />{t('projectCredits.title')}
        </h1>
        <p className="mt-4 max-w-prose text-muted-foreground">{t('projectCredits.lead')}</p>
      </div>
      <span className="font-mono text-sm">{t('projectCredits.count', { count: queue.data?.length ?? 0 })}</span>
    </header>
    {queue.isPending ? <PageState loading /> : queue.error
      ? <PageState title={t('common.error')} description={queue.error.message} retry={() => void queue.refetch()} />
      : !queue.data?.length ? <PageState title={t('projectCredits.empty')} description={t('projectCredits.emptyDescription')} />
      : <div className="grid gap-8 lg:grid-cols-[minmax(0,15rem)_minmax(0,1fr)]">
          <nav aria-label={t('projectCredits.pending')}>
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest">{t('projectCredits.pending')}</p>
            <ul className="divide-y divide-input border-y border-input">
              {queue.data.map(c => <li key={c.id}>
                <button type="button" className="w-full px-3 py-4 text-left text-sm hover:bg-muted"
                  aria-pressed={selected?.id === c.id}
                  onClick={() => setSelectedId(c.id)}>
                  <span className="block font-semibold">{c.display_name}</span>
                  <span className="mt-1 block text-xs text-muted-foreground">{t('projectCredits.draft')}</span>
                </button>
              </li>)}
            </ul>
          </nav>
          {selected && <CreditForm key={selected.id} candidate={selected}
            onReviewed={() => { setSelectedId(''); void client.invalidateQueries({queryKey:queueKey});
              void client.invalidateQueries({queryKey:['facodi','public-project-directory']}); }} />}
        </div>}
    <p className="mt-8 border-t border-input pt-5 text-sm text-muted-foreground">{t('projectCredits.footer')}</p>
  </article>;
}
