import { ArrowUpRight, BookOpen, HeartHandshake, ListVideo, Lightbulb, ShieldCheck, type LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { PageState } from '@/components/layout/PageState';
import { useAuth } from '@/features/auth/useAuth';
import { useProjectDirectory, projectText } from '@/entities/project/project.api';
import { PageSeo } from '@/components/layout/PageSeo';
import { staticPageMeta } from '@/shared/seo/seo';
import { cn } from '@/lib/utils';

const actions: { id: 'explore'|'suggest'|'playlist'|'build'; icon: LucideIcon; href: string; tone: string }[] = [
  { id:'explore',icon:BookOpen,href:'/courses',tone:'bg-brand-mint' },
  { id:'suggest',icon:Lightbulb,href:'/suggest',tone:'bg-brand-cyan' },
  { id:'playlist',icon:ListVideo,href:'/playlists/submit',tone:'bg-brand-orange' },
  { id:'build',icon:HeartHandshake,href:'https://github.com/Open2Tech/facodi',tone:'bg-brand-pink' },
];

const ROLE_TOP_TONES = [
  'border-t-primary',
  'border-t-brand-cyan',
  'border-t-brand-mint',
  'border-t-brand-pink',
] as const;

const ROLE_BADGE_TONES = [
  'bg-primary text-brand-ink',
  'bg-brand-cyan text-brand-ink',
  'bg-brand-mint text-brand-ink',
  'bg-brand-pink text-brand-ink',
] as const;

export default function Community() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const query = useProjectDirectory();
  const community = (query.data?.profiles ?? []).filter(p => p.relationship_kind === 'contribution_path');

  return <article className="space-y-14 sm:space-y-20">
    <PageSeo {...staticPageMeta('/community', { title: t('projectSeo.community.title'), description: t('projectSeo.community.description') })} />
    <header className="grid gap-8 border-b border-foreground border-t-4 border-t-brand-coral pb-12 pt-6 lg:grid-cols-[1fr_0.8fr]">
      <div>
        <h1 className="max-w-3xl text-4xl font-semibold leading-[1.06] tracking-[-0.04em] sm:text-6xl">{t('projectCommunity.title')}</h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">{t('projectCommunity.lead')}</p>
      </div>
      <div className="flex min-h-52 flex-col justify-between border border-foreground bg-primary p-7 text-brand-ink">
        <span className="font-mono text-xs uppercase tracking-[0.14em]">{t('projectCommunity.noteLabel')}</span>
        <p className="max-w-sm text-3xl font-semibold tracking-[-0.03em]">{t('projectCommunity.note')}</p>
        <span className="font-mono text-xs">FACODI / COMMUNITY</span>
      </div>
    </header>

    <section aria-labelledby="community-actions">
      <div className="mb-8">
        <h2 id="community-actions" className="text-3xl font-semibold tracking-[-0.02em]">{t('projectCommunity.actionsTitle')}</h2>
      </div>
      <ul className="grid gap-px border border-foreground bg-foreground sm:grid-cols-2 lg:grid-cols-4">
        {actions.map((action, index) => {
          const Icon = action.icon;
          const external = action.href.startsWith('https://');
          const shared = cn(
            'flex h-full flex-col p-6 text-brand-ink transition-[filter] hover:brightness-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground',
            action.tone,
          );
          const content = <>
            <span className="mb-8 flex items-center justify-between">
              <span className="grid h-11 w-11 place-items-center border border-brand-ink bg-brand-paper text-brand-ink">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="font-mono text-sm font-semibold tabular-nums">{String(index + 1).padStart(2,'0')}</span>
            </span>
            <span className="text-xl font-semibold">{t(`projectCommunity.actions.${action.id}.title`)}</span>
            <span className="mt-3 flex-1 text-sm leading-relaxed text-brand-ink/90">{t(`projectCommunity.actions.${action.id}.description`)}</span>
            <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold underline decoration-brand-ink/40 underline-offset-4">{t(`projectCommunity.actions.${action.id}.cta`)}<ArrowUpRight className="h-4 w-4" /></span>
          </>;
          return <li key={action.id}>
            {external ? <a href={action.href} target="_blank" rel="noopener noreferrer" className={shared}>{content}</a>
              : <Link to={action.href} className={shared}>{content}</Link>}
          </li>;
        })}
      </ul>
    </section>

    <section aria-labelledby="community-roles" className="grid gap-9 lg:grid-cols-[0.7fr_1.3fr] lg:gap-14">
      <div>
        <h2 id="community-roles" className="max-w-sm text-3xl font-semibold tracking-[-0.02em] sm:text-4xl">{t('projectCommunity.rolesTitle')}</h2>
        <p className="mt-5 max-w-prose leading-relaxed text-muted-foreground">{t('projectCommunity.rolesDescription')}</p>
      </div>
      <div>
        {query.isPending && <PageState loading />}
        {query.error && <PageState title={t('common.error')} description={query.error.message} retry={() => void query.refetch()} />}
        {!!community.length && <ul className="grid gap-4 sm:grid-cols-2">
          {community.map((profile, index) => <li key={profile.id} className={cn('flex flex-col border border-foreground border-t-4 bg-card p-6', ROLE_TOP_TONES[index % ROLE_TOP_TONES.length])}>
            <span className={cn('self-start border border-foreground px-2 py-0.5 font-mono text-xs font-semibold tabular-nums', ROLE_BADGE_TONES[index % ROLE_BADGE_TONES.length])}>{String(index + 1).padStart(2,'0')}</span>
            <h3 className="mt-5 text-2xl font-semibold">{profile.display_name}</h3>
            <p className="mt-3 font-medium">{projectText(profile,i18n.language,'headline',profile.headline)}</p>
            <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
              {projectText(profile,i18n.language,'description',profile.description)}
            </p>
          </li>)}
        </ul>}
      </div>
    </section>

    <section aria-labelledby="community-rules" className="grid gap-8 border-t border-foreground pt-12 lg:grid-cols-[0.7fr_1.3fr]">
      <div>
        <div className="inline-flex h-12 w-12 items-center justify-center border border-foreground bg-brand-cyan text-brand-ink">
          <ShieldCheck className="h-6 w-6" aria-hidden="true" />
        </div>
        <h2 id="community-rules" className="mt-5 max-w-sm text-3xl font-semibold tracking-[-0.02em]">{t('projectCommunity.transparencyTitle')}</h2>
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

    <section aria-labelledby="community-cta" className="flex flex-col gap-7 border border-foreground bg-brand-mint p-8 text-brand-ink sm:p-12 md:flex-row md:items-end md:justify-between">
      <div>
        <h2 id="community-cta" className="max-w-xl text-3xl font-semibold tracking-[-0.02em] sm:text-4xl">{t('projectCommunity.ctaTitle')}</h2>
        <p className="mt-4 max-w-2xl leading-relaxed text-brand-ink/90">{t('projectCommunity.ctaDescription')}</p>
      </div>
      <Button size="lg" className="border-brand-ink bg-brand-ink text-ink-foreground hover:bg-brand-ink/90" asChild><Link to={user ? '/community/join' : '/login?next=%2Fcommunity%2Fjoin'}>
        {t('communityJoin.cta')}<ArrowUpRight className="h-4 w-4" />
      </Link></Button>
    </section>
  </article>;
}
