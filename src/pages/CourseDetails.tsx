import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import { useCourse } from '@/features/courses/queries/useCourses';
import { SafeHtml } from '@/components/course/SafeHtml';
import { PageState } from '@/components/layout/PageState';

export default function CourseDetails() {
  const { slug = '' } = useParams();
  const { t } = useTranslation();
  const query = useCourse(slug);
  if (query.isPending) return <PageState loading />;
  if (query.error) return <PageState title={t('common.error')} description={query.error.message} retry={() => void query.refetch()} />;
  if (!query.data) return <PageState title={t('common.notFound')} description={t('common.notFoundDescription')} />;
  const { course, units, resource } = query.data;
  return <article>
    <Link className="mb-8 inline-flex items-center gap-2 text-sm underline underline-offset-4" to="/courses"><ArrowLeft className="h-4 w-4" />{t('nav.courses')}</Link>
    <p className="mb-4 text-sm text-muted-foreground">{[course.institution, course.degree_type, course.language?.toUpperCase()].filter(Boolean).join(' · ')}</p>
    <h1 className="max-w-4xl text-4xl font-semibold sm:text-5xl">{course.title}</h1>
    {course.summary && <p className="mb-8 mt-6 max-w-prose text-lg text-muted-foreground">{course.summary}</p>}
    <div className="my-8"><SafeHtml html={course.description_html} /></div>
    {resource && <Link className="inline-flex items-center gap-2 underline underline-offset-4" to={`/resources/${resource.slug}`}>{resource.title}<ArrowUpRight className="h-4 w-4" /></Link>}
    <section className="mt-12 border-t border-input pt-8"><h2 className="text-2xl font-semibold">{t('catalog.units')}</h2>
      {!units.length && <PageState title={t('catalog.noUnits')} description={t('catalog.noUnitsDescription')} />}
      <ol className="mt-6 divide-y divide-input">{units.map(unit => {
        const linked = unit.learning_objects;
        const visible = linked?.published && ['active', 'published'].includes(linked.status);
        return <li key={unit.id} className="py-6">
          <div className="flex flex-wrap justify-between gap-3"><h3 className="text-xl font-semibold">{unit.title}</h3><span className="text-sm text-muted-foreground">{[unit.ects != null && `${unit.ects} ECTS`, unit.semester != null && t('catalog.semester', { value: unit.semester })].filter(Boolean).join(' · ')}</span></div>
          {unit.summary && <p className="my-3 max-w-prose text-muted-foreground">{unit.summary}</p>}
          <SafeHtml html={unit.description_html} />
          {visible && <Link className="mt-4 inline-flex items-center gap-2 underline underline-offset-4" to={`/resources/${linked.slug}`}>{linked.title}<ArrowUpRight className="h-4 w-4" /></Link>}
        </li>;
      })}</ol>
    </section>
  </article>;
}
