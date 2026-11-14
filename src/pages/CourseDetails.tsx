import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import { useCourse } from '@/features/courses/queries/useCourses';
import { SafeHtml } from '@/components/course/SafeHtml';
import { PageState } from '@/components/layout/PageState';
import { safeExternalUrl } from '@/shared/lib/navigation';

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

export default function CourseDetails() {
  const { slug = '' } = useParams();
  const { t } = useTranslation();
  const query = useCourse(slug);
  if (query.isPending) return <PageState loading />;
  if (query.error) return <PageState title={t('common.error')} description={query.error.message} retry={() => void query.refetch()} />;
  if (!query.data) return <PageState title={t('common.notFound')} description={t('common.notFoundDescription')} />;
  const { course, units, resource } = query.data;
  const plan = safeExternalUrl(course.plan_url);
  const facts = [
    ['code', course.code], ['degree', course.degree_type],
    ['ects', course.ects_total != null ? `${course.ects_total} ECTS` : null],
    ['duration', course.duration_semesters != null ? t('course.semesters', { count: course.duration_semesters }) : null],
    ['institution', course.institution], ['school', course.school],
    ['language', course.language?.toUpperCase()], ['units', String(units.length)],
  ].filter((fact): fact is [string, string] => Boolean(fact[1]));
  const groups = groupUnits(units);
  return <article>
    <Link className="mb-8 inline-flex items-center gap-2 text-sm underline underline-offset-4" to="/courses"><ArrowLeft className="h-4 w-4" />{t('nav.courses')}</Link>
    <header className="border-b border-foreground pb-10">
      <h1 className="max-w-4xl text-4xl font-semibold leading-[1.05] tracking-[-0.03em] sm:text-6xl">{course.title}</h1>
      {course.summary && <p className="mt-6 max-w-prose text-lg leading-relaxed text-muted-foreground">{course.summary}</p>}
    </header>
    <div className="grid gap-12 py-10 lg:grid-cols-[1fr_20rem]">
      <div className="min-w-0">
        <SafeHtml html={course.description_html} />
        {resource && <Link className="mt-6 inline-flex items-center gap-2 font-semibold underline underline-offset-4" to={`/resources/${resource.slug}`}>{resource.title}<ArrowUpRight className="h-4 w-4" /></Link>}
      </div>
      <aside aria-labelledby="facts" className="self-start border border-input lg:sticky lg:top-28">
        <h2 id="facts" className="border-b border-input bg-muted px-5 py-3 text-sm font-semibold">{t('course.facts')}</h2>
        <dl className="divide-y divide-input">{facts.map(([key, value]) => <div key={key} className="flex justify-between gap-4 px-5 py-3 text-sm">
          <dt className="text-muted-foreground">{t(`course.${key}`)}</dt><dd className="text-right font-mono">{value}</dd>
        </div>)}</dl>
        {plan && <a href={plan} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between gap-2 border-t border-input px-5 py-3 text-sm font-semibold hover:bg-primary hover:text-primary-foreground">{t('course.plan')}<ArrowUpRight className="h-4 w-4" /></a>}
      </aside>
    </div>
    <section aria-labelledby="units" className="border-t border-foreground pt-10">
      <h2 id="units" className="text-3xl font-semibold tracking-[-0.02em]">{t('catalog.units')}</h2>
      {!units.length && <PageState level="h3" title={t('catalog.noUnits')} description={t('catalog.noUnitsDescription')} />}
      {groups.map(group => <section key={`${group.year}:${group.semester}`} className="mt-10">
        {(group.year != null || group.semester != null) && <h3 className="mb-2 font-mono text-sm uppercase text-muted-foreground">
          {[group.year != null && t('catalog.year', { value: group.year }), group.semester != null && t('catalog.semester', { value: group.semester })].filter(Boolean).join(' · ')}
        </h3>}
        <ol className="divide-y divide-input border-y border-input">{group.units.map(unit => {
          const linked = unit.learning_objects;
          const visible = linked?.published && ['active', 'published'].includes(linked.status);
          return <li key={unit.id} className="grid gap-3 py-6 sm:grid-cols-[1fr_auto]">
            <div className="min-w-0">
              <h4 className="text-xl font-semibold">{unit.title}</h4>
              {unit.summary && <p className="mt-2 max-w-prose text-muted-foreground">{unit.summary}</p>}
              {unit.description_html && <div className="mt-3"><SafeHtml html={unit.description_html} /></div>}
              {visible && <Link className="mt-4 inline-flex items-center gap-2 font-semibold underline underline-offset-4" to={`/resources/${linked.slug}`}>{linked.title}<ArrowUpRight className="h-4 w-4" /></Link>}
            </div>
            <p className="flex gap-4 font-mono text-xs uppercase text-muted-foreground sm:flex-col sm:items-end sm:gap-1">
              {unit.code && <span>{unit.code}</span>}{unit.ects != null && <span>{unit.ects} ECTS</span>}
            </p>
          </li>;
        })}</ol>
      </section>)}
    </section>
  </article>;
}
