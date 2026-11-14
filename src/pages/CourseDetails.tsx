import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ArrowRight, ArrowUpRight, Award, Building2, Clock, GraduationCap, Hash, Languages, Layers, PlayCircle, School, type LucideIcon } from 'lucide-react';
import { useCourse, useFeaturedVideos } from '@/features/courses/queries/useCourses';
import { VideoMosaic } from '@/components/resource/VideoMosaic';
import { SafeHtml } from '@/components/course/SafeHtml';
import { PageState } from '@/components/layout/PageState';
import { safeExternalUrl } from '@/shared/lib/navigation';
import { unitPath } from '@/entities/course/course.paths';

type Unit = NonNullable<ReturnType<typeof useCourse>['data']>['units'][number];

function groupUnits(units: Unit[]) {
  const groups = new Map<string, { year: number | null; semester: number | null; units: Unit[] }>();
  for (const unit of units) {
    const key = `${unit.year ?? ''}:${unit.semester ?? ''}`;
    if (!groups.has(key)) groups.set(key, { year: unit.year, semester: unit.semester, units: [] });
    groups.get(key)!.units.push(unit);
  }
  return [...groups.values()].sort((a, b) => (a.year ?? 99) - (b.year ?? 99) || (a.semester ?? 99) - (b.semester ?? 99));
}

function groupYears(groups: ReturnType<typeof groupUnits>) {
  const years = new Map<string, { key: string; year: number | null; groups: typeof groups }>();
  for (const group of groups) {
    const key = group.year != null ? String(group.year) : 'other';
    if (!years.has(key)) years.set(key, { key, year: group.year, groups: [] });
    years.get(key)!.groups.push(group);
  }
  return [...years.values()];
}

const FACT_ICONS: Record<string, LucideIcon> = {
  code: Hash, degree: GraduationCap, ects: Award, duration: Clock, institution: Building2, school: School, language: Languages, units: Layers,
};

