import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Facet { value: string; label: string; count: number }

/**
 * A single-choice chip group; selecting the active chip clears it.
 * `scroll` keeps long groups on one swipeable row below `sm` instead of stacking several rows.
 */
export function FacetGroup({ title, options, value, onChange, allLabel, allCount, scroll = false }: {
  title: string; options: Facet[]; value: string; onChange: (value: string) => void;
  allLabel?: string; allCount?: number; scroll?: boolean;
}) {
  const choices = allLabel ? [{ value: '', label: allLabel, count: allCount ?? options.reduce((sum, option) => sum + option.count, 0) }, ...options] : options;
  if (!choices.length) return null;
  return <fieldset className="min-w-0">
    <legend className="mb-3 text-sm font-semibold">{title}</legend>
    <div className={cn('flex gap-2', scroll
      ? '-mx-5 snap-x scroll-px-5 overflow-x-auto px-5 py-1 [scrollbar-width:thin] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0'
      : 'flex-wrap')}>
      {choices.map(option => {
        const active = option.value === value;
        return <button key={option.value} type="button" aria-pressed={active} onClick={() => onChange(active ? '' : option.value)}
          className={cn('inline-flex min-h-9 shrink-0 snap-start items-center gap-2 whitespace-nowrap border px-3 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            active ? 'border-foreground bg-primary text-primary-foreground' : 'border-input bg-background hover:border-foreground')}>
          {active && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
          <span>{option.label}</span>
          <span className={cn('font-mono text-label tabular-nums', active ? 'text-primary-foreground' : 'text-muted-foreground')}>{option.count}</span>
        </button>;
      })}
    </div>
  </fieldset>;
}
