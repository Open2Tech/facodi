import { ArrowRight, BookOpenCheck, CheckCircle2, ListVideo, PlayCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { sequenceInUnitPath } from '@/entities/course/course.paths';
import { useTranslation } from 'react-i18next';
import { useSequence, useSequenceProgress } from '@/features/sequences/useSequences';
import { completedCount, nextItem, type SequenceSummary } from '@/entities/sequence/sequence';
import { groupStudyPathLessons, type StudyPathConfig } from '@/entities/course/studyPath';
import { useNotebook } from '@/features/notes/useNotebook';
import { noteCountsByResource } from '@/entities/notes/studyNoteContext';

interface VideoResource { id: string; slug: string; title: string }

/** One student-facing entry to an existing ordered sequence, not another playlist or module.
 * The playlist continues to own lesson IDs, order and learner progress. */
export function UnitStudyPath({
  config, sequences, videos, courseSlug, unitSlug,
}: {
  config: StudyPathConfig;
  courseSlug?: string;
  unitSlug?: string;
  sequences: SequenceSummary[];
  videos: VideoResource[];
}) {
  const { t, i18n } = useTranslation();
  const href = (slug: string, videoId?: string) => courseSlug && unitSlug
    ? sequenceInUnitPath(slug, courseSlug, unitSlug, videoId)
    : '/sequences/' + encodeURIComponent(slug) + (videoId ? '?v=' + encodeURIComponent(videoId) : '');
  const notebook = useNotebook();
  const noteCounts = noteCountsByResource(notebook.all);
  const locale = (['pt', 'en', 'es', 'fr'] as const)
    .find(candidate => i18n.language.toLowerCase().startsWith(candidate)) ?? 'pt';
  const sequence = useSequence(config.sequenceSlug);
  const progress = useSequenceProgress(sequence.data?.id);
  const extraSequences = [...new Set([...config.supplementarySequenceSlugs, ...sequences.map(item => item.slug)])]
    .filter(slug => slug !== config.sequenceSlug)
    .flatMap(slug => sequences.find(item => item.slug === slug && item.itemCount > 0) ?? []);
  const standalone = config.standaloneResourceSlugs
    .flatMap(slug => videos.find(video => video.slug === slug) ?? []);
  const groups = sequence.data ? groupStudyPathLessons(config, sequence.data) : null;
  const progressMap = progress.data ?? new Map();
  const next = sequence.data && groups ? nextItem(sequence.data.items, progressMap) : null;
  const completed = sequence.data ? completedCount(sequence.data.items, progressMap) : 0;
  const progressReady = !progress.signedIn || progress.isSuccess;

  return <section id="unit-study-path" aria-labelledby="unit-study-path-title" className="scroll-mt-28 border-t border-foreground pt-9">
    <p className="font-mono text-xs uppercase tracking-wide text-muted-foreground">{t('studyPath.eyebrow')}</p>
    <h2 id="unit-study-path-title" className="mt-2 text-2xl font-semibold tracking-tight">{t('studyPath.title')}</h2>
    <p className="mt-3 max-w-prose text-sm leading-relaxed text-muted-foreground">{t('studyPath.intro')}</p>

    {sequence.isPending ? <p role="status" className="mt-6 text-sm text-muted-foreground">{t('common.loading')}</p>
      : sequence.error ? <div role="alert" className="mt-6 border border-input p-5 text-sm">
        <p>{t('studyPath.loadFailed')}</p>
        <button type="button" className="mt-3 font-semibold underline underline-offset-4" onClick={() => void sequence.refetch()}>{t('common.retry')}</button>
      </div>
      : !sequence.data || !groups ? <div role="alert" className="mt-6 border border-input p-5 text-sm">
        <p>{t('studyPath.unavailable')}</p>
        {sequence.data && <Link to={href(sequence.data.slug)} className="mt-3 inline-flex items-center gap-2 font-semibold underline underline-offset-4">
          {t('studyPath.openSequence')}<ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>}
      </div>
      : <>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border border-foreground bg-muted/30 p-5">
          <div>
            <p className="font-semibold">{t('studyPath.lessons', { count: sequence.data.items.length })}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {progress.signedIn && progressReady
                ? t('studyPath.completed', { completed, total: sequence.data.items.length })
                : t('studyPath.progressNote')}
            </p>
          </div>
          {next && progressReady && <Link to={href(sequence.data.slug, next.videoId)}
            className="inline-flex items-center gap-2 bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90">
            <PlayCircle className="h-4 w-4" aria-hidden="true" />{t('studyPath.continue')}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>}
        </div>
        <ol className="mt-6 space-y-5">
          {groups.map((section, index) => <li key={section.id} className="border border-input p-5">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center border border-foreground font-mono text-sm">{index + 1}</span>
              <div>
                <h3 className="font-semibold leading-snug">{section.labels[locale]}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{t('studyPath.lessons', { count: section.items.length })}</p>
              </div>
            </div>
            <ol className="mt-4 divide-y divide-input border-t border-input">
              {section.items.map((item, position) => <li key={item.videoId}>
                <Link to={href(sequence.data!.slug, item.videoId)}
                  className="group flex items-center gap-3 py-3 text-sm hover:bg-muted/40">
                  <span className="w-7 shrink-0 font-mono text-xs tabular-nums text-muted-foreground">{String(position + 1).padStart(2, '0')}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium group-hover:underline group-hover:underline-offset-4">{item.title}</span>
                    {notebook.ready && item.slug && (noteCounts.get(item.videoId) ?? 0) > 0 &&
                      <span className="mt-1 block text-xs text-muted-foreground">{t('studyNotesReview.lessonNoteCount', { count: noteCounts.get(item.videoId) })}</span>}
                  </span>
                  {progress.signedIn && progressMap.get(item.videoId)?.completedAt
                    ? <CheckCircle2 className="h-4 w-4 shrink-0 text-foreground" aria-label={t('studyPath.done')} />
                    : <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />}
                </Link>
              </li>)}
            </ol>
          </li>)}
        </ol>
        <p className="mt-4 text-xs leading-relaxed text-muted-foreground">{t('studyPath.sourceNotice')}</p>
      </>}

    <div className="mt-8 border border-input p-5">
      <h3 className="flex items-center gap-2 text-lg font-semibold"><BookOpenCheck className="h-5 w-5" aria-hidden="true" />{t('studyPath.practice')}</h3>
      <p className="mt-2 max-w-prose text-sm text-muted-foreground">{t('studyPath.practiceDescription')}</p>
      <Link to={`/modules/${encodeURIComponent(config.guideModuleSlug)}`} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold underline underline-offset-4">
        {t('studyPath.openGuide')}<ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </div>
    {(extraSequences.length > 0 || standalone.length > 0) && <div className="mt-8 border-t border-input pt-6">
      <h3 className="flex items-center gap-2 font-semibold"><ListVideo className="h-5 w-5" aria-hidden="true" />{t('studyPath.extra')}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{t('studyPath.extraDescription')}</p>
      <ul className="mt-4 space-y-3">
        {extraSequences.map(extra => <li key={extra.id}>
          <Link to={href(extra.slug)} className="inline-flex items-center gap-2 text-sm font-medium underline underline-offset-4">
            {extra.title}<ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
          </Link>
        </li>)}
        {standalone.map(resource => <li key={resource.id}>
          <Link to={`/resources/${encodeURIComponent(resource.slug)}`} className="inline-flex items-center gap-2 text-sm font-medium underline underline-offset-4">
            {resource.title}<ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
          </Link>
        </li>)}
      </ul>
    </div>}
  </section>;
}
