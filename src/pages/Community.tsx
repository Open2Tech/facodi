import { ArrowUpRight, BookOpen, HeartHandshake, ListVideo, Lightbulb, ShieldCheck, type LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { PageState } from '@/components/layout/PageState';
import { useAuth } from '@/features/auth/useAuth';
import { useProjectDirectory, projectText } from '@/entities/project/project.api';
import { PageSeo } from '@/components/layout/PageSeo';
import { staticPageMeta } from '@/shared/seo/seo';

const actions: { id: 'explore'|'suggest'|'playlist'|'build'; icon: LucideIcon; href: string; private: boolean; tone: string }[] = [
  { id:'explore',icon:BookOpen,href:'/courses',private:false,tone:'bg-brand-mint' },
  { id:'suggest',icon:Lightbulb,href:'/suggest',private:true,tone:'bg-brand-cyan' },
  { id:'playlist',icon:ListVideo,href:'/playlists/submit',private:true,tone:'bg-brand-orange' },
  { id:'build',icon:HeartHandshake,href:'https://github.com/Open2Tech/facodi',private:false,tone:'bg-brand-pink' },
];

export default function Community() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const query = useProjectDirectory();
  const community = (query.data?.profiles ?? []).filter(p => p.relationship_kind === 'contribution_path');

  return <article className="space-y-14 sm:space-y-20">
    <PageSeo {...staticPageMeta('/community', { title: t('projectSeo.community.title'), description: t('projectSeo.community.description') })} />
    <header className="grid gap-8 border-b border-foreground pb-12 lg:grid-cols-[1fr_0.8fr]">
      <div>
        <p className="mb-4 font-mono text-xs font-semibold uppercase tracking-widest text-muted-foreground">{t('projectCommunity.eyebrow')}</p>
        <h1 className="max-w-3xl text-4xl font-semibold leading-[1.06] tracking-[-0.04em] sm:text-6xl">{t('projectCommunity.title')}</h1>
        <p className="mt-7 max-w-2xl text-lg leading-relaxed text-muted-foreground">{t('projectCommunity.lead')}</p>
      </div>
      <div className="flex min-h-52 flex-col justify-between border border-foreground bg-primary p-7 text-primary-foreground">
        <span className="font-mono text-xs uppercase tracking-[0.14em]">{t('projectCommunity.noteLabel')}</span>
        <p className="max-w-sm text-3xl font-semibold tracking-[-0.03em]">{t('projectCommunity.note')}</p>
        <span className="font-mono text-xs">FACODI / COMMUNITY</span>
      </div>
    </header>

    <section aria-labelledby="community-actions">
      <div className="mb-8">
        <p className="font-mono text-xs font-semibold uppercase tracking-widest text-muted-foreground">{t('projectCommunity.actionsEyebrow')}</p>
        <h2 id="community-actions" className="mt-3 text-3xl font-semibold">{t('projectCommunity.actionsTitle')}</h2>
      </div>
      <ul className="grid gap-px border border-foreground bg-foreground sm:grid-cols-2 lg:grid-cols-4">
        {actions.map((action, index) => {
          const Icon = action.icon;
          const to = action.private && !user ? `/login?next=${encodeURIComponent(action.href)}` : action.href;
          const external = to.startsWith('https://');
          const shared = `flex h-full flex-col p-6 text-ink transition-[filter] hover:brightness-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground ${action.tone}`;
          const content = <>
            <span className="mb-8 flex items-center justify-between">
              <Icon className="h-7 w-7" aria-hidden="true" /><span className="font-mono text-sm">{String(index + 1).padStart(2,'0')}</span>
            </span>
            <span className="text-xl font-semibold">{t(`projectCommunity.actions.${action.id}.title`)}</span>
            <span className="mt-3 flex-1 text-sm leading-relaxed">{t(`projectCommunity.actions.${action.id}.description`)}</span>
            <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold">{t(`projectCommunity.actions.${action.id}.cta`)}<ArrowUpRight className="h-4 w-4" /></span>
          </>;
          return <li key={action.id}>
            {external ? <a href={to} target="_blank" rel="noopener noreferrer" className={shared}>{content}</a>
              : <Link to={to} className={shared}>{content}</Link>}
          </li>;
        })}
      </ul>
    </section>

    <section aria-labelledby="community-roles" className="grid gap-9 lg:grid-cols-[0.7fr_1.3fr] lg:gap-14">
      <div>
        <p className="font-mono text-xs font-semibold uppercase tracking-widest text-muted-foreground">{t('projectCommunity.rolesEyebrow')}</p>
        <h2 id="community-roles" className="mt-3 max-w-sm text-3xl font-semibold sm:text-4xl">{t('projectCommunity.rolesTitle')}</h2>
        <p className="mt-5 max-w-prose leading-relaxed text-muted-foreground">{t('projectCommunity.rolesDescription')}</p>
      </div>
      <div>
        {query.isPending && <PageState loading />}
        {query.error && <PageState title={t('common.error')} description={query.error.message} retry={() => void query.refetch()} />}
        {!!community.length && <ul className="grid gap-4 sm:grid-cols-2">
          {community.map((profile, index) => <li key={profile.id} className="flex flex-col border border-input p-6">
            <span className="font-mono text-xs text-muted-foreground">{String(index + 1).padStart(2,'0')}</span>
            <h3 className="mt-5 text-2xl font-semibold">{profile.display_name}</h3>
            <p className="mt-3 font-medium">{projectText(profile,i18n.language,'headline',profile.headline)}</p>
            <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
              {projectText(profile,i18n.language,'description',profile.description)}
            </p>
          </li>)}
        </ul>}
      </div>
    </section>

    <section aria-labelledby="community-rules" className="grid gap-8 border-t border-input pt-12 lg:grid-cols-[0.7fr_1.3fr]">
      <div>
        <div className="inline-flex h-12 w-12 items-center justify-center border border-foreground bg-brand-cyan text-ink">
          <ShieldCheck className="h-6 w-6" aria-hidden="true" />
        </div>
        <h2 id="community-rules" className="mt-5 max-w-sm text-3xl font-semibold">{t('projectCommunity.transparencyTitle')}</h2>
      </div>
      <div className="space-y-4 text-base leading-relaxed text-muted-foreground">
        <p>{t('projectCommunity.transparencyText')}</p>
        <p>{t('projectCommunity.consentText')}</p>
        <p>{t('projectCommunity.degreeText')}</p>
        <Button variant="outline" asChild><Link to="/about#ecosystem">
          {t('projectCommunity.ecosystemCta')}<ArrowUpRight className="h-4 w-4" />
        </Link></Button>
      </div>
    </section>

    <section aria-labelledby="community-cta" className="flex flex-col gap-7 border border-foreground bg-brand-mint p-8 text-ink sm:p-12 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="font-mono text-xs font-semibold uppercase tracking-widest">FACODI / OPEN CALL</p>
        <h2 id="community-cta" className="mt-3 max-w-xl text-3xl font-semibold sm:text-4xl">{t('projectCommunity.ctaTitle')}</h2>
        <p className="mt-4 max-w-2xl">{t('projectCommunity.ctaDescription')}</p>
      </div>
      <Button size="lg" asChild><Link to={user ? '/community/join' : '/login?next=%2Fcommunity%2Fjoin'}>
        {t('communityJoin.cta')}<ArrowUpRight className="h-4 w-4" />
      </Link></Button>
    </section>
  </article>;
}
