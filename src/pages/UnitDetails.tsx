import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, ArrowUpRight, ChevronRight } from 'lucide-react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useUnit, useUnitVideos } from '@/features/courses/queries/useCourses';
import { useUnitOutcomes } from '@/features/courses/queries/useUnitOutcomes';
import { useUnitReadings } from '@/features/courses/queries/useUnitReadings';
import { useContributePath } from '@/features/auth/useContributePath';
import { SafeHtml } from '@/components/course/SafeHtml';
import { PageState } from '@/components/layout/PageState';
import { VideoThumbnail } from '@/components/resource/VideoCard';
import { YouTubePlayer } from '@/components/resource/YouTubePlayer';
import { Skeleton } from '@/components/ui/skeleton';
import { unitPath } from '@/entities/course/course.paths';
import { formatDuration, videoInfo } from '@/entities/course/video';
import { cn } from '@/lib/utils';

export default function UnitDetails() {
  const { slug = '', unit: unitSlug = '' } = useParams();
  const { t } = useTranslation();
  const query = useUnit(slug, unitSlug);
  const contribute = useContributePath();
  const videos = useUnitVideos(query.data?.unit.learning_object_id);
  const outcomesQuery = useUnitOutcomes(query.data?.unit.learning_object_id);
  const readingsQuery = useUnitReadings(query.data?.unit.learning_object_id);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [engaged, setEngaged] = useState(false);
  const { hash } = useLocation();
  const ready = Boolean(query.data);
  useEffect(() => {
    if (!hash || !ready) return;
    // Runs after the layout's scroll reset so links to #unit-resources land on the section.
    const frame = requestAnimationFrame(() => document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView());
    return () => cancelAnimationFrame(frame);
  }, [hash, ready]);
  if (query.isPending) return <PageState loading />;
  if (query.error) return <PageState title={t('common.error')} description={query.error.message} retry={() => void query.refetch()} />;
  if (!query.data) return <PageState title={t('common.notFound')} description={t('common.notFoundDescription')} />;
  const { course, unit, outline } = query.data;
  const index = outline.findIndex(item => item.id === unit.id);
  const previous = index > 0 ? outline[index - 1] : null;
  const next = index >= 0 && index < outline.length - 1 ? outline[index + 1] : null;
  const siblings = outline.filter(item => item.id !== unit.id && item.year === unit.year && item.semester === unit.semester);
  const videoList = videos.data ?? [];
  const selected = videoList.find(video => video.id === selectedId) ?? videoList[0];
  const selectedInfo = selected ? videoInfo(selected.metadata, selected.source_url) : null;
  const facts = [
    ['code', unit.code],
    ['ects', unit.ects != null ? `${unit.ects} ECTS` : null],
    ['yearLabel', unit.year != null ? String(unit.year) : null],
    ['semesterLabel', unit.semester != null ? String(unit.semester) : null],
    ['language', unit.language?.toUpperCase()],
    ['institution', course.institution],
  ].filter((fact): fact is [string, string] => Boolean(fact[1]));
  return <article>
    <nav aria-label={t('unit.breadcrumb')} className="mb-8 text-sm">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-muted-foreground">
        <li><Link className="underline underline-offset-4 hover:text-foreground" to="/units">{t('nav.units')}</Link></li>
        <li aria-hidden="true"><ChevronRight className="h-3.5 w-3.5" /></li>
        <li><Link className="underline underline-offset-4 hover:text-foreground" to={`/courses/${course.slug}`}>{course.code || course.title}</Link></li>
        <li aria-hidden="true"><ChevronRight className="h-3.5 w-3.5" /></li>
        <li aria-current="page" className="text-foreground">{unit.code || unit.title}</li>
      </ol>
    </nav>
    <header className="border-b border-foreground pb-10">
      <h1 className="max-w-4xl text-4xl font-semibold leading-[1.05] tracking-[-0.03em] [text-wrap:balance] sm:text-6xl">{unit.title}</h1>
      <p className="mt-5 text-lg">
        <Link to={`/courses/${course.slug}`} className="font-semibold underline decoration-2 underline-offset-4">{course.title}</Link>
      </p>
      {unit.summary && <p className="mt-4 max-w-prose text-lg leading-relaxed text-muted-foreground">{unit.summary}</p>}
    </header>
    <div className="grid gap-12 py-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="min-w-0 space-y-12">
        {unit.description_html && <SafeHtml html={unit.description_html} />}
        <section aria-labelledby="unit-outcomes" className="border-t border-input pt-9">
          <h2 id="unit-outcomes" className="text-2xl font-semibold tracking-[-0.02em]">{t('unitOutcomes.title')}</h2>
          <p className="mt-3 max-w-prose text-sm text-muted-foreground">{t('unitOutcomes.notice')}</p>
          {outcomesQuery.isPending
            ? <p role="status" className="mt-5 text-sm text-muted-foreground">{t('common.loading')}</p>
            : outcomesQuery.error
              ? <p role="alert" className="mt-5 text-sm text-destructive">{outcomesQuery.error.message}</p>
              : !!outcomesQuery.data?.length
                ? <ol className="mt-5 space-y-3">
                  {outcomesQuery.data.map((outcome, i) => <li key={outcome.id}
                    className="flex items-start gap-4 border-b border-input pb-3 text-sm leading-relaxed">
                    <span className="shrink-0 font-mono text-xs text-muted-foreground">{String(i + 1).padStart(2, '0')}</span>
                    <span>{outcome.statement}</span>
                  </li>)}
                </ol>
                : <p className="mt-5 text-sm text-muted-foreground">{t('unitOutcomes.empty')}</p>}
        </section>
        <section aria-labelledby="unit-readings" className="border-t border-input pt-9">
          <h2 id="unit-readings" className="text-2xl font-semibold tracking-[-0.02em]">{t('unitReadings.title')}</h2>
          <p className="mt-3 max-w-prose text-sm text-muted-foreground">{t('unitReadings.notice')}</p>
          {readingsQuery.isPending
            ? <p role="status" className="mt-5 text-sm text-muted-foreground">{t('common.loading')}</p>
            : readingsQuery.error
              ? <div role="alert" className="mt-5 text-sm text-destructive">
                  <p>{readingsQuery.error.message}</p>
                  <button type="button" onClick={() => void readingsQuery.refetch()} className="mt-2 underline underline-offset-4">{t('common.retry')}</button>
                </div>
              : !!readingsQuery.data?.length && <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                  {readingsQuery.data.map(reading => <li key={reading.id} className="min-w-0">
                    <Link to={`/resources/${encodeURIComponent(reading.slug)}`}
                      className="group flex h-full flex-col gap-2 border border-input p-5 transition-colors hover:border-foreground">
                      <span className="font-semibold group-hover:underline group-hover:underline-offset-4">{reading.title}</span>
                      {reading.description && <span className="line-clamp-3 text-sm text-muted-foreground">{reading.description}</span>}
                      <span className="mt-auto inline-flex items-center gap-1 pt-2 text-xs font-semibold text-foreground">{t('unitReadings.openSource')}<ArrowUpRight className="h-3.5 w-3.5" /></span>
                    </Link>
                  </li>)}
                </ul>}
        </section>
        <section aria-labelledby="unit-resources">
          <h2 id="unit-resources" className="scroll-mt-28 text-2xl font-semibold tracking-[-0.02em]">{t('unit.resources')}</h2>
          {videos.isLoading ? <ul className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{[0, 1, 2].map(key => <li key={key}><Skeleton className="aspect-video w-full" /></li>)}</ul>
            : videos.error ? <div role="alert" className="mt-4 border border-input p-5 text-sm">
              <p>{videos.error.message}</p>
              <button type="button" className="mt-3 font-semibold underline underline-offset-4" onClick={() => void videos.refetch()}>{t('common.retry')}</button>
            </div>
            : selected && selectedInfo ? <>
              <p className="mt-2 text-sm text-muted-foreground">{t('unit.videoCount', { count: videoList.length })}</p>
              <p className="mt-1 max-w-prose text-sm text-muted-foreground">{t('unitVideos.note')}</p>
              <div className="mt-6 grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
                <div className="min-w-0">
                  <div className="border border-foreground">
                    {selectedInfo.youtubeId
                      ? <YouTubePlayer key={selected.id} videoId={selectedInfo.youtubeId} title={selected.title} thumbnail={selectedInfo.thumbnail} autoPlay={engaged} onPlay={() => setEngaged(true)} />
                      : <VideoThumbnail info={selectedInfo} />}
                  </div>
                  <h3 className="mt-4 text-lg font-semibold leading-snug"><Link to={`/resources/${selected.slug}`} className="decoration-2 underline-offset-4 hover:underline">{selected.title}</Link></h3>
                  <p className="mt-1 flex flex-wrap gap-x-3 text-sm text-muted-foreground">
                    {selectedInfo.channel && <span>{selectedInfo.channel}</span>}
                    {selectedInfo.durationSeconds && <span className="font-mono tabular-nums">{formatDuration(selectedInfo.durationSeconds)}</span>}
                  </p>
                  <p className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold">
                    <Link to={`/resources/${selected.slug}`} className="inline-flex items-center gap-2 underline underline-offset-4">{t('unit.openVideoPage')}<ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
                    {selected.source_url && <a href={selected.source_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 underline underline-offset-4">{t('unitVideos.openSource')}<ArrowUpRight className="h-4 w-4" aria-hidden="true" /></a>}
                  </p>
                </div>
                <ol aria-label={t('unitVideos.playlist')} className="max-h-[32rem] divide-y divide-input overflow-y-auto border-y border-input">
                  {videoList.map((video, position) => {
                    const info = videoInfo(video.metadata, video.source_url);
                    const active = video.id === selected.id;
                    return <li key={video.id}>
                      <button type="button" aria-pressed={active} onClick={() => setSelectedId(video.id)}
                        className={cn('flex w-full gap-3 px-3 py-3 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring', active ? 'bg-primary text-primary-foreground' : 'hover:bg-muted')}>
                        <span className="w-6 shrink-0 pt-0.5 font-mono text-xs tabular-nums">{String(position + 1).padStart(2, '0')}</span>
                        <span className="w-24 shrink-0"><VideoThumbnail info={info} /></span>
                        <span className="min-w-0 flex-1">
                          <span className="line-clamp-2 font-medium leading-snug">{video.title}</span>
                          {info.channel && <span className={cn('mt-1 block truncate text-xs', active ? 'text-primary-foreground' : 'text-muted-foreground')}>{info.channel}</span>}
                        </span>
                      </button>
                    </li>;
                  })}
                </ol>
              </div>
            </>
            : <div className="mt-4 border border-input bg-muted/40 p-6">
              <p className="font-semibold">{t('unitVideos.empty')}</p>
              <p className="mt-2 max-w-prose text-sm text-muted-foreground">{t('unit.noResourcesText')}</p>
              <Link to={contribute} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold underline underline-offset-4">{t('units.contribute')}<ArrowRight className="h-4 w-4" /></Link>
            </div>}
        </section>
        {!!siblings.length && <section aria-labelledby="unit-siblings">
          <h2 id="unit-siblings" className="text-2xl font-semibold tracking-[-0.02em]">{t('unit.sameTerm', { year: unit.year, semester: unit.semester })}</h2>
          <ul className="mt-4 divide-y divide-input border-y border-input">
            {siblings.map(item => <li key={item.id}>
              <Link to={unitPath(course.slug, item.slug)} className="flex items-baseline justify-between gap-4 py-4 hover:underline hover:underline-offset-4">
                <span className="font-medium">{item.title}</span>
                {item.ects != null && <span className="shrink-0 font-mono text-sm tabular-nums text-muted-foreground">{item.ects} ECTS</span>}
              </Link>
            </li>)}
          </ul>
        </section>}
      </div>
      <aside aria-labelledby="unit-facts" className="self-start border border-input lg:sticky lg:top-28">
        <h2 id="unit-facts" className="border-b border-input bg-muted px-5 py-3 text-sm font-semibold">{t('unit.facts')}</h2>
        <dl className="divide-y divide-input">{facts.map(([key, value]) => <div key={key} className="flex justify-between gap-4 px-5 py-3 text-sm">
          <dt className="text-muted-foreground">{t(`course.${key}`)}</dt><dd className="text-right font-mono tabular-nums">{value}</dd>
        </div>)}</dl>
        <Link to={`/units?course=${encodeURIComponent(course.slug)}`} className="flex items-center justify-between gap-2 border-t border-input px-5 py-3 text-sm font-semibold hover:bg-primary hover:text-primary-foreground">{t('unit.allInCourse')}<ArrowRight className="h-4 w-4" /></Link>
      </aside>
    </div>
    {(previous || next) && <nav aria-label={t('unit.sequence')} className="grid gap-4 border-t border-foreground pt-8 sm:grid-cols-2">
      {previous ? <Link to={unitPath(course.slug, previous.slug)} className="group flex flex-col gap-1 border border-input p-5 transition-colors hover:border-foreground">
        <span className="inline-flex items-center gap-2 text-sm text-muted-foreground"><ArrowLeft className="h-4 w-4" />{t('unit.previous')}</span>
        <span className="font-semibold group-hover:underline group-hover:underline-offset-4">{previous.title}</span>
      </Link> : <span />}
      {next && <Link to={unitPath(course.slug, next.slug)} className="group flex flex-col gap-1 border border-input p-5 text-right transition-colors hover:border-foreground">
        <span className="inline-flex items-center justify-end gap-2 text-sm text-muted-foreground">{t('unit.next')}<ArrowRight className="h-4 w-4" /></span>
        <span className="font-semibold group-hover:underline group-hover:underline-offset-4">{next.title}</span>
      </Link>}
    </nav>}
  </article>;
}
