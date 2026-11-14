import { useTranslation } from 'react-i18next';
import { SearchInput } from '@/components/catalog/SearchInput';

export const LANGUAGES = [['pt', 'Português'], ['en', 'English'], ['es', 'Español'], ['fr', 'Français']] as const;

export function CatalogToolbar({ search, language, onFilter, withLanguage = true }: {
  search: string; language: string; onFilter: (key: 'search' | 'language', value: string) => void; withLanguage?: boolean;
}) {
  const { t } = useTranslation();
  return <div className="mb-8 mt-9 flex flex-col gap-5 border-t border-input pt-5 sm:flex-row">
    <label className="flex-1 space-y-2 text-sm font-medium"><span className="block">{t('catalog.search')}</span>
      <SearchInput value={search} onSearch={value => onFilter('search', value)} placeholder={t('catalog.searchPlaceholder')} />
    </label>
    {withLanguage && <label className="space-y-2 text-sm font-medium"><span className="block">{t('common.language')}</span>
      <select className="h-10 w-full rounded-md border border-input bg-background px-3 sm:w-48" value={language} onChange={e => onFilter('language', e.target.value)}>
        <option value="">{t('catalog.allLanguages')}</option>
        {!['', ...LANGUAGES.map(([code]) => code)].includes(language) && <option value={language}>{language}</option>}
        {LANGUAGES.map(([code, label]) => <option key={code} value={code}>{label}</option>)}
      </select>
    </label>}
  </div>;
}

export function CatalogHeader({ title, description, total }: { title: string; description: string; total?: number }) {
  const { t } = useTranslation();
  return <header className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
    <div><h1 className="max-w-3xl text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">{title}</h1>
      <p className="mt-4 max-w-prose text-lg text-muted-foreground">{description}</p></div>
    {total != null && <p className="font-mono text-sm text-muted-foreground">{t('catalog.count', { count: total })}</p>}
  </header>;
}
