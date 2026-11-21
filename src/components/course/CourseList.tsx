import { CourseEmblem } from '@/components/course/CourseEmblem';
import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Course } from '@/entities/course/course.types';
import { cn } from '@/lib/utils';

export function CourseList({ courses, headingLevel = 'h2', className }: { courses: (Course & { unit_count?: number })[]; headingLevel?: 'h2' | 'h3'; className?: string }) {
  const { t } = useTranslation();
  const Heading = headingLevel;
  return <div className={cn('divide-y divide-input border-y border-input', className)}>
    {courses.map(course => <article key={course.id} className="group grid gap-4 px-3 py-7 -mx-3 transition-colors hover:bg-primary/10 sm:grid-cols-[3rem_1fr_auto] sm:gap-x-6 sm:items-start">
      <CourseEmblem course={course} />
      <div className="min-w-0">
        <p className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 font-mono text-xs uppercase text-muted-foreground">
          {course.code && <span className="font-semibold text-foreground">{course.code}</span>}
          {course.degree_type && <span>{t(`course.degreeTypes.${course.degree_type}`, { defaultValue: course.degree_type })}</span>}
          {course.ects_total != null && <span className="tabular-nums">{course.ects_total} ECTS</span>}
          {course.unit_count != null && course.unit_count > 0 && <span className="border border-foreground/30 bg-brand-orange px-2 py-0.5 font-semibold text-brand-ink tabular-nums">{t('catalog.unitCount', { count: course.unit_count })}</span>}
          {course.language && <span lang={course.language}>{course.language}</span>}
        </p>
        <Heading className="text-xl font-semibold sm:text-2xl"><Link className="decoration-2 underline-offset-4 hover:underline" to={`/courses/${course.slug}`}>{course.title}</Link></Heading>
        {course.summary && course.summary.trim() !== course.title.trim() && <p className="mt-3 max-w-prose text-muted-foreground">{course.summary}</p>}
        {course.institution && <p className="mt-3 text-sm font-medium">{[course.institution, course.school].filter(Boolean).join(' · ')}</p>}
        <Link to={`/units?course=${encodeURIComponent(course.slug)}`} className="relative mt-3 inline-block text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground">{t('course.browseUnits')}</Link>
      </div>
      <Link to={`/courses/${course.slug}`} className="inline-flex items-center gap-2 self-start border border-foreground bg-card px-3.5 py-2 text-sm font-semibold transition-colors group-hover:bg-primary group-hover:text-brand-ink" aria-label={`${t('catalog.open')}: ${course.title}`}>{t('catalog.open')}<ArrowUpRight className="h-4 w-4" /></Link>
    </article>)}
  </div>;
}
