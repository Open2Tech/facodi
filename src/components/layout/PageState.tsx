import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

export function PageState({ loading, title, description, retry }: {
  loading?: boolean; title?: string; description?: string; retry?: () => void;
}) {
  const { t } = useTranslation();
  if (loading) return <div role="status" aria-label={t('common.loading')} className="space-y-5 py-12">
    <span className="sr-only">{t('common.loading')}</span>
    <Skeleton className="h-10 w-2/3" /><Skeleton className="h-6 w-full" /><Skeleton className="h-48 w-full" />
  </div>;
  return <section className="my-10 border border-input bg-muted/40 p-6 sm:p-10" aria-live="polite">
    <h1 className="text-2xl font-bold">{title}</h1>
    {description && <p className="mt-3 max-w-prose text-muted-foreground">{description}</p>}
    {retry && <Button className="mt-5" variant="outline" onClick={retry}>{t('common.retry')}</Button>}
  </section>;
}
