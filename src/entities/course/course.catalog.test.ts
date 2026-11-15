import { describe, expect, it } from 'vitest';
import { courseFacets, filterCourses } from '@/entities/course/course.catalog';
import type { PublicCourse } from '@/entities/course/course.types';

const course = (values: Partial<PublicCourse>) => ({
  id: values.slug, title: '', code: null, summary: null, school: null, institution: null, degree_type: null, language: 'pt', unit_count: 0, ...values,
}) as PublicCourse;
const courses = [
  course({ slug: 'lesti', title: 'Engenharia de Sistemas', code: 'LESTI', institution: 'Universidade do Algarve', degree_type: 'Licenciatura' }),
  course({ slug: 'ctesp', title: 'Tecnologias', institution: 'Universidade do Algarve', degree_type: 'CTeSP', summary: 'Programação e redes' }),
  course({ slug: 'ifes', title: 'Administração', institution: 'Instituto Federal', degree_type: 'Técnico', language: 'pt-BR', school: 'Campus Cariacica' }),
  course({ slug: 'ufes', title: 'Letras Inglês', institution: 'UFES', degree_type: 'Licenciatura', language: 'en' }),
];
const none = { search: '', language: '', institution: '', degree: '' };
const slugs = (items: PublicCourse[]) => items.map(item => item.slug);

describe('public course catalogue', () => {
  it('searches without accents across title, code, summary and school', () => {
    expect(slugs(filterCourses(courses, { ...none, search: 'programacao' }))).toEqual(['ctesp']);
    expect(slugs(filterCourses(courses, { ...none, search: 'lesti' }))).toEqual(['lesti']);
    expect(slugs(filterCourses(courses, { ...none, search: 'CARIACICA' }))).toEqual(['ifes']);
  });
  it('matches regional languages from the base language and combines facets', () => {
    expect(slugs(filterCourses(courses, { ...none, language: 'pt' }))).toEqual(['lesti', 'ctesp', 'ifes']);
    expect(slugs(filterCourses(courses, { ...none, institution: 'Universidade do Algarve', degree: 'Licenciatura' }))).toEqual(['lesti']);
  });
  it('counts each facet under the other filters and keeps an unmatched selection reachable', () => {
    const facets = courseFacets(courses, { ...none, degree: 'Licenciatura', institution: 'Instituto Federal' });
    expect(facets.institutions).toEqual([
      { value: 'UFES', count: 1 }, { value: 'Universidade do Algarve', count: 1 }, { value: 'Instituto Federal', count: 0 },
    ]);
    expect(facets.degrees).toEqual([{ value: 'Técnico', count: 1 }, { value: 'Licenciatura', count: 0 }]);
  });
});
