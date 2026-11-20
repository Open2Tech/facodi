import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, BookOpenCheck, FileSearch, Globe, Lightbulb, Link2, RotateCcw, Scale, ShieldCheck } from 'lucide-react';
import { unitPath } from '@/entities/course/course.paths';
import { classifyLicense, parseSuggestionTags, rankUnits, recognizeUrl, type Recognition } from '@/entities/suggestion/recognition';
import { baseMetadata } from '@/entities/suggestion/metadata';
import { parseScreening } from '@/entities/suggestion/suggestion.api';
import { PROVIDERS, SUGGESTION_TYPES, type SuggestionSummary } from '@/entities/suggestion/suggestion.types';
import { useMySuggestions, usePublicMetadata, useSubmitSuggestion, useSuggestionUnits } from '@/features/suggestions/queries/useSuggestions';
import { resourceSuggestionSchema, type ResourceSuggestionFormValues } from '@/shared/lib/validation';
import { LANGUAGES } from '@/components/catalog/CatalogToolbar';
import { TypeBadge } from '@/components/catalog/TypeBadge';
import { StatusBadge } from '@/components/editorial/StatusBadge';
import { FormField } from '@/components/auth/FormField';
import { PageState } from '@/components/layout/PageState';
import { RecognitionPipeline } from '@/components/suggestion/RecognitionPipeline';
import { useStagedReveal, type Stage } from '@/components/suggestion/useStagedReveal';
import { RecommendationBadge } from '@/components/suggestion/RecommendationBadge';
import { ScreeningSignals } from '@/components/suggestion/ScreeningSignals';
import { SuggestionHistory } from '@/components/suggestion/SuggestionHistory';
import { UnitMatchPicker } from '@/components/suggestion/UnitMatchPicker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LegalRichText } from '@/components/legal/LegalRichText';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

const SELECT = 'h-11 w-full border border-input bg-background px-3 text-sm disabled:cursor-not-allowed disabled:opacity-50';
/** A word-overlap match is preselected only when it shares at least half of the vocabulary. */
const PRESELECT_SCORE = 50;
const EMPTY: ResourceSuggestionFormValues = {
  title: '', author: '', license: '', objectType: 'external_resource', language: '', tags: '', courseId: '', unitId: '', note: '',
  licenseDeclared: false as true, attributionDeclared: false as true,
};
const LICENSE_FILLS = { open: 'bg-brand-mint', restricted: 'bg-brand-coral', unknown: 'bg-muted' } as const;

