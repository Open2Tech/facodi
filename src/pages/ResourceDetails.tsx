import CourseReader from '@/components/reader/CourseReader';
import { readerAlias, readerEditions } from '@/entities/course/lessonReader';
import type { LearningObject } from '@/entities/course/course.types';
import { useCallback, useRef, useState } from 'react';
import { Link, Navigate, useLocation, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageSeo, NoIndex } from '@/components/layout/PageSeo';
import { resourceMeta } from '@/shared/seo/seo';
import { toast } from 'sonner';
import { ArrowLeft, ArrowRight, ArrowUpRight, ChevronRight, Clock, MessageSquarePlus, NotebookPen } from 'lucide-react';
import { useChannelVideos, useResource, useResourceContext } from '@/features/courses/queries/useCourses';
import { useLinkedCatalogAssets, useModuleProgression } from '@/features/courses/queries/useLinkedCatalogAssets';
import { useContributePath } from '@/features/auth/useContributePath';
import { unitPath } from '@/entities/course/course.paths';
import { formatDuration, isoDuration, videoInfo, youtubePlaylistIdFromUrl } from '@/entities/course/video';
import { TypeBadge } from '@/components/catalog/TypeBadge';
import { SafeHtml } from '@/components/course/SafeHtml';
import { PageState } from '@/components/layout/PageState';
import { LearningContext } from '@/components/learning/LearningPathGuide';
import { ShareButton } from '@/components/share/ShareButton';
import { VideoCard } from '@/components/resource/VideoCard';
import { CreatorLearningPanel } from '@/components/resource/CreatorLearningPanel';
import { VideoSequences } from '@/components/sequence/VideoSequences';
import { YouTubePlayer, type YouTubePlayerHandle } from '@/components/resource/YouTubePlayer';
import { YouTubePlaylistPlayer } from '@/components/resource/YouTubePlaylistPlayer';
import { NoteTimeline } from '@/components/notes/NoteTimeline';
import { StudyNotebook } from '@/components/notes/StudyNotebook';
import { formatTimestamp, parseStartParam } from '@/entities/notes/notes';
import { useResourceNotes } from '@/features/notes/useNotebook';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { catalogReturnPath, safeExternalUrl, safeReturnPath } from '@/shared/lib/navigation';
import { plainText, stringList } from '@/shared/lib/text';
import { cn } from '@/lib/utils';
import { ResourceFeedback } from '@/components/resource/ResourceFeedback';
import { studyTopics } from '@/shared/lib/topicTags';
import { useContextSearchParams } from '@/shared/hooks/useContextSearchParams';

const SEQUENCE_WINDOW = 5;
const MIRRORS = ['course', 'curricular_unit'];

/** Breadcrumb links keep at least a 24px target (WCAG 2.2 target size). */
const CRUMB = 'inline-flex min-h-6 items-center underline underline-offset-4 hover:text-foreground';

export default function ResourceDetails() {
  const { slug = '' } = useParams();
  const { t } = useTranslation();
  const query = useResource(slug);
  if (query.isPending) return <PageState loading />;
  if (query.error) return <PageState title={t('common.error')} description={query.error.message} retry={() => void query.refetch()} />;
  const resource = query.data;
  if (!resource) return <><NoIndex /><PageState title={t('common.notFound')} description={t('common.notFoundDescription')} /></>;
  const editions = resource.object_type === 'collection' && readerEditions(resource.metadata);
  if (editions) return <CourseReader course={resource} editions={editions} />;
  const alias = ['document','module'].includes(resource.object_type) && readerAlias(resource.metadata);
  if (alias) return <Navigate replace to={alias} />;
  return <ResourceContent resource={resource} slug={slug} />;
}

