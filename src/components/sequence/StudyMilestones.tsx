import { useTranslation } from 'react-i18next';
import { BookOpenText, CalendarCheck, Flag, Footprints, ListChecks, ListVideo, Mountain, NotebookPen, PlayCircle, type LucideIcon } from 'lucide-react';
import { useStudyMilestones } from '@/features/milestones/useStudyMilestones';
import type { MilestoneKey } from '@/entities/sequence/milestones';
import { cn } from '@/lib/utils';

const ICONS: Record<MilestoneKey, LucideIcon> = {
  firstLesson: Footprints, tenLessons: PlayCircle, fiftyLessons: Mountain,
  firstSequence: ListChecks, threeSequences: ListVideo,
  firstNote: NotebookPen, tenNotes: BookOpenText,
  fourWeeks: CalendarCheck,
};

/** Private progress markers on the dashboard: what the learner has done, never a ranking. */
export function StudyMilestones() {
  return <StudyMilestonesView {...useStudyMilestones()} />;
}

type MilestonesState = ReturnType<typeof useStudyMilestones>;

/** Presentation only, so the section can be rendered and checked with any data. */
export function StudyMilestonesView({ data, isPending, isError, retry }: MilestonesState) {
  const { t } = useTranslation();
  return <section aria-labelledby="dashboard-milestones" className="mt-12">
    <div className="flex flex-wrap items-end justify-between gap-3 border-b border-foreground pb-3">
      <h2 id="dashboard-milestones" className="flex items-center gap-3 text-2xl font-semibold tracking-[-0.02em]">
        <span className="grid h-9 w-9 place-items-center border border-foreground bg-brand-mint text-ink" aria-hidden="true"><Flag className="h-5 w-5" strokeWidth={1.75} /></span>
        {t('milestones.title')}
      </h2>
      <p className="text-sm text-muted-foreground">{t('milestones.private')}</p>
    </div>
    {isError ? <div role="alert" className="py-6 text-sm">
      <p>{t('milestones.loadFailed')}</p>
      <button type="button" onClick={retry} className="mt-2 min-h-6 font-semibold underline underline-offset-4">{t('common.retry')}</button>
    </div>
      : isPending || !data ? <p className="py-6 text-sm text-muted-foreground">{t('common.loading')}</p>
      : <>
        <div className="mt-6 grid gap-6 lg:grid-cols-[15rem_minmax(0,1fr)]">
          <div className="border border-foreground p-5">
            <p className="text-sm font-medium">{t('milestones.streakTitle')}</p>
            <p className="mt-2 text-5xl font-semibold tabular-nums tracking-[-0.03em]">{data.streak.current}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {t(data.streak.thisWeek ? 'milestones.streakDone' : data.streak.current ? 'milestones.streakKeep' : 'milestones.streakStart')}
            </p>
            {data.streak.best > 0 && <p className="mt-3 font-mono text-xs text-muted-foreground">{t('milestones.best', { count: data.streak.best })}</p>}
          </div>
          <ul className="grid content-start grid-cols-2 gap-px border border-input bg-input xl:grid-cols-4">
            {data.milestones.map(item => {
              const Icon = ICONS[item.key];
              return <li key={item.key} className="flex flex-col items-start gap-2 bg-background p-3 sm:flex-row sm:gap-4 sm:p-4">
                <span className={cn('grid h-8 w-8 shrink-0 place-items-center border sm:h-10 sm:w-10', item.reached ? 'border-foreground bg-primary text-primary-foreground' : 'border-input text-muted-foreground')} aria-hidden="true">
                  <Icon className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={1.75} />
                </span>
                <span className="min-w-0">
                  <span className={cn('block text-sm font-semibold leading-snug sm:text-base', !item.reached && 'text-muted-foreground')}>{t(`milestones.items.${item.key}`)}</span>
                  <span className="mt-1 block text-xs text-muted-foreground sm:text-sm">
                    {item.reached ? t('milestones.reached') : t('milestones.progress', { value: Math.min(item.value, item.target), target: item.target })}
                  </span>
                </span>
              </li>;
            })}
          </ul>
        </div>
      </>}
  </section>;
}
