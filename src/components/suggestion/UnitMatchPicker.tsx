import { useId, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { UnitMatch } from '@/entities/suggestion/recognition';
import type { UnitOption } from '@/entities/suggestion/suggestion.types';
import { cn } from '@/lib/utils';

const SELECT = 'h-11 w-full border border-input bg-background px-3 text-sm disabled:cursor-not-allowed disabled:opacity-50';

interface Props {
  units: UnitOption[];
  matches: UnitMatch[];
  courseId: string;
  unitId: string;
  onChange: (value: { courseId: string; unitId: string }) => void;
  disabled?: boolean;
}

/**
 * Course first, unit optional: with a course the automatic analysis finds the unit itself. Word-overlap
 * suggestions (limited to the chosen course) pick both at once.
 */
export function UnitMatchPicker({ units, matches, courseId, unitId, onChange, disabled }: Props) {
  const { t } = useTranslation();
  const name = useId();
  const hintId = useId();
  const courses = useMemo(() => {
    const byId = new Map<string, UnitOption['course']>();
    for (const unit of units) byId.set(unit.course.id, unit.course);
    return [...byId.values()].sort((a, b) => a.code.localeCompare(b.code));
  }, [units]);
  const courseUnits = useMemo(() => units.filter(unit => unit.course.id === courseId), [units, courseId]);
  const visibleMatches = courseId ? matches.filter(({ unit }) => unit.course.id === courseId) : matches;

  return <fieldset className="space-y-4" disabled={disabled}>
    <legend className="sr-only">{t('suggest.course')}</legend>
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="block space-y-2 text-sm">
        <span className="block font-medium">{t('suggest.course')}</span>
        <select className={SELECT} value={courseId} aria-describedby={hintId}
          onChange={event => onChange({ courseId: event.target.value, unitId: '' })}>
          <option value="">{t('suggest.courseNone')}</option>
          {courses.map(course => <option key={course.id} value={course.id}>{course.code} · {course.title}</option>)}
        </select>
      </label>
      <label className="block space-y-2 text-sm">
        <span className="block font-medium">{t('suggest.unit')}</span>
        <select className={SELECT} value={unitId} disabled={disabled || !courseId}
          onChange={event => onChange({ courseId, unitId: event.target.value })}>
          <option value="">{t('suggest.noUnit')}</option>
          {courseUnits.map(unit => <option key={unit.id} value={unit.id}>{unit.code} · {unit.title}</option>)}
        </select>
      </label>
    </div>
    <p id={hintId} className="max-w-prose text-sm text-muted-foreground">{t('suggest.courseHint')}</p>
    {visibleMatches.length > 0
      ? <div role="radiogroup" aria-label={t('suggest.matches')} className="divide-y divide-input border border-input">
        {visibleMatches.map(({ unit, score }) => {
          const checked = unitId === unit.id;
          return <label key={unit.id} className={cn('flex cursor-pointer items-center gap-3 p-3 transition-colors hover:bg-muted', checked && 'bg-muted')}>
            <input type="radio" name={name} className="h-4 w-4 accent-foreground" checked={checked}
              onChange={() => onChange({ courseId: unit.course.id, unitId: unit.id })} />
            <span className="min-w-0 flex-1">
              <span className="block break-words text-sm font-medium">{unit.title}</span>
              <span className="block text-xs text-muted-foreground">{unit.course.code} · {unit.code}</span>
            </span>
            <span className="shrink-0 font-mono text-sm tabular-nums" aria-label={t('suggest.matchScore', { score })}>{score}%</span>
          </label>;
        })}
      </div>
      : <p className="text-sm text-muted-foreground">{t('suggest.noMatches')}</p>}
  </fieldset>;
}
