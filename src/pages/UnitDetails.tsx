import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, ArrowUpRight, Award, BookOpen, Building2, Calendar, CalendarRange, ChevronRight, Clock, ExternalLink, Hash, Languages, PlayCircle, type LucideIcon } from 'lucide-react';
import { Link, useLocation, useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageSeo, NoIndex } from '@/components/layout/PageSeo';
import { unitMeta } from '@/shared/seo/seo';
import { useUnit, useUnitVideos } from '@/features/courses/queries/useCourses';
import { parseStudyPath } from '@/entities/course/studyPath';
import { parseComposedStudyPath, canPresentComposedStudyPath, isComposedPathPending } from '@/entities/course/composedStudyPath';
import { UnitComposedStudyPath } from '@/components/course/UnitComposedStudyPath';
import { UnitVideoLibraryFrame } from '@/components/course/UnitVideoLibraryFrame';
import { UnitStudyPath } from '@/components/course/UnitStudyPath';
import { UnitLearningHighlights } from '@/components/course/UnitLearningHighlights';
import { pickUnitHighlights } from '@/entities/course/unitHighlights';
import { useUnitOutcomes } from '@/features/courses/queries/useUnitOutcomes';
import { useUnitReadings } from '@/features/courses/queries/useUnitReadings';
import { useLinkedCatalogAssets } from '@/features/courses/queries/useLinkedCatalogAssets';
import { useSequences } from '@/features/sequences/useSequences';
import { SequenceList } from '@/components/sequence/SequenceList';
import { SuggestResourceCallout } from '@/components/suggestion/SuggestResourceCallout';
import { SafeHtml } from '@/components/course/SafeHtml';
import { PageState } from '@/components/layout/PageState';
import { LearningContext } from '@/components/learning/LearningPathGuide';
import { ShareButton } from '@/components/share/ShareButton';
import { VideoThumbnail } from '@/components/resource/VideoCard';
import { StudyVideo } from '@/components/resource/StudyVideo';
import { Skeleton } from '@/components/ui/skeleton';
import { courseMaterialsPath, unitPath } from '@/entities/course/course.paths';
import { formatDuration, videoInfo } from '@/entities/course/video';
import { ExamRevision } from '@/components/course/ExamRevision';
import { cn } from '@/lib/utils';
import { TypeBadge } from '@/components/catalog/TypeBadge';
import { brazilianCredits, ufesElectiveGroup, unitHours } from '@/entities/course/brazilianCurriculum';
import { ectsVerificationPending } from '@/entities/course/ualgCurriculum';

const FACT_ICONS: Record<string, LucideIcon> = {
  code: Hash, ects: Award, hours: Clock, brazilianCredits: Award, electiveGroup: CalendarRange, yearLabel: Calendar, semesterLabel: CalendarRange, language: Languages, institution: Building2,
};

