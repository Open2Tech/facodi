import { useId, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { UnitMatch } from '@/entities/suggestion/recognition';
import type { UnitOption } from '@/entities/suggestion/suggestion.types';
import { cn } from '@/lib/utils';

const SELECT = 'h-11 w-full border border-input bg-background px-3 text-sm disabled:cursor-not-allowed disabled:opacity-50';

interface Props {
  units: UnitOption[];
  matches: UnitMatch[];
  value: string;
  onChange: (unitId: string) => void;
  disabled?: boolean;
}

/** Word-overlap suggestions first, then every public unit grouped by course; choosing none is valid. */
export function UnitMatchPicker({ units, matches, value, onChange, disabled }: Props) {
  const { t } = useTranslation();
  const name = useId();
  const groups = useMemo(() => {
    const byCourse = new Map<string, { label: string; units: UnitOption[] }>();
    for (const unit of units) {
      const group = byCourse.get(unit.course.slug) ?? { label: `${unit.course.code} · ${unit.course.title}`, units: [] };
      group.units.push(unit);
      byCourse.set(unit.course.slug, group);
    }
    return [...byCourse.values()].sort((a, b) => a.label.localeCompare(b.label));
  }, [units]);

  return <fieldset className="space-y-3" disabled={disabled}>
    <legend className="text-sm font-medium">{t('suggest.unit')}</legend>
    {matches.length > 0
      ? <div role="radiogroup" aria-label={t('suggest.matches')} className="divide-y divide-input border border-input">
        {matches.map(({ unit, score }) => {
          const checked = value === unit.id;
          return <label key={unit.id} className={cn('flex cursor-pointer items-center gap-3 p-3 transition-colors hover:bg-muted', checked && 'bg-muted')}>
            <input type="radio" name={name} className="h-4 w-4 accent-foreground" checked={checked} onChange={() => onChange(unit.id)} />
            <span className="min-w-0 flex-1">
              <span className="block break-words text-sm font-medium">{unit.title}</span>
              <span className="block text-xs text-muted-foreground">{unit.course.code} · {unit.code}</span>
            </span>
            <span className="shrink-0 font-mono text-sm tabular-nums" aria-label={t('suggest.matchScore', { score })}>{score}%</span>
          </label>;
        })}
      </div>
      : <p className="text-sm text-muted-foreground">{t('suggest.noMatches')}</p>}
    <label className="block space-y-2 text-sm">
      <span className="block text-muted-foreground">{t('suggest.unitAll')}</span>
      <select className={SELECT} value={value} onChange={event => onChange(event.target.value)}>
        <option value="">{t('suggest.noUnit')}</option>
        {groups.map(group => <optgroup key={group.label} label={group.label}>
          {group.units.map(unit => <option key={unit.id} value={unit.id}>{unit.code} · {unit.title}</option>)}
        </optgroup>)}
      </select>
    </label>
  </fieldset>;
}
