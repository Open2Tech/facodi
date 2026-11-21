import { Link } from 'react-router-dom';
import { Check, Compass, ArrowUpRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { discoveryLinks } from '@/features/discoveries/catalog';
import { useDiscoveries } from '@/features/discoveries/useDiscoveries';
import { cn } from '@/lib/utils';

export function DiscoveryAlbum({ className }: { className?: string }) {
  const { t } = useTranslation();
  const found = useDiscoveries();
  const total = discoveryLinks.length;

  return <details className={cn('border border-foreground bg-card', className)}>
    <summary className="cursor-pointer px-4 py-3 marker:text-muted-foreground hover:bg-muted focus-visible:outline-ring">
      <span className="ms-2 inline-flex flex-wrap items-center gap-x-3 gap-y-1 align-middle">
        <Compass className="size-5 shrink-0" aria-hidden="true" />
        <span className="font-semibold">{t('discoveries.title')}</span>
        <span className="text-sm text-muted-foreground">{t('discoveries.progress', { found: found.size, total })}</span>
      </span>
    </summary>
    <div className="border-t border-input p-4">
      <p className="max-w-prose text-sm text-muted-foreground">{t(found.size === total ? 'discoveries.complete' : 'discoveries.description')}</p>
      <progress aria-label={t('discoveries.title')} value={found.size} max={total} className="mt-3 h-2 w-full accent-primary" />
      <ul className="mt-4 grid gap-px border border-input bg-input sm:grid-cols-2">
        {discoveryLinks.map(({ id, to }) => <li key={id} className="bg-background">
          <Link to={to} className="flex min-h-11 items-center gap-3 px-3 py-2 text-sm hover:bg-muted focus-visible:outline-ring">
            {found.has(id) ? <Check className="size-4 shrink-0" aria-hidden="true" /> : <ArrowUpRight className="size-4 shrink-0" aria-hidden="true" />}
            <span>{t(`discoveries.hints.${id}`)}{found.has(id) && <span className="sr-only"> — {t('discoveries.found')}</span>}</span>
          </Link>
        </li>)}
      </ul>
    </div>
  </details>;
}
