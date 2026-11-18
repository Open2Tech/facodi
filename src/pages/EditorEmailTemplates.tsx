import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, FileCheck2, MailCheck, ShieldAlert } from 'lucide-react';
import { supabase } from '@/shared/api/supabase/supabaseClient';
import { getSupabaseErrorMessage } from '@/shared/api/supabase/supabaseErrors';
import { PageState } from '@/components/layout/PageState';

async function listFacodiEmailTemplates() {
  const { data, error } = await supabase.from('email_template_catalog')
    .select('template_key,locale,subject,body_html,site_origin,review_status,delivery_enabled,version')
    .eq('audience', 'facodi')
    .eq('locale','pt-PT')
    .order('template_key');
  if (error) throw new Error(getSupabaseErrorMessage(error));
  return data ?? [];
}

export default function EditorEmailTemplates() {
  const { t } = useTranslation();
  const [selectedKey,setSelectedKey] = useState('');
  const query = useQuery({
    queryKey:['facodi','email-template-catalog','pt-PT'],
    queryFn:listFacodiEmailTemplates,
    staleTime:5 * 60_000,
  });
  const selected = query.data?.find(x=>x.template_key===selectedKey) ?? query.data?.[0];
  const count=query.data?.length ?? 0;
  return <article className="space-y-8">
    <Link to="/editor" className="inline-flex items-center gap-2 text-sm font-semibold underline underline-offset-4">
      <ArrowLeft className="h-4 w-4" />{t('editorEmails.back')}
    </Link>
    <header className="border-b border-input pb-8">
      <span className="mb-4 grid h-12 w-12 place-items-center border border-foreground bg-brand-cyan text-ink">
        <MailCheck className="h-6 w-6" aria-hidden="true" />
      </span>
      <h1 className="text-3xl font-semibold sm:text-4xl">{t('editorEmails.title')}</h1>
      <p className="mt-4 max-w-3xl leading-relaxed text-muted-foreground">{t('editorEmails.lead')}</p>
    </header>
    <section className="flex gap-3 border border-input bg-muted/40 p-5" aria-label={t('editorEmails.isolationLabel')}>
      <ShieldAlert className="mt-0.5 h-6 w-6 shrink-0 text-foreground" aria-hidden="true" />
      <div>
        <p className="font-semibold">{t('editorEmails.isolationTitle')}</p>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t('editorEmails.isolationDescription')}</p>
      </div>
    </section>
    {query.isPending && <PageState loading />}
    {query.error && <PageState title={t('common.error')} description={query.error.message} retry={() => void query.refetch()} />}
    {!query.isPending && !query.error && !count && <PageState title={t('editorEmails.empty')} />}
    {!!count && <div className="grid gap-7 lg:grid-cols-[minmax(0,16rem)_minmax(0,1fr)]">
      <aside>
        <p className="mb-4 font-mono text-label uppercase tracking-widest text-muted-foreground">
          {t('editorEmails.count',{count})}
        </p>
        <ul className="divide-y divide-input border-y border-input">
          {query.data?.map(item=><li key={item.template_key}>
            <button type="button" aria-pressed={selected?.template_key===item.template_key}
              className="w-full px-3 py-4 text-left hover:bg-muted focus-visible:outline"
              onClick={()=>setSelectedKey(item.template_key)}>
              <span className="block font-semibold">{item.template_key.replace(/_/g,' ')}</span>
              <span className="mt-1 block text-xs text-muted-foreground">{item.subject}</span>
            </button>
          </li>)}
        </ul>
      </aside>
      {selected && <section className="min-w-0 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">{selected.subject}</h2>
            <p className="mt-2 font-mono text-label text-muted-foreground">
              {selected.site_origin} · v{selected.version} · {selected.locale}
            </p>
          </div>
          <span className="inline-flex items-center gap-2 border border-input px-3 py-2 text-xs font-semibold uppercase">
            <FileCheck2 className="h-4 w-4" aria-hidden="true" />
            {selected.delivery_enabled ? t('editorEmails.enabled') : t('editorEmails.previewOnly')}
          </span>
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">{t('editorEmails.placeholders')}</p>
        <iframe key={selected.template_key} title={t('editorEmails.previewTitle',{subject:selected.subject})}
          sandbox="" referrerPolicy="no-referrer" loading="lazy"
          srcDoc={selected.body_html}
          className="min-h-[720px] w-full rounded-lg border border-input bg-white"
        />
      </section>}
    </div>}
  </article>;
}
