import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ArrowRight, ArrowUpRight, Award, BookOpen, Building2, Clock, GraduationCap, Hash, Languages, Layers, School, type LucideIcon } from 'lucide-react';
import { PageSeo, NoIndex } from '@/components/layout/PageSeo';
import { courseMeta } from '@/shared/seo/seo';
import { useCourse, useFeaturedVideos } from '@/features/courses/queries/useCourses';
import { useCourseCoverage } from '@/features/courses/queries/useCourseCoverage';
import { useLinkedCatalogAssets } from '@/features/courses/queries/useLinkedCatalogAssets';
import { VideoMosaic } from '@/components/resource/VideoMosaic';
import { SafeHtml } from '@/components/course/SafeHtml';
import { CurriculumArchive } from '@/components/course/CurriculumArchive';
import { IfesLearningJourney } from '@/components/course/IfesLearningJourney';
import { PageState } from '@/components/layout/PageState';
import { LearningContext } from '@/components/learning/LearningPathGuide';
import { safeExternalUrl } from '@/shared/lib/navigation';
import { unitPath } from '@/entities/course/course.paths';
import { courseHours, unitHours, ufesElectiveGroup, ufesElectiveGroupOrder, type UfesElectiveGroup } from '@/entities/course/brazilianCurriculum';

type Unit = NonNullable<ReturnType<typeof useCourse>['data']>['units'][number];

function groupUnits(units: Unit[]) {
  const groups = new Map<string, { year: number | null; semester: number | null; electiveGroup: UfesElectiveGroup | null; units: Unit[] }>();
  for (const unit of units) {
    const electiveGroup = ufesElectiveGroup(unit.metadata);
    const key = `${unit.year ?? ''}:${unit.semester ?? ''}:${electiveGroup ?? ''}`;
    if (!groups.has(key)) groups.set(key, { year: unit.year, semester: unit.semester, electiveGroup, units: [] });
    groups.get(key)!.units.push(unit);
  }
  return [...groups.values()].sort((a, b) => (a.year ?? 99) - (b.year ?? 99) || (a.semester ?? 99) - (b.semester ?? 99) || ufesElectiveGroupOrder(a.electiveGroup) - ufesElectiveGroupOrder(b.electiveGroup));
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
  code: Hash, degree: GraduationCap, ects: Award, hours: Clock, duration: Clock, institution: Building2, school: School, language: Languages, units: Layers,
};

