import { useState, type FormEvent } from 'react';
import { ArrowRight, ArrowUpRight, BookOpen, CircleHelp, Compass, HandHeart, Layers, Link2, PlayCircle, Shapes, type LucideIcon } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Trans, useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { useCatalogCounts, useCourses, useFeaturedVideos, useTopics } from '@/features/courses/queries/useCourses';
import { VideoMosaic } from '@/components/resource/VideoMosaic';
import { cn } from '@/lib/utils';
import { CourseList } from '@/components/course/CourseList';
import { LearningPathGuide } from '@/components/learning/LearningPathGuide';
import { PageState } from '@/components/layout/PageState';
import { useContributePath } from '@/features/auth/useContributePath';

const STEPS: { key: 'ask' | 'explore' | 'connect' | 'contribute'; icon: LucideIcon }[] = [
  { key: 'ask', icon: CircleHelp }, { key: 'explore', icon: Compass }, { key: 'connect', icon: Link2 }, { key: 'contribute', icon: HandHeart },
];

export default function Home() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const courses = useCourses({ page: 1, search: '', language: '' });
  const counts = useCatalogCounts();
  const topics = useTopics();
  const videos = useFeaturedVideos(6);
  const contribute = useContributePath();
  function submit(event: FormEvent) {
    event.preventDefault();
    const term = search.trim();
    navigate(term ? `/units?search=${encodeURIComponent(term)}` : '/units');
  }
  const paths = [
    { to: '/courses', key: 'courses', count: counts.data?.courses, icon: BookOpen, tone: 'bg-primary' },
    { to: '/units', key: 'units', count: counts.data?.units, icon: Layers, tone: 'bg-brand-orange' },
    { to: '/resources?type=video', key: 'videos', count: counts.data?.videos, icon: PlayCircle, tone: 'bg-brand-pink' },
    { to: '/resources', key: 'resources', count: counts.data?.resources, icon: Shapes, tone: 'bg-brand-cyan' },
  ] as const;
  return <>
    <section className="grid gap-10 pb-14 pt-4 lg:grid-cols-[1.35fr_1fr] lg:gap-14 lg:pb-20">
      <div className="flex flex-col">
        <h1 className="max-w-3xl text-balance text-[2.6rem] font-semibold leading-[1.12] tracking-[-0.04em] sm:text-6xl lg:text-7xl">
          <Trans i18nKey="home.title" components={{ mark: <mark className="box-decoration-clone bg-primary px-1 text-primary-foreground" /> }} />
        </h1>
        <p className="mt-7 max-w-xl text-lg leading-relaxed text-muted-foreground">{t('home.description')}</p>
        <div className="mt-9 flex flex-wrap gap-3">
          <Button size="lg" asChild><Link to="/courses">{t('home.explore')}<ArrowUpRight /></Link></Button>
          <Button size="lg" variant="outline" asChild><Link to="/how-it-works">{t('home.howItWorks')}</Link></Button>
        </div>
        <p className="mt-auto pt-10 text-sm text-muted-foreground">{t('home.open')}</p>
      </div>
      <div className="flex flex-col border border-foreground bg-primary text-primary-foreground">
        <p className="flex items-center justify-between border-b border-ink/25 px-6 py-4 text-sm font-semibold sm:px-8">
          <span>{t('home.notebook')}</span><span className="font-mono text-xs" aria-hidden="true">FACODI/01</span>
        </p>
        <form role="search" onSubmit={submit} className="flex flex-1 flex-col justify-center gap-5 px-6 py-10 sm:px-8 sm:py-14">
          <label htmlFor="home-search" className="max-w-sm text-3xl font-semibold leading-tight tracking-[-0.02em]">{t('home.question')}</label>
          <div className="flex border border-ink bg-brand-paper focus-within:outline focus-within:outline-2 focus-within:outline-offset-4 focus-within:outline-ink">
            <input id="home-search" type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder={t('home.searchPlaceholder')}
              className="h-12 min-w-0 flex-1 bg-transparent px-4 text-base text-ink placeholder:text-ink/65 focus-visible:outline-none" />
            <button type="submit" className="grid w-12 shrink-0 place-items-center bg-ink text-primary transition-colors hover:bg-ink/90 focus-visible:outline-none" aria-label={t('home.searchButton')}>
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </form>
        <p className="border-t border-ink/25 px-6 py-4 text-sm leading-relaxed sm:px-8">{t('home.connect')}</p>
      </div>
    </section>

    <section aria-labelledby="paths" className="border-t border-foreground pt-10">
      <h2 id="paths" className="text-3xl font-semibold tracking-[-0.02em]">{t('home.pathsTitle')}</h2>
      <ul className="mt-8 grid gap-px border border-foreground bg-foreground sm:grid-cols-2 xl:grid-cols-4">
        {paths.map(({ to, key, count, icon: Icon, tone }) => <li key={key} className={cn(tone, 'text-ink')}>
          <Link to={to} className="group flex h-full flex-col gap-3 p-6 transition-[filter] hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ink">
            <span className="flex items-start justify-between gap-4">
              <Icon className="h-7 w-7" strokeWidth={1.75} aria-hidden="true" />
              <span className="font-mono text-3xl font-semibold tabular-nums tracking-[-0.03em]">{count == null ? '—' : count.toLocaleString(i18n.language)}</span>
            </span>
            <span className="mt-4 text-2xl font-semibold">{t(`home.paths.${key}.title`)}</span>
            <span className="max-w-sm text-sm leading-relaxed">{t(`home.paths.${key}.text`)}</span>
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
        <Link to="/courses" className="inline-flex items-center gap-2 text-sm font-semibold underline underline-offset-4">{t('catalog.all')}<ArrowUpRight className="h-4 w-4" /></Link>
      </div>
      {courses.isPending ? <PageState loading /> : courses.error ? <PageState level="h3" title={t('common.error')} description={courses.error.message} retry={() => void courses.refetch()} /> : courses.data.items.length
        ? <CourseList courses={courses.data.items.slice(0, 4)} headingLevel="h3" />
        : <PageState level="h3" title={t('catalog.empty')} description={t('catalog.emptyDescription')} />}
    </section>

    <section aria-labelledby="method" className="bg-ink px-6 py-12 text-ink-foreground sm:px-10 sm:py-16">
      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr] lg:gap-14">
        <h2 id="method" className="max-w-md text-3xl font-semibold tracking-[-0.02em] sm:text-4xl">{t('home.thread')}</h2>
        <p className="max-w-prose leading-relaxed text-ink-foreground/75">{t('home.threadDescription')}</p>
      </div>
      <ol className="mt-12 grid gap-px bg-ink-foreground/15 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map(({ key: step, icon: Icon }, index) => <li key={step} className="flex flex-col gap-3 bg-ink py-6 sm:p-6 lg:first:pl-0">
          <span className="flex items-center gap-3 text-primary">
            <span className="grid h-10 w-10 place-items-center border border-primary"><Icon className="h-5 w-5" aria-hidden="true" /></span>
            <span className="font-mono text-sm tabular-nums">{String(index + 1).padStart(2, '0')}</span>
          </span>
          <h3 className="text-xl font-semibold">{t(`home.steps.${step}.title`)}</h3>
          <p className="text-sm leading-relaxed text-ink-foreground/75">{t(`home.steps.${step}.text`)}</p>
          {step === 'contribute' && <Link to={contribute} className="mt-auto inline-flex items-center gap-2 pt-2 text-sm font-semibold text-primary underline underline-offset-4">{t('home.contributeLink')}<ArrowUpRight className="h-4 w-4" /></Link>}
        </li>)}
      </ol>
    </section>

    {!!topics.data?.length && <section aria-labelledby="topics" className="pt-14 sm:pt-20">
      <h2 id="topics" className="text-3xl font-semibold tracking-[-0.02em]">{t('home.topicsTitle')}</h2>
      <p className="mt-3 max-w-prose text-muted-foreground">{t('home.topicsDescription')}</p>
      <ul className="mt-7 flex flex-wrap gap-2">
        {topics.data.map(({ tag, count }) => <li key={tag}>
          <Link to={`/resources?tag=${encodeURIComponent(tag)}`} className="inline-flex items-center gap-3 border border-input px-4 py-2 text-sm font-medium transition-colors hover:border-foreground hover:bg-brand-cyan hover:text-ink">
            {tag}<span className="font-mono text-xs text-muted-foreground">{count}</span>
          </Link>
        </li>)}
      </ul>
    </section>}

    <section aria-labelledby="community" className="grid gap-8 py-14 sm:py-20 lg:grid-cols-[1fr_1.2fr] lg:gap-14">
      <div>
        <h2 id="community" className="max-w-md text-3xl font-semibold tracking-[-0.02em]">{t('home.communityTitle')}</h2>
        <Link to="/community" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold underline underline-offset-4">{t('home.communityLink')}<ArrowUpRight className="h-4 w-4" /></Link>
      </div>
      <dl className="divide-y divide-input border-y border-input">
        {(['program', 'home', 'model'] as const).map(item => <div key={item} className="grid gap-1 py-5 sm:grid-cols-[10rem_1fr] sm:gap-6">
          <dt className="text-sm font-semibold">{t(`home.community.${item}.label`)}</dt>
          <dd className="text-muted-foreground">{t(`home.community.${item}.value`)}</dd>
        </div>)}
      </dl>
    </section>

    <section aria-labelledby="contribute" className="flex flex-col gap-8 border border-foreground bg-primary px-6 py-10 text-primary-foreground sm:px-10 md:flex-row md:items-end md:justify-between">
      <div><h2 id="contribute" className="max-w-xl text-3xl font-semibold tracking-[-0.02em] sm:text-4xl">{t('home.ctaTitle')}</h2>
        <p className="mt-4 max-w-prose leading-relaxed">{t('home.ctaText')}</p></div>
      <Button size="lg" className="h-auto min-h-11 max-w-full shrink-0 whitespace-normal bg-ink py-3 text-primary hover:bg-ink/90" asChild><Link to={contribute}>{t('home.ctaButton')}<ArrowUpRight /></Link></Button>
    </section>
  </>;
}
