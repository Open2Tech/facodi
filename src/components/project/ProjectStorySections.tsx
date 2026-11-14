import { ArrowUpRight, Compass, Globe2, HeartHandshake, Sparkles, type LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useProjectDirectory, projectText, type ProjectProfilePublic } from '@/entities/project/project.api';
import { safeExternalUrl } from '@/shared/lib/navigation';

const relationship: Record<string, { icon: LucideIcon; tone: string }> = {
  academic_reference: { icon: Compass, tone: 'bg-brand-cyan' },
  student_led_program: { icon: Globe2, tone: 'bg-brand-mint' },
  technology_collaboration: { icon: HeartHandshake, tone: 'bg-brand-orange' },
  code_repository: { icon: Compass, tone: 'bg-brand-pink' },
  creative_influence: { icon: Sparkles, tone: 'bg-primary' },
  candidate_contributor: { icon: HeartHandshake, tone: 'bg-brand-mint' },
};
const groups = [
  { id: 'context', kinds: ['academic_reference', 'student_led_program'] },
  { id: 'collaboration', kinds: ['technology_collaboration', 'code_repository'] },
  { id: 'inspiration', kinds: ['creative_influence'] },
  { id: 'contributors', kinds: ['candidate_contributor'] },
] as const;

function ExternalSource({ url, label }: { url: string | null; label: string }) {
  const href = safeExternalUrl(url);
  if (!href) return null;
  return <a href={href} target="_blank" rel="noopener noreferrer"
    className="inline-flex items-center gap-1.5 text-sm font-semibold underline underline-offset-4 transition-colors hover:text-foreground">
    {label}<ArrowUpRight className="h-4 w-4" aria-hidden="true" />
  </a>;
}
function IdentityCard({ profile, language }: { profile: ProjectProfilePublic; language: string }) {
  const { t } = useTranslation();
  const config = relationship[profile.relationship_kind] ?? { icon: Compass, tone: 'bg-muted' };
  const Icon = config.icon;
  return <li className="flex min-w-0 flex-col border border-input bg-background p-6">
    <div className="mb-6 flex items-start justify-between gap-3">
      <span className={`grid h-12 w-12 shrink-0 place-items-center border border-foreground text-ink ${config.tone}`}>
        <Icon className="h-6 w-6" aria-hidden="true" />
      </span>
      <span className="max-w-40 text-right font-mono text-xs uppercase leading-relaxed text-muted-foreground">
        {projectText(profile, language, 'role_label', profile.role_label)}
      </span>
    </div>
    <h4 className="text-xl font-semibold">{profile.display_name}</h4>
    <p className="mt-3 text-base font-medium">{projectText(profile, language, 'headline', profile.headline)}</p>
    <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
      {projectText(profile, language, 'description', profile.description)}
    </p>
    <div className="mt-6 border-t border-input pt-4">
      <ExternalSource url={profile.public_source_url} label={t('projectStory.source')} />
    </div>
  </li>;
}

