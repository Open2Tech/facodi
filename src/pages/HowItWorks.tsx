import { PageSeo } from '@/components/layout/PageSeo';
import { staticPageMeta } from '@/shared/seo/seo';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, BookOpenCheck, FolderOpen, ListVideo, ShieldCheck } from 'lucide-react';
import { LearningPathGuide } from '@/components/learning/LearningPathGuide';

export default function HowItWorks() {
  const { t } = useTranslation();
  return <article className="space-y-14 pb-10 sm:space-y-20">
    <PageSeo {...staticPageMeta('/how-it-works', { title: t('learningGuide.pageTitle'), description: t('learningGuide.pageDescription') })} />
    <header className="grid gap-6 border-b border-foreground pb-11 lg:grid-cols-[1fr_0.8fr]">
      <div>
        <p className="font-mono text-label uppercase tracking-widest text-muted-foreground">{t('learningGuide.eyebrow')}</p>
        <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight tracking-tight sm:text-6xl">
          {t('learningGuide.pageTitle')}
        </h1>
      </div>
      <p className="max-w-xl self-end text-lg leading-relaxed text-muted-foreground">{t('learningGuide.pageDescription')}</p>
    </header>
    <LearningPathGuide />
    <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
      <div className="border border-input p-7">
        <div className="mb-5 inline-flex h-11 w-11 items-center justify-center border border-foreground bg-brand-mint text-ink">
          <BookOpenCheck className="h-6 w-6" aria-hidden="true" />
        </div>
        <h2 className="text-2xl font-semibold">{t('learningGuide.modulesTitle')}</h2>
        <p className="mt-4 leading-relaxed text-muted-foreground">{t('learningGuide.modulesText')}</p>
        <Link className="mt-6 inline-flex items-center gap-2 text-sm font-semibold underline underline-offset-4" to="/resources?type=module">
          {t('learningGuide.modulesCta')}<ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
      <div className="border border-input p-7">
        <div className="mb-5 inline-flex h-11 w-11 items-center justify-center border border-foreground bg-brand-pink text-ink">
          <ListVideo className="h-6 w-6" aria-hidden="true" />
        </div>
        <h2 className="text-2xl font-semibold">{t('learningGuide.sequencesTitle')}</h2>
        <p className="mt-4 leading-relaxed text-muted-foreground">{t('learningGuide.sequencesText')}</p>
        <Link className="mt-6 inline-flex items-center gap-2 text-sm font-semibold underline underline-offset-4" to="/sequences">
          {t('learningGuide.sequencesCta')}<ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </section>
    <section className="grid gap-6 border-t border-input pt-10 lg:grid-cols-[0.55fr_1fr]">
      <div className="flex items-start gap-3">
        <FolderOpen className="h-7 w-7 shrink-0" aria-hidden="true" />
        <h2 className="text-2xl font-semibold">{t('learningGuide.resourcesTitle')}</h2>
      </div>
      <div>
        <p className="leading-relaxed text-muted-foreground">{t('learningGuide.resourcesText')}</p>
        <Link className="mt-5 inline-flex items-center gap-2 text-sm font-semibold underline underline-offset-4" to="/resources">
          {t('learningGuide.resourcesCta')}<ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </section>
    <section className="flex gap-4 border border-input bg-muted/40 p-6">
      <ShieldCheck className="mt-0.5 h-6 w-6 shrink-0" aria-hidden="true" />
      <div>
        <h2 className="text-lg font-semibold">{t('learningGuide.disclaimerTitle')}</h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">{t('learningGuide.disclaimerText')}</p>
      </div>
    </section>
  </article>;
}
