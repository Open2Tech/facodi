import { useSearchParams } from 'react-router-dom';
import type { UnitSort } from '@/entities/course/course.types';

export type CatalogParamKey = 'search' | 'language' | 'page' | 'tag' | 'course' | 'year' | 'semester' | 'sort' | 'type' | 'institution' | 'degree' | 'area';
const SORTS: UnitSort[] = ['curriculum', 'title', 'ects'];

function positive(value: string | null) {
  const number = Math.floor(Number(value));
  return Number.isFinite(number) && number > 0 && number < 100 ? number : undefined;
}

/** URL-backed catalogue state shared by the public listings. */
export function useCatalogParams() {
  const [params, setParams] = useSearchParams();
  const page = Math.max(1, Math.min(100000, Math.floor(Number(params.get('page')) || 1)));
  const search = params.get('search') ?? '';
  const language = params.get('language') ?? '';
  const tag = params.get('tag') ?? '';
  const area = params.get('area') ?? '';
  const course = params.get('course') ?? '';
  const type = params.get('type') ?? '';
  const institution = params.get('institution') ?? '';
  const degree = params.get('degree') ?? '';
  const year = positive(params.get('year'));
  const semester = positive(params.get('semester'));
  const rawSort = params.get('sort') as UnitSort | null;
  const sort: UnitSort = rawSort && SORTS.includes(rawSort) ? rawSort : 'curriculum';
  function update(values: Partial<Record<CatalogParamKey, string>>) {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(values)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    if (!('page' in values)) next.delete('page');
    setParams(next, { replace: true });
  }
  function filter(key: CatalogParamKey, value: string) {
    update({ [key]: value });
  }
  function reset() {
    setParams(new URLSearchParams(), { replace: true });
  }
  const facets = Boolean(course || year || semester || institution || degree);
  return {
    page, search, language, tag, area, type, institution, degree, course, year, semester, sort, filter, update, reset,
    filtered: Boolean(search || language || tag || area || type || facets || page > 1),
    faceted: Boolean(search || facets),
  };
}
