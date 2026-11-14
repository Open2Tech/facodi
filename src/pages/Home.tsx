import { useState, type FormEvent } from 'react';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { useCatalogCounts, useCourses, useTopics } from '@/features/courses/queries/useCourses';
import { CourseList } from '@/components/course/CourseList';
import { PageState } from '@/components/layout/PageState';
import { useContributePath } from '@/features/auth/useContributePath';

const STEPS = ['ask', 'explore', 'connect', 'contribute'] as const;

export default function Home() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const courses = useCourses({ page: 1, search: '', language: '' });
  const counts = useCatalogCounts();
  const topics = useTopics();
  const contribute = useContributePath();
  function submit(event: FormEvent) {
    event.preventDefault();
    const term = search.trim();
    navigate(term ? `/units?search=${encodeURIComponent(term)}` : '/units');
  }
  const paths = [
    { to: '/courses', key: 'courses', count: counts.data?.courses },
    { to: '/units', key: 'units', count: counts.data?.units },
    { to: '/resources', key: 'resources', count: counts.data?.resources },
  ] as const;
  return <>
    <section className="grid gap-10 pb-14 pt-4 lg:grid-cols-[1.35fr_1fr] lg:gap-14 lg:pb-20">
      <div className="flex flex-col">
        <h1 className="max-w-3xl text-[2.6rem] font-semibold leading-[1.04] tracking-[-0.04em] sm:text-6xl lg:text-7xl">{t('home.title')}</h1>
        <p className="mt-7 max-w-xl text-lg leading-relaxed text-muted-foreground">{t('home.description')}</p>
        <div className="mt-9 flex flex-wrap gap-3">
          <Button size="lg" asChild><Link to="/courses">{t('home.explore')}<ArrowUpRight /></Link></Button>
          <Button size="lg" variant="outline" asChild><Link to="/about">{t('home.howItWorks')}</Link></Button>
        </div>
        <p className="mt-auto pt-10 text-sm text-muted-foreground">{t('home.open')}</p>
      </div>
      <div className="flex flex-col border border-foreground bg-primary text-primary-foreground">
        <p className="flex items-center justify-between border-b border-black/25 px-6 py-4 text-sm font-semibold sm:px-8">
          <span>{t('home.notebook')}</span><span className="font-mono text-xs" aria-hidden="true">FACODI/01</span>
        </p>
        <form role="search" onSubmit={submit} className="flex flex-1 flex-col justify-center gap-5 px-6 py-10 sm:px-8 sm:py-14">
          <label htmlFor="home-search" className="max-w-sm text-3xl font-semibold leading-tight tracking-[-0.02em]">{t('home.question')}</label>
          <div className="flex border border-black bg-white focus-within:outline focus-within:outline-2 focus-within:outline-offset-4 focus-within:outline-black">
            <input id="home-search" type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder={t('home.searchPlaceholder')}
              className="h-12 min-w-0 flex-1 bg-transparent px-4 text-base text-black placeholder:text-neutral-600 focus-visible:outline-none" />
            <button type="submit" className="grid w-12 shrink-0 place-items-center bg-black text-primary transition-colors hover:bg-neutral-800 focus-visible:outline-none" aria-label={t('home.searchButton')}>
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </form>
        <p className="border-t border-black/25 px-6 py-4 text-sm leading-relaxed sm:px-8">{t('home.connect')}</p>
      </div>
    </section>

    <section aria-labelledby="paths" className="border-t border-foreground pt-10">
      <h2 id="paths" className="text-3xl font-semibold tracking-[-0.02em]">{t('home.pathsTitle')}</h2>
      <ul className="mt-8 grid border-y border-input md:grid-cols-3 md:divide-x md:divide-input">
        {paths.map(({ to, key, count }) => <li key={key} className="border-b border-input last:border-b-0 md:border-b-0">
          <Link to={to} className="group flex h-full flex-col gap-3 py-7 transition-colors hover:bg-muted md:px-6">
            <span className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <span className="text-2xl font-semibold">{t(`home.paths.${key}.title`)}</span>
              <span className="whitespace-nowrap font-mono text-sm tabular-nums text-muted-foreground">{count == null ? '—' : t('home.paths.published', { count })}</span>
            </span>
            <span className="max-w-sm text-muted-foreground">{t(`home.paths.${key}.text`)}</span>
            <span className="mt-auto inline-flex items-center gap-2 pt-2 text-sm font-semibold">{t(`home.paths.${key}.cta`)}<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
          </Link>
        </li>)}
      </ul>
    </section>

    <section aria-labelledby="featured" className="py-14 sm:py-20">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
        <div><h2 id="featured" className="text-3xl font-semibold tracking-[-0.02em]">{t('home.start')}</h2><p className="mt-3 max-w-prose text-muted-foreground">{t('home.startDescription')}</p></div>
        <Link to="/courses" className="inline-flex items-center gap-2 text-sm font-semibold underline underline-offset-4">{t('catalog.all')}<ArrowUpRight className="h-4 w-4" /></Link>
      </div>
      {courses.isPending ? <PageState loading /> : courses.error ? <PageState level="h3" title={t('common.error')} description={courses.error.message} retry={() => void courses.refetch()} /> : courses.data.items.length
        ? <CourseList courses={courses.data.items.slice(0, 4)} headingLevel="h3" />
        : <PageState level="h3" title={t('catalog.empty')} description={t('catalog.emptyDescription')} />}
    </section>

    <section aria-labelledby="method" className="bg-foreground px-6 py-12 text-background sm:px-10 sm:py-16">
      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr] lg:gap-14">
        <h2 id="method" className="max-w-md text-3xl font-semibold tracking-[-0.02em] sm:text-4xl">{t('home.thread')}</h2>
        <p className="max-w-prose leading-relaxed text-background/75">{t('home.threadDescription')}</p>
      </div>
      <ol className="mt-12 grid gap-px bg-background/20 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((step, index) => <li key={step} className="flex flex-col gap-3 bg-foreground py-6 sm:p-6 lg:first:pl-0">
          <span className="font-mono text-sm text-primary">{String(index + 1).padStart(2, '0')}</span>
          <h3 className="text-xl font-semibold">{t(`home.steps.${step}.title`)}</h3>
          <p className="text-sm leading-relaxed text-background/75">{t(`home.steps.${step}.text`)}</p>
          {step === 'contribute' && <Link to={contribute} className="mt-auto inline-flex items-center gap-2 pt-2 text-sm font-semibold text-primary underline underline-offset-4">{t('home.contributeLink')}<ArrowUpRight className="h-4 w-4" /></Link>}
        </li>)}
      </ol>
    </section>

    {!!topics.data?.length && <section aria-labelledby="topics" className="pt-14 sm:pt-20">
      <h2 id="topics" className="text-3xl font-semibold tracking-[-0.02em]">{t('home.topicsTitle')}</h2>
      <p className="mt-3 max-w-prose text-muted-foreground">{t('home.topicsDescription')}</p>
      <ul className="mt-7 flex flex-wrap gap-2">
        {topics.data.map(({ tag, count }) => <li key={tag}>
          <Link to={`/resources?tag=${encodeURIComponent(tag)}`} className="inline-flex items-center gap-3 border border-input px-4 py-2 text-sm font-medium transition-colors hover:border-foreground hover:bg-primary hover:text-primary-foreground">
            {tag}<span className="font-mono text-xs text-muted-foreground">{count}</span>
          </Link>
        </li>)}
      </ul>
    </section>}

    <section aria-labelledby="community" className="grid gap-8 py-14 sm:py-20 lg:grid-cols-[1fr_1.2fr] lg:gap-14">
      <div>
        <h2 id="community" className="max-w-md text-3xl font-semibold tracking-[-0.02em]">{t('home.communityTitle')}</h2>
        <Link to="/about" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold underline underline-offset-4">{t('home.communityLink')}<ArrowUpRight className="h-4 w-4" /></Link>
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
      <Button size="lg" className="h-auto min-h-11 max-w-full shrink-0 whitespace-normal bg-black py-3 text-primary hover:bg-neutral-800" asChild><Link to={contribute}>{t('home.ctaButton')}<ArrowUpRight /></Link></Button>
    </section>
  </>;
}
