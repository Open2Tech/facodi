import { ArrowDownRight, ArrowUpRight, BookOpen, Network } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { useCourses } from '@/features/courses/queries/useCourses';
import { CourseList } from '@/components/course/CourseList';
import { PageState } from '@/components/layout/PageState';

export default function Home() {
  const { t } = useTranslation();
  const query = useCourses({ page: 1, search: '', language: '' });
  return <>
    <section className="grid gap-10 border-b border-input pb-14 pt-5 lg:grid-cols-[1.4fr_1fr] lg:gap-16 lg:pb-20">
      <div>
        <p className="mb-6 flex items-center gap-2 text-sm font-medium"><span className="h-2 w-2 rounded-full bg-foreground" />{t('home.campus')}</p>
        <h1 className="max-w-3xl text-4xl font-semibold leading-[1.08] tracking-[-0.035em] sm:text-6xl lg:text-7xl">{t('home.title')}</h1>
        <p className="mt-7 max-w-xl text-lg leading-relaxed text-muted-foreground">{t('home.description')}</p>
        <Button size="lg" className="mt-8" asChild><Link to="/courses">{t('home.explore')}<ArrowUpRight /></Link></Button>
        <p className="mt-6 text-sm text-muted-foreground">{t('home.open')}</p>
      </div>
      <div className="flex flex-col justify-between border border-foreground bg-primary p-7 text-primary-foreground sm:p-9">
        <div className="flex justify-between border-b border-black/30 pb-5 text-sm font-semibold"><span>{t('home.notebook')}</span><Network className="h-5 w-5" /></div>
        <div className="py-12"><BookOpen className="mb-7 h-12 w-12" strokeWidth={1.2} /><p className="max-w-xs text-3xl font-semibold leading-tight">{t('home.question')}</p></div>
        <div className="flex items-end justify-between border-t border-black/30 pt-5"><p className="max-w-52 text-sm leading-relaxed">{t('home.connect')}</p><ArrowDownRight className="h-10 w-10" strokeWidth={1.2} /></div>
      </div>
    </section>
    <section className="py-12 sm:py-16">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-5"><div><h2 className="text-3xl font-semibold">{t('home.start')}</h2><p className="mt-3 max-w-prose text-muted-foreground">{t('home.startDescription')}</p></div><Link to="/courses" className="inline-flex items-center gap-2 text-sm font-semibold underline underline-offset-4">{t('catalog.all')}<ArrowUpRight className="h-4 w-4" /></Link></div>
      {query.isPending ? <PageState loading /> : query.error ? <PageState title={t('common.error')} description={query.error.message} retry={() => void query.refetch()} /> : query.data.items.length
        ? <CourseList courses={query.data.items.slice(0, 4)} />
        : <PageState title={t('catalog.empty')} description={t('catalog.emptyDescription')} />}
    </section>
    <section className="grid gap-6 border-t border-input py-10 md:grid-cols-2 md:gap-16"><h2 className="max-w-lg text-3xl font-semibold">{t('home.thread')}</h2><p className="max-w-prose leading-relaxed text-muted-foreground">{t('home.threadDescription')}</p></section>
  </>;
}
