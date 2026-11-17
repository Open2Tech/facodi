import { useEffect } from 'react';
import { ArrowUpRight, BadgeCheck, Link2, LockOpen, type LucideIcon } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/useAuth';
import { canAccessFacodiRoute } from '@/entities/facodi/access';
import { cn } from '@/lib/utils';
import ProjectStorySections from '@/components/project/ProjectStorySections';
import { PageSeo } from '@/components/layout/PageSeo';
import { ABOUT_FAQ, aboutMeta } from '@/shared/seo/seo';

const PRINCIPLES: { key: 'open' | 'context' | 'curated'; icon: LucideIcon; fill: string }[] = [
  { key: 'open', icon: LockOpen, fill: 'bg-brand-cyan' },
  { key: 'context', icon: Link2, fill: 'bg-brand-orange' },
  { key: 'curated', icon: BadgeCheck, fill: 'bg-brand-mint' },
];
const FLOW = ['account', 'review', 'publish'] as const;

export default function About() {
  const { t } = useTranslation();
  const { user, role } = useAuth();
  const { hash } = useLocation();
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView();
  }, [hash]);
  const editor = canAccessFacodiRoute(role, 'editor');
  return <article>
    <PageSeo {...aboutMeta(
      { title: t('projectSeo.about.title'), description: t('projectSeo.about.description') },
      ABOUT_FAQ.map(item => ({ question: t(item.question), answer: t(item.answer) })),
    )} />
    <header className="grid gap-8 border-b border-foreground pb-12 lg:grid-cols-[1.4fr_1fr] lg:items-end">
      <h1 className="max-w-3xl text-4xl font-semibold leading-[1.05] tracking-[-0.035em] sm:text-6xl">{t('about.title')}</h1>
      <p className="max-w-prose text-lg leading-relaxed text-muted-foreground">{t('about.lead')}</p>
    </header>

    <section aria-labelledby="seaeu" className="grid gap-6 py-12 lg:grid-cols-[1fr_1.4fr] lg:gap-14">
      <h2 id="seaeu" className="text-3xl font-semibold tracking-[-0.02em]">{t('about.seaeuTitle')}</h2>
      <div className="space-y-4 text-lg leading-relaxed text-muted-foreground"><p>{t('about.seaeuText')}</p><p>{t('about.seaeuScope')}</p></div>
    </section>

    <ProjectStorySections />

    <section aria-labelledby="principles" className="border-t border-input py-12">
      <h2 id="principles" className="text-3xl font-semibold tracking-[-0.02em]">{t('about.principlesTitle')}</h2>
      <dl className="mt-8 grid gap-px bg-input md:grid-cols-3">
        {PRINCIPLES.map(({ key: item, icon: Icon, fill }) => <div key={item} className="bg-background py-6 md:px-6 md:first:pl-0">
          <dt className="flex items-center gap-3 text-xl font-semibold">
            <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center border border-foreground text-ink', fill)}><Icon className="h-5 w-5" aria-hidden="true" /></span>
            {t(`about.principles.${item}.title`)}
          </dt>
          <dd className="mt-4 leading-relaxed text-muted-foreground">{t(`about.principles.${item}.text`)}</dd>
        </div>)}
      </dl>
    </section>

    <section id="contribute" aria-labelledby="contribute-title" className="scroll-mt-28 border border-foreground bg-primary px-6 py-10 text-primary-foreground sm:px-10">
      <h2 id="contribute-title" className="max-w-2xl text-3xl font-semibold tracking-[-0.02em] sm:text-4xl">{t('about.contributeTitle')}</h2>
      <p className="mt-4 max-w-prose leading-relaxed">{t('about.contributeText')}</p>
      <ol className="mt-8 grid gap-6 border-t border-ink/25 pt-6 md:grid-cols-3">
        {FLOW.map((step, index) => <li key={step} className="flex gap-4">
          <span className="font-mono text-sm">{String(index + 1).padStart(2, '0')}</span>
          <p className="leading-relaxed">{t(`about.flow.${step}`)}</p>
        </li>)}
      </ol>
      <Button size="lg" className="mt-9 h-auto min-h-11 max-w-full whitespace-normal bg-ink py-3 text-left text-primary hover:bg-ink/90" asChild>
        {editor ? <Link to="/editor">{t('about.openEditor')}<ArrowUpRight /></Link>
          : user ? <Link to="/suggest">{t('suggest.nav')}<ArrowUpRight /></Link>
          : <Link to="/login">{t('about.createAccount')}<ArrowUpRight /></Link>}
      </Button>
      {user && !editor && <Link to="/playlists/submit" className="mt-4 block w-fit text-sm font-semibold underline underline-offset-4">{t('playlistSubmit.send')}</Link>}
    </section>
  </article>;
}