export default function ProjectStorySections() {
  const { t, i18n } = useTranslation();
  const query = useProjectDirectory();
  const profiles = query.data?.profiles ?? [];
  const founder = profiles.find(p => p.relationship_kind === 'founder');
  return <div id="project-story" className="scroll-mt-28 space-y-14 py-12 sm:space-y-20 sm:py-20">
    <section aria-labelledby="story-title" className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:gap-12">
      <div>
        <p className="mb-3 font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">{t('projectStory.eyebrow')}</p>
        <h2 id="story-title" className="max-w-xl text-4xl font-semibold leading-[1.1] tracking-[-0.04em] sm:text-5xl">
          {t('projectStory.title')}
        </h2>
      </div>
      <div className="max-w-2xl space-y-5 text-lg leading-relaxed text-muted-foreground">
        <p>{t('projectStory.origin')}</p>
        <p>{t('projectStory.mission')}</p>
        <p className="border-l-4 border-primary pl-5 font-semibold text-foreground">{t('projectStory.line')}</p>
      </div>
    </section>

    {query.isPending && <p role="status" className="text-sm text-muted-foreground">{t('common.loading')}</p>}
    {query.error && <p role="alert" className="text-sm text-destructive">{query.error.message}</p>}

    {founder && <section aria-labelledby="founder-title"
      className="grid gap-0 border border-foreground bg-brand-mint text-ink md:grid-cols-[minmax(0,13rem)_minmax(0,1fr)]">
      <div className="grid min-h-44 place-items-center border-b border-ink/25 px-8 py-12 md:border-b-0 md:border-r">
        <span aria-hidden="true" className="select-none font-mono text-8xl font-bold tracking-tighter">MS.</span>
      </div>
      <div className="p-7 sm:p-10">
        <p className="font-mono text-xs uppercase tracking-widest">{t('projectStory.founderEyebrow')}</p>
        <h3 id="founder-title" className="mt-3 text-3xl font-semibold sm:text-4xl">{founder.display_name}</h3>
        <p className="mt-2 font-semibold">{projectText(founder, i18n.language, 'role_label', founder.role_label)}</p>
        <p className="mt-5 max-w-2xl leading-relaxed">{projectText(founder, i18n.language, 'description', founder.description)}</p>
        <div className="mt-6"><ExternalSource url={founder.public_source_url} label={t('projectStory.authorSource')} /></div>
      </div>
    </section>}

    {!!query.data?.milestones.length && <section aria-labelledby="timeline-title">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">{t('projectStory.timelineEyebrow')}</p>
          <h3 id="timeline-title" className="mt-2 text-3xl font-semibold">{t('projectStory.timelineTitle')}</h3>
        </div>
        <span className="font-mono text-xs text-muted-foreground">{t('projectStory.timelineUpdated')}</span>
      </div>
      <ol className="grid gap-px border border-foreground bg-foreground md:grid-cols-3">
        {query.data.milestones.map((event, index) => <li key={event.id}
          className="flex flex-col bg-background p-6 sm:p-8">
          <div className="mb-7 flex items-center justify-between gap-3">
            <span className="font-mono text-xs uppercase text-muted-foreground">{event.date_label}</span>
            <span className="font-mono text-sm font-bold">{String(index + 1).padStart(2, '0')}</span>
          </div>
          <h4 className="text-xl font-semibold">{projectText(event, i18n.language, 'title', event.title)}</h4>
          <p className="mt-4 flex-1 leading-relaxed text-muted-foreground">{projectText(event, i18n.language, 'summary', event.summary)}</p>
          <div className="mt-6 border-t border-input pt-4">
            <ExternalSource url={event.public_source_url} label={t('projectStory.source')} />
          </div>
        </li>)}
      </ol>
    </section>}

    {!!profiles.length && <section aria-labelledby="ecosystem-title" id="ecosystem" className="scroll-mt-28">
      <div className="mb-8 max-w-3xl">
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">{t('projectStory.ecosystemEyebrow')}</p>
        <h3 id="ecosystem-title" className="mt-2 text-3xl font-semibold sm:text-4xl">{t('projectStory.ecosystemTitle')}</h3>
        <p className="mt-4 leading-relaxed text-muted-foreground">{t('projectStory.ecosystemDescription')}</p>
      </div>
      {groups.map(group => {
        const items = profiles.filter(p => (group.kinds as readonly string[]).includes(p.relationship_kind));
        if (!items.length) return null;
        return <div key={group.id} className="mb-10">
          <h4 className="mb-4 font-mono text-sm font-semibold uppercase tracking-widest">
            {t(`projectStory.groups.${group.id}`)}
          </h4>
          <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {items.map(profile => <IdentityCard key={profile.id} profile={profile} language={i18n.language} />)}
          </ul>
        </div>;
      })}
      <p className="max-w-3xl border-t border-input pt-4 text-sm text-muted-foreground">{t('projectStory.boundary')}</p>
    </section>}

    <section aria-labelledby="community-invite-title" className="flex flex-col gap-8 border border-foreground bg-brand-pink p-7 text-ink md:flex-row md:items-end md:justify-between sm:p-10">
      <div>
        <p className="font-mono text-xs font-semibold uppercase tracking-widest">{t('projectStory.communityEyebrow')}</p>
        <h3 id="community-invite-title" className="mt-3 max-w-xl text-3xl font-semibold sm:text-4xl">
          {t('projectStory.communityTitle')}
        </h3>
        <p className="mt-4 max-w-xl leading-relaxed">{t('projectStory.communityDescription')}</p>
      </div>
      <Link to="/community" className="inline-flex shrink-0 items-center justify-center gap-2 border border-ink bg-ink px-5 py-3 font-semibold text-ink-foreground transition-colors hover:bg-ink/90">
        {t('projectStory.communityCta')}<ArrowUpRight className="h-5 w-5" />
      </Link>
    </section>
  </div>;
}
