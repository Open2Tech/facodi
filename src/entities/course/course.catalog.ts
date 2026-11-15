import type { PublicCourse } from '@/entities/course/course.types';

export interface CourseFilters { search: string; language: string; institution: string; degree: string }
export interface CourseFacet { value: string; count: number }

const fold = (value: string) => value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
const baseLanguage = (value: string | null) => value?.split('-')[0].toLowerCase() ?? '';

function matches(course: PublicCourse, { search, language, institution, degree }: CourseFilters, skip?: 'institution' | 'degree') {
  if (language && baseLanguage(course.language) !== language.toLowerCase()) return false;
  if (skip !== 'institution' && institution && course.institution !== institution) return false;
  if (skip !== 'degree' && degree && course.degree_type !== degree) return false;
  const term = fold(search.trim());
  if (!term) return true;
  return [course.title, course.code, course.summary, course.institution, course.school]
    .some(value => value && fold(value).includes(term));
}

/** Accent-insensitive search over title, code, summary, institution and school; `pt` includes `pt-BR`. */
export function filterCourses(courses: PublicCourse[], filters: CourseFilters) {
  return courses.filter(course => matches(course, filters));
}

function facet(courses: PublicCourse[], filters: CourseFilters, key: 'institution' | 'degree') {
  const counts = new Map<string, number>();
  for (const course of courses) {
    const value = key === 'institution' ? course.institution : course.degree_type;
    if (value && matches(course, filters, key)) counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  const selected = filters[key];
  if (selected && !counts.has(selected)) counts.set(selected, 0);
  return [...counts].map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));
}

/** Counts for each facet under every other active filter, so choices never lead to an empty list. */
export function courseFacets(courses: PublicCourse[], filters: CourseFilters) {
  return { institutions: facet(courses, filters, 'institution'), degrees: facet(courses, filters, 'degree') };
}
