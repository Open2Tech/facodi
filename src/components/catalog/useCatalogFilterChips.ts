import { useTranslation } from 'react-i18next';
import { isStudyArea } from '@/shared/catalog/studyAreas';
import { LANGUAGES } from '@/components/catalog/CatalogToolbar';
import type { ActiveFilter } from '@/components/catalog/ActiveFilters';

/** Labelled chips for the shared URL filters; `type` carries the already translated type label. */
export function useCatalogFilterChips({ search, language, tag, area, type }: { search: string; language: string; tag?: string; area?: string; type?: string }) {
  const { t } = useTranslation();
  const chips: ActiveFilter[] = [];
  if (search.trim()) chips.push({ key: 'search', label: t('catalog.filterSearch'), value: search.trim() });
  if (language) chips.push({ key: 'language', label: t('common.language'), value: LANGUAGES.find(([code]) => code === language)?.[1] ?? language });
  if (type) chips.push({ key: 'type', label: t('catalog.filterType'), value: type });
  if (area) chips.push({ key: 'area', label: t('catalog.area'), value: isStudyArea(area) ? t('catalog.studyAreas.' + area) : area });
  if (tag) chips.push({ key: 'tag', label: t('catalog.filterTag'), value: tag });
  return chips;
}
