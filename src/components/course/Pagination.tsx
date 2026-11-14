import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { PAGE_SIZE } from '@/entities/course/course.types';
import { cn } from '@/lib/utils';
import { pageWindow } from '@/shared/lib/pagination';

export function Pagination({ page, total, onChange }: { page: number; total: number; onChange: (page: number) => void }) {
  const { t } = useTranslation();
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  return <nav aria-label={t('catalog.pagination')} className="mt-8 flex flex-wrap items-center justify-between gap-4">
    <p className="text-sm text-muted-foreground" aria-live="polite">{t('catalog.page', { page, pages, total })}</p>
    {pages > 1 && <div className="flex items-center gap-1">
      <Button variant="outline" size="icon" disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label={t('catalog.previous')}><ChevronLeft className="h-4 w-4" /></Button>
      {pageWindow(page, pages).map((value, index) => value == null
        ? <span key={`gap-${index}`} className="w-8 text-center text-muted-foreground" aria-hidden="true">…</span>
        : <Button key={value} variant={value === page ? 'default' : 'ghost'} size="icon" onClick={() => onChange(value)}
          aria-current={value === page ? 'page' : undefined} aria-label={t('catalog.goToPage', { page: value })}
          className={cn('font-mono tabular-nums', value !== page && 'text-muted-foreground')}>{value}</Button>)}
      <Button variant="outline" size="icon" disabled={page >= pages} onClick={() => onChange(page + 1)} aria-label={t('catalog.next')}><ChevronRight className="h-4 w-4" /></Button>
    </div>}
  </nav>;
}
