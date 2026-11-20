import { ArrowRight, ArrowUpRight, BookOpen, CircleHelp, Compass, HandHeart, Layers, Link2, PlayCircle, Shapes, type LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { PageSeo } from '@/components/layout/PageSeo';
import { homeMeta } from '@/shared/seo/seo';
import { useCatalogCounts, usePublicCourses, useFeaturedVideos, useTopics } from '@/features/courses/queries/useCourses';
import { VideoMosaic } from '@/components/resource/VideoMosaic';
import { cn } from '@/lib/utils';
import { CourseList } from '@/components/course/CourseList';
import { HomeHero } from '@/components/home/HomeHero';
import { LearningPathGuide } from '@/components/learning/LearningPathGuide';
import { PageState } from '@/components/layout/PageState';
import { ContinueLearning } from '@/components/sequence/ContinueLearning';

const STEPS: { key: 'ask' | 'explore' | 'connect' | 'contribute'; icon: LucideIcon; badgeTone: string; numTone: string }[] = [
  { key: 'ask', icon: CircleHelp, badgeTone: 'bg-primary text-brand-ink', numTone: 'text-primary' },
  { key: 'explore', icon: Compass, badgeTone: 'bg-brand-cyan text-brand-ink', numTone: 'text-brand-cyan' },
  { key: 'connect', icon: Link2, badgeTone: 'bg-brand-mint text-brand-ink', numTone: 'text-brand-mint' },
  { key: 'contribute', icon: HandHeart, badgeTone: 'bg-brand-pink text-brand-ink', numTone: 'text-brand-pink' },
];

const TOPIC_HOVER_TONES = [
  'hover:bg-primary',
  'hover:bg-brand-cyan',
  'hover:bg-brand-orange',
  'hover:bg-brand-pink',
  'hover:bg-brand-coral',
] as const;

const COMMUNITY_SWATCHES = {
  program: 'bg-brand-cyan',
  home: 'bg-brand-orange',
  model: 'bg-brand-mint',
} as const;

export default function Home() {
  const { t, i18n } = useTranslation();
  const courses = usePublicCourses();
  const counts = useCatalogCounts();
  const topics = useTopics();
  const videos = useFeaturedVideos(6);
  const paths = [
    { to: '/courses', key: 'courses', count: counts.data?.courses, icon: BookOpen, tone: 'bg-primary' },
    { to: '/units', key: 'units', count: counts.data?.units, icon: Layers, tone: 'bg-brand-orange' },
    { to: '/resources?type=video', key: 'videos', count: counts.data?.videos, icon: PlayCircle, tone: 'bg-brand-pink' },
    { to: '/resources', key: 'resources', count: counts.data?.resources, icon: Shapes, tone: 'bg-brand-cyan' },
  ] as const;
  return <>
    <PageSeo {...homeMeta({ title: `FACODI — ${t('brand.tagline')}`, description: t('brand.description') })} />
    {/* Signed-in learners with a sequence in progress get straight back to it. */}
    <ContinueLearning className="mb-10" />
    <HomeHero counts={counts.data} />

    <section aria-labelledby="paths" className="border-t border-foreground pt-10">
      <h2 id="paths" className="text-3xl font-semibold tracking-[-0.02em]">{t('home.pathsTitle')}</h2>
      <ul className="mt-8 grid gap-px border border-foreground bg-foreground sm:grid-cols-2 xl:grid-cols-4">
        {paths.map(({ to, key, count, icon: Icon, tone }) => <li key={key} className={cn(tone, 'text-brand-ink')}>
          <Link to={to} className="group flex h-full flex-col gap-3 p-6 transition-[filter] hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-ink">
            <span className="flex items-start justify-between gap-4">
              <span className="grid h-11 w-11 place-items-center border border-brand-ink bg-brand-paper text-brand-ink">
                <Icon className="h-6 w-6" strokeWidth={1.75} aria-hidden="true" />
              </span>
              <span className="border border-brand-ink/30 bg-brand-ink/10 px-2.5 py-0.5 font-mono text-2xl font-semibold tabular-nums tracking-[-0.03em]">{count == null ? '—' : count.toLocaleString(i18n.language)}</span>
            </span>
            <span className="mt-3 text-2xl font-semibold">{t(`home.paths.${key}.title`)}</span>
            <span className="max-w-sm text-sm leading-relaxed text-brand-ink/90">{t(`home.paths.${key}.text`)}</span>
            <span className="mt-auto inline-flex items-center gap-2 pt-3 text-sm font-semibold">{t(`home.paths.${key}.cta`)}<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" /></span>
          </Link>
        </li>)}
      </ul>
    </section>

    <div className="mt-14 sm:mt-20"><LearningPathGuide compact /></div>

    {!!videos.data?.length && <VideoMosaic id="featured-videos" className="mt-14 sm:mt-20" title={t('home.videosTitle')} description={t('home.videosText')} videos={videos.data}
      action={<Button size="lg" asChild><Link to="/resources?type=video">{t('home.videosCta')}<ArrowUpRight /></Link></Button>} />}

    <section aria-labelledby="featured" className="py-14 sm:py-20">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
        <div><h2 id="featured" className="text-3xl font-semibold tracking-[-0.02em]">{t('home.start')}</h2><p className="mt-3 max-w-prose text-muted-foreground">{t('home.startDescription')}</p></div>
        <Link to="/courses" className="inline-flex items-center gap-2 border border-foreground bg-primary px-4 py-2 text-sm font-semibold text-brand-ink transition-[filter] hover:brightness-95">{t('catalog.all')}<ArrowUpRight className="h-4 w-4" /></Link>
      </div>
      {courses.isPending ? <PageState loading /> : courses.error ? <PageState level="h3" title={t('common.error')} description={courses.error.message} retry={() => void courses.refetch()} /> : courses.data.length
        ? <CourseList courses={courses.data.slice(0, 4)} headingLevel="h3" />
        : <PageState level="h3" title={t('catalog.empty')} description={t('catalog.emptyDescription')} />}
    </section>

    <section aria-labelledby="method" className="border border-foreground bg-ink text-ink-foreground">
      <div aria-hidden="true" className="grid h-1.5 grid-cols-4">
        <span className="bg-primary" />
        <span className="bg-brand-cyan" />
        <span className="bg-brand-mint" />
        <span className="bg-brand-pink" />
      </div>
      <div className="px-6 py-12 sm:px-10 sm:py-16">
        <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr] lg:gap-14">
          <h2 id="method" className="max-w-md text-3xl font-semibold tracking-[-0.02em] sm:text-4xl">{t('home.thread')}</h2>
          <p className="max-w-prose leading-relaxed text-ink-foreground/80">{t('home.threadDescription')}</p>
        </div>
        <ol className="mt-12 grid gap-px bg-ink-foreground/15 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(({ key: step, icon: Icon, badgeTone, numTone }, index) => <li key={step} className="flex flex-col gap-3 bg-ink py-6 sm:p-6 lg:first:pl-0">
            <span className="flex items-center gap-3">
              <span className={cn('grid h-10 w-10 place-items-center', badgeTone)}><Icon className="h-5 w-5" aria-hidden="true" /></span>
              <span className={cn('font-mono text-sm font-semibold tabular-nums', numTone)}>{String(index + 1).padStart(2, '0')}</span>
            </span>
            <h3 className="text-xl font-semibold">{t(`home.steps.${step}.title`)}</h3>
            <p className="text-sm leading-relaxed text-ink-foreground/80">{t(`home.steps.${step}.text`)}</p>
            {step === 'contribute' && <Link to="/about#contribute" className="mt-auto inline-flex items-center gap-2 pt-2 text-sm font-semibold text-brand-pink underline underline-offset-4 hover:text-primary">{t('home.contributeLink')}<ArrowUpRight className="h-4 w-4" aria-hidden="true" /></Link>}
          </li>)}
        </ol>
      </div>
    </section>

    {!!topics.data?.length && <section aria-labelledby="topics" className="mt-14 border border-foreground bg-brand-mint px-6 py-10 text-brand-ink sm:mt-20 sm:px-10 sm:py-12">
      <h2 id="topics" className="text-3xl font-semibold tracking-[-0.02em]">{t('home.topicsTitle')}</h2>
      <p className="mt-3 max-w-prose text-brand-ink/85">{t('home.topicsDescription')}</p>
      <ul className="mt-7 flex flex-wrap gap-2.5">
        {topics.data.map(({ tag, count }, index) => <li key={tag}>
          <Link to={`/resources?tag=${encodeURIComponent(tag)}`} className={cn(
            'inline-flex items-center gap-3 border border-brand-ink bg-brand-paper px-4 py-2 text-sm font-semibold text-brand-ink transition-colors',
            TOPIC_HOVER_TONES[index % TOPIC_HOVER_TONES.length],
          )}>
            {tag}<span className="bg-brand-ink/10 px-1.5 py-0.5 font-mono text-xs tabular-nums text-brand-ink">{count}</span>
          </Link>
        </li>)}
      </ul>
    </section>}

    <section aria-labelledby="community" className="grid gap-8 py-14 sm:py-20 lg:grid-cols-[1fr_1.2fr] lg:gap-12">
      <div className="flex flex-col justify-between gap-8 border border-foreground bg-brand-coral p-6 text-brand-ink sm:p-8">
        <div>
          <h2 id="community" className="max-w-md text-3xl font-semibold tracking-[-0.02em] sm:text-4xl">{t('home.communityTitle')}</h2>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-brand-ink/90">{t('brand.footer')}</p>
        </div>
        <Link to="/community" className="inline-flex min-h-11 items-center gap-2 self-start border border-brand-ink bg-brand-ink px-5 py-2.5 text-sm font-semibold text-ink-foreground transition-opacity hover:opacity-90">
          {t('home.communityLink')}<ArrowUpRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
      <dl className="divide-y divide-input self-center border-y border-foreground">
        {(['program', 'home', 'model'] as const).map(item => <div key={item} className="grid gap-1 py-5 sm:grid-cols-[11rem_1fr] sm:gap-6">
          <dt className="flex items-center gap-2.5 text-sm font-semibold">
            <span className={cn('h-3 w-3 shrink-0 border border-foreground', COMMUNITY_SWATCHES[item])} aria-hidden="true" />
            {t(`home.community.${item}.label`)}
          </dt>
          <dd className="text-muted-foreground">{t(`home.community.${item}.value`)}</dd>
        </div>)}
      </dl>
    </section>

    <section aria-labelledby="contribute" className="flex flex-col gap-8 border border-foreground bg-primary px-6 py-10 text-brand-ink sm:px-10 md:flex-row md:items-end md:justify-between">
      <div><h2 id="contribute" className="max-w-xl text-3xl font-semibold tracking-[-0.02em] sm:text-4xl">{t('home.ctaTitle')}</h2>
        <p className="mt-4 max-w-prose leading-relaxed text-brand-ink/90">{t('home.ctaText')}</p></div>
      <div className="flex flex-wrap items-center gap-4 md:justify-end">
        <Button size="lg" className="h-auto min-h-11 max-w-full shrink-0 whitespace-normal bg-brand-ink py-3 text-primary hover:bg-brand-ink/90" asChild>
          <Link to="/suggest">{t('suggest.nav')}<ArrowUpRight aria-hidden="true" /></Link>
        </Button>
        <Link to="/playlists/submit" className="inline-flex min-h-11 items-center gap-1.5 px-2 text-sm font-semibold text-brand-ink underline underline-offset-4">
          {t('playlistSubmit.send')}<ArrowUpRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </section>
  </>;
}
