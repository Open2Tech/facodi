import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import { useResource } from '@/features/courses/queries/useCourses';
import { SafeHtml } from '@/components/course/SafeHtml';
import { PageState } from '@/components/layout/PageState';
import { safeExternalUrl } from '@/shared/lib/navigation';
import { stringList } from '@/shared/lib/text';
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
  const objectives = stringList(resource.objectives);
  return <article>
    <Link to="/resources" className="mb-8 inline-flex items-center gap-2 text-sm underline underline-offset-4"><ArrowLeft className="h-4 w-4" />{t('nav.resources')}</Link>
    <header className="border-b border-foreground pb-10">
      <p className="mb-5 flex flex-wrap gap-x-4 font-mono text-xs uppercase text-muted-foreground"><span>{t(`objectTypes.${resource.object_type}`, { defaultValue: resource.object_type })}</span><span lang={resource.language}>{resource.language}</span></p>
      <h1 className="max-w-4xl text-4xl font-semibold leading-[1.05] tracking-[-0.03em] sm:text-6xl">{resource.title}</h1>
    </header>
    <div className="grid gap-12 py-10 lg:grid-cols-[1fr_20rem]">
      <div className="min-w-0">
        <SafeHtml html={resource.description} />
        {!!objectives.length && <section aria-labelledby="objectives" className="mt-10">
          <h2 id="objectives" className="text-2xl font-semibold">{t('resource.objectives')}</h2>
          <ol className="mt-4 space-y-3">{objectives.map((objective, index) => <li key={objective} className="flex gap-4"><span className="font-mono text-sm text-muted-foreground">{String(index + 1).padStart(2, '0')}</span><span>{objective}</span></li>)}</ol>
        </section>}
        {source ? <Button size="lg" className="mt-10" asChild><a href={source} target="_blank" rel="noopener noreferrer">{t('catalog.source')}<ArrowUpRight /></a></Button>
          : resource.source_url && <p role="alert" className="mt-6 text-destructive">{t('validation.url')}</p>}
      </div>
      {(!!resource.tags.length || !!resource.keywords.length) && <aside className="space-y-8 self-start">
        {!!resource.tags.length && <section aria-labelledby="tags"><h2 id="tags" className="mb-3 text-sm font-semibold">{t('catalog.tags')}</h2>
          <ul className="flex flex-wrap gap-2">{resource.tags.map(tag => <li key={tag}><Link to={`/resources?tag=${encodeURIComponent(tag)}`} className="inline-block border border-input px-3 py-1 text-sm hover:border-foreground hover:bg-primary hover:text-primary-foreground">{tag}</Link></li>)}</ul></section>}
        {!!resource.keywords.length && <section aria-labelledby="keywords"><h2 id="keywords" className="mb-3 text-sm font-semibold">{t('resource.keywords')}</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">{resource.keywords.join(' · ')}</p></section>}
      </aside>}
    </div>
  </article>;
}
