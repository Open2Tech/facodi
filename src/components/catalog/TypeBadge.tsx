import { contentTone } from '@/components/catalog/contentTone';
import { cn } from '@/lib/utils';

/** Coloured content-type label with its icon; colour is decorative, the text names the type. */
export function TypeBadge({ type, label, className }: { type: string; label: string; className?: string }) {
  const { icon: Icon, fill } = contentTone(type);
  return <span className={cn('inline-flex items-center gap-1.5 px-2 py-1 font-mono text-xs font-medium uppercase text-ink', fill, className)}>
    <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />{label}
  </span>;
}
