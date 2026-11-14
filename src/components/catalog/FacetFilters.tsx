import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Facet { value: string; label: string; count: number }

/** A single-choice chip group; selecting the active chip clears it. */
export function FacetGroup({ title, options, value, onChange }: {
  title: string; options: Facet[]; value: string; onChange: (value: string) => void;
}) {
  if (!options.length) return null;
  return <fieldset className="min-w-0">
    <legend className="mb-3 text-sm font-semibold">{title}</legend>
    <div className="flex flex-wrap gap-2">
      {options.map(option => {
        const active = option.value === value;
        return <button key={option.value} type="button" aria-pressed={active} onClick={() => onChange(active ? '' : option.value)}
          className={cn('inline-flex min-h-9 items-center gap-2 border px-3 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            active ? 'border-foreground bg-primary text-primary-foreground' : 'border-input bg-background hover:border-foreground')}>
          {active && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
          <span>{option.label}</span>
          <span className={cn('font-mono text-xs tabular-nums', active ? 'text-primary-foreground' : 'text-muted-foreground')}>{option.count}</span>
        </button>;
      })}
    </div>
  </fieldset>;
}
