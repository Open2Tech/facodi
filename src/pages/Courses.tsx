import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCourses } from '@/features/courses/queries/useCourses';
import { Input } from '@/components/ui/input';
import { CourseList } from '@/components/course/CourseList';
import { Pagination } from '@/components/course/Pagination';
import { PageState } from '@/components/layout/PageState';

export default function Courses() {
  const { t } = useTranslation();
  const [params, setParams] = useSearchParams();
  const page = Math.max(1, Math.min(100000, Math.floor(Number(params.get('page')) || 1)));
  const search = params.get('search') ?? '';
  const language = params.get('language') ?? '';
  const query = useCourses({ page, search, language });
  function filter(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== 'page') next.delete('page');
    setParams(next, { replace: true });
  }
  return <>
    <h1 className="text-4xl font-semibold">{t('catalog.title')}</h1>
    <p className="mt-4 max-w-prose text-lg text-muted-foreground">{t('catalog.description')}</p>
    <div className="mb-8 mt-9 flex flex-col gap-5 sm:flex-row">
      <label className="flex-1 space-y-2 text-sm font-medium"><span>{t('catalog.search')}</span><Input type="search" value={search} onChange={e => filter('search', e.target.value)} placeholder={t('catalog.searchPlaceholder')} /></label>
      <label className="space-y-2 text-sm font-medium"><span className="block">{t('common.language')}</span><select className="h-10 w-full rounded-md border border-input bg-background px-3 sm:w-48" value={language} onChange={e => filter('language', e.target.value)}>
        <option value="">{t('catalog.allLanguages')}</option>
        {!['', 'pt', 'en', 'es', 'fr'].includes(language) && <option value={language}>{language}</option>}
        <option value="pt">Português</option><option value="en">English</option><option value="es">Español</option><option value="fr">Français</option>
      </select></label>
    </div>
    {query.isPending ? <PageState loading /> : query.error ? <PageState title={t('common.error')} description={query.error.message} retry={() => void query.refetch()} /> : <>
      {query.data.items.length ? <CourseList courses={query.data.items} /> : <PageState title={t('catalog.empty')} description={t(search || language || page > 1 ? 'catalog.noResults' : 'catalog.emptyDescription')} />}
      <Pagination page={page} total={query.data.total} onChange={value => filter('page', String(value))} />
    </>}
  </>;
}
