import { useTranslation } from 'react-i18next';
import { useCourses } from '@/features/courses/queries/useCourses';
import { CourseList } from '@/components/course/CourseList';
import { Pagination } from '@/components/course/Pagination';
import { PageState } from '@/components/layout/PageState';
import { CatalogHeader, CatalogToolbar } from '@/components/catalog/CatalogToolbar';
import { useCatalogParams } from '@/shared/hooks/useCatalogParams';
import { LearningContext } from '@/components/learning/LearningPathGuide';

export default function Courses() {
  const { t } = useTranslation();
  const { page, search, language, filter, filtered } = useCatalogParams();
  const query = useCourses({ page, search, language });
  return <>
    <CatalogHeader title={t('catalog.title')} description={t('catalog.description')} total={query.data?.total} />
    <LearningContext focus="course" />
    <CatalogToolbar search={search} language={language} onFilter={filter} />
    {query.isPending ? <PageState loading /> : query.error ? <PageState title={t('common.error')} description={query.error.message} retry={() => void query.refetch()} /> : <>
      {query.data.items.length ? <CourseList courses={query.data.items} /> : <PageState title={t('catalog.empty')} description={t(filtered ? 'catalog.noResults' : 'catalog.emptyDescription')} />}
      <Pagination page={page} total={query.data.total} onChange={value => filter('page', String(value))} />
    </>}
  </>;
}
