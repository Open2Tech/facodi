import { useTranslation } from 'react-i18next';
import { SearchInput } from '@/components/catalog/SearchInput';
import { cn } from '@/lib/utils';

export const LANGUAGES = [['pt', 'Português'], ['en', 'English'], ['es', 'Español'], ['fr', 'Français']] as const;

export type CatalogAccent = 'courses' | 'units' | 'sequences' | 'resources';

const ACCENT_STYLES: Record<CatalogAccent, { rule: string; badge: string }> = {
  courses: { rule: 'border-t-primary', badge: 'bg-primary text-brand-ink' },
  units: { rule: 'border-t-brand-orange', badge: 'bg-brand-orange text-brand-ink' },
  sequences: { rule: 'border-t-brand-pink', badge: 'bg-brand-pink text-brand-ink' },
  resources: { rule: 'border-t-brand-mint', badge: 'bg-brand-mint text-brand-ink' },
};

export function CatalogToolbar({ search, language, onFilter, withLanguage = true, searchLabel, searchPlaceholder }: {
  search: string; language: string; onFilter: (key: 'search' | 'language', value: string) => void; withLanguage?: boolean;
  searchLabel?: string; searchPlaceholder?: string;
}) {
  const { t } = useTranslation();
  return <div className="mb-8 mt-9 flex flex-col gap-5 border-t border-input pt-5 sm:flex-row">
    <label className="flex-1 space-y-2 text-sm font-medium"><span className="block">{searchLabel ?? t('catalog.search')}</span>
      <SearchInput value={search} onSearch={value => onFilter('search', value)} placeholder={searchPlaceholder ?? t('catalog.searchPlaceholder')} />
    </label>
    {withLanguage && <label className="space-y-2 text-sm font-medium"><span className="block">{t('common.language')}</span>
      <select className="h-10 w-full border border-input bg-background px-3 sm:w-48" value={language} onChange={e => onFilter('language', e.target.value)}>
        <option value="">{t('catalog.allLanguages')}</option>
        {!['', ...LANGUAGES.map(([code]) => code)].includes(language) && <option value={language}>{language}</option>}
        {LANGUAGES.map(([code, label]) => <option key={code} value={code}>{label}</option>)}
      </select>
    </label>}
  </div>;
}

export function CatalogHeader({ title, description, total, accent = 'courses' }: {
  title: string; description: string; total?: number; accent?: CatalogAccent;
}) {
  const { t } = useTranslation();
  const style = ACCENT_STYLES[accent];
  return <header className={cn('grid gap-6 border-t-4 pt-6 lg:grid-cols-[1fr_auto] lg:items-end', style.rule)}>
    <div><h1 className="max-w-3xl text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">{title}</h1>
      <p className="mt-4 max-w-prose text-lg text-muted-foreground">{description}</p></div>
    {total != null && <p className={cn('w-fit justify-self-start self-start border border-foreground px-3.5 py-1.5 font-mono text-sm font-semibold tabular-nums lg:self-end', style.badge)}>{t('catalog.count', { count: total })}</p>}
  </header>;
}
