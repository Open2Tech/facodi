import { Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { STUDY_AREAS, type StudyAreaKey } from '@/shared/catalog/studyAreas';
import { cn } from '@/lib/utils';

/** Compact, single-choice, URL-backed browse-by-area control shared by the public catalogues.
 * Counts are optional because resource totals are server-paginated.
 */
export function StudyAreaFilters({ value, onChange, counts, total }: {
  value: string;
  onChange: (next: string) => void;
  counts?: Partial<Record<StudyAreaKey, number>>;
  total?: number;
}) {
  const { t } = useTranslation();
  const options = STUDY_AREAS.filter(area => counts == null || (counts[area.key] ?? 0) > 0 || value === area.key);
  if (!options.length) return null;
  const choices = [{ key: '', label: t('catalog.allAreas'), count: total },
    ...options.map(area => ({ key: area.key, label: t('catalog.studyAreas.' + area.key), count: counts?.[area.key] }))];
  return <fieldset className="my-7 min-w-0 border-y border-input py-5">
    <legend className="text-sm font-semibold">{t('catalog.browseByArea')}</legend>
    <p className="mb-3 mt-2 text-sm text-muted-foreground">{t('catalog.areaHint')}</p>
    <div className="-mx-5 flex snap-x scroll-px-5 gap-2 overflow-x-auto px-5 py-1 [scrollbar-width:thin] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
      {choices.map(option => {
        const selected = value === option.key;
        return <button key={option.key || 'all'} type="button" aria-pressed={selected}
          onClick={() => onChange(selected ? '' : option.key)}
          className={cn('inline-flex min-h-10 shrink-0 snap-start items-center gap-2 whitespace-nowrap border px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            selected ? 'border-foreground bg-primary text-primary-foreground' : 'border-input bg-background hover:border-foreground hover:bg-muted')}>
          {selected && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
          {option.label}
          {option.count != null && <span className={cn('font-mono text-label tabular-nums', selected ? 'text-primary-foreground' : 'text-muted-foreground')}>{option.count}</span>}
        </button>;
      })}
    </div>
  </fieldset>;
}
