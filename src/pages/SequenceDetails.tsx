import { useRef } from 'react';
import { PageSeo, NoIndex } from '@/components/layout/PageSeo';
import { sequenceMeta } from '@/shared/seo/seo';
import { ArrowRight, ArrowUpRight, Check, ChevronRight, LogIn, RotateCcw } from 'lucide-react';
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useSequence, useSequenceProgress } from '@/features/sequences/useSequences';
import { completedCount, nextItem, type SequenceItem } from '@/entities/sequence/sequence';
import { formatDuration, type VideoInfo } from '@/entities/course/video';
import { unitPath } from '@/entities/course/course.paths';
import { safeExternalUrl } from '@/shared/lib/navigation';
import { PageState } from '@/components/layout/PageState';
import { LearningContext } from '@/components/learning/LearningPathGuide';
import { ShareButton } from '@/components/share/ShareButton';
import { ShareAchievementButton } from '@/components/share/ShareAchievementButton';
import { useLinkedCatalogAssets } from '@/features/courses/queries/useLinkedCatalogAssets';
import { TypeBadge } from '@/components/catalog/TypeBadge';
import { VideoThumbnail } from '@/components/resource/VideoCard';
import { YouTubePlayer } from '@/components/resource/YouTubePlayer';
import { StudyVideo } from '@/components/resource/StudyVideo';
import { StudyNotesReview } from '@/components/notes/StudyNotesReview';
import { useNotebook } from '@/features/notes/useNotebook';
import { noteCountsByResource, type StudyNoteContextResource } from '@/entities/notes/studyNoteContext';
import { CreatorLearningPanel } from '@/components/resource/CreatorLearningPanel';
import { SequenceProgress } from '@/components/sequence/SequenceProgress';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { plainText } from '@/shared/lib/text';
import { cn } from '@/lib/utils';

/** Positions closer than this to the start are not worth resuming from. */
const RESUME_MIN_SECONDS = 15;
/** How far playback must move before the position is saved again. */
const SAVE_EVERY_SECONDS = 20;

const infoOf = (item: SequenceItem): VideoInfo => ({
  youtubeId: item.youtubeId, thumbnail: item.thumbnail, durationSeconds: null, uploadDate: null, channel: item.channel,
  reviewScope: null, fullReviewed: false, licenseVerified: false,
});

