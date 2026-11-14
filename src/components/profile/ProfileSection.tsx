import type { ReactNode } from 'react';

/** Titled settings block; `scroll-mt` keeps anchored headings clear of the sticky header. */
export function ProfileSection({ id, title, description, children }: { id: string; title: string; description: string; children: ReactNode }) {
  return <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-24 border-t border-input pt-8">
    <h2 id={`${id}-title`} className="text-xl font-semibold">{title}</h2>
    <p className="mt-2 max-w-prose text-sm text-muted-foreground">{description}</p>
    <div className="mt-6">{children}</div>
  </section>;
}