export default function UnitDetails() {
  const { slug = '', unit: unitSlug = '' } = useParams();
  const { t } = useTranslation();
  const query = useUnit(slug, unitSlug);
  const videos = useUnitVideos(query.data?.unit.learning_object_id);
  const outcomesQuery = useUnitOutcomes(query.data?.unit.learning_object_id);
  const readingsQuery = useUnitReadings(query.data?.unit.learning_object_id);
  const playlistsQuery = useLinkedCatalogAssets(query.data?.unit.learning_object_id, 'playlist');
  const modulesQuery = useLinkedCatalogAssets(query.data?.unit.learning_object_id, 'module');
  const unitCode = query.data?.unit.code ?? null;
  const sequences = useSequences(unitCode, !!unitCode);
  const [params, setParams] = useSearchParams();
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
  if (!query.data) return <><NoIndex /><PageState title={t('common.notFound')} description={t('common.notFoundDescription')} /></>;
  const { course, unit, outline } = query.data;
  const studyPath = parseStudyPath(unit.metadata);
  const composedCandidate = !studyPath ? parseComposedStudyPath(unit.metadata) : null;
  // A configured journey must not flash the legacy catalog while its dependencies load.
  // Errors/invalid links still fall back to the complete catalog after queries settle.
  const composedPending = isComposedPathPending(composedCandidate, [
    sequences.status, playlistsQuery.status, modulesQuery.status,
  ]);
  const composedPath = composedCandidate && !composedPending
    && sequences.isSuccess && modulesQuery.isSuccess && playlistsQuery.isSuccess
    && canPresentComposedStudyPath(composedCandidate, sequences.data ?? [], playlistsQuery.data ?? [], modulesQuery.data ?? [])
    ? composedCandidate : null;
  const showLegacy = !studyPath && !composedPath && !composedPending;
  const index = outline.findIndex(item => item.id === unit.id);
  const previous = index > 0 ? outline[index - 1] : null;
  const next = index >= 0 && index < outline.length - 1 ? outline[index + 1] : null;
  // Unscheduled electives are alternatives, not all peers in one academic term.
  const siblings = unit.year == null || unit.semester == null ? [] : outline.filter(item => item.id !== unit.id && item.year === unit.year && item.semester === unit.semester);
  const videoList = videos.data ?? [];
  const selected = videoList.find(video => video.id === params.get('v')) ?? videoList[0];
  const selectedInfo = selected ? videoInfo(selected.metadata, selected.source_url) : null;
  const highlights = pickUnitHighlights({
    courseSlug: course.slug, unitSlug: unit.slug, unitTitle: unit.title,
    hasStudyPath: Boolean(studyPath || composedPath),
    sequences: sequences.data ?? [], videos: videoList,
    playlists: playlistsQuery.data ?? [], modules: modulesQuery.data ?? [],
    readings: readingsQuery.data ?? [],
  });
  const highlightsLoading = Boolean(unit.learning_object_id) && [
    videos.isPending, readingsQuery.isPending, playlistsQuery.isPending, modulesQuery.isPending,
  ].some(Boolean) || (Boolean(unitCode) && sequences.isPending);
  const highlightsError = Boolean(
    videos.error || readingsQuery.error || playlistsQuery.error || modulesQuery.error ||
    (unitCode && sequences.error),
  );
  const facts = [
    ['code', unit.code],
    ['ects', ectsVerificationPending(unit.metadata) ? t('ualgCurriculum.ectsPending') : unit.ects != null ? `${unit.ects} ECTS` : null],
    ['hours', unit.ects == null && unitHours(unit.metadata) != null ? `${unitHours(unit.metadata)} h` : null],
    ['brazilianCredits', course.code === 'UFES-LETRAS-ING-83-2019' && brazilianCredits(unit.metadata) != null ? String(brazilianCredits(unit.metadata)) : null],
    ['electiveGroup', course.code === 'UFES-LETRAS-ING-83-2019' && ufesElectiveGroup(unit.metadata) ? t(`course.electiveGroups.${ufesElectiveGroup(unit.metadata)}`) : null],
    ['yearLabel', unit.year != null ? String(unit.year) : null],
    ['semesterLabel', unit.semester != null ? String(unit.semester) : null],
    ['language', unit.language?.toUpperCase()],
    ['institution', course.institution],
  ].filter((fact): fact is [string, string] => Boolean(fact[1]));
  return <article>
    <PageSeo {...unitMeta(unit, course, { courses: t('nav.courses') })} />
    <nav aria-label={t('unit.breadcrumb')} className="mb-8 text-sm">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-muted-foreground">
        <li><Link className="underline underline-offset-4 hover:text-foreground" to="/units">{t('nav.units')}</Link></li>
        <li aria-hidden="true"><ChevronRight className="h-3.5 w-3.5" /></li>
        <li><Link className="underline underline-offset-4 hover:text-foreground" to={`/courses/${course.slug}`}>{course.code || course.title}</Link></li>
        <li aria-hidden="true"><ChevronRight className="h-3.5 w-3.5" /></li>
        <li aria-current="page" className="text-foreground">{unit.code || unit.title}</li>
      </ol>
    </nav>
    <header className="border-b border-foreground border-t-4 border-t-brand-orange pb-10 pt-6">
      <p className="mb-5 flex flex-wrap items-center gap-2">
        <TypeBadge type="curricular_unit" label={course.code === 'FACODI-GACS-ASTRO-2018' ? t('unit.editorialStudyStep') : t('objectTypes.curricular_unit')} className="border border-foreground" />
        {!!videoList.length && <a href={studyPath || composedPath || composedPending ? "#unit-study-path" : "#unit-resources"} className="inline-flex items-center gap-1.5 border border-foreground bg-card px-2.5 py-1 font-mono text-xs uppercase transition-colors hover:bg-brand-pink hover:text-brand-ink">
          <PlayCircle className="h-3.5 w-3.5" aria-hidden="true" />{studyPath || composedPath || composedPending ? t('composedPath.title') : t('unit.videoChip', { count: videoList.length })}
        </a>}
      </p>
      <h1 className="max-w-4xl text-4xl font-semibold leading-[1.05] tracking-[-0.03em] [text-wrap:balance] sm:text-6xl">{unit.title}</h1>
      <p className="mt-5 text-lg">
        <Link to={`/courses/${course.slug}`} className="font-semibold underline decoration-2 underline-offset-4">{course.title}</Link>
      </p>
      {unit.summary && <p className="mt-4 max-w-prose text-lg leading-relaxed text-muted-foreground">{unit.summary}</p>}
      <div className="mt-6 flex flex-wrap items-center gap-x-7 gap-y-3">
        <ShareButton title={unit.title} />
        <Link to={courseMaterialsPath(course.slug, unit.slug)}
          className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <BookOpen className="h-4 w-4" aria-hidden="true" />
          {t('courseMaterials.viewUnitMaterials')}
          <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </header>
    <ExamRevision institution={course.institution} semester={unit.semester} lessons={videoList.length}
      href={studyPath || composedPath || composedPending ? '#unit-study-path' : '#unit-resources'} />
    <LearningContext focus="unit" />
    <UnitLearningHighlights courseSlug={course.slug} unitSlug={unit.slug} highlights={highlights} loading={highlightsLoading} hasError={highlightsError} />
    <div className="grid gap-12 py-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="min-w-0 space-y-12">
        {unit.description_html && <SafeHtml html={unit.description_html} />}
        {composedPending && <section id="unit-study-path" aria-labelledby="composed-loading-heading" aria-busy="true" className="scroll-mt-28 border-t border-foreground pt-9">
          <h2 id="composed-loading-heading" className="text-2xl font-semibold tracking-tight">{t('composedPath.title')}</h2>
          <p role="status" className="mt-3 text-sm text-muted-foreground">{t('common.loading')}</p>
          <Skeleton className="mt-5 h-24 w-full" />
          <Skeleton className="mt-3 h-24 w-full" />
        </section>}
        {composedPath && <UnitComposedStudyPath config={composedPath} sequences={sequences.data ?? []} modules={modulesQuery.data ?? []} />}
        {studyPath && <UnitStudyPath config={studyPath}
          sequences={sequences.data ?? []} videos={videoList} />}
        <section aria-labelledby="unit-outcomes" className="border-t border-input pt-9">
          <h2 id="unit-outcomes" className="text-2xl font-semibold tracking-[-0.02em]">{t('unitOutcomes.title')}</h2>
          {outcomesQuery.isPending
            ? <p role="status" className="mt-5 text-sm text-muted-foreground">{t('common.loading')}</p>
            : outcomesQuery.error
              ? <p role="alert" className="mt-5 text-sm text-destructive">{outcomesQuery.error.message}</p>
              : outcomesQuery.data?.length
                ? <ol className="mt-5 space-y-3">
                  {outcomesQuery.data.map((outcome, i) => <li key={outcome.id}
                    className="flex items-start gap-4 border-b border-input pb-3 text-sm leading-relaxed">
                    <span className="shrink-0 font-mono text-xs text-muted-foreground">{String(i + 1).padStart(2, '0')}</span>
                    <span>{outcome.statement}</span>
                  </li>)}
                </ol>
                : <p className="mt-5 text-sm text-muted-foreground">{t('unitOutcomes.empty')}</p>}
        </section>
        {(readingsQuery.isPending || readingsQuery.error || !!readingsQuery.data?.length) && <section aria-labelledby="unit-readings" className="border-t border-input pt-9">
          <h2 id="unit-readings" className="text-2xl font-semibold tracking-[-0.02em]">{t('unitReadings.title')}</h2>
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
                      className="group flex h-full flex-col gap-2 border border-input border-t-4 border-t-brand-cyan bg-card p-5 transition-colors hover:border-foreground hover:bg-brand-cyan/10">
                      <span className="grid h-8 w-8 place-items-center border border-foreground bg-brand-cyan text-brand-ink" aria-hidden="true"><ExternalLink className="h-4 w-4" /></span>
                      <span className="font-semibold group-hover:underline group-hover:underline-offset-4">{reading.title}</span>
                      {reading.description && <span className="line-clamp-3 text-sm text-muted-foreground">{reading.description}</span>}
                      <span className="mt-auto inline-flex items-center gap-1 pt-2 text-xs font-semibold text-foreground">{t('unitReadings.openSource')}<ArrowUpRight className="h-3.5 w-3.5" /></span>
                    </Link>
                  </li>)}
                </ul>}
        </section>}
        {showLegacy && (modulesQuery.isPending || modulesQuery.error || !!modulesQuery.data?.length) && <section aria-labelledby="unit-modules" className="border-t border-input pt-9">
          <h2 id="unit-modules" className="text-2xl font-semibold tracking-tight">{t('studyModules.forUnit')}</h2>
          <p className="mt-2 max-w-prose text-sm leading-relaxed text-muted-foreground">{t('studyModules.forUnitText')}</p>
          {modulesQuery.isPending
            ? <p className="mt-5 text-sm text-muted-foreground" role="status">{t('common.loading')}</p>
            : modulesQuery.error
              ? <div className="mt-4 text-sm text-destructive" role="alert"><p>{modulesQuery.error.message}</p>
                  <button type="button" onClick={() => void modulesQuery.refetch()} className="mt-2 font-semibold underline underline-offset-4">{t('common.retry')}</button>
                </div>
              : !!modulesQuery.data?.length && <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                {modulesQuery.data.map(module => <li key={module.id}>
                  <Link to={`/modules/${encodeURIComponent(module.slug)}`}
                    className="group flex h-full flex-col gap-2 border border-input border-t-4 border-t-brand-mint bg-card p-5 transition-colors hover:border-foreground hover:bg-brand-mint/10">
                    <span className="font-semibold group-hover:underline group-hover:underline-offset-4">{module.title}</span>
                    {module.description && <span className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">{module.description}</span>}
                    <span className="mt-auto inline-flex items-center gap-2 pt-2 text-sm font-semibold">{t('studyModules.open')}<ArrowRight className="h-4 w-4" aria-hidden="true" /></span>
                  </Link>
                </li>)}
              </ul>}
        </section>}
        {showLegacy && (playlistsQuery.isPending || playlistsQuery.error || !!playlistsQuery.data?.length) && <section aria-labelledby="unit-playlists" className="border-t border-input pt-9">
          <h2 id="unit-playlists" className="text-2xl font-semibold tracking-[-0.02em]">{t('unitPlaylists.title')}</h2>
          {playlistsQuery.isPending
            ? <p role="status" className="mt-5 text-sm text-muted-foreground">{t('common.loading')}</p>
            : playlistsQuery.error
              ? <div role="alert" className="mt-5 text-sm text-destructive">
                  <p>{playlistsQuery.error.message}</p>
                  <button type="button" onClick={() => void playlistsQuery.refetch()} className="mt-2 underline underline-offset-4">{t('common.retry')}</button>
                </div>
              : !!playlistsQuery.data?.length && <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                  {playlistsQuery.data.map(playlist => <li key={playlist.id}>
                    <Link to={`/resources/${encodeURIComponent(playlist.slug)}`}
                      className="group flex h-full flex-col gap-2 border border-input border-t-4 border-t-brand-pink bg-card p-5 transition-colors hover:border-foreground hover:bg-brand-pink/10">
                      <span className="font-semibold group-hover:underline group-hover:underline-offset-4">{playlist.title}</span>
                      {playlist.description && <span className="line-clamp-3 text-sm text-muted-foreground">{playlist.description}</span>}
                      <span className="mt-auto inline-flex items-center gap-1 pt-2 text-xs font-semibold">{t('unitPlaylists.openDetails')}<ArrowUpRight className="h-3.5 w-3.5" /></span>
                    </Link>
                  </li>)}
                </ul>}
        </section>}
        {!studyPath && !composedPending && <UnitVideoLibraryFrame collapsed={!!composedPath} count={videoList.length} forceOpen={Boolean(params.get('v')) || hash === '#unit-resources'}><section aria-labelledby="unit-resources">
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
                  <div>
                    {selectedInfo.youtubeId
                      ? <StudyVideo key={selected.id} resource={{ id: selected.id, slug: selected.slug, title: selected.title, type: 'video' }}
                        videoId={selectedInfo.youtubeId} info={selectedInfo} autoPlay={engaged} onPlay={() => setEngaged(true)} />
                      : <div className="border border-foreground"><VideoThumbnail info={selectedInfo} /></div>}
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
                      <button type="button" aria-pressed={active} onClick={() => setParams(previous => {
                        const next = new URLSearchParams(previous);
                        if (next.get('v') !== video.id) next.delete('t');
                        next.set('v', video.id);
                        return next;
                      }, { replace: true })}
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
            </div>}
        </section></UnitVideoLibraryFrame>}
        {showLegacy && !!sequences.data?.length && <section aria-labelledby="unit-sequences">
          <h2 id="unit-sequences" className="text-2xl font-semibold tracking-[-0.02em]">{t('sequences.forUnit')}</h2>
          <p className="mt-2 max-w-prose text-sm text-muted-foreground">{t('sequences.forUnitText')}</p>
          <div className="mt-5"><SequenceList sequences={sequences.data} headingLevel={3} showUnits={false} /></div>
        </section>}
        <SuggestResourceCallout context="unit" unitId={unit.id} />
        {!!siblings.length && <section aria-labelledby="unit-siblings">
          <h2 id="unit-siblings" className="text-2xl font-semibold tracking-[-0.02em]">{t('unit.sameTerm', { year: unit.year, semester: unit.semester })}</h2>
          <ul className="mt-4 divide-y divide-input border-y border-input">
            {siblings.map(item => <li key={item.id}>
              <Link to={unitPath(course.slug, item.slug)} className="flex items-baseline justify-between gap-4 py-4 hover:underline hover:underline-offset-4">
                <span className="font-medium">{item.title}</span>
                {ectsVerificationPending(item.metadata)
                  ? <span className="shrink-0 text-xs text-muted-foreground">{t('ualgCurriculum.ectsPending')}</span>
                  : item.ects != null && <span className="shrink-0 font-mono text-sm tabular-nums text-muted-foreground">{item.ects} ECTS</span>}
              </Link>
            </li>)}
          </ul>
        </section>}
      </div>
      <aside aria-labelledby="unit-facts" className="self-start border border-foreground bg-card lg:sticky lg:top-28">
        <h2 id="unit-facts" className="border-b border-foreground bg-brand-orange px-5 py-3 text-sm font-semibold text-brand-ink">{t('unit.facts')}</h2>
        <dl className="divide-y divide-input">{facts.map(([key, value]) => <div key={key} className="flex justify-between gap-4 px-5 py-3 text-sm">
          <dt className="flex items-center gap-2 text-muted-foreground">{(() => { const Icon = FACT_ICONS[key]; return Icon && <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />; })()}{t(`course.${key}`)}</dt><dd className="text-right font-mono tabular-nums">{value}</dd>
        </div>)}</dl>
        <Link to={`/units?course=${encodeURIComponent(course.slug)}`} className="flex items-center justify-between gap-2 border-t border-input px-5 py-3 text-sm font-semibold transition-colors hover:bg-primary hover:text-brand-ink">{t('unit.allInCourse')}<ArrowRight className="h-4 w-4" /></Link>
      </aside>
    </div>
    {(previous || next) && <nav aria-label={t('unit.sequence')} className="grid gap-4 border-t border-foreground pt-8 sm:grid-cols-2">
      {previous ? <Link to={unitPath(course.slug, previous.slug)} className="group flex flex-col gap-1 border border-input border-t-4 border-t-brand-orange bg-card p-5 transition-colors hover:border-foreground hover:bg-brand-orange/10">
        <span className="inline-flex items-center gap-2 text-sm text-muted-foreground"><ArrowLeft className="h-4 w-4" />{t('unit.previous')}</span>
        <span className="font-semibold group-hover:underline group-hover:underline-offset-4">{previous.title}</span>
      </Link> : <span />}
      {next && <Link to={unitPath(course.slug, next.slug)} className="group flex flex-col gap-1 border border-input border-t-4 border-t-brand-orange bg-card p-5 text-right transition-colors hover:border-foreground hover:bg-brand-orange/10">
        <span className="inline-flex items-center justify-end gap-2 text-sm text-muted-foreground">{t('unit.next')}<ArrowRight className="h-4 w-4" /></span>
        <span className="font-semibold group-hover:underline group-hover:underline-offset-4">{next.title}</span>
      </Link>}
    </nav>}
  </article>;
}