export default function CourseDetails() {
  const { slug = '' } = useParams();
  const { t } = useTranslation();
  const query = useCourse(slug);
  const coverage = useCourseCoverage(query.data?.course.id);
  const collections = useLinkedCatalogAssets(query.data?.course.learning_object_id, 'collection');
  const unitObjects = (query.data?.units ?? []).flatMap(unit => unit.learning_object_id ? [unit.learning_object_id] : []);
  const videos = useFeaturedVideos(6, unitObjects, unitObjects.length > 0);
  if (query.isPending) return <PageState loading />;
  if (query.error) return <PageState title={t('common.error')} description={query.error.message} retry={() => void query.refetch()} />;
  if (!query.data) return <><NoIndex /><PageState title={t('common.notFound')} description={t('common.notFoundDescription')} /></>;
  const { course, units, resource } = query.data;
  const otherLabel = course.code === 'UFES-LETRAS-ING-83-2019' ? t('course.availableElectives') : t('course.otherUnits');
  const plan = safeExternalUrl(course.plan_url);
  const facts = [
    ['code', course.code], ['degree', course.degree_type ? t(`course.degreeTypes.${course.degree_type}`, { defaultValue: course.degree_type }) : null],
    ['ects', course.ects_total != null ? `${course.ects_total} ECTS` : null],
    ['hours', course.ects_total == null && courseHours(course.metadata) != null ? `${courseHours(course.metadata)} h` : null],
    ['duration', course.duration_semesters != null ? t('course.semesters', { count: course.duration_semesters }) : null],
    ['institution', course.institution], ['school', course.school],
    ['language', course.language?.toUpperCase()], ['units', String(units.length)],
  ].filter((fact): fact is [string, string] => Boolean(fact[1]));
  const years = groupYears(groupUnits(units));
  const coverageById = new Map((coverage.data ?? []).map(row => [row.curricular_unit_id, row]));
  return <article>
    <PageSeo {...courseMeta(course, { courses: t('nav.courses') })} />
    <Link className="mb-8 inline-flex items-center gap-2 text-sm underline underline-offset-4" to="/courses"><ArrowLeft className="h-4 w-4" />{t('nav.courses')}</Link>
    <header className="border-b border-foreground pb-10">
      <h1 className="max-w-4xl text-4xl font-semibold leading-[1.05] tracking-[-0.03em] sm:text-6xl">{course.title}</h1>
      {course.summary && course.summary.trim() !== course.title.trim() && <p className="mt-6 max-w-prose text-lg leading-relaxed text-muted-foreground">{course.summary}</p>}
    </header>
    <LearningContext focus="course" />
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
    {course.code === 'IFES-CAR-ADM-INT-2026' && <IfesLearningJourney courseSlug={course.slug} />}
    {!!collections.data?.length && <section aria-labelledby="course-collections" className="mb-12 border-t border-foreground pt-9">
      <h2 id="course-collections" className="text-2xl font-semibold tracking-[-0.02em]">{t('courseCollections.title')}</h2>
      <p className="mt-3 max-w-prose text-sm text-muted-foreground">{t('courseCollections.notice')}</p>
      <ul className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {collections.data.map(collection => <li key={collection.id}>
          <Link to={`/resources/${encodeURIComponent(collection.slug)}`} className="group flex h-full flex-col gap-3 border border-input p-5 transition-colors hover:border-foreground">
            <span className="text-lg font-semibold group-hover:underline group-hover:underline-offset-4">{collection.title}</span>
            {collection.description && <span className="line-clamp-3 text-sm text-muted-foreground">{collection.description}</span>}
            <span className="mt-auto inline-flex items-center gap-1 pt-2 text-xs font-semibold">{t('courseCollections.open')}<ArrowUpRight className="h-4 w-4" /></span>
          </Link>
        </li>)}
      </ul>
    </section>}
    <section aria-labelledby="units" className="border-t border-foreground pt-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h2 id="units" className="scroll-mt-28 text-3xl font-semibold tracking-[-0.02em]">{t('course.studyPlan')}</h2>
        {!!units.length && <Link to={`/units?course=${encodeURIComponent(course.slug)}`} className="inline-flex items-center gap-2 text-sm font-semibold underline underline-offset-4">{t('course.filterUnits')}<ArrowRight className="h-4 w-4" /></Link>}
      </div>
      {!!coverage.data?.length && <p className="mt-4 text-sm text-muted-foreground" aria-live="polite">
        {t('course.coverageSummary', { videos: coverage.data.filter(unit => unit.video_count > 0).length, units: units.length, readings: coverage.data.filter(unit => unit.reading_count > 0).length })}
      </p>}
      {!units.length && <PageState level="h3" title={t('catalog.noUnits')} description={t('catalog.noUnitsDescription')} />}
      {years.length > 1 && <nav aria-label={t('course.jumpToYear')} className="mt-6 flex flex-wrap gap-2">
        {years.map(year => <a key={year.key} href={`#year-${year.key}`} className="border border-input px-4 py-1.5 text-sm transition-colors hover:border-foreground hover:bg-brand-cyan hover:text-ink">
          {year.year != null ? t('catalog.year', { value: year.year }) : otherLabel}
        </a>)}
      </nav>}
      {years.map(year => <section key={year.key} id={`year-${year.key}`} aria-labelledby={`year-${year.key}-title`} className="mt-12 scroll-mt-28">
        <h3 id={`year-${year.key}-title`} className="text-2xl font-semibold">{year.year != null ? t('catalog.year', { value: year.year }) : otherLabel}</h3>
        {year.year == null && course.code === 'UFES-LETRAS-ING-83-2019' && <p className="mt-3 max-w-prose text-sm text-muted-foreground">{t('course.ufesElectiveNotice')}</p>}
        <div className="mt-5 grid gap-8 xl:grid-cols-2">
          {year.groups.map(group => {
            const groupLabel = group.electiveGroup && course.code === 'UFES-LETRAS-ING-83-2019'
              ? t(`course.electiveGroups.${group.electiveGroup}`)
              : group.semester != null ? t('catalog.semester', { value: group.semester }) : otherLabel;
            return <section key={`${group.year}:${group.semester}:${group.electiveGroup ?? ''}`} aria-label={groupLabel} className="min-w-0">
              <div className="flex items-baseline justify-between gap-4 border-b border-foreground pb-2">
                <h4 className="font-semibold">{groupLabel}</h4>
                <p className="font-mono text-xs tabular-nums text-muted-foreground">{t('course.termSummary', { count: group.units.length })}</p>
              </div>
              <ol className="divide-y divide-input">{group.units.map(unit => {
                const media = coverageById.get(unit.id);
                const visible = media && (media.video_count > 0 || media.reading_count > 0);
                return <li key={unit.id}>
                  <Link to={unitPath(course.slug, unit.slug)} className="group grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-4 gap-y-1 py-3">
                    <span className="min-w-0">
                      <span className="font-medium group-hover:underline group-hover:underline-offset-4">{unit.title}</span>
                      {visible && <span className="ml-2 inline-grid h-5 w-5 place-items-center bg-brand-mint align-middle text-ink" title={t('course.hasResource')}><BookOpen className="h-3.5 w-3.5" aria-hidden="true" /><span className="sr-only">{t('course.hasResource')}</span></span>}
                      {unit.code && <span className="block font-mono text-xs text-muted-foreground">{unit.code}</span>}
                      {!!media?.video_count && <span className="block text-xs text-muted-foreground">{t('unit.videoChip', { count: media.video_count })}</span>}
                    </span>
                    {unit.ects != null ? <span className="font-mono text-sm tabular-nums text-muted-foreground">{unit.ects} ECTS</span>
                      : unitHours(unit.metadata) != null ? <span className="font-mono text-sm tabular-nums text-muted-foreground">{unitHours(unit.metadata)} h</span> : null}
                  </Link>
                </li>;
              })}</ol>
            </section>;
          })}
        </div>
      </section>)}
    </section>
    {['LGEST', 'UFES-LETRAS-ING-83-2019'].includes(course.code) && <CurriculumArchive courseId={course.id} />}
  </article>;
}
