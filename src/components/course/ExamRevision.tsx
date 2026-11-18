import { useTranslation } from 'react-i18next';
import { ArrowDown, CalendarClock } from 'lucide-react';
import { examTerm, unitInExamTerm, type ExamTerm } from '@/entities/course/examSeason';

/**
 * "Exam revision" highlight on a UAlg unit page during the weeks before that semester's exams.
 * Renders nothing out of season, for other institutions' calendars, or when the unit has no lessons.
 */
export function ExamRevision({ institution, semester, lessons, href, today = new Date() }: {
  institution: string | null; semester: number | null; lessons: number; href: string; today?: Date;
}) {
  const term = examTerm(today);
  if (!institution?.includes('Algarve') || !lessons || !unitInExamTerm(semester, term)) return null;
  return <ExamRevisionView term={term!} lessons={lessons} href={href} />;
}

export function ExamRevisionView({ term, lessons, href }: { term: ExamTerm; lessons: number; href: string }) {
  const { t } = useTranslation();
  return <aside aria-labelledby="exam-revision" className="mt-7 flex flex-col gap-4 border border-foreground bg-primary p-5 text-ink sm:flex-row sm:items-center sm:justify-between">
    <div className="flex items-start gap-4">
      <CalendarClock className="mt-0.5 h-6 w-6 shrink-0" aria-hidden="true" />
      <div>
        <h2 id="exam-revision" className="text-lg font-semibold">{t('examRevision.title', { term })}</h2>
        <p className="mt-1 max-w-prose text-sm leading-relaxed">{t('examRevision.text', { count: lessons })}</p>
      </div>
    </div>
    <a href={href} className="inline-flex min-h-11 shrink-0 items-center gap-2 border border-ink bg-background px-4 text-sm font-semibold text-foreground hover:bg-muted">
      {t('examRevision.cta')}<ArrowDown className="h-4 w-4" aria-hidden="true" />
    </a>
  </aside>;
}