export default function CourseDetails() {
  const { slug = '' } = useParams();
  const { t } = useTranslation();
  const query = useCourse(slug);
  const unitObjects = (query.data?.units ?? []).flatMap(unit => unit.learning_object_id ? [unit.learning_object_id] : []);
  const videos = useFeaturedVideos(6, unitObjects, unitObjects.length > 0);
  if (query.isPending) return <PageState loading />;
  if (query.error) return <PageState title={t('common.error')} description={query.error.message} retry={() => void query.refetch()} />;
  if (!query.data) return <PageState title={t('common.notFound')} description={t('common.notFoundDescription')} />;
  const { course, units, resource } = query.data;
  const plan = safeExternalUrl(course.plan_url);
  const facts = [
    ['code', course.code], ['degree', course.degree_type ? t(`course.degreeTypes.${course.degree_type}`, { defaultValue: course.degree_type }) : null],
    ['ects', course.ects_total != null ? `${course.ects_total} ECTS` : null],
    ['duration', course.duration_semesters != null ? t('course.semesters', { count: course.duration_semesters }) : null],
    ['institution', course.institution], ['school', course.school],
    ['language', course.language?.toUpperCase()], ['units', String(units.length)],
  ].filter((fact): fact is [string, string] => Boolean(fact[1]));
  const years = groupYears(groupUnits(units));
  return <article>
    <Link className="mb-8 inline-flex items-center gap-2 text-sm underline underline-offset-4" to="/courses"><ArrowLeft className="h-4 w-4" />{t('nav.courses')}</Link>
    <header className="border-b border-foreground pb-10">
      <h1 className="max-w-4xl text-4xl font-semibold leading-[1.05] tracking-[-0.03em] sm:text-6xl">{course.title}</h1>
      {course.summary && course.summary.trim() !== course.title.trim() && <p className="mt-6 max-w-prose text-lg leading-relaxed text-muted-foreground">{course.summary}</p>}
    </header>
    <div className="grid gap-12 py-10 lg:grid-cols-[1fr_20rem]">
      <div className="min-w-0">
        {course.description_html ? <SafeHtml html={course.description_html} />
          : !!units.length && <p className="max-w-prose text-lg leading-relaxed">{t('course.planIntro', { count: units.length, years: years.filter(year => year.year != null).length })}</p>}
        {resource && <Link className="mt-6 inline-flex items-center gap-2 font-semibold underline underline-offset-4" to={`/resources/${resource.slug}`}>{resource.title}<ArrowUpRight className="h-4 w-4" /></Link>}
      </div>
      <aside aria-labelledby="facts" className="self-start border border-input lg:sticky lg:top-28">
        <h2 id="facts" className="border-b border-foreground bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground">{t('course.facts')}</h2>
        <dl className="divide-y divide-input">{facts.map(([key, value]) => <div key={key} className="flex justify-between gap-4 px-5 py-3 text-sm">
          <dt className="flex items-center gap-2 text-muted-foreground">{(() => { const Icon = FACT_ICONS[key]; return Icon && <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />; })()}{t(`course.${key}`)}</dt><dd className="text-right font-mono tabular-nums">{value}</dd>
        </div>)}</dl>
        {plan && <a href={plan} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between gap-2 border-t border-input px-5 py-3 text-sm font-semibold hover:bg-primary hover:text-primary-foreground">{t('course.plan')}<ArrowUpRight className="h-4 w-4" /></a>}
      </aside>
    </div>
    {!!videos.data?.length && <VideoMosaic id="course-videos" className="mb-12" title={t('course.videosTitle')} description={t('course.videosText', { count: units.length })} videos={videos.data}
      action={<a href="#units" className="inline-flex items-center gap-2 text-sm font-semibold text-primary underline underline-offset-4">{t('course.studyPlan')}<ArrowRight className="h-4 w-4" aria-hidden="true" /></a>} />}
    <section aria-labelledby="units" className="border-t border-foreground pt-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h2 id="units" className="scroll-mt-28 text-3xl font-semibold tracking-[-0.02em]">{t('course.studyPlan')}</h2>
        {!!units.length && <Link to={`/units?course=${encodeURIComponent(course.slug)}`} className="inline-flex items-center gap-2 text-sm font-semibold underline underline-offset-4">{t('course.filterUnits')}<ArrowRight className="h-4 w-4" /></Link>}
      </div>
      {!units.length && <PageState level="h3" title={t('catalog.noUnits')} description={t('catalog.noUnitsDescription')} />}
      {years.length > 1 && <nav aria-label={t('course.jumpToYear')} className="mt-6 flex flex-wrap gap-2">
        {years.map(year => <a key={year.key} href={`#year-${year.key}`} className="border border-input px-4 py-1.5 text-sm transition-colors hover:border-foreground hover:bg-brand-cyan hover:text-ink">
          {year.year != null ? t('catalog.year', { value: year.year }) : t('course.otherUnits')}
        </a>)}
      </nav>}
      {years.map(year => <section key={year.key} id={`year-${year.key}`} aria-labelledby={`year-${year.key}-title`} className="mt-12 scroll-mt-28">
        <h3 id={`year-${year.key}-title`} className="text-2xl font-semibold">{year.year != null ? t('catalog.year', { value: year.year }) : t('course.otherUnits')}</h3>
        <div className="mt-5 grid gap-8 xl:grid-cols-2">
          {year.groups.map(group => {
            return <section key={`${group.year}:${group.semester}`} aria-label={group.semester != null ? t('catalog.semester', { value: group.semester }) : t('course.otherUnits')} className="min-w-0">
              <div className="flex items-baseline justify-between gap-4 border-b border-foreground pb-2">
                <h4 className="font-semibold">{group.semester != null ? t('catalog.semester', { value: group.semester }) : t('course.otherUnits')}</h4>
                <p className="font-mono text-xs tabular-nums text-muted-foreground">{t('course.termSummary', { count: group.units.length })}</p>
              </div>
              <ol className="divide-y divide-input">{group.units.map(unit => {
                const linked = unit.learning_objects;
                const visible = linked?.published && ['active', 'published'].includes(linked.status);
                return <li key={unit.id}>
                  <Link to={unitPath(course.slug, unit.slug)} className="group grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-4 gap-y-1 py-3">
                    <span className="min-w-0">
                      <span className="font-medium group-hover:underline group-hover:underline-offset-4">{unit.title}</span>
                      {visible && <span className="ml-2 inline-grid h-5 w-5 place-items-center bg-brand-mint align-middle text-ink" title={t('course.hasResource')}><PlayCircle className="h-3.5 w-3.5" aria-hidden="true" /><span className="sr-only">{t('course.hasResource')}</span></span>}
                      {unit.code && <span className="block font-mono text-xs text-muted-foreground">{unit.code}</span>}
                    </span>
                    {unit.ects != null && <span className="font-mono text-sm tabular-nums text-muted-foreground">{unit.ects} ECTS</span>}
                  </Link>
                </li>;
              })}</ol>
            </section>;
          })}
        </div>
      </section>)}
    </section>
  </article>;
}
