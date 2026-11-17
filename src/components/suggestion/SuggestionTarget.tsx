import { Link } from 'react-router-dom';
import type { SuggestionSummary } from '@/entities/suggestion/suggestion.types';

/** Where the learner placed the suggestion: the curricular unit when chosen, otherwise the course. */
export function SuggestionTarget({ item }: { item: Pick<SuggestionSummary, 'curricular_units' | 'courses'> }) {
  const unit = item.curricular_units;
  const linkClass = 'underline underline-offset-4';
  if (unit) return unit.courses
    ? <Link className={linkClass} to={`/courses/${encodeURIComponent(unit.courses.slug)}/units/${encodeURIComponent(unit.slug)}`}>{unit.title}</Link>
    : <>{unit.title}</>;
  if (item.courses) return <Link className={linkClass} to={`/courses/${encodeURIComponent(item.courses.slug)}`}>{item.courses.title}</Link>;
  return null;
}
