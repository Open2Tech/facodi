import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Check, ExternalLink, X } from 'lucide-react';
import { toast } from 'sonner';
import type { Blueprint, BlueprintDecision, BlueprintStatus } from '@/entities/contribution/contribution.types';
import { readBlueprint } from '@/entities/contribution/blueprint';
import { useBlueprintCounts, useBlueprints, useReviewBlueprint } from '@/features/contributions/queries/useContributions';
import { TypeBadge } from '@/components/catalog/TypeBadge';
import { StatusBadge } from '@/components/editorial/StatusBadge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Pagination } from '@/components/course/Pagination';
import { PageState } from '@/components/layout/PageState';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const STATES: BlueprintStatus[] = ['draft', 'accepted', 'rejected'];
const PREVIEW = 12;

function BlueprintItem({ blueprint, busy, onDecide }: { blueprint: Blueprint; busy: boolean; onDecide: (action: BlueprintDecision) => void }) {
  const { t, i18n } = useTranslation();
  const view = readBlueprint(blueprint);
  const title = view.title || t('studyReview.untitled');
  const when = blueprint.reviewed_at ?? blueprint.created_at;
  const date = new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium' }).format(new Date(when));
  const meta = [
    view.courseCode,
    view.year !== null && t('catalog.year', { value: view.year }),
    view.semester !== null && t('catalog.semester', { value: view.semester }),
    view.ects !== null && t('studyReview.ects', { count: view.ects }),
    t('studyReview.itemCount', { count: view.elements.length }),
    view.videoLinks !== null && view.readingLinks !== null && t('studyReview.links', { videos: view.videoLinks, readings: view.readingLinks }),
  ].filter(Boolean);
  const headingId = `blueprint-${blueprint.id}`;

  return <li className="py-7" aria-labelledby={headingId}>
    <div className="flex flex-wrap items-center gap-2">
      <TypeBadge type={view.isCourse ? 'course' : 'curricular_unit'} label={view.isCourse ? t('studyReview.courseMap') : t('studyReview.unitPlan')} />
      <StatusBadge status={blueprint.status} label={t(`studyReview.status.${blueprint.status}`, { defaultValue: blueprint.status })} />
      {view.code && <span className="font-mono text-label text-muted-foreground">{view.code}</span>}
    </div>
    <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 flex-1">
        <h2 id={headingId} className="break-words text-xl font-semibold">{title}</h2>
        <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted-foreground">
          {meta.map(item => <span key={String(item)}>{item}</span>)}
          <time dateTime={when}>{blueprint.reviewed_at ? t('studyReview.reviewedOn', { date }) : t('studyReview.createdOn', { date })}</time>
        </p>
        {blueprint.review_note && <p className="mt-3 max-w-prose text-sm">{t('studyReview.previousNote')}: {blueprint.review_note}</p>}
        {view.officialUrl && <a href={view.officialUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-2 text-sm font-semibold underline underline-offset-4">
          {t('studyReview.officialPlan')}<ExternalLink className="h-4 w-4" aria-hidden="true" />
        </a>}
      </div>
      {blueprint.status === 'draft' && <div className="flex shrink-0 flex-wrap gap-2">
        <Button type="button" variant="outline" disabled={busy} onClick={() => onDecide('rejected')}
          aria-label={`${t('studyReview.reject')}: ${title}`}><X className="h-4 w-4" aria-hidden="true" />{t('studyReview.reject')}</Button>
        <Button type="button" disabled={busy} onClick={() => onDecide('accepted')}
          aria-label={`${t('studyReview.accept')}: ${title}`}><Check className="h-4 w-4" aria-hidden="true" />{t('studyReview.accept')}</Button>
      </div>}
    </div>
    {!!view.elements.length && <ol className="mt-5 grid gap-px border border-input bg-input sm:grid-cols-2 lg:grid-cols-3">
      {view.elements.slice(0, PREVIEW).map((item, index) => {
        const detail = view.isCourse
          ? [item.code, item.year !== null && t('catalog.year', { value: item.year }), item.semester !== null && t('catalog.semester', { value: item.semester }), item.ects !== null && t('studyReview.ects', { count: item.ects })].filter(Boolean).join(' · ')
          : item.activity;
        return <li key={index} className="flex gap-3 bg-background p-3 text-sm">
          <span className="w-5 shrink-0 text-right font-mono text-label tabular-nums text-muted-foreground">{item.order}</span>
          <span className="min-w-0">
            <span className="block break-words font-medium">{item.label}</span>
            {detail && <span className="mt-0.5 block text-xs text-muted-foreground">{detail}</span>}
          </span>
        </li>;
      })}
    </ol>}
    {view.elements.length > PREVIEW && <p className="mt-2 text-xs text-muted-foreground">{t('studyReview.additional', { count: view.elements.length - PREVIEW })}</p>}
    <p className="mt-4 text-xs text-muted-foreground">{t('studyReview.disclaimer')}</p>
  </li>;
}

export default function EditorStudyPaths() {
  const { t } = useTranslation();
  const [params, setParams] = useSearchParams();
  const rawStatus = params.get('status');
  const status: BlueprintStatus = STATES.includes(rawStatus as BlueprintStatus) ? rawStatus as BlueprintStatus : 'draft';
  const page = Math.max(1, Number.parseInt(params.get('page') ?? '1', 10) || 1);
  const [decision, setDecision] = useState<{ blueprint: Blueprint; action: BlueprintDecision } | null>(null);
  const [note, setNote] = useState('');
  const queue = useBlueprints(status, page);
  const counts = useBlueprintCounts();
  const review = useReviewBlueprint();

  const update = (next: { status?: BlueprintStatus; page?: number }) => setParams(previous => {
    const result = new URLSearchParams(previous);
    if (next.status) { result.set('status', next.status); result.delete('page'); }
    if (next.page) { if (next.page > 1) result.set('page', String(next.page)); else result.delete('page'); }
    return result;
  });
  const startDecision = (blueprint: Blueprint, action: BlueprintDecision) => {
    setNote('');
    review.reset();
    setDecision({ blueprint, action });
  };
  const confirm = () => {
    if (!decision) return;
    review.mutate({ id: decision.blueprint.id, decision: decision.action, note }, {
      onSuccess: () => {
        setDecision(null);
        setNote('');
        toast.success(t('studyReview.saved'));
      },
    });
  };

  return <div>
    <Link to="/editor" className="mb-8 inline-flex items-center gap-2 text-sm font-semibold underline underline-offset-4">
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />{t('studyReview.back')}
    </Link>
    <header className="mb-7 max-w-3xl">
      <h1 className="text-3xl font-semibold sm:text-4xl">{t('studyReview.title')}</h1>
      <p className="mt-4 text-muted-foreground">{t('studyReview.description')}</p>
    </header>
    <div className="mb-7 flex flex-wrap items-center gap-2" role="group" aria-label={t('studyReview.filter')}>
      {STATES.map(value => <Button key={value} type="button" variant={status === value ? 'default' : 'outline'}
        aria-pressed={status === value} onClick={() => update({ status: value })}>
        {t(`studyReview.status.${value}`)}
        {counts.data && <span className="font-mono text-label tabular-nums opacity-75">{counts.data[value]}</span>}
      </Button>)}
    </div>
    {queue.isPending ? <PageState loading /> : queue.error
      ? <PageState level="h2" title={t('common.error')} description={queue.error.message} retry={() => void queue.refetch()} />
      : <>
        <p className="mb-2 font-mono text-label text-muted-foreground" aria-live="polite">{t('studyReview.count', { count: queue.data.total })}</p>
        {!queue.data.items.length
          ? <PageState level="h2" title={t('studyReview.empty')} description={t('studyReview.emptyDescription')} />
          : <ul className={`divide-y divide-input border-y border-input transition-opacity ${queue.isPlaceholderData ? 'opacity-60' : ''}`}>
            {queue.data.items.map(blueprint => <BlueprintItem key={blueprint.id} blueprint={blueprint} busy={review.isPending}
              onDecide={action => startDecision(blueprint, action)} />)}
          </ul>}
        <Pagination page={page} total={queue.data.total} onChange={next => update({ page: next })} />
      </>}

    <AlertDialog open={!!decision} onOpenChange={open => { if (!open && !review.isPending) setDecision(null); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{decision ? `${t(`studyReview.${decision.action === 'accepted' ? 'accept' : 'reject'}`)}: ${readBlueprint(decision.blueprint).title}` : ''}</AlertDialogTitle>
          <AlertDialogDescription>{t('studyReview.confirmDescription')}</AlertDialogDescription>
        </AlertDialogHeader>
        <label className="block space-y-2 text-sm font-medium">
          <span className="block">{t('studyReview.note')}</span>
          <Textarea rows={3} maxLength={2000} value={note} onChange={event => setNote(event.target.value)} placeholder={t('studyReview.notePlaceholder')} />
        </label>
        {review.error && <p role="alert" className="border border-destructive p-3 text-sm text-destructive">{review.error.message}</p>}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={review.isPending}>{t('common.cancel')}</AlertDialogCancel>
          <AlertDialogAction disabled={review.isPending || !decision} onClick={event => { event.preventDefault(); confirm(); }}>
            {review.isPending ? t('common.working') : t('common.confirm')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>;
}
