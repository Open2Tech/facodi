import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';

export interface ActiveFilter { key: string; label: string; value: string }

/**
 * Result count plus one removable chip per active URL filter, so learners see why the list
 * changed and can undo a single choice without starting over.
 */
export function ActiveFilters({ count, filters, onRemove, onReset }: {
  count?: number; filters: ActiveFilter[]; onRemove: (key: string) => void; onReset: () => void;
}) {
  const { t } = useTranslation();
  if (!filters.length) return null;
  return <div className="mb-8 flex flex-wrap items-center gap-x-5 gap-y-3 border-b border-input pb-5">
    <p className="font-mono text-sm tabular-nums" aria-live="polite" aria-atomic="true">
      {count == null ? t('common.loading') : t('catalog.results', { count })}
    </p>
    <ul className="order-last flex w-full flex-wrap items-center gap-2 sm:order-none sm:w-auto" aria-label={t('catalog.activeFilters')}>
      {filters.map(filter => <li key={filter.key}>
        <button type="button" onClick={() => onRemove(filter.key)} aria-label={t('catalog.removeFilter', { label: filter.label, value: filter.value })}
          className="inline-flex min-h-9 max-w-[18rem] items-center gap-2 border border-foreground bg-background px-3 text-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
          <span className="text-muted-foreground">{filter.label}</span>
          <span className="truncate font-semibold">{filter.value}</span>
          <X className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        </button>
      </li>)}
    </ul>
    <Button variant="ghost" size="sm" className="ml-auto h-9 px-2" onClick={onReset}>
      {t('catalog.clearFilters')}
    </Button>
  </div>;
}
