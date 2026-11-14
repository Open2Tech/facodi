import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle2, ListVideo } from 'lucide-react';
import { supabase } from '@/shared/api/supabase/supabaseClient';
import { getSupabaseErrorMessage } from '@/shared/api/supabase/supabaseErrors';
import { useAuth } from '@/features/auth/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { PageState } from '@/components/layout/PageState';

type Submission = {
  playlist_id: string;
  review_status: string;
  import_status: string;
  playlist_video_count: number;
  linked_video_count: number;
  missing_video_count: number;
  title: string;
};
const YOUTUBE_ID = /^[a-zA-Z0-9_-]{11}$/;
const PLAYLIST_ID = /^[a-zA-Z0-9_-]{10,120}$/;
const YOUTUBE_HOSTS = new Set(['youtube.com', 'www.youtube.com', 'm.youtube.com', 'music.youtube.com', 'youtu.be']);
function validPlaylistUrl(raw: string): boolean {
  try {
    const url = new URL(raw);
    return url.protocol === 'https:' && YOUTUBE_HOSTS.has(url.hostname.toLowerCase())
      && PLAYLIST_ID.test(url.searchParams.get('list') ?? '');
  } catch { return false; }
}
function optionalIds(raw: string): string[] {
  const ids = raw.trim().split(/[\s,;]+/).filter(Boolean);
  if (ids.length > 100 || ids.some(id => !YOUTUBE_ID.test(id))) {
    throw new Error('invalid_youtube_video_ids');
  }
  return [...new Set(ids)];
}
async function submitPlaylist(body: Record<string, unknown>): Promise<Submission> {
  const { data, error } = await supabase.functions.invoke<Submission>('facodi-submit-playlist', { body });
  if (error) {
    let code = error.message;
    const context = 'context' in error ? error.context : null;
    if (context instanceof Response) {
      try {
        const payload: unknown = await context.clone().json();
        if (payload && typeof payload === 'object' && 'error' in payload
          && typeof payload.error === 'string') code = payload.error;
      } catch { /* The backend may return non-JSON errors. */ }
    }
    throw new Error(code);
  }
  if (!data || typeof data.playlist_id !== 'string') throw new Error('playlist_submission_failed');
  return data;
}
export default function PlaylistSubmit() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const client = useQueryClient();
  const [courseId, setCourseId] = useState('');
  const [unitId, setUnitId] = useState('');
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [maxVideos, setMaxVideos] = useState(50);
  const [idsText, setIdsText] = useState('');
  const [response, setResponse] = useState<Submission | null>(null);
  const courses = useQuery({
    queryKey: ['facodi', 'playlist-submit', 'courses'],
    queryFn: async () => {
      const { data, error } = await supabase.from('courses')
        .select('id,code,title').eq('published', true).eq('status', 'active').order('title');
      if (error) throw new Error(getSupabaseErrorMessage(error));
      return data ?? [];
    },
  });
  const units = useQuery({
    queryKey: ['facodi', 'playlist-submit', 'units', courseId],
    enabled: !!courseId,
    queryFn: async () => {
      const { data, error } = await supabase.from('curricular_units')
        .select('id,course_id,code,title')
        .eq('course_id', courseId).eq('published', true).eq('status', 'active')
        .order('year').order('semester').order('position').order('title');
      if (error) throw new Error(getSupabaseErrorMessage(error));
      return data ?? [];
    },
  });
  const myPlaylists = useQuery({
    queryKey: ['facodi', 'playlist-submit', 'mine', user?.id ?? ''],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from('playlists')
        .select('id,title,status,import_status,submitted_at')
        .eq('submitted_by', user!.id)
        .order('submitted_at', { ascending: false }).limit(10);
      if (error) throw new Error(getSupabaseErrorMessage(error));
      return data ?? [];
    },
  });
  const submit = useMutation({
    mutationFn: async () => {
      if (!courseId || !unitId || !validPlaylistUrl(url.trim())) throw new Error('invalid_course_unit_or_youtube_playlist');
      const ids = idsText.trim() ? optionalIds(idsText) : [];
      return submitPlaylist({
        course_id: courseId,
        curricular_unit_id: unitId,
        playlist_url: url.trim(),
        ...(title.trim() ? { title: title.trim() } : {}),
        ...(description.trim() ? { description: description.trim() } : {}),
        language: 'pt',
        max_videos: maxVideos,
        ...(ids.length ? { youtube_video_ids: ids } : {}),
      });
    },
    onSuccess: async (data) => {
      setResponse(data);
      await client.invalidateQueries({ queryKey: ['facodi', 'playlist-submit', 'mine'] });
    },
  });
  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setResponse(null);
    submit.mutate();
  };
  const inputStyle = 'h-11 w-full rounded-md border border-input bg-background px-3 text-sm';
  const busy = submit.isPending;
  const errorCode = submit.error?.message ?? '';
  return <div className="mx-auto max-w-3xl">
    <Link to="/about#contribute" className="mb-8 inline-flex items-center gap-2 text-sm font-semibold underline underline-offset-4">
      <ArrowLeft className="h-4 w-4" />{t('playlistSubmit.back')}
    </Link>
    <header className="mb-10 border-b border-foreground pb-8">
      <div className="mb-3 flex items-center gap-3"><ListVideo className="h-7 w-7" aria-hidden="true" />
        <h1 className="text-3xl font-semibold sm:text-4xl">{t('playlistSubmit.title')}</h1>
      </div>
      <p className="max-w-prose text-muted-foreground">{t('playlistSubmit.description')}</p>
    </header>
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="space-y-2 text-sm font-medium">
          <span>{t('playlistSubmit.course')} *</span>
          <select className={inputStyle} required value={courseId} disabled={busy || courses.isPending}
            onChange={e => { setCourseId(e.target.value); setUnitId(''); }}>
            <option value="">{t('playlistSubmit.selectCourse')}</option>
            {courses.data?.map(row => <option key={row.id} value={row.id}>{row.code} — {row.title}</option>)}
          </select>
        </label>
        <label className="space-y-2 text-sm font-medium">
          <span>{t('playlistSubmit.unit')} *</span>
          <select className={inputStyle} required value={unitId} disabled={!courseId || busy || units.isPending}
            onChange={e => setUnitId(e.target.value)}>
            <option value="">{t('playlistSubmit.selectUnit')}</option>
            {units.data?.map(row => <option key={row.id} value={row.id}>{row.code} — {row.title}</option>)}
          </select>
        </label>
      </div>
      {(courses.error || units.error) && <PageState title={t('common.error')}
        description={(courses.error ?? units.error)?.message ?? t('common.error')} retry={() => {
          void courses.refetch();
          if (courseId) void units.refetch();
        }} />}
      <label className="block space-y-2 text-sm font-medium">
        <span>{t('playlistSubmit.url')} *</span>
        <Input type="url" required maxLength={500} value={url} disabled={busy}
          onChange={e => setUrl(e.target.value)}
          placeholder="https://www.youtube.com/playlist?list=PL..." />
        <span className="block text-xs font-normal text-muted-foreground">{t('playlistSubmit.urlHint')}</span>
      </label>
      <label className="block space-y-2 text-sm font-medium">
        <span>{t('playlistSubmit.optionalTitle')}</span>
        <Input maxLength={200} value={title} disabled={busy} onChange={e => setTitle(e.target.value)} />
      </label>
      <label className="block space-y-2 text-sm font-medium">
        <span>{t('playlistSubmit.optionalDescription')}</span>
        <Textarea maxLength={2000} rows={3} value={description} disabled={busy}
          onChange={e => setDescription(e.target.value)} />
      </label>
      <label className="block space-y-2 text-sm font-medium">
        <span>{t('playlistSubmit.maxVideos')}</span>
        <select className={inputStyle} value={maxVideos} disabled={busy}
          onChange={e => setMaxVideos(Number(e.target.value))}>
          {[10, 25, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
        </select>
      </label>
      <details className="border border-input p-4">
        <summary className="cursor-pointer text-sm font-semibold">{t('playlistSubmit.manualTitle')}</summary>
        <p className="my-3 text-sm text-muted-foreground">{t('playlistSubmit.manualHint')}</p>
        <Textarea rows={4} value={idsText} disabled={busy} onChange={e => setIdsText(e.target.value)}
          placeholder="dQw4w9WgXcQ&#10;..." />
      </details>
      <p className="border-l-4 border-input pl-4 text-sm text-muted-foreground">{t('playlistSubmit.reviewNotice')}</p>
      {submit.error && <p role="alert" className="border border-destructive p-3 text-sm text-destructive">
        {t(`playlistSubmit.errors.${errorCode}`, { defaultValue: errorCode || t('common.error') })}
      </p>}
      <Button type="submit" disabled={busy || !courseId || !unitId || !validPlaylistUrl(url.trim())}>
        {busy ? t('playlistSubmit.sending') : t('playlistSubmit.send')}
      </Button>
    </form>
    {response && <div role="status" className="mt-8 space-y-2 border border-foreground p-5">
      <p className="flex items-center gap-2 font-semibold"><CheckCircle2 className="h-5 w-5" />{t('playlistSubmit.received')}</p>
      <p className="text-sm">{response.title}</p>
      <p className="text-sm text-muted-foreground">{t('playlistSubmit.receivedCounts', {
        count: response.playlist_video_count,
        linked: response.linked_video_count,
        missing: response.missing_video_count,
      })}</p>
      <p className="font-mono text-xs text-muted-foreground">{response.playlist_id}</p>
    </div>}
    <section className="mt-12 border-t border-input pt-8">
      <h2 className="text-xl font-semibold">{t('playlistSubmit.history')}</h2>
      {myPlaylists.isPending ? <PageState loading /> : myPlaylists.error
        ? <p role="alert" className="mt-4 text-sm text-destructive">{myPlaylists.error.message}</p>
        : !myPlaylists.data?.length ? <p className="mt-4 text-sm text-muted-foreground">{t('playlistSubmit.historyEmpty')}</p>
        : <ul className="mt-5 divide-y divide-input border-y border-input">
          {myPlaylists.data.map(item => <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
            <span className="font-medium">{item.title}</span>
            <span className="font-mono text-xs text-muted-foreground">{t(`playlistSubmit.status.${item.status}`, { defaultValue: item.status })}</span>
          </li>)}
        </ul>}
    </section>
  </div>;
}
