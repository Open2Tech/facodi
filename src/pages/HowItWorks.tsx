import { PageSeo } from '@/components/layout/PageSeo';
import { staticPageMeta } from '@/shared/seo/seo';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, BookOpenCheck, FolderOpen, ListVideo, ShieldCheck } from 'lucide-react';
import { LearningPathGuide } from '@/components/learning/LearningPathGuide';
import { SuggestResourceCallout } from '@/components/suggestion/SuggestResourceCallout';

export default function HowItWorks() {
  const { t } = useTranslation();
  return <article className="space-y-14 pb-10 sm:space-y-20">
    <PageSeo {...staticPageMeta('/how-it-works', { title: t('learningGuide.pageTitle'), description: t('learningGuide.pageDescription') })} />
    <header className="grid gap-6 border-b border-foreground border-t-4 border-t-primary pb-11 pt-6 lg:grid-cols-[1fr_0.8fr]">
      <div>
        <h1 className="max-w-3xl text-4xl font-semibold leading-tight tracking-tight sm:text-6xl">
          {t('learningGuide.pageTitle')}
        </h1>
      </div>
      <p className="max-w-xl self-end text-lg leading-relaxed text-muted-foreground">{t('learningGuide.pageDescription')}</p>
    </header>
    <LearningPathGuide />
    <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
      <div className="border border-foreground border-t-4 border-t-brand-mint bg-card p-7">
        <div className="mb-5 inline-flex h-11 w-11 items-center justify-center border border-foreground bg-brand-mint text-brand-ink">
          <BookOpenCheck className="h-6 w-6" aria-hidden="true" />
        </div>
        <h2 className="text-2xl font-semibold">{t('learningGuide.modulesTitle')}</h2>
        <p className="mt-4 leading-relaxed text-muted-foreground">{t('learningGuide.modulesText')}</p>
        <Link className="mt-6 inline-flex items-center gap-2 text-sm font-semibold underline underline-offset-4" to="/resources?type=module">
          {t('learningGuide.modulesCta')}<ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
      <div className="border border-foreground border-t-4 border-t-brand-pink bg-card p-7">
        <div className="mb-5 inline-flex h-11 w-11 items-center justify-center border border-foreground bg-brand-pink text-brand-ink">
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
        <span className="grid h-11 w-11 shrink-0 place-items-center border border-foreground bg-brand-cyan text-brand-ink" aria-hidden="true">
          <FolderOpen className="h-6 w-6" />
        </span>
        <h2 className="text-2xl font-semibold">{t('learningGuide.resourcesTitle')}</h2>
      </div>
      <div>
        <p className="leading-relaxed text-muted-foreground">{t('learningGuide.resourcesText')}</p>
        <Link className="mt-5 inline-flex items-center gap-2 text-sm font-semibold underline underline-offset-4" to="/resources">
          {t('learningGuide.resourcesCta')}<ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </section>
    <SuggestResourceCallout context="guide" />
    <section className="flex gap-4 border border-foreground border-t-4 border-t-primary bg-card p-6">
      <span className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center border border-foreground bg-primary text-brand-ink" aria-hidden="true">
        <ShieldCheck className="h-5 w-5" />
      </span>
      <div>
        <h2 className="text-lg font-semibold">{t('learningGuide.disclaimerTitle')}</h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">{t('learningGuide.disclaimerText')}</p>
        <h3 className="mt-5 text-sm font-semibold">{t('learningGuide.unitNotesTitle')}</h3>
        <ul className="mt-2 max-w-3xl list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted-foreground">
          <li>{t('unitOutcomes.notice')}</li>
          <li>{t('unitReadings.notice')}</li>
          <li>{t('unitPlaylists.notice')}</li>
        </ul>
      </div>
    </section>
  </article>;
}
