import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Check, ExternalLink, RefreshCw, X } from 'lucide-react';
import { toast } from 'sonner';
import { parseAnalysis, parseScreening } from '@/entities/suggestion/suggestion.api';
import type { SuggestionDecision } from '@/entities/suggestion/suggestion.types';
import { safeExternalUrl } from '@/shared/lib/navigation';
import { useRetrySuggestionAnalysis, useReviewSuggestion, useSuggestionQueue } from '@/features/suggestions/queries/useSuggestions';
import { LANGUAGES } from '@/components/catalog/CatalogToolbar';
import { TypeBadge } from '@/components/catalog/TypeBadge';
import { StatusBadge } from '@/components/editorial/StatusBadge';
import { RecommendationBadge } from '@/components/suggestion/RecommendationBadge';
import { ScreeningSignals } from '@/components/suggestion/ScreeningSignals';
import { SuggestionAnalysis } from '@/components/suggestion/SuggestionAnalysis';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { PageState } from '@/components/layout/PageState';
import { cn } from '@/lib/utils';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function EditorSuggestions() {
  const { t, i18n } = useTranslation();
  const [params, setParams] = useSearchParams();
  const [decision, setDecision] = useState<SuggestionDecision | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [unitChoice, setUnitChoice] = useState('none');
  const queue = useSuggestionQueue();
  const review = useReviewSuggestion();
  const retry = useRetrySuggestionAnalysis();
  const selected = queue.data?.find(item => item.id === params.get('id')) ?? queue.data?.[0] ?? null;
  const screening = selected ? parseScreening(selected.screening) : null;
  const analysis = selected ? parseAnalysis(selected.analysis_jobs) : null;
  const learnerUnit = selected?.curricular_units ?? null;
  // Units proposed by the analysis that differ from the learner's choice; the editor picks one explicitly.
  const proposedUnits = analysis?.matches.filter(match => match.unitId !== learnerUnit?.id) ?? [];
  const dateFormat = new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium' });
  const languageName = (code: string | null) => LANGUAGES.find(([value]) => value === code)?.[1] ?? code ?? '—';
  const provider = (value: string) => t(`suggest.providers.${value}`, { defaultValue: value });
  const source = selected ? safeExternalUrl(selected.canonical_url) : null;
  // A duplicate's approval links the existing learning object instead of creating a draft.
  const reusesExisting = !!screening?.duplicate;

  const select = (id: string) => {
    review.reset();
    setParams(previous => { const next = new URLSearchParams(previous); next.set('id', id); return next; }, { replace: true });
  };
  const open = (next: SuggestionDecision) => {
    review.reset();
    setReviewNote('');
    setUnitChoice(learnerUnit?.id ?? proposedUnits.find(match => match.fit === 'strong')?.unitId ?? 'none');
    setDecision(next);
  };
  const reanalyse = () => {
    if (!selected) return;
    retry.mutate(selected.id, {
      onSuccess: () => toast.success(t('suggestReview.analysisQueued')),
      onError: error => toast.error(t(`suggest.errors.${error.message}`, { defaultValue: error.message })),
    });
  };
  const confirm = () => {
    if (!selected || !decision) return;
    const unitId = decision === 'approved' && unitChoice !== 'none' && unitChoice !== learnerUnit?.id ? unitChoice : undefined;
    review.mutate({ id: selected.id, decision, note: reviewNote, unitId }, {
      onSuccess: () => {
        toast.success(t(decision === 'rejected' ? 'suggestReview.rejected' : reusesExisting ? 'suggestReview.approvedExisting' : 'suggestReview.approved'));
        setDecision(null);
        setReviewNote('');
      },
    });
  };

  return <div>
    <Link to="/editor" className="mb-8 inline-flex items-center gap-2 text-sm font-semibold underline underline-offset-4">
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />{t('suggestReview.back')}
    </Link>
    <header className="mb-8 max-w-3xl">
      <h1 className="text-3xl font-semibold sm:text-4xl">{t('suggestReview.title')}</h1>
      <p className="mt-4 text-muted-foreground">{t('suggestReview.description')}</p>
    </header>
    <div className="grid gap-8 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
      <aside aria-labelledby="suggestion-queue">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 id="suggestion-queue" className="font-semibold">{t('suggestReview.queue', { count: queue.data?.length ?? 0 })}</h2>
          <Button type="button" variant="outline" size="sm" onClick={() => void queue.refetch()} disabled={queue.isFetching}>
            <RefreshCw className={cn('h-4 w-4', queue.isFetching && 'motion-safe:animate-spin')} aria-hidden="true" />{t('playlistReview.refresh')}
          </Button>
        </div>
        {queue.isPending ? <PageState loading /> : queue.error
          ? <PageState level="h3" title={t('common.error')} description={queue.error.message} retry={() => void queue.refetch()} />
          : !!queue.data.length && <ul className="divide-y divide-input border-y border-input">
            {queue.data.map(item => <li key={item.id}>
              <button type="button" onClick={() => select(item.id)} aria-pressed={selected?.id === item.id}
                className={cn('w-full p-4 text-left transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  selected?.id === item.id && 'bg-muted')}>
                <span className="block break-words font-medium">{item.title}</span>
                <span className="mt-1 block text-sm text-muted-foreground">{[provider(item.provider), item.curricular_units?.code].filter(Boolean).join(' · ')}</span>
                <span className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <time dateTime={item.created_at} className="text-xs text-muted-foreground">{dateFormat.format(new Date(item.created_at))}</time>
                  <RecommendationBadge recommendation={parseScreening(item.screening).recommendation} />
                </span>
              </button>
            </li>)}
          </ul>}
      </aside>
      <section className="min-w-0" aria-live="polite">
        {!selected || !screening ? queue.isSuccess && <PageState level="h2" title={t('suggestReview.empty')} description={t('suggestReview.emptyDescription')} /> : <>
          <div className="flex flex-wrap items-center gap-2">
            <TypeBadge type={selected.object_type} label={t(`objectTypes.${selected.object_type}`, { defaultValue: selected.object_type })} />
            <StatusBadge status={selected.status} label={t(`suggest.status.${selected.status}`)} />
            <RecommendationBadge recommendation={screening.recommendation} />
          </div>
          <div className="mt-4 grid gap-5 sm:grid-cols-[minmax(0,1fr)_12rem]">
            <div className="min-w-0">
              <h2 className="break-words text-2xl font-semibold">{selected.title}</h2>
              {selected.author && <p className="mt-1 text-muted-foreground">{selected.author}</p>}
              {source && <a href={source} target="_blank" rel="noopener noreferrer"
                className="mt-3 inline-flex max-w-full items-center gap-2 break-all font-mono text-sm underline underline-offset-4">
                {selected.canonical_url}<ExternalLink className="h-4 w-4 shrink-0" aria-hidden="true" />
              </a>}
            </div>
            {selected.thumbnail_url && <img src={selected.thumbnail_url} alt="" referrerPolicy="no-referrer" loading="lazy" decoding="async"
              className="aspect-video w-full border border-input object-cover" />}
          </div>
          <dl className="mt-6 grid gap-x-6 gap-y-3 border-y border-input py-4 text-sm sm:grid-cols-2">
            <div><dt className="text-muted-foreground">{t('suggest.unit')}</dt><dd className="font-medium">{selected.curricular_units ? `${selected.curricular_units.code} · ${selected.curricular_units.title}` : '—'}</dd></div>
            <div><dt className="text-muted-foreground">{t('suggest.fields.license')}</dt><dd className="font-mono font-medium">{selected.license || '—'}</dd></div>
            <div><dt className="text-muted-foreground">{t('suggest.fields.language')}</dt><dd className="font-medium">{languageName(selected.language)}</dd></div>
            <div><dt className="text-muted-foreground">{t('playlistReview.submitted')}</dt><dd className="font-medium"><time dateTime={selected.created_at}>{dateFormat.format(new Date(selected.created_at))}</time></dd></div>
            {!!selected.tags.length && <div className="sm:col-span-2"><dt className="text-muted-foreground">{t('suggest.fields.tags')}</dt>
              <dd className="mt-1 flex flex-wrap gap-1.5">{selected.tags.map(tag => <span key={tag} className="border border-input px-1.5 py-0.5 font-mono text-xs">{tag}</span>)}</dd></div>}
          </dl>
          {selected.note && <blockquote className="mt-4 max-w-prose border-l-2 border-foreground pl-4 text-sm">{selected.note}</blockquote>}
          <h3 className="mt-6 font-semibold">{t('suggestReview.screening')}</h3>
          <ScreeningSignals className="mt-3" screening={screening} provider={selected.provider} />
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-semibold">{t('suggest.analysis.title')}</h3>
            {(!analysis || analysis.state === 'done' || analysis.state === 'failed') &&
              <Button type="button" variant="outline" size="sm" disabled={retry.isPending} onClick={reanalyse}>
                <RefreshCw className={cn('h-4 w-4', retry.isPending && 'motion-safe:animate-spin')} aria-hidden="true" />
                {t(analysis ? 'suggestReview.reanalyse' : 'suggestReview.analyse')}
              </Button>}
          </div>
          {analysis && <SuggestionAnalysis className="mt-3" analysis={analysis} />}
          <p className="mt-5 max-w-prose text-sm text-muted-foreground">{t('suggestReview.scope')}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button variant="outline" disabled={review.isPending} onClick={() => open('rejected')}>
              <X className="h-4 w-4" aria-hidden="true" />{t('suggestReview.reject')}
            </Button>
            <Button disabled={review.isPending} onClick={() => open('approved')}>
              <Check className="h-4 w-4" aria-hidden="true" />{t('suggestReview.approve')}
            </Button>
          </div>
        </>}
      </section>
    </div>
    <AlertDialog open={!!decision} onOpenChange={next => { if (!next && !review.isPending) setDecision(null); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{decision === 'approved' ? t('suggestReview.approve') : t('suggestReview.reject')}</AlertDialogTitle>
          <AlertDialogDescription>{t(decision === 'rejected' ? 'suggestReview.confirmReject' : reusesExisting ? 'suggestReview.confirmApproveExisting' : 'suggestReview.confirmApprove')}</AlertDialogDescription>
        </AlertDialogHeader>
        {decision === 'approved' && proposedUnits.length > 0 && <fieldset className="space-y-3 text-sm">
          <legend className="mb-2 font-medium">{t('suggestReview.unitChoice')}</legend>
          <RadioGroup value={unitChoice} onValueChange={setUnitChoice}>
            {[
              ...(learnerUnit ? [{ id: learnerUnit.id, label: `${learnerUnit.code} · ${learnerUnit.title}`, hint: t('suggestReview.unitLearner') }] : []),
              ...proposedUnits.map(match => ({
                id: match.unitId,
                label: [match.code, match.title].filter(Boolean).join(' · '),
                hint: [t('suggestReview.unitAnalysis'), t(`suggest.analysis.fit.${match.fit}`), match.courseCode].filter(Boolean).join(' · '),
              })),
              ...(learnerUnit ? [] : [{ id: 'none', label: t('suggestReview.unitNone'), hint: '' }]),
            ].map(option => <label key={option.id} className="flex cursor-pointer items-start gap-3">
              <RadioGroupItem value={option.id} className="mt-0.5" />
              <span className="min-w-0"><span className="block break-words font-medium">{option.label}</span>
                {option.hint && <span className="block text-xs text-muted-foreground">{option.hint}</span>}</span>
            </label>)}
          </RadioGroup>
        </fieldset>}
        <label className="block space-y-2 text-sm font-medium"><span className="block">{t('playlistReview.note')}</span>
          <Textarea maxLength={500} rows={3} value={reviewNote} onChange={event => setReviewNote(event.target.value)} />
        </label>
        {review.error && <p role="alert" className="border border-destructive p-3 text-sm text-destructive">
          {t(`suggest.errors.${review.error.message}`, { defaultValue: review.error.message })}
        </p>}
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
