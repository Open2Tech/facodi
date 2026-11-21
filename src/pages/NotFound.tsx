import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight } from 'lucide-react';
import { contentTone } from '@/components/catalog/contentTone';
import { PageState } from '@/components/layout/PageState';
import { NoIndex } from '@/components/layout/PageSeo';
import { cn } from '@/lib/utils';

const PATHS = [
  { to: '/courses', label: 'nav.courses', type: 'course', tone: 'border-t-primary hover:bg-primary/15' },
  { to: '/units', label: 'nav.units', type: 'curricular_unit', tone: 'border-t-brand-orange hover:bg-brand-orange/15' },
  { to: '/resources', label: 'nav.resources', type: 'video', tone: 'border-t-brand-mint hover:bg-brand-mint/15' },
] as const;

export default function NotFound() {
  const { t } = useTranslation();
  return <>
    <NoIndex />
    <PageState title={t('common.notFound')} description={t('common.notFoundDescription')} />
    <nav aria-label={t('common.notFoundPaths')}>
      <ul className="grid gap-4 sm:grid-cols-3">
        {PATHS.map(path => {
          const { icon: Icon, fill } = contentTone(path.type);
          return <li key={path.to}>
            <Link to={path.to} className={cn('group flex h-full items-center gap-4 border border-foreground border-t-4 bg-card p-5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring', path.tone)}>
              <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center border border-foreground text-brand-ink', fill)}><Icon className="h-5 w-5" aria-hidden="true" /></span>
              <span className="font-semibold">{t(path.label)}</span>
              <ArrowRight className="ml-auto h-4 w-4 transition-transform group-hover:translate-x-1 motion-reduce:transition-none" aria-hidden="true" />
            </Link>
          </li>;
        })}
      </ul>
    </nav>
  </>;
}
