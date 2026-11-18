import { useId, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Library search available from every page; results open in /resources like the home search. */
export function HeaderSearch({ className, autoFocus, onSubmitted }: { className?: string; autoFocus?: boolean; onSubmitted?: () => void }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [value, setValue] = useState('');
  const id = useId();
  return <form role="search" className={cn('flex w-full', className)} onSubmit={event => {
    event.preventDefault();
    const term = value.trim();
    navigate(term ? `/resources?search=${encodeURIComponent(term)}` : '/resources');
    setValue('');
    onSubmitted?.();
  }}>
    <label htmlFor={id} className="sr-only">{t('resourceExplorer.searchLabel')}</label>
    <input id={id} type="search" autoFocus={autoFocus} value={value} onChange={event => setValue(event.target.value)}
      placeholder={t('resourceExplorer.searchPlaceholder')}
      className="h-11 min-w-0 flex-1 border border-foreground bg-background px-4 text-base placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring" />
    <button type="submit" aria-label={t('home.searchButton')}
      className="grid w-11 shrink-0 place-items-center border border-l-0 border-foreground bg-primary text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
      <Search className="h-5 w-5" aria-hidden="true" />
    </button>
  </form>;
}
