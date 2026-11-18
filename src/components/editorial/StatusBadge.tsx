import { stateSwatch } from '@/components/editorial/statusTone';
import { cn } from '@/lib/utils';

export function StateSwatch({ status, className }: { status: string; className?: string }) {
  return <span aria-hidden="true" className={cn('inline-block h-2.5 w-2.5 shrink-0 border border-foreground/40', stateSwatch(status), className)} />;
}

/** Outlined editorial-state label; the swatch matches the admin distribution bars. */
export function StatusBadge({ status, label }: { status: string; label: string }) {
  return <span className="inline-flex items-center gap-1.5 border border-input px-2 py-1 font-mono text-label font-medium uppercase">
    <StateSwatch status={status} />{label}
  </span>;
}
