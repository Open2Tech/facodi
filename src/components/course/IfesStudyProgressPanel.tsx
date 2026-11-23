import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { BookOpen, Check, LogIn, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/features/auth/useAuth';
import { publicLearningRows } from '@/features/learning/publicLearningRpc';
import { supabase } from '@/shared/api/supabase/supabaseClient';
import { unitPath } from '@/entities/course/course.paths';

const COURSE_CODE = 'IFES-CAR-ADM-INT-2026';
const progressRowSchema = z.object({
  module_slug: z.string(),
  unit_slug: z.string(),
  school_year: z.number(),
  status: z.enum(['in_progress', 'completed']).nullable(),
  completed_at: z.string().nullable(),
});

export type IfesProgressUnit = {
  unit_slug: string;
  unit_title: string;
  study_module_slug?: string | null;
  study_topic_count: number;
  video_count: number;
  reading_count: number;
};

type Props = {
  courseSlug: string;
  units: IfesProgressUnit[];
};

/** User-scoped reading, with PostgreSQL RLS as the actual authorization boundary. */
export function IfesStudyProgressPanel({ courseSlug, units }: Props) {
  const { t } = useTranslation();
  const location = useLocation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const progressKey = ['facodi', 'ifes-study-modules', user?.id, COURSE_CODE];
  const progress = useQuery({
    queryKey: progressKey,
    enabled: !!user,
    queryFn: () => publicLearningRows(
      'get_my_course_study_modules_v1',
      { p_course_code: COURSE_CODE },
      progressRowSchema,
    ),
    staleTime: 30_000,
  });
  const save = useMutation({
    mutationFn: async ({ slug, completed }: { slug: string; completed: boolean }) => {
      const rpcClient = supabase as unknown as { rpc: (
        name: string, parameters: Record<string, unknown>
      ) => Promise<{ data: unknown; error: { message: string } | null }> };
      const { data, error } = await rpcClient.rpc('set_my_study_module_completion_v1', {
        p_module_slug: slug,
        p_completed: completed,
      });
      if (error) throw new Error(error.message);
      if (!Array.isArray(data) || !data.length) throw new Error(t('ifesProgress.saveError'));
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: progressKey });
      toast.success(t('ifesProgress.saved'));
    },
    onError: () => toast.error(t('ifesProgress.saveError')),
  });

  const byModule = useMemo(
    () => new Map(progress.data?.map(row => [row.module_slug, row]) ?? []),
    [progress.data],
  );
  const total = progress.data?.length ?? 0;
  const completed = progress.data?.filter(row => row.status === 'completed').length ?? 0;
  const selectedTotal = units.filter(unit => !!unit.study_module_slug).length;
  const selectedCompleted = units.filter(unit => unit.study_module_slug &&
    byModule.get(unit.study_module_slug)?.status === 'completed').length;

  return <div className="mt-5">
    {user ? <section aria-label={t('ifesProgress.title')} className="mb-5 border border-input bg-muted/20 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h4 className="font-semibold">{t('ifesProgress.title')}</h4>
          <p className="mt-1 text-sm text-muted-foreground">
            {progress.isSuccess
              ? t('ifesProgress.summary', { completed, total, yearCompleted: selectedCompleted, yearTotal: selectedTotal })
              : t('ifesProgress.loading')}
          </p>
        </div>
        {progress.isSuccess && <span className="font-mono text-xl font-semibold tabular-nums">
          {total ? Math.round(completed * 100 / total) : 0}%
        </span>}
      </div>
      {progress.isSuccess && <progress
        className="mt-4 h-2 w-full accent-foreground"
        value={completed} max={Math.max(total, 1)}
        aria-label={t('ifesProgress.overallProgress')}
      />}
      {progress.error && <p role="alert" className="mt-3 text-sm">
        {t('ifesProgress.loadError')}{' '}
        <button type="button" onClick={() => void progress.refetch()}
          className="font-semibold underline underline-offset-4">
          {t('common.retry')}
        </button>
      </p>}
      <p className="mt-2 text-xs text-muted-foreground">{t('ifesProgress.disclaimer')}</p>
    </section> : <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border border-input p-4">
      <p className="max-w-prose text-sm text-muted-foreground">{t('ifesProgress.guest')}</p>
      <Link to={`/login?next=${encodeURIComponent(location.pathname + location.search + location.hash)}`} state={location.state}
        className="inline-flex items-center gap-2 text-sm font-semibold underline underline-offset-4">
        <LogIn className="h-4 w-4" aria-hidden="true" />
        {t('ifesProgress.signIn')}
      </Link>
    </div>}

    <ul className="grid gap-3 md:grid-cols-2">
      {units.map(unit => {
        const moduleSlug = unit.study_module_slug;
        const done = !!moduleSlug && byModule.get(moduleSlug)?.status === 'completed';
        const savingThis = save.isPending && save.variables?.slug === moduleSlug;
        return <li key={unit.unit_slug} className="flex flex-col border border-input p-4 transition-colors hover:border-foreground">
          <Link to={unitPath(courseSlug, unit.unit_slug)} state={location.state}
            className="font-semibold underline-offset-4 hover:underline">{unit.unit_title}</Link>
          <p className="mt-2 font-mono text-xs tabular-nums text-muted-foreground">
            {t('ifesProgress.resources', {
              topics: unit.study_topic_count, videos: unit.video_count, readings: unit.reading_count,
            })}
          </p>
          {moduleSlug && <div className="mt-auto pt-4">
            <Link to={`/resources/${encodeURIComponent(moduleSlug)}`}
              className="inline-flex items-center gap-2 text-sm font-semibold underline underline-offset-4 hover:underline">
              <BookOpen className="h-4 w-4" aria-hidden="true" />
              {t('ifesProgress.openGuide')}
            </Link>
            {user && progress.isSuccess && <button
              type="button" aria-pressed={done} disabled={save.isPending}
              onClick={() => save.mutate({ slug: moduleSlug, completed: !done })}
              className="mt-4 flex w-full items-center justify-center gap-2 border border-foreground px-3 py-2 text-sm font-semibold hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60">
              {done ? <RotateCcw className="h-4 w-4" aria-hidden="true" /> :
                <Check className="h-4 w-4" aria-hidden="true" />}
              {savingThis ? t('common.working') :
                t(done ? 'ifesProgress.reopen' : 'ifesProgress.complete')}
            </button>}
          </div>}
        </li>;
      })}
    </ul>
  </div>;
}
