import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/shared/api/supabase/supabaseClient';
import { getSupabaseErrorMessage } from '@/shared/api/supabase/supabaseErrors';
import type { Json, Database } from '@/integrations/supabase/types';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/course/Pagination';
import { PageState } from '@/components/layout/PageState';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type Blueprint = Database['facodi']['Tables']['generated_structures']['Row'];
type Decision = 'accepted' | 'rejected';
type StatusFilter = 'draft' | Decision;
const PAGE_SIZE = 10;
const QUEUE_KEY = ['facodi', 'editor-blueprints'];

function fields(json: Json): Record<string, Json | undefined> {
  return json && typeof json === 'object' && !Array.isArray(json)
    ? json as Record<string, Json | undefined>
    : {};
}
function display(value: Json | undefined): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  return '';
}
async function fetchBlueprints(status: StatusFilter, page: number) {
  const { data, count, error } = await supabase.from('generated_structures')
    .select('*', { count: 'exact' })
    .eq('generated_by', 'facodi_deterministic_editorial_blueprint')
    .eq('status', status)
    .order('created_at', { ascending: false })
    .order('id')
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (error) throw new Error(getSupabaseErrorMessage(error));
  return { items: data ?? [] as Blueprint[], total: count ?? 0 };
}

export default function EditorStudyPaths() {
  const { t } = useTranslation();
  const [status, setStatus] = useState<StatusFilter>('draft');
  const [page, setPage] = useState(1);
  const [decision, setDecision] = useState<{ blueprint: Blueprint; action: Decision } | null>(null);
  const [note, setNote] = useState('');
  const client = useQueryClient();
  const queue = useQuery({ queryKey: [...QUEUE_KEY, status, page], queryFn: () => fetchBlueprints(status, page) });
  const review = useMutation({
    mutationFn: async ({ id, action, reviewNote }: { id: string; action: Decision; reviewNote: string }) => {
      const { error } = await supabase.rpc('review_study_blueprint', {
        p_id: id,
        p_decision: action,
        p_note: reviewNote.trim() || null,
      });
      if (error) throw new Error(getSupabaseErrorMessage(error));
    },
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: QUEUE_KEY });
      toast.success(t('studyReview.saved'));
    },
  });

  const startDecision = (blueprint: Blueprint, action: Decision) => {
    setNote('');
    review.reset();
    setDecision({ blueprint, action });
  };

  return <div>
    <Link to="/editor" className="mb-8 inline-flex items-center gap-2 text-sm font-semibold underline underline-offset-4">
      <ArrowLeft className="h-4 w-4" />{t('studyReview.back')}
    </Link>
    <header className="mb-7 max-w-3xl">
      <h1 className="text-3xl font-semibold sm:text-4xl">{t('studyReview.title')}</h1>
      <p className="mt-4 text-muted-foreground">{t('studyReview.description')}</p>
    </header>
    <div className="mb-7 flex flex-wrap items-center gap-2" role="group" aria-label={t('studyReview.filter')}>
      {(['draft', 'accepted', 'rejected'] as StatusFilter[]).map(value =>
        <Button key={value} type="button" variant={status === value ? 'default' : 'outline'}
          aria-pressed={status === value}
          onClick={() => { setStatus(value); setPage(1); }}>
          {t(`studyReview.status.${value}`)}
        </Button>)}
    </div>
    {review.error && <p role="alert" className="my-5 text-sm text-destructive">{review.error.message}</p>}
    {queue.isPending ? <PageState loading /> : queue.error
      ? <PageState title={t('common.error')} description={queue.error.message} retry={() => void queue.refetch()} />
      : <>
        <p className="mb-5 font-mono text-xs text-muted-foreground">
          {t('studyReview.count', { count: queue.data.total })}
        </p>
        {!queue.data.items.length
          ? <PageState title={t('studyReview.empty')} description={t('studyReview.emptyDescription')} />
          : <ul className="divide-y divide-input border-y border-input">
            {queue.data.items.map(blueprint => {
              const input = fields(blueprint.prompt);
              const output = fields(blueprint.result);
              const isCourse = blueprint.structure_type === 'curriculum_mapping';
              const header = display(output.title) || display(output.unit_title) || display(output.code) || display(output.unit_code);
              const steps = Array.isArray(output.steps) ? output.steps : [];
              const units = Array.isArray(output.units) ? output.units : [];
              const elements = isCourse ? units : steps;
              return <li key={blueprint.id} className="py-6">
                <div className="flex flex-wrap items-start justify-between gap-5">
                  <div className="min-w-0 flex-1">
                    <p className="mb-2 font-mono text-xs uppercase tracking-wide text-muted-foreground">
                      {isCourse ? t('studyReview.courseMap') : t('studyReview.unitPlan')}
                      {' · '}{display(input.unit_id) ? display(output.course_code) : display(output.code)}
                    </p>
                    <h2 className="break-words text-xl font-semibold">{header || t('studyReview.untitled')}</h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {t(`studyReview.status.${blueprint.status}`, { defaultValue: blueprint.status })}
                      {' · '}{t('studyReview.itemCount', { count: elements.length })}
                    </p>
                    {blueprint.review_note && <p className="mt-2 max-w-prose text-sm">{t('studyReview.previousNote')}: {blueprint.review_note}</p>}
                  </div>
                  {blueprint.status === 'draft' && <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="outline" disabled={review.isPending}
                      onClick={() => startDecision(blueprint, 'rejected')}><X className="h-4 w-4" />{t('studyReview.reject')}</Button>
                    <Button type="button" disabled={review.isPending}
                      onClick={() => startDecision(blueprint, 'accepted')}><Check className="h-4 w-4" />{t('studyReview.accept')}</Button>
                  </div>}
                </div>
                {!!elements.length && <ol className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {elements.slice(0, 12).map((element, idx) => {
                    const item = fields(element);
                    const title = display(item.topic) || display(item.title) || display(item.code);
                    return <li key={idx} className="border border-input bg-muted/30 p-3 text-sm">
                      <span className="mr-2 font-mono text-xs text-muted-foreground">{idx + 1}.</span>
                      {title}
                    </li>;
                  })}
                </ol>}
                {elements.length > 12 && <p className="mt-2 text-xs text-muted-foreground">
                  {t('studyReview.additional', { count: elements.length - 12 })}
                </p>}
                <p className="mt-4 text-xs text-muted-foreground">{t('studyReview.disclaimer')}</p>
              </li>;
            })}
          </ul>}
        <Pagination page={page} total={queue.data.total} onChange={setPage} />
      </>}

    <AlertDialog open={!!decision} onOpenChange={open => { if (!open && !review.isPending) setDecision(null); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{decision ? t(`studyReview.status.${decision.action}`) : ''}</AlertDialogTitle>
          <AlertDialogDescription>{t('studyReview.confirmDescription')}</AlertDialogDescription>
        </AlertDialogHeader>
        <label className="block space-y-2 text-sm font-medium">
          <span>{t('studyReview.note')}</span>
          <textarea className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2"
            maxLength={2000} value={note} onChange={event => setNote(event.target.value)}
            placeholder={t('studyReview.notePlaceholder')} />
        </label>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={review.isPending}>{t('common.cancel')}</AlertDialogCancel>
          <AlertDialogAction disabled={review.isPending || !decision} onClick={event => {
            event.preventDefault();
            if (!decision) return;
            review.mutate({ id: decision.blueprint.id, action: decision.action, reviewNote: note }, {
              onSuccess: () => { setDecision(null); setNote(''); },
            });
          }}>{t('common.confirm')}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>;
}
