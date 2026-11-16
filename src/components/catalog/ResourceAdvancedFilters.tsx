import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { usePublicResourceTopics } from '@/features/courses/queries/usePublicResourceTopics';
import { StudyAreaFilters } from '@/components/catalog/StudyAreaFilters';
import { FacetGroup, type Facet } from '@/components/catalog/FacetFilters';
import { LANGUAGES } from '@/components/catalog/CatalogToolbar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PageState } from '@/components/layout/PageState';
import type { CatalogParamKey } from '@/shared/hooks/useCatalogParams';

export function ResourceAdvancedFilters({ search, language, type, tag, area, options, onFilter }: {
  search: string; language: string; type: string; tag: string; area: string; options: Facet[];
  onFilter: (key: CatalogParamKey, value: string) => void;
}) {
  const { t } = useTranslation();
  const [topicSearch, setTopicSearch] = useState('');
  const topics = usePublicResourceTopics({ search, language, objectType: type, area });
  const fold = (text: string) => text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase();
  const choices = (topics.data ?? []).map(option => ({
    ...option, label: t('resourceTopics.' + option.value, { defaultValue: option.value }),
  })).filter(option => !topicSearch.trim() || fold(option.label).includes(fold(topicSearch.trim())));
  return <div className="border border-input bg-muted/20 p-5">
    <div className="grid gap-5 sm:grid-cols-2">
      <label className="space-y-2 text-sm font-medium">
        <span className="block">{t('common.language')}</span>
        <select className="h-11 w-full border border-input bg-background px-3" value={language} onChange={event => onFilter('language', event.target.value)}>
          <option value="">{t('catalog.allLanguages')}</option>
          {!['', ...LANGUAGES.map(([code]) => code)].includes(language) && <option value={language}>{language}</option>}
          {LANGUAGES.map(([code, label]) => <option key={code} value={code}>{label}</option>)}
        </select>
      </label>
      <label className="space-y-2 text-sm font-medium">
        <span className="block">{t('resources.filterType')}</span>
        <select className="h-11 w-full border border-input bg-background px-3" value={type} onChange={event => onFilter('type', event.target.value)}>
          <option value="">{t('resources.allTypes')}</option>
          {options.map(option => <option key={option.value} value={option.value}>{option.label} ({option.count})</option>)}
        </select>
      </label>
    </div>
    <StudyAreaFilters value={area} onChange={value => onFilter('area', value)} />
    <label className="block max-w-md space-y-2 text-sm font-medium">
      <span className="block">{t('resourceExplorer.searchTopics')}</span>
      <Input type="search" value={topicSearch} onChange={event => setTopicSearch(event.target.value)} placeholder={t('resourceExplorer.topicPlaceholder')} />
    </label>
    <div className="mt-4">
      {topics.isPending ? <p role="status" className="text-sm text-muted-foreground">{t('common.loading')}</p>
        : topics.error ? <PageState level="h3" title={t('common.error')} description={topics.error.message} retry={() => void topics.refetch()} />
        : choices.length ? <div className="max-h-60 overflow-y-auto p-1">
          <FacetGroup title={t('resources.filterTopic')} options={choices} value={tag} onChange={value => onFilter('tag', value)} />
        </div>
        : <p role="status" className="text-sm text-muted-foreground">{t('resourceExplorer.noTopics')}</p>}
      {tag && <Button variant="link" className="mt-2 px-0" onClick={() => onFilter('tag', '')}>{t('resourceExplorer.clearTopic')}</Button>}
    </div>
  </div>;
}
