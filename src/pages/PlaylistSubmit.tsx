import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, CheckCircle2, ListVideo, ShieldCheck } from 'lucide-react';
import { isPlaylistUrl } from '@/entities/contribution/contribution.api';
import type { PlaylistSubmission } from '@/entities/contribution/contribution.types';
import { useCourseOptions, useMyPlaylists, useSubmitPlaylist, useUnitOptions } from '@/features/contributions/queries/useContributions';
import { LANGUAGES } from '@/components/catalog/CatalogToolbar';
import { StatusBadge } from '@/components/editorial/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { PageState } from '@/components/layout/PageState';

const SELECT = 'h-11 w-full border border-input bg-background px-3 text-sm disabled:cursor-not-allowed disabled:opacity-50';

export default function PlaylistSubmit() {
  const { t, i18n } = useTranslation();
  const [courseId, setCourseId] = useState('');
  const [unitId, setUnitId] = useState('');
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [language, setLanguage] = useState(() => LANGUAGES.some(([code]) => code === i18n.language) ? i18n.language : 'pt');
  const [maxVideos, setMaxVideos] = useState(50);
  const [idsText, setIdsText] = useState('');
  const [response, setResponse] = useState<PlaylistSubmission | null>(null);
  const courses = useCourseOptions();
  const units = useUnitOptions(courseId);
  const mine = useMyPlaylists();
  const submit = useSubmitPlaylist();
  const busy = submit.isPending;
  const errorCode = submit.error?.message ?? '';
  const urlValid = isPlaylistUrl(url);
  const dateFormat = new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium' });

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setResponse(null);
    submit.mutate({ courseId, unitId, url, title, description, language, maxVideos, manualIds: idsText }, { onSuccess: setResponse });
  };

  return <div className="mx-auto max-w-3xl">
    <Link to="/about#contribute" className="mb-8 inline-flex items-center gap-2 text-sm font-semibold underline underline-offset-4">
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />{t('playlistSubmit.back')}
    </Link>
    <header className="mb-10 border-b border-foreground pb-8">
      <div className="mb-3 flex items-center gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center bg-brand-pink text-ink"><ListVideo className="h-6 w-6" aria-hidden="true" /></span>
        <h1 className="text-3xl font-semibold sm:text-4xl">{t('playlistSubmit.title')}</h1>
      </div>
      <p className="max-w-prose text-muted-foreground">{t('playlistSubmit.description')}</p>
    </header>
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="space-y-2 text-sm font-medium">
          <span className="block">{t('playlistSubmit.course')} *</span>
          <select className={SELECT} required value={courseId} disabled={busy || courses.isPending}
            onChange={e => { setCourseId(e.target.value); setUnitId(''); }}>
            <option value="">{t('playlistSubmit.selectCourse')}</option>
            {courses.data?.map(row => <option key={row.id} value={row.id}>{row.code} · {row.title}</option>)}
          </select>
        </label>
        <label className="space-y-2 text-sm font-medium">
          <span className="block">{t('playlistSubmit.unit')} *</span>
          <select className={SELECT} required value={unitId} disabled={!courseId || busy || units.isPending}
            onChange={e => setUnitId(e.target.value)}>
            <option value="">{t('playlistSubmit.selectUnit')}</option>
            {units.data?.map(row => <option key={row.id} value={row.id}>{row.code} · {row.title}</option>)}
          </select>
        </label>
      </div>
      {(courses.error || units.error) && <PageState level="h2" title={t('common.error')}
        description={(courses.error ?? units.error)?.message} retry={() => {
          void courses.refetch();
          if (courseId) void units.refetch();
        }} />}
      <label className="block space-y-2 text-sm font-medium">
        <span className="block">{t('playlistSubmit.url')} *</span>
        <Input type="url" inputMode="url" required maxLength={500} value={url} disabled={busy}
          aria-invalid={!!url.trim() && !urlValid} aria-describedby="playlist-url-hint"
          onChange={e => setUrl(e.target.value)} placeholder="https://www.youtube.com/playlist?list=PL…" />
        <span id="playlist-url-hint" className={`block text-xs font-normal ${url.trim() && !urlValid ? 'text-destructive' : 'text-muted-foreground'}`}>
          {t('playlistSubmit.urlHint')}
        </span>
      </label>
      <label className="block space-y-2 text-sm font-medium">
        <span className="block">{t('playlistSubmit.optionalTitle')}</span>
        <Input maxLength={200} value={title} disabled={busy} onChange={e => setTitle(e.target.value)} />
      </label>
      <label className="block space-y-2 text-sm font-medium">
        <span className="block">{t('playlistSubmit.optionalDescription')}</span>
        <Textarea maxLength={2000} rows={3} value={description} disabled={busy} onChange={e => setDescription(e.target.value)} />
      </label>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="space-y-2 text-sm font-medium">
          <span className="block">{t('playlistSubmit.language')}</span>
          <select className={SELECT} value={language} disabled={busy} onChange={e => setLanguage(e.target.value)}>
            {LANGUAGES.map(([code, label]) => <option key={code} value={code}>{label}</option>)}
          </select>
        </label>
        <label className="space-y-2 text-sm font-medium">
          <span className="block">{t('playlistSubmit.maxVideos')}</span>
          <select className={SELECT} value={maxVideos} disabled={busy} onChange={e => setMaxVideos(Number(e.target.value))}>
            {[10, 25, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
      </div>
      <details className="border border-input p-4">
        <summary className="cursor-pointer text-sm font-semibold">{t('playlistSubmit.manualTitle')}</summary>
        <p className="my-3 text-sm text-muted-foreground">{t('playlistSubmit.manualHint')}</p>
        <Textarea rows={4} value={idsText} disabled={busy} onChange={e => setIdsText(e.target.value)}
          aria-label={t('playlistSubmit.manualTitle')} placeholder={'dQw4w9WgXcQ\n…'} className="font-mono" />
      </details>
      <p className="flex gap-3 border border-input bg-muted/40 p-4 text-sm text-muted-foreground">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-foreground" aria-hidden="true" />{t('playlistSubmit.reviewNotice')}
      </p>
      {submit.error && <p role="alert" className="border border-destructive p-3 text-sm text-destructive">
        {t(`playlistSubmit.errors.${errorCode}`, { defaultValue: errorCode || t('common.error') })}
      </p>}
      <Button type="submit" size="lg" disabled={busy || !courseId || !unitId || !urlValid}>
        {busy ? t('playlistSubmit.sending') : t('playlistSubmit.send')}
      </Button>
    </form>
    {response && <div role="status" className="mt-8 space-y-2 border border-foreground p-5">
      <p className="flex items-center gap-2 font-semibold"><CheckCircle2 className="h-5 w-5" aria-hidden="true" />{t('playlistSubmit.received')}</p>
      <p className="text-sm">{response.title}</p>
      <p className="text-sm text-muted-foreground">{t('playlistSubmit.receivedCounts', {
        count: response.playlist_video_count, linked: response.linked_video_count, missing: response.missing_video_count,
      })}</p>
    </div>}
    <section className="mt-12 border-t border-input pt-8" aria-labelledby="playlist-history">
      <h2 id="playlist-history" className="text-xl font-semibold">{t('playlistSubmit.history')}</h2>
      {mine.isPending ? <PageState loading /> : mine.error
        ? <PageState level="h3" title={t('common.error')} description={mine.error.message} retry={() => void mine.refetch()} />
        : !mine.data.length ? <p className="mt-4 text-sm text-muted-foreground">{t('playlistSubmit.historyEmpty')}</p>
        : <ul className="mt-5 divide-y divide-input border-y border-input">
          {mine.data.map(item => <li key={item.id} className="flex flex-wrap items-start justify-between gap-3 py-4">
            <div className="min-w-0 flex-1">
              <p className="break-words font-medium">{item.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {[item.courses?.code, item.curricular_units?.title].filter(Boolean).join(' · ')}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                <time dateTime={item.submitted_at}>{t('playlistSubmit.submittedOn', { date: dateFormat.format(new Date(item.submitted_at)) })}</time>
              </p>
              {item.review_note && <p className="mt-2 max-w-prose text-sm">{t('studyReview.previousNote')}: {item.review_note}</p>}
            </div>
            <StatusBadge status={item.status} label={t(`playlistSubmit.status.${item.status}`, { defaultValue: item.status })} />
          </li>)}
        </ul>}
    </section>
  </div>;
}
