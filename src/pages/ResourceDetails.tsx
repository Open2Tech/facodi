import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowUpRight } from 'lucide-react';
import { useResource } from '@/features/courses/queries/useCourses';
import { SafeHtml } from '@/components/course/SafeHtml';
import { PageState } from '@/components/layout/PageState';
import { safeExternalUrl } from '@/shared/lib/navigation';
import { Button } from '@/components/ui/button';

export default function ResourceDetails() {
  const { slug = '' } = useParams();
  const { t } = useTranslation();
  const query = useResource(slug);
  if (query.isPending) return <PageState loading />;
  if (query.error) return <PageState title={t('common.error')} description={query.error.message} retry={() => void query.refetch()} />;
  if (!query.data) return <PageState title={t('common.notFound')} description={t('common.notFoundDescription')} />;
  const resource = query.data;
  const source = safeExternalUrl(resource.source_url);
  return <article className="max-w-4xl">
    <Link to="/courses" className="text-sm underline underline-offset-4">{t('nav.courses')}</Link>
    <p className="mb-4 mt-8 text-sm text-muted-foreground">{resource.object_type} · {resource.language.toUpperCase()}</p>
    <h1 className="mb-8 text-4xl font-semibold sm:text-5xl">{resource.title}</h1>
    <SafeHtml html={resource.description} />
    {!!resource.tags.length && <ul aria-label={t('catalog.tags')} className="my-7 flex flex-wrap gap-2">{resource.tags.map(tag => <li key={tag} className="rounded-full bg-muted px-3 py-1 text-sm">{tag}</li>)}</ul>}
    {source ? <Button className="mt-8" asChild><a href={source} target="_blank" rel="noopener noreferrer">{t('catalog.source')}<ArrowUpRight /></a></Button>
      : resource.source_url && <p role="alert" className="mt-6 text-destructive">{t('validation.url')}</p>}
  </article>;
}
