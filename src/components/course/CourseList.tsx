import { ArrowUpRight, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Course } from '@/entities/course/course.types';

export function CourseList({ courses, headingLevel = 'h2' }: { courses: Course[]; headingLevel?: 'h2' | 'h3' }) {
  const { t } = useTranslation();
  const Heading = headingLevel;
  return <div className="divide-y divide-input border-y border-input">
    {courses.map(course => <article key={course.id} className="group grid gap-4 py-7 sm:grid-cols-[3rem_1fr_auto] sm:items-start">
      <BookOpen className="mt-1 h-8 w-8 text-muted-foreground transition-colors group-hover:text-foreground" strokeWidth={1.4} aria-hidden="true" />
      <div className="min-w-0">
        <p className="mb-2 flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs uppercase text-muted-foreground">
          {course.code && <span>{course.code}</span>}
          {course.degree_type && <span>{course.degree_type}</span>}
          {course.ects_total != null && <span>{course.ects_total} ECTS</span>}
          {course.language && <span lang={course.language}>{course.language}</span>}
        </p>
        <Heading className="text-xl font-semibold sm:text-2xl"><Link className="decoration-2 underline-offset-4 hover:underline" to={`/courses/${course.slug}`}>{course.title}</Link></Heading>
        {course.summary && <p className="mt-3 max-w-prose text-muted-foreground">{course.summary}</p>}
        {course.institution && <p className="mt-3 text-sm">{[course.institution, course.school].filter(Boolean).join(' · ')}</p>}
      </div>
      <Link to={`/courses/${course.slug}`} className="inline-flex items-center gap-2 text-sm font-semibold underline underline-offset-4" aria-label={`${t('catalog.open')}: ${course.title}`}>{t('catalog.open')}<ArrowUpRight className="h-4 w-4" /></Link>
    </article>)}
  </div>;
}
