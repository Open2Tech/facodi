import { ArrowLeft, ArrowRight, ArrowUpRight, ChevronRight } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useUnit } from '@/features/courses/queries/useCourses';
import { useContributePath } from '@/features/auth/useContributePath';
import { SafeHtml } from '@/components/course/SafeHtml';
import { PageState } from '@/components/layout/PageState';
import { unitPath } from '@/entities/course/course.paths';

export default function UnitDetails() {
  const { slug = '', unit: unitSlug = '' } = useParams();
  const { t } = useTranslation();
  const query = useUnit(slug, unitSlug);
  const contribute = useContributePath();
  if (query.isPending) return <PageState loading />;
  if (query.error) return <PageState title={t('common.error')} description={query.error.message} retry={() => void query.refetch()} />;
  if (!query.data) return <PageState title={t('common.notFound')} description={t('common.notFoundDescription')} />;
  const { course, unit, outline } = query.data;
  const index = outline.findIndex(item => item.id === unit.id);
  const previous = index > 0 ? outline[index - 1] : null;
  const next = index >= 0 && index < outline.length - 1 ? outline[index + 1] : null;
  const siblings = outline.filter(item => item.id !== unit.id && item.year === unit.year && item.semester === unit.semester);
  const linked = unit.learning_objects;
  const resource = linked?.published && ['active', 'published'].includes(linked.status) ? linked : null;
  const facts = [
    ['code', unit.code],
    ['ects', unit.ects != null ? `${unit.ects} ECTS` : null],
    ['yearLabel', unit.year != null ? String(unit.year) : null],
    ['semesterLabel', unit.semester != null ? String(unit.semester) : null],
    ['language', unit.language?.toUpperCase()],
    ['institution', course.institution],
  ].filter((fact): fact is [string, string] => Boolean(fact[1]));
  return <article>
    <nav aria-label={t('unit.breadcrumb')} className="mb-8 text-sm">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-muted-foreground">
        <li><Link className="underline underline-offset-4 hover:text-foreground" to="/units">{t('nav.units')}</Link></li>
        <li aria-hidden="true"><ChevronRight className="h-3.5 w-3.5" /></li>
        <li><Link className="underline underline-offset-4 hover:text-foreground" to={`/courses/${course.slug}`}>{course.code || course.title}</Link></li>
        <li aria-hidden="true"><ChevronRight className="h-3.5 w-3.5" /></li>
        <li aria-current="page" className="text-foreground">{unit.code || unit.title}</li>
      </ol>
    </nav>
    <header className="border-b border-foreground pb-10">
      <h1 className="max-w-4xl text-4xl font-semibold leading-[1.05] tracking-[-0.03em] [text-wrap:balance] sm:text-6xl">{unit.title}</h1>
      <p className="mt-5 text-lg">
        <Link to={`/courses/${course.slug}`} className="font-semibold underline decoration-2 underline-offset-4">{course.title}</Link>
      </p>
      {unit.summary && <p className="mt-4 max-w-prose text-lg leading-relaxed text-muted-foreground">{unit.summary}</p>}
    </header>
    <div className="grid gap-12 py-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="min-w-0 space-y-12">
        {unit.description_html && <SafeHtml html={unit.description_html} />}
        <section aria-labelledby="unit-resources">
          <h2 id="unit-resources" className="text-2xl font-semibold tracking-[-0.02em]">{t('unit.resources')}</h2>
          {resource
            ? <Link className="mt-4 flex items-center justify-between gap-4 border border-input p-5 font-semibold transition-colors hover:border-foreground" to={`/resources/${resource.slug}`}>{resource.title}<ArrowUpRight className="h-4 w-4 shrink-0" /></Link>
            : <div className="mt-4 border border-input bg-muted/40 p-6">
              <p className="font-semibold">{t('unit.noResources')}</p>
              <p className="mt-2 max-w-prose text-sm text-muted-foreground">{t('unit.noResourcesText')}</p>
              <Link to={contribute} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold underline underline-offset-4">{t('units.contribute')}<ArrowRight className="h-4 w-4" /></Link>
            </div>}
        </section>
        {!!siblings.length && <section aria-labelledby="unit-siblings">
          <h2 id="unit-siblings" className="text-2xl font-semibold tracking-[-0.02em]">{t('unit.sameTerm', { year: unit.year, semester: unit.semester })}</h2>
          <ul className="mt-4 divide-y divide-input border-y border-input">
            {siblings.map(item => <li key={item.id}>
              <Link to={unitPath(course.slug, item.slug)} className="flex items-baseline justify-between gap-4 py-4 hover:underline hover:underline-offset-4">
                <span className="font-medium">{item.title}</span>
                {item.ects != null && <span className="shrink-0 font-mono text-sm tabular-nums text-muted-foreground">{item.ects} ECTS</span>}
              </Link>
            </li>)}
          </ul>
        </section>}
      </div>
      <aside aria-labelledby="unit-facts" className="self-start border border-input lg:sticky lg:top-28">
        <h2 id="unit-facts" className="border-b border-input bg-muted px-5 py-3 text-sm font-semibold">{t('unit.facts')}</h2>
        <dl className="divide-y divide-input">{facts.map(([key, value]) => <div key={key} className="flex justify-between gap-4 px-5 py-3 text-sm">
          <dt className="text-muted-foreground">{t(`course.${key}`)}</dt><dd className="text-right font-mono tabular-nums">{value}</dd>
        </div>)}</dl>
        <Link to={`/units?course=${encodeURIComponent(course.slug)}`} className="flex items-center justify-between gap-2 border-t border-input px-5 py-3 text-sm font-semibold hover:bg-primary hover:text-primary-foreground">{t('unit.allInCourse')}<ArrowRight className="h-4 w-4" /></Link>
      </aside>
    </div>
    {(previous || next) && <nav aria-label={t('unit.sequence')} className="grid gap-4 border-t border-foreground pt-8 sm:grid-cols-2">
      {previous ? <Link to={unitPath(course.slug, previous.slug)} className="group flex flex-col gap-1 border border-input p-5 transition-colors hover:border-foreground">
        <span className="inline-flex items-center gap-2 text-sm text-muted-foreground"><ArrowLeft className="h-4 w-4" />{t('unit.previous')}</span>
        <span className="font-semibold group-hover:underline group-hover:underline-offset-4">{previous.title}</span>
      </Link> : <span />}
      {next && <Link to={unitPath(course.slug, next.slug)} className="group flex flex-col gap-1 border border-input p-5 text-right transition-colors hover:border-foreground">
        <span className="inline-flex items-center justify-end gap-2 text-sm text-muted-foreground">{t('unit.next')}<ArrowRight className="h-4 w-4" /></span>
        <span className="font-semibold group-hover:underline group-hover:underline-offset-4">{next.title}</span>
      </Link>}
    </nav>}
  </article>;
}
