import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function PageState({ loading, title, description, retry, level = 'h1' }: {
  loading?: boolean; title?: string; description?: string; retry?: () => void; level?: 'h1' | 'h2' | 'h3' | 'h4';
}) {
  const Heading = level;
  const { t } = useTranslation();
  if (loading) return <div role="status" aria-label={t('common.loading')} className="space-y-5 py-12">
    <span className="sr-only">{t('common.loading')}</span>
    <Skeleton className="h-10 w-2/3" /><Skeleton className="h-6 w-full" /><Skeleton className="h-48 w-full" />
  </div>;
  return <section className={cn(
    'my-10 border border-foreground border-t-4 bg-card p-6 sm:p-10',
    retry ? 'border-t-brand-coral' : 'border-t-brand-cyan',
  )} aria-live="polite">
    <Heading className="text-2xl font-bold">{title}</Heading>
    {description && <p className="mt-3 max-w-prose text-muted-foreground">{description}</p>}
    {retry && <Button className="mt-5" variant="outline" onClick={retry}>{t('common.retry')}</Button>}
  </section>;
}
