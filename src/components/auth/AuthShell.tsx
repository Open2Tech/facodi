import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight } from 'lucide-react';
import { useCatalogCounts } from '@/features/courses/queries/useCourses';
import { contentTone } from '@/components/catalog/contentTone';
import { cn } from '@/lib/utils';

const PATHS = [
  { to: '/courses', key: 'courses', type: 'course' },
  { to: '/units', key: 'units', type: 'curricular_unit' },
  { to: '/resources?type=video', key: 'videos', type: 'video' },
] as const;

/** Account pages: the form leads, an ink panel reminds that the catalogue stays open without an account. */
export function AuthShell({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const counts = useCatalogCounts();
  return <div className="grid gap-10 lg:grid-cols-[minmax(0,28rem)_minmax(0,1fr)] lg:gap-16 xl:gap-24">
    <section className="min-w-0 py-2 lg:py-6">{children}</section>
    <aside aria-labelledby="auth-open-title" className="border-t-4 border-primary bg-ink px-6 py-8 text-ink-foreground sm:px-10 sm:py-10 lg:self-start">
      <h2 id="auth-open-title" className="max-w-sm text-2xl font-semibold tracking-[-0.02em] sm:text-3xl">{t('authPanel.title')}</h2>
      <p className="mt-4 max-w-prose leading-relaxed text-ink-foreground/80">{t('authPanel.text')}</p>
      <ul className="mt-8 divide-y divide-ink-foreground/15 border-y border-ink-foreground/15">
        {PATHS.map(path => {
          const { icon: Icon, fill } = contentTone(path.type);
          const count = counts.data?.[path.key];
          return <li key={path.key}>
            <Link to={path.to} className="group flex items-center gap-4 py-4 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-ink">
              <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center text-ink', fill)}><Icon className="h-5 w-5" aria-hidden="true" /></span>
              <span className="min-w-0 flex-1 font-semibold">{t(`home.paths.${path.key}.title`)}</span>
              {count !== undefined && <span className="font-mono text-sm tabular-nums text-ink-foreground/80">{count}</span>}
              <ArrowRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-1 motion-reduce:transition-none" aria-hidden="true" />
            </Link>
          </li>;
        })}
      </ul>
    </aside>
  </div>;
}
