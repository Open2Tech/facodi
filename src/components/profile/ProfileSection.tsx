import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** Titled settings block; `scroll-mt` keeps anchored headings clear of the sticky header. */
export function ProfileSection({ id, title, description, accent = 'border-t-input', children }: { id: string; title: string; description: string; accent?: string; children: ReactNode }) {
  return <section id={id} aria-labelledby={`${id}-title`} className={cn('scroll-mt-24 border-t-2 pt-8', accent)}>
    <h2 id={`${id}-title`} className="text-xl font-semibold">{title}</h2>
    <p className="mt-2 max-w-prose text-sm text-muted-foreground">{description}</p>
    <div className="mt-6">{children}</div>
  </section>;
}
