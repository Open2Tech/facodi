import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { ArrowRight, BookOpenCheck } from 'lucide-react';
import { useAuth } from '@/features/auth/useAuth';
import { publicLearningRows } from '@/features/learning/publicLearningRpc';

const COURSE_CODE = 'IFES-CAR-ADM-INT-2026';
const coursePath = '/courses/ifes-cariacica-administracao-integrado-2026';
const progressSchema = z.object({
  module_slug: z.string(),
  unit_slug: z.string(),
  school_year: z.number(),
  status: z.enum(['in_progress', 'completed']).nullable(),
  completed_at: z.string().nullable(),
});

/** Only show this dashboard shortcut when the user has deliberately tracked a guide. */
export function IfesProgressOverview() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const progress = useQuery({
    queryKey: ['facodi', 'ifes-study-modules', user?.id, COURSE_CODE],
    enabled: !!user,
    queryFn: () => publicLearningRows('get_my_course_study_modules_v1',
      { p_course_code: COURSE_CODE }, progressSchema),
    staleTime: 30_000,
  });
  if (!user || !progress.isSuccess || !progress.data?.some(row => row.status !== null)) return null;
  const total = progress.data.length;
  const completed = progress.data.filter(row => row.status === 'completed').length;
  return <section aria-labelledby="ifes-dashboard-progress" className="my-9 border border-foreground p-6">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="max-w-prose">
        <p className="font-mono text-xs uppercase tracking-wide text-muted-foreground">FACODI · Ifes Cariacica</p>
        <h2 id="ifes-dashboard-progress" className="mt-2 inline-flex items-center gap-2 text-2xl font-semibold">
          <BookOpenCheck className="h-6 w-6" aria-hidden="true" /> {t('ifesProgress.dashboardTitle')}
        </h2>
        <p className="mt-3 text-sm text-muted-foreground">
          {t('ifesProgress.dashboardSummary', { completed, total })}
        </p>
      </div>
      <Link className="inline-flex items-center gap-2 text-sm font-semibold underline underline-offset-4" to={coursePath}>
        {t('ifesProgress.dashboardResume')} <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </div>
    <progress className="mt-5 h-2 w-full accent-foreground" value={completed}
      max={Math.max(total, 1)} aria-label={t('ifesProgress.overallProgress')} />
    <p className="mt-2 text-xs text-muted-foreground">{t('ifesProgress.disclaimer')}</p>
  </section>;
}
