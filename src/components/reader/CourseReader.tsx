import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, ExternalLink } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageState } from '@/components/layout/PageState';
import { PageSeo } from '@/components/layout/PageSeo';
import { YouTubePlayer } from '@/components/resource/YouTubePlayer';
import { LessonCheckpoint } from './LessonCheckpoint';
import { OdooScreenFigure } from './OdooScreenFigure';
import { TeachingFigure } from './TeachingFigure';
import { useLinkedCatalogAssets } from '@/features/courses/queries/useLinkedCatalogAssets';
import { useModule } from '@/features/modules/useModules';
import type { LearningObject } from '@/entities/course/course.types';
import { lessonNumber, readerPath, readFigure, readCheckpoint, readOdooScreen } from '@/entities/course/lessonReader';
import { youtubeIdFromUrl } from '@/entities/course/video';
import type { StudyModuleDetail } from '@/entities/module/module.api';
import { stringList } from '@/shared/lib/text';
import { safeExternalUrl } from '@/shared/lib/navigation';
import { resourceMeta } from '@/shared/seo/seo';

function shortTitle(title: string) { return title.replace(/^\d+\s*·\s*/, ''); }

function Lesson({ detail }: { detail: StudyModuleDetail }) {
  const { module, items } = detail;
  const { t } = useTranslation(undefined, { lng: module.language });
  const videos = items.filter(item => item.object_type === 'video' && youtubeIdFromUrl(item.source_url));
  const [videoIndex, setVideoIndex] = useState(0);
  const video = videos[videoIndex];
  const videoId = youtubeIdFromUrl(video?.source_url);
  const metadata = module.metadata && typeof module.metadata === 'object' && !Array.isArray(module.metadata) ? module.metadata : {};
  const figure = readFigure(module.metadata);
  const checkpoint = readCheckpoint(module.metadata);
  const screen = readOdooScreen(module.metadata);
  const doc = safeExternalUrl(module.source_url);
  return <div className="space-y-7">
    <p className="max-w-prose text-lg leading-relaxed">{module.description}</p>
    {figure && <TeachingFigure figure={figure} language={module.language} />}
    {typeof metadata.suggested_deliverable === 'string' && <section><h3 className="mb-2 text-xl font-bold">{t('reader.workflow')}</h3><p className="max-w-prose leading-relaxed">{metadata.suggested_deliverable}</p>
      {screen && <OdooScreenFigure screen={screen} language={module.language} />}
    </section>}
    {video && videoId && <section className="space-y-3">
      <h3 className="text-xl font-bold">{t('reader.watch')}</h3>
      {videos.length > 1 && <select aria-label={t('reader.watch')} value={videoIndex} onChange={e => setVideoIndex(Number(e.target.value))} className="min-h-11 w-full rounded border border-input bg-background px-3">
        {videos.map((v, i) => <option key={v.id} value={i}>{v.title} · {v.language.toUpperCase()}</option>)}
      </select>}
      <YouTubePlayer key={videoId} videoId={videoId} title={video.title} thumbnail={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`} />
      <p className="text-sm text-muted-foreground"><a href={video.source_url!} target="_blank" rel="noreferrer" className="underline">{video.title}</a> · {video.language.toUpperCase()}{video.description && <> · {video.description}</>}</p>
    </section>}
    {typeof metadata.activity_prompt === 'string' && <section className="rounded-lg border border-foreground border-l-4 border-l-brand-orange bg-card p-5">
      <h3 className="text-xl font-bold">{t('reader.practice')}</h3><p className="my-3 leading-relaxed">{metadata.activity_prompt}</p>
      {typeof metadata.self_review_criteria === 'string' && <details className="border-t border-input pt-3"><summary className="cursor-pointer py-1 font-semibold">{t('reader.answer')}</summary><p className="mt-3">{metadata.self_review_criteria}</p></details>}
    </section>}
    {checkpoint && <LessonCheckpoint key={module.id} checkpoint={checkpoint} language={module.language} />}
    {doc && <a href={doc} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-semibold underline underline-offset-4">{t('reader.source')}<ExternalLink size={15} aria-hidden="true" /></a>}
  </div>;
}

export default function CourseReader({ course, editions }: { course: LearningObject; editions: Record<string, string> }) {
  const { t } = useTranslation(undefined, { lng: course.language });
  const source = safeExternalUrl(course.source_url);
  const outcomes = stringList(course.objectives);
  const [params, changeParams] = useSearchParams();
  const outline = useLinkedCatalogAssets(course.id, 'module');
  const modules = outline.data ?? [];
  const number = lessonNumber(params.get('lesson'), modules.length);
  const active = modules[number - 1];
  const lesson = useModule(active?.slug ?? '');
  const titleRef = useRef<HTMLHeadingElement>(null);
  const previousSlug = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (active && previousSlug.current && previousSlug.current !== active.slug) {
      titleRef.current?.focus({ preventScroll: true });
      titleRef.current?.scrollIntoView({ block: 'start' });
    }
    previousSlug.current = active?.slug;
  }, [active]);
  function navigateTo(n: number) {
    changeParams(previous => { const next = new URLSearchParams(previous); next.set('lesson', String(n)); return next; });
  }
  return <article lang={course.language} className="pb-8">
    <PageSeo {...resourceMeta(course, null, {resources:t('nav.resources'), type:t('reader.course')})} />
    <header className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-input pb-5">
      <div><div className="flex items-center gap-3"><span className="rounded border border-foreground bg-brand-mint p-2 text-brand-ink"><BookOpen aria-hidden="true" /></span><h1 className="max-w-xl text-xl font-bold">{course.title}</h1></div>
        <details className="mt-2 max-w-prose text-sm"><summary className="cursor-pointer py-1 underline underline-offset-4">{t('reader.about')}</summary>
          <p className="mt-2">{t('reader.training')}</p>
          <ul className="my-3 list-disc space-y-1 pl-5">{outcomes.map(outcome => <li key={outcome}>{outcome}</li>)}</ul>
          {source && <a href={source} target="_blank" rel="noreferrer" className="font-medium underline">{t('reader.syllabus')}</a>}
        </details></div>
      <nav aria-label={t('reader.editions')} className="flex gap-3">{Object.entries(editions).filter(([lang])=>lang!==course.language).map(([lang,slug])=><Link key={lang} lang={lang} to={readerPath(slug,number)} className="inline-flex min-h-10 items-center font-semibold underline underline-offset-4">{new Intl.DisplayNames([lang],{type:'language'}).of(lang)}</Link>)}</nav>
    </header>
    {outline.isError ? <PageState title={t('common.error')} retry={() => void outline.refetch()} />
      : outline.isPending ? <PageState loading /> : !active ? <PageState title={t('common.notFound')} /> : <div className="grid items-start gap-6 lg:grid-cols-[minmax(13rem,18rem)_minmax(0,1fr)] lg:gap-10">
        <aside className="hidden rounded-lg border border-input bg-card lg:block">
          <h2 className="border-b border-input px-4 py-3 font-semibold">{t('reader.contents')}</h2>
          <ol className="max-h-[70vh] overflow-auto p-2">{modules.map((m,i)=><li key={m.id}>
            <Link to={readerPath(course.slug,i+1)} aria-current={i+1===number?'step':undefined}
              className="flex items-baseline gap-3 rounded px-3 py-2 text-sm hover:bg-muted aria-[current=step]:bg-brand-mint aria-[current=step]:font-semibold aria-[current=step]:text-brand-ink">
              <span className="font-mono text-xs">{String(i+1).padStart(2,'0')}</span>{shortTitle(m.title)}</Link></li>)}</ol>
        </aside>
        <div className="min-w-0">
          <label className="mb-4 block text-sm font-semibold lg:hidden">{t('reader.contents')}
            <select className="mt-2 min-h-11 w-full rounded border border-input bg-background px-3" value={number} onChange={e=>navigateTo(Number(e.target.value))}>
              {modules.map((m,i)=><option value={i+1} key={m.id}>{m.title}</option>)}
            </select></label>
          <p className="mb-2 font-mono text-xs uppercase tracking-wide text-muted-foreground">{t('reader.position',{number,total:modules.length})}</p>
          <h2 ref={titleRef} tabIndex={-1} className="mb-4 scroll-mt-20 text-3xl font-bold leading-tight tracking-tight md:text-4xl">{shortTitle(active.title)}</h2>
          {lesson.isError ? <PageState title={t('common.error')} retry={()=>void lesson.refetch()} /> : lesson.isPending ? <PageState loading /> : lesson.data ? <Lesson key={lesson.data.module.id} detail={lesson.data} /> : <PageState title={t('common.notFound')} />}
          <nav aria-label={t('reader.contents')} className="mt-8 flex flex-wrap justify-between gap-3 border-t border-input pt-5">
            {number>1 && <Link className="inline-flex min-h-11 items-center gap-2 rounded border border-input px-4 font-semibold" to={readerPath(course.slug,number-1)}><ArrowLeft size={16} />{t('reader.previous')}</Link>}
            {number<modules.length && <Link className="ml-auto inline-flex min-h-11 items-center gap-2 rounded border border-foreground bg-primary px-4 font-semibold text-primary-foreground" to={readerPath(course.slug,number+1)}>{t('reader.next')}<ArrowRight size={16} /></Link>}
          </nav>
        </div>
      </div>}
  </article>;
}