export default function SequenceDetails() {
  const { slug = '' } = useParams();
  const { t } = useTranslation();
  const query = useSequence(slug);
  const readings = useLinkedCatalogAssets(query.data?.id, 'external_resource');
  const progress = useSequenceProgress(query.data?.id);
  const [params, setParams] = useSearchParams();
  const saved = useRef(new Map<string, number>());
  const notebook = useNotebook();

  if (query.isPending) return <PageState loading />;
  if (query.error) return <PageState title={t('common.error')} description={query.error.message} retry={() => void query.refetch()} />;
  if (!query.data) return <><NoIndex /><PageState title={t('common.notFound')} description={t('common.notFoundDescription')} /></>;

  const sequence = query.data;
  // Preserve bookmarks while canonicalizing duplicate video sequences.
  // The SQL RPC resolves only explicit, public editorial alias metadata.
  if (sequence.slug !== slug) {
    const search = params.toString();
    return <Navigate to={`/sequences/${encodeURIComponent(sequence.slug)}${search ? `?${search}` : ''}`} replace />;
  }
  const items = sequence.items;
  const rows = progress.data ?? new Map();
  const progressReady = !progress.signedIn || progress.isSuccess;
  const done = completedCount(items, rows);
  const resumeItem = nextItem(items, rows);
  const selected = items.find(item => item.videoId === params.get('v')) ?? resumeItem;
  const selectedIndex = selected ? items.indexOf(selected) : -1;
  const following = selectedIndex >= 0 ? items[selectedIndex + 1] ?? null : null;
  const selectedRow = selected ? rows.get(selected.videoId) : undefined;
  const resumeAt = selectedRow && !selectedRow.completedAt && selectedRow.lastPosition >= RESUME_MIN_SECONDS ? selectedRow.lastPosition : null;

  const noteCounts = noteCountsByResource(notebook.all);
  const noteResources: StudyNoteContextResource[] = items.filter(item => item.slug).map(item => ({
    id: item.videoId, title: item.title,
    path: `/sequences/${encodeURIComponent(sequence.slug)}?v=${encodeURIComponent(item.videoId)}`,
    scope: 'open', timed: true,
  }));

  function select(videoId: string) {
    setParams(previous => {
      const next = new URLSearchParams(previous);
      if (next.get('v') !== videoId) next.delete('t');
      next.set('v', videoId);
      return next;
    }, { replace: true });
  }
  function toggle(item: SequenceItem) {
    const completed = !rows.get(item.videoId)?.completedAt;
    // Pin the current lesson so marking it done does not swap the player underneath the learner.
    if (selected) select(selected.videoId);
    progress.toggle.mutate({ videoId: item.videoId, completed }, {
      onError: () => toast.error(t('sequences.saveFailed')),
    });
  }
  function trackTime(videoId: string, seconds: number) {
    const last = saved.current.get(videoId) ?? rows.get(videoId)?.lastPosition ?? 0;
    if (Math.abs(seconds - last) < SAVE_EVERY_SECONDS) return;
    saved.current.set(videoId, seconds);
    void progress.savePosition(videoId, seconds);
  }

  const description = plainText(sequence.description);
  return <article>
    <PageSeo {...sequenceMeta(sequence, { sequences: t('sequences.title') })} />
    <nav aria-label={t('unit.breadcrumb')} className="mb-8 text-sm">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-muted-foreground">
        <li><Link className="underline underline-offset-4 hover:text-foreground" to="/sequences">{t('sequences.title')}</Link></li>
        <li aria-hidden="true"><ChevronRight className="h-3.5 w-3.5" /></li>
        <li aria-current="page" className="line-clamp-1 text-foreground">{sequence.title}</li>
      </ol>
    </nav>
    <header className="grid gap-8 border-b border-foreground border-t-4 border-t-brand-pink pb-10 pt-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-end">
      <div className="min-w-0">
        <p className="mb-5 flex flex-wrap items-center gap-2">
          <TypeBadge type="playlist" label={t('objectTypes.playlist')} className="border border-foreground" />
          <span className="border border-foreground bg-brand-pink px-2.5 py-1 font-mono text-xs font-semibold uppercase text-brand-ink">{t('sequences.lessons', { count: items.length })}</span>
          {sequence.language && <span className="border border-input px-2 py-1 font-mono text-xs uppercase">{sequence.language}</span>}
        </p>
        <h1 className="max-w-4xl text-4xl font-semibold leading-[1.05] tracking-[-0.03em] [text-wrap:balance] sm:text-5xl">{sequence.title}</h1>
        {description && <p className="mt-5 max-w-prose leading-relaxed text-muted-foreground">{description}</p>}
        <div className="mt-6"><ShareButton title={sequence.title} /></div>
      </div>
      <section aria-labelledby="sequence-progress" className="border border-foreground border-t-4 border-t-brand-pink bg-card p-5">
        <h2 id="sequence-progress" className="text-sm font-semibold">{t('sequences.yourProgress')}</h2>
        {!progress.signedIn ? <>
          <p className="mt-2 text-sm text-muted-foreground">{t('sequences.guest')}</p>
          <Button asChild size="sm" className="mt-4"><Link to={`/login?next=${encodeURIComponent(`/sequences/${sequence.slug}`)}`}><LogIn aria-hidden="true" />{t('sequences.signIn')}</Link></Button>
        </> : progress.isError ? <div role="alert" className="mt-2 text-sm">
          <p>{t('sequences.loadFailed')}</p>
          <button type="button" onClick={() => void progress.refetch()} className="mt-2 font-semibold underline underline-offset-4">{t('common.retry')}</button>
        </div> : !progressReady ? <p role="status" className="mt-2 text-sm text-muted-foreground">{t('common.loading')}</p> : <>
          <SequenceProgress className="mt-3" completed={done} total={items.length} label={t('sequences.progressLabel', { title: sequence.title })} />
          <p className="mt-3 text-xs text-muted-foreground">{t('sequences.selfReported')}</p>
          {done === items.length && items.length > 0
            ? <>
              <p className="mt-4 text-sm font-semibold">{t('sequences.finished')}</p>
              <ShareAchievementButton title={sequence.title} path={`/sequences/${sequence.slug}`} lessons={items.length} />
            </>
            : resumeItem && selected?.videoId !== resumeItem.videoId && <button type="button" onClick={() => select(resumeItem.videoId)}
              className="mt-4 inline-flex items-center gap-2 text-left text-sm font-semibold underline underline-offset-4">{t('sequences.continue', { title: resumeItem.title })}<ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" /></button>}
          {rows.size > 0 && <AlertDialog>
            <AlertDialogTrigger asChild>
              <button type="button" disabled={progress.reset.isPending} className="mt-4 flex items-center gap-2 text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground disabled:opacity-60"><RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />{t('sequences.reset')}</button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t('sequences.reset')}</AlertDialogTitle>
                <AlertDialogDescription>{t('sequences.resetConfirm')}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                <AlertDialogAction onClick={() => progress.reset.mutate(undefined, { onError: () => toast.error(t('sequences.saveFailed')) })}>{t('common.confirm')}</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>}
        </>}
      </section>
    </header>
    <LearningContext focus="sequence" />

    <div className="pt-8"><CreatorLearningPanel kind="playlist" slug={sequence.slug} youtubeId={null} inlineSequence /></div>
    {selected ? <section aria-labelledby="sequence-lessons" className="py-10">
      <h2 id="sequence-lessons" className="sr-only">{t('sequences.lessonsHeading')}</h2>
      <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div className="min-w-0">
          <div>
            {selected.youtubeId && progressReady
              ? selected.slug
                ? <StudyVideo key={selected.videoId} resource={{ id: selected.videoId, slug: selected.slug, title: selected.title, type: 'video' }}
                  videoId={selected.youtubeId} info={infoOf(selected)} start={resumeAt}
                  onPlay={() => void progress.start(selected.videoId)} onTime={seconds => trackTime(selected.videoId, seconds)} />
                : <YouTubePlayer key={selected.videoId} videoId={selected.youtubeId} title={selected.title} thumbnail={selected.thumbnail}
                  start={resumeAt} onPlay={() => void progress.start(selected.videoId)} onTime={seconds => trackTime(selected.videoId, seconds)} />
              : <div className="border border-foreground"><VideoThumbnail info={infoOf(selected)} /></div>}
          </div>
          <p className="mt-4 font-mono text-xs tabular-nums text-muted-foreground">{t('sequences.position', { current: selectedIndex + 1, total: items.length })}</p>
          <h3 className="mt-1 text-xl font-semibold leading-snug">{selected.title}</h3>
          <p className="mt-1 flex flex-wrap gap-x-3 text-sm text-muted-foreground">
            {selected.channel && <span>{selected.channel}</span>}
            {resumeAt != null && <span>{t('sequences.resumeAt', { time: formatDuration(resumeAt) })}</span>}
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            {progress.signedIn && progressReady && !progress.isError && (() => {
              const complete = !!selectedRow?.completedAt;
              return <Button type="button" variant={complete ? 'outline' : 'default'} aria-pressed={complete} onClick={() => toggle(selected)}>
                <Check aria-hidden="true" />{t(complete ? 'sequences.completed' : 'sequences.markComplete')}
              </Button>;
            })()}
            {following && <Button type="button" variant="outline" onClick={() => select(following.videoId)}>{t('sequences.next')}<ArrowRight aria-hidden="true" /></Button>}
          </div>
          <p className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold">
            {selected.slug && <Link to={`/resources/${encodeURIComponent(selected.slug)}`} className="inline-flex items-center gap-2 underline underline-offset-4">{t('unit.openVideoPage')}<ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>}
            {selected.youtubeUrl && <a href={selected.youtubeUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 underline underline-offset-4">{t('video.watchOnYoutube')}<ArrowUpRight className="h-4 w-4" aria-hidden="true" /></a>}
          </p>
          {selected.youtubeId && sequence.slug.startsWith('facodi-playlist-ifes-') &&
            <div className="mt-7"><CreatorLearningPanel kind="video" slug={selected.slug ?? ''} youtubeId={selected.youtubeId} /></div>}
        </div>
        <ol aria-label={t('sequences.lessonsHeading')} className="max-h-[36rem] divide-y divide-input overflow-y-auto border-y border-input">
          {items.map((item, position) => {
            const active = item.videoId === selected.videoId;
            const row = rows.get(item.videoId);
            const complete = !!row?.completedAt;
            return <li key={item.videoId} className={cn('flex items-stretch', active ? 'bg-primary text-primary-foreground' : 'hover:bg-muted')}>
              <button type="button" aria-current={active ? 'true' : undefined} onClick={() => select(item.videoId)}
                className="flex min-w-0 flex-1 gap-3 px-3 py-3 text-left text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring">
                <span className="w-6 shrink-0 pt-0.5 font-mono text-xs tabular-nums">{String(position + 1).padStart(2, '0')}</span>
                <span className="w-24 shrink-0"><VideoThumbnail info={infoOf(item)} /></span>
                <span className="min-w-0 flex-1">
                  <span className="line-clamp-2 font-medium leading-snug">{item.title}</span>
                  {item.channel && <span className={cn('mt-1 block truncate text-xs', active ? 'text-primary-foreground' : 'text-muted-foreground')}>{item.channel}</span>}
                  {notebook.ready && item.slug && (noteCounts.get(item.videoId) ?? 0) > 0 && <span className={cn('mt-1 block text-xs', active ? 'text-primary-foreground' : 'text-muted-foreground')}>{t('studyNotesReview.lessonNoteCount', { count: noteCounts.get(item.videoId) })}</span>}
                  {complete ? <span className="sr-only">{t('sequences.completed')}</span> : row && <span className={cn('mt-1 block text-xs', active ? 'text-primary-foreground' : 'text-muted-foreground')}>{t('sequences.started')}</span>}
                </span>
              </button>
              {progress.signedIn && progressReady && !progress.isError && <button type="button" aria-pressed={complete} onClick={() => toggle(item)}
                aria-label={t(complete ? 'sequences.unmarkItem' : 'sequences.markItem', { title: item.title })}
                className="grid w-12 shrink-0 place-items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring">
                <span className={cn('grid h-6 w-6 place-items-center border transition-colors', complete ? 'border-foreground bg-brand-mint text-ink' : active ? 'border-primary-foreground' : 'border-foreground bg-background')}>
                  {complete && <Check className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />}
                </span>
              </button>}
            </li>;
          })}
        </ol>
      </div>
    </section> : <PageState level="h2" title={t('sequences.noLessons')} description={t('sequences.noLessonsText')} />}

    <div className="mt-4"><StudyNotesReview kind="sequence" resources={noteResources} /></div>

    {!!readings.data?.length && <section aria-labelledby="sequence-readings" className="mt-10 border-t border-foreground pt-8">
      <h2 id="sequence-readings" className="text-2xl font-semibold tracking-[-0.02em]">{t('unit.resources')}</h2>
      <ul className="mt-4 divide-y divide-input border-y border-input">
        {readings.data.map(reading => {
          const externalUrl = safeExternalUrl(reading.sourceUrl);
          return <li key={reading.id} className="flex flex-wrap items-start justify-between gap-3 py-4">
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{reading.title}</p>
              {reading.description && <p className="mt-1 line-clamp-3 max-w-prose text-sm text-muted-foreground">{reading.description}</p>}
            </div>
            {externalUrl
              ? <a href={externalUrl} target="_blank" rel="noopener noreferrer"
                  className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold underline underline-offset-4">
                  {t('resources.open')}<ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </a>
              : <Link to={`/resources/${encodeURIComponent(reading.slug)}`}
                  className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold underline underline-offset-4">
                  {t('resources.open')}<ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>}
          </li>;
        })}
      </ul>
    </section>}

    {!!sequence.units.length && <section aria-labelledby="sequence-units" className="border-t border-foreground pt-8">
      <h2 id="sequence-units" className="text-2xl font-semibold tracking-[-0.02em]">{t('sequences.units')}</h2>
      <ul className="mt-4 divide-y divide-input border-y border-input">
        {sequence.units.map(unit => <li key={`${unit.courseSlug}/${unit.unitSlug}`}>
          <Link to={unitPath(unit.courseSlug, unit.unitSlug)} className="group flex items-baseline justify-between gap-4 py-4 hover:bg-muted sm:px-3">
            <span className="font-medium decoration-2 underline-offset-4 group-hover:underline">{unit.unitTitle}</span>
            <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">{unit.courseCode} · {unit.unitCode}</span>
          </Link>
        </li>)}
      </ul>
    </section>}
    <p className="mt-8 max-w-prose text-xs text-muted-foreground">{t('sequences.notice')}</p>
  </article>;
}