export default function SuggestResource() {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const contextUnitId = z.uuid().safeParse(params.get('unit')).data?.toLowerCase();
  const [urlDraft, setUrlDraft] = useState('');
  const [urlError, setUrlError] = useState(false);
  const [run, setRun] = useState<{ recognition: Recognition; key: string } | null>(null);
  const [verdict, setVerdict] = useState<SuggestionSummary | null>(null);
  const verdictRef = useRef<HTMLDivElement>(null);
  const recognition = run?.recognition ?? null;
  const metadata = usePublicMetadata(recognition);
  const units = useSuggestionUnits(contextUnitId);
  const contextUnit = contextUnitId ? units.data?.find(unit => unit.id === contextUnitId) : undefined;
  const mine = useMySuggestions();
  const submit = useSubmitSuggestion();
  const form = useForm<ResourceSuggestionFormValues>({ resolver: zodResolver(resourceSuggestionSchema), defaultValues: EMPTY });
  const { errors } = form.formState;

  const metadataSettled = !!recognition && !metadata.isFetching;
  const extracted = useMemo(() => recognition && metadataSettled ? metadata.data ?? baseMetadata(recognition) : null,
    [recognition, metadataSettled, metadata.data]);
  const alreadyMine = !!recognition && !!mine.data?.some(item => item.canonical_url === recognition.canonicalUrl);
  const [title, tags, license, courseId, unitId] = form.watch(['title', 'tags', 'license', 'courseId', 'unitId']);
  const matches = useMemo(() => rankUnits(`${title} ${tags} ${extracted?.description ?? ''}`, units.data ?? []),
    [title, tags, extracted?.description, units.data]);
  const licenseClass = classifyLicense(license);
  const providerName = (provider: string) => t(`suggest.providers.${provider}`, { defaultValue: provider });

  // Prefill the editable form once per analysed URL, as soon as the recognition data is known.
  const prefilled = useRef<string | null>(null);
  useEffect(() => {
    if (!run || !extracted || units.isPending || prefilled.current === run.key) return;
    prefilled.current = run.key;
    const top = rankUnits(`${extracted.title} ${extracted.tags.join(' ')} ${extracted.description}`, units.data ?? [])[0];
    const preselect = contextUnit ?? (top && top.score >= PRESELECT_SCORE ? top.unit : null);
    form.reset({
      ...EMPTY,
      title: extracted.title, author: extracted.author, license: extracted.license, objectType: extracted.objectType,
      language: (LANGUAGES.some(([code]) => code === extracted.language) ? extracted.language : '') as ResourceSuggestionFormValues['language'],
      tags: extracted.tags.join(', '), courseId: preselect?.course.id ?? '', unitId: preselect?.id ?? '',
    });
  }, [run, extracted, contextUnit, units.isPending, units.data, form]);

  const extractedLicense = extracted ? classifyLicense(extracted.license) : 'unknown';
  const initialTop = extracted && units.data ? rankUnits(`${extracted.title} ${extracted.tags.join(' ')} ${extracted.description}`, units.data)[0] : undefined;
  const stages: Stage[] = recognition ? [
    { key: 'source', icon: Link2, label: t('suggest.stages.source'), state: alreadyMine ? 'blocked' : recognition.provider === 'web' ? 'attention' : 'done',
      detail: alreadyMine ? t('suggest.stages.sourceMine') : recognition.provider === 'web' ? t('suggest.stages.sourceGeneric') : providerName(recognition.provider) },
    { key: 'metadata', icon: FileSearch, label: t('suggest.stages.metadata'), state: !metadataSettled ? 'running' : metadata.data ? 'done' : 'attention',
      detail: metadata.data ? t('suggest.stages.metadataFound') : metadata.error ? t('suggest.stages.metadataFailed') : t('suggest.stages.metadataManual') },
    { key: 'license', icon: Scale, label: t('suggest.stages.license'), state: !metadataSettled ? 'waiting' : extractedLicense === 'open' ? 'done' : extractedLicense === 'restricted' ? 'blocked' : 'attention',
      detail: extracted?.license ? `${extracted.license} · ${t(`suggest.licenseClass.${extractedLicense}`)}` : t('suggest.stages.licenseMissing') },
    { key: 'unit', icon: BookOpenCheck, label: t('suggest.stages.unit'), state: !metadataSettled || units.isPending ? 'running' : initialTop ? 'done' : 'attention',
      detail: initialTop ? t('suggest.stages.unitFound', { unit: initialTop.unit.title, score: initialTop.score }) : t('suggest.stages.unitNone') },
  ] : [];
  const reveal = useStagedReveal(stages, run?.key ?? null);
  const showForm = reveal.complete && !!extracted && !verdict;

  const analyse = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const next = recognizeUrl(urlDraft);
    setUrlError(!next);
    if (!next) return;
    submit.reset();
    setVerdict(null);
    setRun({ recognition: next, key: `${next.canonicalUrl}#${Date.now()}` });
  };
  const restart = () => {
    setRun(null); setVerdict(null); setUrlDraft(''); submit.reset(); form.reset(EMPTY); prefilled.current = null;
  };
  const onSubmit = form.handleSubmit(values => {
    if (!recognition || alreadyMine) return;
    submit.mutate({
      url: urlDraft.trim(), title: values.title, author: values.author, license: values.license,
      thumbnailUrl: extracted?.thumbnail ?? null, objectType: values.objectType, language: values.language,
      tags: parseSuggestionTags(values.tags), courseId: values.courseId, unitId: values.unitId, note: values.note,
    }, { onSuccess: data => setVerdict(data) });
  });
  useEffect(() => { if (verdict) verdictRef.current?.focus(); }, [verdict]);

  const errorCode = submit.error?.message ?? '';
  const screening = verdict ? parseScreening(verdict.screening) : null;
  const busy = submit.isPending;

  return <div>
    <Link to={contextUnit ? unitPath(contextUnit.course.slug, contextUnit.slug) : '/about#contribute'}
      className="mb-8 inline-flex items-center gap-2 text-sm font-semibold underline underline-offset-4">
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />{t(contextUnit ? 'suggest.backToUnit' : 'suggest.back')}
    </Link>
    <header className="mb-10 max-w-3xl">
      <div className="mb-3 flex items-center gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center bg-brand-cyan text-ink"><Lightbulb className="h-6 w-6" aria-hidden="true" /></span>
        <h1 className="text-3xl font-semibold sm:text-4xl">{t('suggest.title')}</h1>
      </div>
      <p className="max-w-prose text-muted-foreground">{t('suggest.description')}</p>
      {contextUnit && <p className="mt-4 max-w-prose border-l-4 border-primary pl-3 text-sm">
        {t('suggest.unitContext', { unit: contextUnit.title, course: contextUnit.course.title })}
      </p>}
    </header>
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)]">
      <div className="min-w-0 space-y-8">
        <form onSubmit={analyse} noValidate className="border border-foreground p-5 sm:p-6">
          <label htmlFor="suggest-url" className="block text-sm font-semibold">{t('suggest.url')}</label>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row">
            <Input id="suggest-url" type="url" inputMode="url" maxLength={2048} value={urlDraft} placeholder="https://"
              aria-invalid={urlError} aria-describedby="suggest-url-hint" className="font-mono"
              onChange={event => { setUrlDraft(event.target.value); setUrlError(false); }} />
            <Button type="submit" size="lg" className="shrink-0" disabled={!urlDraft.trim() || busy}>
              <FileSearch aria-hidden="true" />{t('suggest.analyse')}
            </Button>
          </div>
          <p id="suggest-url-hint" role={urlError ? 'alert' : undefined} className={cn('mt-2 text-sm', urlError ? 'text-destructive' : 'text-muted-foreground')}>
            {urlError ? t('suggest.urlInvalid') : t('suggest.urlHint')}
          </p>
          <ul className="mt-4 flex flex-wrap gap-2" aria-label={t('suggest.providersLabel')}>
            {PROVIDERS.filter(provider => provider !== 'web').map(provider => {
              const active = recognition?.provider === provider;
              return <li key={provider} className={cn('border px-2 py-1 font-mono text-xs transition-colors',
                active ? 'border-foreground bg-primary text-ink' : 'border-input text-muted-foreground')}>
                {providerName(provider)}{active && <span className="sr-only"> · {t('suggest.detected')}</span>}
              </li>;
            })}
            <li className={cn('flex items-center gap-1 border px-2 py-1 font-mono text-xs',
              recognition?.provider === 'web' ? 'border-foreground bg-primary text-ink' : 'border-input text-muted-foreground')}>
              <Globe className="h-3 w-3" aria-hidden="true" />{providerName('web')}
            </li>
          </ul>
          <Link to="/playlists/submit" className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold underline underline-offset-4">
            {t('suggest.playlistLink')}
          </Link>
        </form>

        {recognition && <section aria-labelledby="suggest-recognition">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="suggest-recognition" className="text-xl font-semibold">{t('suggest.recognition')}</h2>
            <span className="max-w-full break-all font-mono text-xs text-muted-foreground">{recognition.canonicalUrl}</span>
          </div>
          <RecognitionPipeline stages={reveal.stages} label={t('suggest.recognition')} />
          {units.error && <PageState level="h3" title={t('common.error')} description={units.error.message} retry={() => void units.refetch()} />}
        </section>}

        {showForm && <form onSubmit={onSubmit} noValidate className="space-y-8 motion-safe:animate-rise" aria-labelledby="suggest-details">
          <h2 id="suggest-details" className="text-xl font-semibold">{t('suggest.details')}</h2>
          <div className="grid gap-6 sm:grid-cols-[10rem_minmax(0,1fr)]">
            <div className="aspect-video w-full overflow-hidden border border-input bg-muted sm:aspect-square">
              {extracted?.thumbnail
                ? <img src={extracted.thumbnail} alt="" referrerPolicy="no-referrer" loading="lazy" decoding="async" className="h-full w-full object-cover" />
                : <span className="grid h-full place-items-center text-muted-foreground"><Link2 className="h-8 w-8" aria-hidden="true" /></span>}
            </div>
            <div className="min-w-0 space-y-5">
              <FormField label={`${t('suggest.fields.title')} *`} error={errors.title?.message}>
                {props => <Input {...props} maxLength={200} {...form.register('title')} />}
              </FormField>
              <FormField label={t('suggest.fields.author')} error={errors.author?.message}>
                {props => <Input {...props} maxLength={160} {...form.register('author')} />}
              </FormField>
            </div>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField label={t('suggest.fields.license')} error={errors.license?.message} hint={t('suggest.licenseHint')}>
              {props => <div className="flex items-center gap-2">
                <Input {...props} maxLength={80} className="font-mono" placeholder="CC BY 4.0" {...form.register('license')} />
                <span className={cn('shrink-0 px-2 py-1 text-xs font-semibold text-ink', LICENSE_FILLS[licenseClass])} aria-live="polite">
                  {t(`suggest.licenseClass.${licenseClass}`)}
                </span>
              </div>}
            </FormField>
            <FormField label={t('suggest.fields.type')}>
              {props => <div className="flex items-center gap-2">
                <select {...props} className={SELECT} {...form.register('objectType')}>
                  {(recognition?.youtubeId ? ['video' as const] : SUGGESTION_TYPES).map(type => <option key={type} value={type}>{t(`objectTypes.${type}`)}</option>)}
                </select>
                <TypeBadge type={form.watch('objectType')} label={t(`objectTypes.${form.watch('objectType')}`)} className="hidden shrink-0 sm:inline-flex" />
              </div>}
            </FormField>
            <FormField label={t('suggest.fields.language')}>
              {props => <select {...props} className={SELECT} {...form.register('language')}>
                <option value="">{t('suggest.languageUnknown')}</option>
                {LANGUAGES.map(([code, label]) => <option key={code} value={code}>{label}</option>)}
              </select>}
            </FormField>
            <FormField label={t('suggest.fields.tags')} hint={t('suggest.tagsHint')} error={errors.tags?.message}>
              {props => <Input {...props} maxLength={400} {...form.register('tags')} />}
            </FormField>
          </div>
          <UnitMatchPicker units={units.data ?? []} matches={matches} courseId={courseId} unitId={unitId} disabled={busy}
            onChange={next => {
              form.setValue('courseId', next.courseId, { shouldDirty: true });
              form.setValue('unitId', next.unitId, { shouldDirty: true });
            }} />
          <FormField label={t('suggest.fields.note')} error={errors.note?.message}
            hint={t('suggest.noteCount', { length: form.watch('note').length })}>
            {props => <Textarea {...props} rows={3} maxLength={500} {...form.register('note')} />}
          </FormField>
          <fieldset className="space-y-3 border border-input bg-muted/40 p-4">
            <legend className="px-1 text-sm font-semibold">{t('suggest.declarations')}</legend>
            {(['licenseDeclared', 'attributionDeclared'] as const).map(field => <label key={field} className="flex items-start gap-3 text-sm">
              <input type="checkbox" className="mt-0.5 h-4 w-4 shrink-0 accent-foreground" aria-invalid={!!errors[field]} {...form.register(field)} />
              <span>{t(`suggest.${field}`)}</span>
            </label>)}
            {(errors.licenseDeclared || errors.attributionDeclared) && <p role="alert" className="text-sm text-destructive">{t('suggest.errors.declaration')}</p>}
          </fieldset>
          <p className="text-sm text-muted-foreground"><LegalRichText text={t('suggest.legalNote')} /></p>
          {submit.error && <p role="alert" className="border border-destructive p-3 text-sm text-destructive">
            {t(`suggest.errors.${errorCode}`, { defaultValue: errorCode || t('common.error') })}
          </p>}
          <div className="flex flex-wrap gap-3">
            <Button type="submit" size="lg" disabled={busy || alreadyMine}>
              <ShieldCheck aria-hidden="true" />{busy ? t('suggest.sending') : t('suggest.send')}
            </Button>
            <Button type="button" variant="outline" size="lg" onClick={restart} disabled={busy}>{t('suggest.restart')}</Button>
          </div>
        </form>}

        {verdict && screening && <div ref={verdictRef} tabIndex={-1} role="status"
          className="border border-foreground p-5 outline-none focus-visible:ring-2 focus-visible:ring-ring motion-safe:animate-rise sm:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={verdict.status} label={t(`suggest.status.${verdict.status}`)} />
            <RecommendationBadge recommendation={screening.recommendation} />
          </div>
          <h2 className="mt-4 text-2xl font-semibold">{t(verdict.status === 'duplicate' ? 'suggest.verdict.duplicateTitle' : 'suggest.verdict.title')}</h2>
          <p className="mt-2 max-w-prose text-muted-foreground">{t(`suggest.verdict.${screening.recommendation}`)}</p>
          {verdict.status === 'pending' && <p className="mt-2 max-w-prose text-muted-foreground">{t('suggest.verdict.analysis')}</p>}
          <ScreeningSignals className="mt-5" screening={screening} provider={verdict.provider} />
          <Button type="button" variant="outline" className="mt-6" onClick={restart}><RotateCcw aria-hidden="true" />{t('suggest.another')}</Button>
        </div>}
      </div>

      <aside className="space-y-10">
        <section aria-labelledby="suggest-history">
          <h2 id="suggest-history" className="text-lg font-semibold">{t('suggest.history')}</h2>
          <SuggestionHistory />
        </section>
        <section aria-labelledby="suggest-criteria" className="border-t border-input pt-6">
          <h2 id="suggest-criteria" className="text-lg font-semibold">{t('suggest.criteria.title')}</h2>
          <dl className="mt-4 space-y-4 text-sm">
            {(['fast_track', 'review', 'reject'] as const).map(item => <div key={item}>
              <dt><RecommendationBadge recommendation={item} /></dt>
              <dd className="mt-2 text-muted-foreground">{t(`suggest.criteria.${item}`)}</dd>
            </div>)}
          </dl>
          <p className="mt-5 text-sm text-muted-foreground">{t('suggest.criteria.manual')}</p>
        </section>
      </aside>
    </div>
  </div>;
}