function ResourceContent({ resource, slug }: { resource: LearningObject; slug: string }) {
  const { t } = useTranslation();
  const location = useLocation();
  const origin = location.state && typeof location.state === 'object' && typeof location.state.sequenceReturn === 'string'
    ? safeReturnPath(location.state.sequenceReturn) : null;
  const sequenceReturn = origin?.startsWith('/sequences/') ? origin : null;
  const context = useResourceContext(resource);
  const playlistLessons = useLinkedCatalogAssets(resource?.object_type === 'playlist' && resource?.source_type === 'youtube' ? resource.id : undefined, 'video');
  const collectionVideos = useLinkedCatalogAssets(resource?.object_type === 'collection' ? resource.id : undefined, 'video');
  const collectionPlaylists = useLinkedCatalogAssets(resource?.object_type === 'collection' ? resource.id : undefined, 'playlist');
  const collectionModules = useLinkedCatalogAssets(resource?.object_type === 'collection' ? resource.id : undefined, 'module');
  const moduleId = resource?.object_type === 'module' ? resource.id : undefined;
  const moduleSequences = useLinkedCatalogAssets(moduleId, 'playlist');
  const moduleDocuments = useLinkedCatalogAssets(moduleId, 'document');
  const moduleReferences = useLinkedCatalogAssets(moduleId, 'external_resource');
  const moduleProgression = useModuleProgression(moduleId);
  const isVideo = resource?.object_type === 'video';
  const info = resource ? videoInfo(resource.metadata, resource.source_url) : null;
  const channelVideos = useChannelVideos(isVideo ? info?.channel ?? null : null, resource?.id ?? '');
  const contribute = useContributePath();
  const [searchParams, setSearchParams] = useContextSearchParams();
  const playerRef = useRef<YouTubePlayerHandle>(null);
  const playerSection = useRef<HTMLElement>(null);
  const [engaged, setEngaged] = useState(false);
  const [clock, setClock] = useState<{ id: string; time: number } | null>(null);
  const resourceId = resource?.id ?? '';
  const { notes } = useResourceNotes(resourceId);
  const onTime = useCallback((seconds: number) => {
    const time = Math.floor(seconds);
    setClock(previous => previous?.id === resourceId && previous.time === time ? previous : { id: resourceId, time });
  }, [resourceId]);

  if (!info) return <><NoIndex /><PageState title={t('common.notFound')} description={t('common.notFoundDescription')} /></>;
  // A previous study sequence may remain public as a historical URL alias.
  // Redirect only verified canonical slugs; keep the user's query parameters.
  const aliasMetadata = resource?.object_type === 'playlist' && resource.metadata
    && typeof resource.metadata === 'object' && !Array.isArray(resource.metadata)
    ? resource.metadata as Record<string, unknown> : null;
  const canonicalSlug = typeof aliasMetadata?.canonical_playlist_slug === 'string'
    ? aliasMetadata.canonical_playlist_slug : null;
  if (canonicalSlug && canonicalSlug !== slug) {
    return <Navigate to={`/sequences/${encodeURIComponent(canonicalSlug)}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`} replace />;
  }

  if (context.data?.redirect) return <Navigate to={context.data.redirect} replace />;
  // Course and unit mirror objects have their own pages; avoid flashing this layout while resolving them.
  if (MIRRORS.includes(resource.object_type) && context.isPending) return <PageState loading />;

  const source = safeExternalUrl(resource.source_url);
  const objectives = stringList(resource.objectives);
  const typeLabel = t(`objectTypes.${resource.object_type}`, { defaultValue: resource.object_type });
  const units = context.data?.units ?? [];
  const primary = units[0];
  const sequence = context.data?.sequence ?? [];
  const position = sequence.findIndex(item => item.id === resource.id);
  const previous = position > 0 ? sequence[position - 1] : null;
  const next = position >= 0 && position < sequence.length - 1 ? sequence[position + 1] : null;
  const windowStart = Math.max(0, Math.min(position - 2, sequence.length - SEQUENCE_WINDOW));
  const visibleSequence = sequence.slice(windowStart, windowStart + SEQUENCE_WINDOW);
  const player = isVideo && info.youtubeId;
  const playlistId = resource.object_type === 'playlist' && resource.source_type === 'youtube'
    ? youtubePlaylistIdFromUrl(resource.source_url) : null;
  const hasPlayer = Boolean(player || playlistId);
  const unitHref = primary ? unitPath(primary.courses.slug, primary.slug) : null;
  const playerTime = player && clock?.id === resource.id ? clock.time : null;
  const notesOpen = searchParams.get('notes') === 'open';

  // The drawer state lives in the URL so dashboard links can open it, without adding history entries.
  function setNotesOpen(open: boolean) {
    setSearchParams(next => {
      if (open) next.set('notes', 'open');
      else next.delete('notes');
      return next;
    });
  }

  function seek(seconds: number) {
    playerRef.current?.seekTo(seconds);
    // On phones the drawer covers the player; close it so the learner sees the jump.
    if (!window.matchMedia('(min-width: 640px)').matches) setNotesOpen(false);
    playerSection.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  const facts = [
    ['channel', info.channel],
    ['duration', info.durationSeconds ? formatDuration(info.durationSeconds) : null],
    ['language', resource.language?.toUpperCase()],
    ['type', typeLabel],
  ].filter((fact): fact is [string, string] => Boolean(fact[1]));

  // On small screens a video page shows the player right after the title; the actions follow the player.
  const renderActions = (className?: string) => <div className={cn('flex flex-col gap-3', className)}>
    {source ? <Button size="lg" asChild><a href={source} target="_blank" rel="noopener noreferrer">{t(isVideo ? 'video.watchOnYoutube' : 'catalog.source')}<ArrowUpRight /></a></Button>
      : resource.source_url && <p role="alert" className="text-destructive">{t('validation.url')}</p>}
    <Button variant="outline" onClick={() => setNotesOpen(true)} aria-haspopup="dialog" aria-expanded={notesOpen}>
      <NotebookPen />{t('notes.open')}
      {notes.length > 0 && <span className="ml-auto border border-foreground bg-primary px-1.5 font-mono text-xs tabular-nums text-primary-foreground">{notes.length}</span>}
    </Button>
    <ShareButton title={resource.title} />
    <Link to={contribute} className="inline-flex min-h-11 items-center gap-2 text-sm underline underline-offset-4 hover:text-foreground"><MessageSquarePlus className="h-4 w-4" aria-hidden="true" />{t('video.suggest')}</Link>
  </div>;

  return <article>
    <PageSeo {...resourceMeta(resource, info, { resources: t('nav.resources'), type: typeLabel })} />
    {sequenceReturn && <Link to={sequenceReturn} state={{ catalogReturn: catalogReturnPath(location.state, '/sequences') }}
      className="mb-5 inline-flex items-center gap-2 text-sm font-semibold underline underline-offset-4">
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />{t('sequences.backToSequence')}
    </Link>}
    <nav aria-label={t('unit.breadcrumb')} className="mb-8 text-sm">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-muted-foreground">
        <li><Link className={CRUMB} to={catalogReturnPath(location.state, '/resources')}>{t('nav.resources')}</Link></li>
        <li aria-hidden="true"><ChevronRight className="h-3.5 w-3.5" /></li>
        <li><Link className={CRUMB} to={`/resources?type=${encodeURIComponent(resource.object_type)}`}>{typeLabel}</Link></li>
        {primary && unitHref && <>
          <li aria-hidden="true"><ChevronRight className="h-3.5 w-3.5" /></li>
          <li><Link className={CRUMB} to={unitHref}>{primary.title || primary.code}</Link></li>
        </>}
      </ol>
    </nav>

    <header className="grid gap-8 border-b border-foreground border-t-4 border-t-brand-cyan pb-8 pt-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-end">
      <div className="min-w-0">
        <ul className="mb-5 flex flex-wrap gap-2 font-mono text-xs uppercase">
          <li><TypeBadge type={resource.object_type} label={typeLabel} className="border border-foreground" /></li>
          {info.durationSeconds && <li className="inline-flex items-center gap-1.5 border border-input px-2 py-1"><Clock className="h-3.5 w-3.5" aria-hidden="true" /><time dateTime={isoDuration(info.durationSeconds)}>{formatDuration(info.durationSeconds)}</time></li>}
          {resource.language && <li lang={resource.language} className="border border-input px-2 py-1">{resource.language}</li>}
        </ul>
        <h1 className="max-w-4xl text-3xl font-semibold leading-[1.08] tracking-[-0.03em] [text-wrap:balance] sm:text-5xl">{resource.title}</h1>
        {info.channel && <p className="mt-4 text-lg text-muted-foreground">{t('video.byChannel', { channel: info.channel })}</p>}
      </div>
      {renderActions(hasPlayer ? 'max-lg:hidden' : undefined)}
    </header>
    <LearningContext focus="resource" />

    <div className="grid gap-10 py-10 lg:grid-cols-[minmax(0,1fr)_22rem]">
      {player && <section ref={playerSection} aria-label={t('video.player')} className="min-w-0 scroll-mt-24 lg:col-start-1 lg:row-start-1">
        <div className="border border-foreground">
          <YouTubePlayer key={resource.id} ref={playerRef} videoId={info.youtubeId!} title={resource.title} thumbnail={info.thumbnail}
            autoPlay={engaged} onPlay={() => setEngaged(true)} start={parseStartParam(searchParams.get('t'))} onTime={onTime} />
          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 bg-ink px-4 py-3 font-mono text-xs text-ink-foreground/80">
            <span className="min-w-0 truncate">{info.channel ?? 'YouTube'}</span>
            <span className="flex items-center gap-4">
              <button type="button" onClick={() => setNotesOpen(true)} className="inline-flex min-h-6 items-center gap-1.5 font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                <NotebookPen className="h-3.5 w-3.5" aria-hidden="true" />{playerTime !== null ? t('notes.quickAddAt', { time: formatTimestamp(playerTime) }) : t('notes.quickAdd')}
              </button>
              {info.durationSeconds && <span className="tabular-nums">{formatDuration(info.durationSeconds)}</span>}
              {source && <a href={source} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-6 items-center gap-1 text-primary underline-offset-4 hover:underline">YouTube<ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" /></a>}
            </span>
          </div>
          {info.durationSeconds && <NoteTimeline notes={notes} duration={info.durationSeconds} playerTime={playerTime} onSeek={seek} />}
        </div>
        {renderActions('mt-6 lg:hidden')}
      </section>}

      {playlistId && <section aria-label={t('video.player')} className="min-w-0 lg:col-start-1 lg:row-start-1">
        <div className="border border-foreground">
          <YouTubePlaylistPlayer key={resource.id} playlistId={playlistId} title={resource.title} />
          <div className="flex items-center justify-between gap-4 bg-ink px-4 py-3 font-mono text-xs text-ink-foreground/80">
            <span>YouTube</span>
            {source && <a href={source} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-6 items-center gap-1 text-primary underline-offset-4 hover:underline">YouTube<ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" /></a>}
          </div>
        </div>
        {renderActions('mt-6 lg:hidden')}
      </section>}

      <aside aria-label={t('video.context')} className="space-y-6 self-start lg:col-start-2 lg:row-span-2 lg:row-start-1">
        {context.isPending ? <div className="space-y-3"><Skeleton className="h-56 w-full" /><Skeleton className="h-64 w-full" /></div>
          : context.error ? <div role="alert" className="border border-input p-5 text-sm">
            <p>{context.error.message}</p>
            <button type="button" className="mt-3 font-semibold underline underline-offset-4" onClick={() => void context.refetch()}>{t('common.retry')}</button>
          </div>
          : primary && unitHref ? <>
            <section aria-labelledby="video-unit" className="border border-foreground bg-primary p-5 text-brand-ink">
              <h2 id="video-unit" className="text-sm font-semibold">{t('video.unit')}</h2>
              {primary.code && <p className="mt-4 inline-block bg-brand-ink px-2 py-1 font-mono text-xs text-primary">{primary.code}</p>}
              <p className="mt-3 text-2xl font-semibold leading-tight tracking-[-0.02em] [text-wrap:balance]"><Link to={unitHref} className="decoration-2 underline-offset-4 hover:underline">{primary.title}</Link></p>
              <dl className="mt-5 grid grid-cols-3 gap-3 border-t border-brand-ink/25 pt-4 text-sm">
                {primary.ects != null && <div><dt className="text-xs">{t('course.ects')}</dt><dd className="font-mono tabular-nums">{primary.ects}</dd></div>}
                {primary.year != null && <div><dt className="text-xs">{t('course.yearLabel')}</dt><dd className="font-mono tabular-nums">{primary.year}</dd></div>}
                {primary.semester != null && <div><dt className="text-xs">{t('course.semesterLabel')}</dt><dd className="font-mono tabular-nums">{primary.semester}</dd></div>}
                <div className="col-span-3"><dt className="text-xs">{t('video.course')}</dt><dd><Link to={`/courses/${primary.courses.slug}`} className="font-medium underline underline-offset-4">{primary.courses.title}</Link></dd></div>
              </dl>
              <Link to={`${unitHref}#unit-resources`} className="mt-5 flex items-center justify-between gap-3 bg-brand-ink px-4 py-3 text-sm font-semibold text-ink-foreground transition-opacity hover:opacity-90">{t('video.openUnit')}<ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
            </section>

            {!!sequence.length && <section aria-labelledby="video-sequence" className="border border-foreground border-t-4 border-t-brand-pink bg-card">
              <div className="flex items-baseline justify-between gap-3 border-b border-input bg-muted px-5 py-3">
                <h2 id="video-sequence" className="text-sm font-semibold">{t('video.sequence')}</h2>
                {position >= 0 && <p className="font-mono text-xs tabular-nums text-muted-foreground">{t('video.position', { current: position + 1, total: sequence.length })}</p>}
              </div>
              {position >= 0 && <div aria-hidden="true" className="h-1 bg-muted"><div className="h-full bg-foreground" style={{ width: `${((position + 1) / sequence.length) * 100}%` }} /></div>}
              <ol className="divide-y divide-input">
                {visibleSequence.map((item, offset) => {
                  const current = item.id === resource.id;
                  const itemInfo = videoInfo(item.metadata, item.source_url);
                  const body = <>
                    <span className="w-7 shrink-0 pt-0.5 font-mono text-xs tabular-nums">{String(windowStart + offset + 1).padStart(2, '0')}</span>
                    <span className="min-w-0 flex-1">
                      <span className="line-clamp-2 text-sm font-medium leading-snug">{item.title}</span>
                      <span className={cn('mt-1 block font-mono text-xs', current ? 'text-primary-foreground' : 'text-muted-foreground')}>
                        {current ? t('video.nowViewing') : itemInfo.durationSeconds ? formatDuration(itemInfo.durationSeconds) : itemInfo.channel}
                      </span>
                    </span>
                  </>;
                  return <li key={item.id}>
                    {current
                      ? <div aria-current="true" className="flex gap-3 bg-primary px-5 py-3 text-primary-foreground">{body}</div>
                      : <Link to={`/resources/${item.slug}`} state={location.state} className="flex gap-3 px-5 py-3 transition-colors hover:bg-muted">{body}</Link>}
                  </li>;
                })}
              </ol>
              {sequence.length > SEQUENCE_WINDOW && <Link to={`${unitHref}#unit-resources`} className="flex items-center justify-between gap-2 border-t border-input px-5 py-3 text-sm font-semibold transition-colors hover:bg-primary hover:text-primary-foreground">{t('video.allInUnit', { count: sequence.length })}<ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>}
            </section>}

            {units.length > 1 && <section aria-labelledby="video-also" className="border border-input p-5">
              <h2 id="video-also" className="text-sm font-semibold">{t('video.alsoIn')}</h2>
              <ul className="mt-3 space-y-2 text-sm">{units.slice(1).map(unit => <li key={unit.id}>
                <Link to={unitPath(unit.courses.slug, unit.slug)} className="underline underline-offset-4 hover:text-foreground">{unit.title}</Link>
                <span className="ml-2 font-mono text-xs text-muted-foreground">{unit.courses.code}</span>
              </li>)}</ul>
            </section>}
          </>
          : isVideo && <section aria-labelledby="video-no-unit" className="border border-input bg-muted/40 p-5 text-sm">
            <h2 id="video-no-unit" className="font-semibold">{t('video.noUnit')}</h2>
            <p className="mt-2 text-muted-foreground">{t('video.noUnitText')}</p>
          </section>}
        {isVideo && <VideoSequences videoId={resource.id} />}
      </aside>

      <div className={cn('min-w-0 space-y-12 lg:col-start-1', player ? 'lg:row-start-2' : 'lg:row-start-1')}>
        {(previous || next) && <nav aria-label={t('video.sequence')} className="grid gap-4 sm:grid-cols-2">
          {previous ? <Link to={`/resources/${previous.slug}`} state={location.state} className="group flex flex-col gap-1 border border-input p-4 transition-colors hover:border-foreground">
            <span className="inline-flex items-center gap-2 text-sm text-muted-foreground"><ArrowLeft className="h-4 w-4" aria-hidden="true" />{t('video.previous')}</span>
            <span className="line-clamp-2 font-semibold group-hover:underline group-hover:underline-offset-4">{previous.title}</span>
          </Link> : <span className="hidden sm:block" />}
          {next && <Link to={`/resources/${next.slug}`} state={location.state} className="group flex flex-col gap-1 border border-input p-4 text-right transition-colors hover:border-foreground">
            <span className="inline-flex items-center justify-end gap-2 text-sm text-muted-foreground">{t('video.next')}<ArrowRight className="h-4 w-4" aria-hidden="true" /></span>
            <span className="line-clamp-2 font-semibold group-hover:underline group-hover:underline-offset-4">{next.title}</span>
          </Link>}
        </nav>}

        {(resource.object_type === 'playlist' || isVideo) && <CreatorLearningPanel kind={resource.object_type} slug={resource.slug} youtubeId={isVideo ? info.youtubeId : null} />}
        {playlistId && (playlistLessons.isPending || playlistLessons.isError || !!playlistLessons.data?.length) && (
          <section aria-labelledby="known-playlist-lessons" className="border-t border-foreground pt-8">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h2 id="known-playlist-lessons" className="text-2xl font-semibold tracking-[-0.02em]">{t('sequences.lessonsHeading')}</h2>
              {!!playlistLessons.data?.length && <span className="font-mono text-sm tabular-nums text-muted-foreground">{t('sequences.lessons', { count: playlistLessons.data.length })}</span>}
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{t('courseMaterials.playlistNotice')}</p>
            {playlistLessons.isPending ? <p role="status" className="mt-4 text-sm text-muted-foreground">{t('common.loading')}</p>
              : playlistLessons.isError ? <div role="alert" className="mt-4 text-sm">
                  <p>{t('common.error')}</p>
                  <button type="button" onClick={() => void playlistLessons.refetch()} className="mt-2 font-semibold underline underline-offset-4">{t('common.retry')}</button>
                </div>
              : <ol className="mt-5 max-h-[36rem] divide-y divide-input overflow-y-auto border-y border-input">
                  {playlistLessons.data?.map((lesson, index) => (
                    <li key={lesson.id}>
                      <Link to={`/resources/${encodeURIComponent(lesson.slug)}`}
                        className="group flex min-h-12 items-start gap-4 px-2 py-3 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring">
                        <span className="w-8 shrink-0 pt-0.5 font-mono text-xs tabular-nums text-muted-foreground">{String(index + 1).padStart(2, '0')}</span>
                        <span className="min-w-0 flex-1 font-medium group-hover:underline group-hover:underline-offset-4">{lesson.title}</span>
                        <ArrowRight className="mt-1 h-4 w-4 shrink-0" aria-hidden="true" />
                      </Link>
                    </li>
                  ))}
                </ol>}
          </section>
        )}
        <ResourceFeedback resourceId={resource.id} isVideo={isVideo} />
        <section aria-labelledby="resource-about">
          <h2 id="resource-about" className="text-2xl font-semibold tracking-[-0.02em]">{t(isVideo ? 'video.about' : 'resource.about')}</h2>
          {resource.description && <div className="mt-4"><SafeHtml html={resource.description} /></div>}
          <dl className="mt-6 grid border-t border-input sm:grid-cols-2">{facts.map(([key, value]) => <div key={key} className="flex justify-between gap-4 border-b border-input py-3 text-sm sm:odd:pr-6 sm:even:pl-6">
            <dt className="text-muted-foreground">{t(`video.facts.${key}`)}</dt><dd className="text-right font-mono tabular-nums">{value}</dd>
          </div>)}</dl>
          {!!studyTopics(resource.tags).length && <ul className="mt-6 flex flex-wrap gap-2">{studyTopics(resource.tags).map(tag => <li key={tag}>
            <Link to={`/resources?tag=${encodeURIComponent(tag)}`} className="inline-block border border-input px-3 py-1 text-sm transition-colors hover:border-foreground hover:bg-primary hover:text-primary-foreground">{tag}</Link>
          </li>)}</ul>}
          {!!resource.keywords.length && <p className="mt-4 text-sm leading-relaxed text-muted-foreground"><span className="font-semibold text-foreground">{t('resource.keywords')}:</span> {resource.keywords.join(' · ')}</p>}
        </section>

        {resource.object_type === 'module' && <section aria-labelledby="module-study-sequences">
          <h2 id="module-study-sequences" className="text-2xl font-semibold tracking-[-0.02em]">{t('moduleResources.sequences')}</h2>
          <p className="mt-2 max-w-prose text-sm text-muted-foreground">{t('moduleResources.sequenceNotice')}</p>
          {moduleSequences.isPending
            ? <p role="status" className="mt-4 text-sm text-muted-foreground">{t('common.loading')}</p>
            : moduleSequences.isError
              ? <div role="alert" className="mt-4 text-sm text-destructive">
                  <p>{moduleSequences.error.message}</p>
                  <button type="button" className="mt-2 underline underline-offset-4" onClick={() => void moduleSequences.refetch()}>{t('common.retry')}</button>
                </div>
              : moduleSequences.data?.length
                ? <ol className="mt-5 divide-y divide-input border-y border-input">
                    {moduleSequences.data.map((item, index) => <li key={item.id}>
                      <Link to={`/sequences/${encodeURIComponent(item.slug)}`}
                        className="group flex items-start gap-4 py-4 transition-colors hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground">
                        <span className="w-8 shrink-0 font-mono text-sm tabular-nums text-muted-foreground">{String(index + 1).padStart(2, '0')}</span>
                        <span className="min-w-0 flex-1">
                          <span className="block font-semibold group-hover:underline group-hover:underline-offset-4">{item.title}</span>
                          {item.description && <span className="mt-1 line-clamp-2 text-sm text-muted-foreground">{item.description}</span>}
                        </span>
                        <ArrowRight className="mt-1 h-4 w-4 shrink-0" aria-hidden="true" />
                      </Link>
                    </li>)}
                  </ol>
                : <p className="mt-4 text-sm text-muted-foreground">{t('moduleResources.noSequences')}</p>}
        </section>}
        {resource.object_type === 'module' && <section aria-labelledby="module-readings">
          <h2 id="module-readings" className="text-2xl font-semibold tracking-[-0.02em]">{t('moduleResources.readings')}</h2>
          <p className="mt-2 max-w-prose text-sm text-muted-foreground">{t('moduleResources.readingsNotice')}</p>
          {(moduleDocuments.isPending || moduleReferences.isPending)
            ? <p role="status" className="mt-4 text-sm text-muted-foreground">{t('common.loading')}</p>
            : (moduleDocuments.isError || moduleReferences.isError)
              ? <div role="alert" className="mt-4 text-sm text-destructive">
                  <p>{moduleDocuments.error?.message ?? moduleReferences.error?.message}</p>
                  <button type="button" className="mt-2 underline underline-offset-4" onClick={() => {
                    void moduleDocuments.refetch();
                    void moduleReferences.refetch();
                  }}>{t('common.retry')}</button>
                </div>
              : (moduleDocuments.data?.length || moduleReferences.data?.length)
                ? <ul className="mt-5 divide-y divide-input border-y border-input">
                    {[...(moduleDocuments.data ?? []), ...(moduleReferences.data ?? [])].map(item => <li key={item.id}>
                      <Link to={`/resources/${encodeURIComponent(item.slug)}`}
                        className="group flex items-start gap-4 py-4 transition-colors hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground">
                        <span className="min-w-0 flex-1">
                          <span className="block font-medium group-hover:underline group-hover:underline-offset-4">{item.title}</span>
                          {item.description && <span className="mt-1 line-clamp-2 text-sm text-muted-foreground">{item.description}</span>}
                        </span>
                        <ArrowUpRight className="mt-1 h-4 w-4 shrink-0" aria-hidden="true" />
                      </Link>
                    </li>)}
                  </ul>
                : <p className="mt-4 text-sm text-muted-foreground">{t('moduleResources.noReadings')}</p>}
        </section>}
        {resource.object_type === 'module' && (moduleProgression.isPending || moduleProgression.isError ||
          !!moduleProgression.data?.prerequisites.length || !!moduleProgression.data?.nextModules.length || !!moduleProgression.data?.relatedModules.length) && (
          <section aria-labelledby="module-progression">
            <h2 id="module-progression" className="text-2xl font-semibold tracking-[-0.02em]">{t('moduleResources.progression')}</h2>
            <p className="mt-2 max-w-prose text-sm text-muted-foreground">{t('moduleResources.progressionNotice')}</p>
            {moduleProgression.isPending
              ? <p role="status" className="mt-4 text-sm text-muted-foreground">{t('common.loading')}</p>
              : moduleProgression.isError
                ? <div role="alert" className="mt-4 text-sm text-destructive">
                    <p>{moduleProgression.error.message}</p>
                    <button type="button" className="mt-2 underline underline-offset-4" onClick={() => void moduleProgression.refetch()}>{t('common.retry')}</button>
                  </div>
                : <div className="mt-5 grid gap-6 sm:grid-cols-2">
                    {[{ label: t('moduleResources.before'), items: moduleProgression.data?.prerequisites ?? [] },
                      { label: t('moduleResources.after'), items: moduleProgression.data?.nextModules ?? [] },
                      { label: t('moduleResources.related'), items: moduleProgression.data?.relatedModules ?? [] }].map(group =>
                      group.items.length > 0 && <div key={group.label}>
                        <h3 className="mb-2 text-sm font-semibold">{group.label}</h3>
                        <ul className="divide-y divide-input border-y border-input">
                          {group.items.map(item => <li key={item.id}>
                            <Link to={`/resources/${encodeURIComponent(item.slug)}`}
                              className="group flex items-start gap-2 py-3 text-sm hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground">
                              <span className="min-w-0 flex-1 group-hover:underline group-hover:underline-offset-4">{item.title}</span>
                              <ArrowRight className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                            </Link>
                          </li>)}
                        </ul>
                      </div>)}
                  </div>}
          </section>
        )}
        {resource.object_type === 'collection' && (collectionModules.isPending || collectionModules.isError || !!collectionModules.data?.length) && (
          <section aria-labelledby="collection-modules">
            <h2 id="collection-modules" className="text-2xl font-semibold tracking-[-0.02em]">{t('collectionModules.title')}</h2>
            <p className="mt-2 max-w-prose text-sm text-muted-foreground">{t('collectionModules.notice')}</p>
            {collectionModules.isPending
              ? <p role="status" className="mt-4 text-sm text-muted-foreground">{t('common.loading')}</p>
              : collectionModules.isError
                ? <div role="alert" className="mt-4 text-sm text-destructive">
                    <p>{collectionModules.error.message}</p>
                    <button type="button" className="mt-2 underline underline-offset-4" onClick={() => void collectionModules.refetch()}>{t('common.retry')}</button>
                  </div>
                : <ol className="mt-5 divide-y divide-input border-y border-input">
                    {(collectionModules.data ?? []).map((item, index) => <li key={item.id}>
                      <Link to={`/resources/${encodeURIComponent(item.slug)}`}
                        className="group flex items-start gap-4 py-4 transition-colors hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground">
                        <span className="w-8 shrink-0 font-mono text-sm tabular-nums text-muted-foreground">{String(index + 1).padStart(2, '0')}</span>
                        <span className="min-w-0 flex-1">
                          <span className="block font-semibold group-hover:underline group-hover:underline-offset-4">{item.title}</span>
                          {item.description && <span className="mt-1 line-clamp-2 block text-sm text-muted-foreground">{item.description}</span>}
                        </span>
                        <ArrowRight className="mt-1 h-4 w-4 shrink-0" aria-hidden="true" />
                      </Link>
                    </li>)}
                  </ol>}
          </section>
        )}
        {resource.object_type === 'collection' && (collectionPlaylists.isPending || collectionPlaylists.isError || !!collectionPlaylists.data?.length) && (
          <section aria-labelledby="collection-playlists">
            <h2 id="collection-playlists" className="text-2xl font-semibold tracking-[-0.02em]">{t('collectionPlaylists.title')}</h2>
            <p className="mt-2 max-w-prose text-sm text-muted-foreground">{t('collectionPlaylists.notice')}</p>
            {collectionPlaylists.isPending
              ? <p role="status" className="mt-4 text-sm text-muted-foreground">{t('common.loading')}</p>
              : collectionPlaylists.error
                ? <div role="alert" className="mt-4 text-sm text-destructive">
                    <p>{collectionPlaylists.error.message}</p>
                    <button type="button" onClick={() => void collectionPlaylists.refetch()} className="mt-2 underline underline-offset-4">{t('common.retry')}</button>
                  </div>
                : <ol className="mt-5 divide-y divide-input border-y border-input">
                    {(collectionPlaylists.data ?? []).map((item, index) => <li key={item.id}>
                      <Link
                        to={`/sequences/${encodeURIComponent(item.slug)}`}
                        className="group flex items-start gap-4 py-4 transition-colors hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
                      >
                        <span className="w-8 shrink-0 font-mono text-sm tabular-nums text-muted-foreground">{String(index + 1).padStart(2, '0')}</span>
                        <span className="min-w-0 flex-1">
                          <span className="block font-semibold group-hover:underline group-hover:underline-offset-4">{item.title}</span>
                          {item.description && <span className="mt-1 line-clamp-2 text-sm text-muted-foreground">{item.description}</span>}
                        </span>
                        <ArrowRight className="mt-1 h-4 w-4 shrink-0" aria-hidden="true" />
                      </Link>
                    </li>)}
                  </ol>}
          </section>
        )}
        {resource.object_type === 'collection' && (collectionVideos.isPending || collectionVideos.isError || !!collectionVideos.data?.length || !collectionPlaylists.data?.length) && <section aria-labelledby="collection-videos">
          <h2 id="collection-videos" className="text-2xl font-semibold tracking-[-0.02em]">{t('collectionVideos.title')}</h2>
          <p className="mt-2 max-w-prose text-sm text-muted-foreground">{t('collectionVideos.notice')}</p>
          {collectionVideos.isPending
            ? <p role="status" className="mt-4 text-sm text-muted-foreground">{t('common.loading')}</p>
            : collectionVideos.error
              ? <div role="alert" className="mt-4 text-sm text-destructive">
                  <p>{collectionVideos.error.message}</p>
                  <button type="button" className="mt-2 underline underline-offset-4" onClick={() => void collectionVideos.refetch()}>{t('common.retry')}</button>
                </div>
              : collectionVideos.data?.length
                ? <ol className="mt-5 divide-y divide-input border-y border-input">
                    {collectionVideos.data.map((item, i) => <li key={item.id}>
                      <Link to={`/resources/${encodeURIComponent(item.slug)}`} className="group flex items-start gap-4 py-4 transition-colors hover:bg-muted">
                        <span className="w-8 shrink-0 font-mono text-sm tabular-nums text-muted-foreground">{String(i + 1).padStart(2, '0')}</span>
                        <span className="flex-1">
                          <span className="block font-semibold group-hover:underline group-hover:underline-offset-4">{item.title}</span>
                          {item.description && <span className="mt-1 line-clamp-2 block text-sm text-muted-foreground">{item.description}</span>}
                        </span>
                        <ArrowRight className="mt-1 h-4 w-4 shrink-0" aria-hidden="true" />
                      </Link>
                    </li>)}
                  </ol>
                : <p className="mt-4 text-sm text-muted-foreground">{t('collectionVideos.empty')}</p>}
        </section>}
        {!!objectives.length && <section aria-labelledby="objectives">
          <h2 id="objectives" className="text-2xl font-semibold tracking-[-0.02em]">{t('resource.objectives')}</h2>
          <ol className="mt-4 space-y-3">{objectives.map((objective, index) => <li key={objective} className="flex gap-4"><span className="font-mono text-sm text-muted-foreground">{String(index + 1).padStart(2, '0')}</span><span>{objective}</span></li>)}</ol>
        </section>}

        {isVideo && <section aria-labelledby="video-curation" className="border border-input bg-muted/40 p-6">
          <h2 id="video-curation" className="text-lg font-semibold">{t('video.curation')}</h2>
          <p className="mt-2 max-w-prose text-sm leading-relaxed text-muted-foreground">{t('video.curationText')}</p>
          <dl className="mt-5 divide-y divide-input border-y border-input text-sm">
            {info.reviewScope && <div className="flex justify-between gap-4 py-3"><dt className="text-muted-foreground">{t('video.selection')}</dt><dd className="min-w-0 break-words text-right">{info.reviewScope === 'title_and_channel_only' ? t('video.scopeTitleChannel') : info.reviewScope}</dd></div>}
            <div className="flex justify-between gap-4 py-3"><dt className="text-muted-foreground">{t('video.fullReviewed')}</dt><dd className="text-right">{t(info.fullReviewed ? 'common.yes' : 'common.no')}</dd></div>
            <div className="flex justify-between gap-4 py-3"><dt className="text-muted-foreground">{t('video.licenseVerified')}</dt><dd className="text-right">{t(info.licenseVerified ? 'common.yes' : 'common.no')}</dd></div>
          </dl>
          <p className="mt-4 max-w-prose text-sm leading-relaxed">{t('video.rights')}</p>
          <Link to={contribute} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold underline underline-offset-4">{t('video.suggest')}<ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
        </section>}

        {!!channelVideos.data?.length && <section aria-labelledby="video-channel">
          <h2 id="video-channel" className="text-2xl font-semibold tracking-[-0.02em]">{t('video.moreFromChannel', { channel: info.channel })}</h2>
          <ul className="mt-5 grid gap-4 sm:grid-cols-2">{channelVideos.data.map(video => <li key={video.id}><VideoCard video={video} /></li>)}</ul>
        </section>}
      </div>
    </div>
    <StudyNotebook resource={{ id: resource.id, slug: resource.slug, title: resource.title, type: resource.object_type }} timed={Boolean(player)} playerTime={playerTime}
      onSeek={player ? seek : null} open={notesOpen} onOpenChange={setNotesOpen} />
  </article>;
}
