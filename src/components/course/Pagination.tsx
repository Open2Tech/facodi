import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { PAGE_SIZE } from '@/entities/course/course.types';

export function Pagination({ page, total, onChange }: { page: number; total: number; onChange: (page: number) => void }) {
  const { t } = useTranslation();
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  return <nav aria-label={t('catalog.pagination')} className="mt-8 flex flex-wrap items-center justify-between gap-4">
    <p className="text-sm text-muted-foreground" aria-live="polite">{t('catalog.page', { page, pages, total })}</p>
    <div className="flex gap-2"><Button variant="outline" disabled={page <= 1} onClick={() => onChange(page - 1)}>{t('catalog.previous')}</Button><Button variant="outline" disabled={page >= pages} onClick={() => onChange(page + 1)}>{t('catalog.next')}</Button></div>
  </nav>;
}
