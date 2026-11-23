import { ArrowRight, ArrowUpRight, BookOpenCheck, ClipboardCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { readOfficialFuc } from '@/entities/course/officialFuc';
import { courseMaterialsPath } from '@/entities/course/course.paths';

/** Facts link to the University's authoritative FUC; all study activities are FACODI editorial support. */
export function OfficialFucStudyGuide({
  metadata, courseSlug, unitSlug,
}: {
  metadata: unknown;
  courseSlug: string;
  unitSlug: string;
}) {
  const { t } = useTranslation();
  const official = readOfficialFuc(metadata);
  if (!official) return null;

  return <section id="official-fuc" className="mb-10 border border-foreground border-t-4 border-t-brand-cyan bg-card"
    aria-labelledby="official-fuc-heading">
    <div className="flex flex-wrap items-start justify-between gap-4 p-5 sm:p-7">
      <div className="max-w-2xl">
        <p className="inline-flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <BookOpenCheck className="h-4 w-4 text-brand-cyan" aria-hidden="true" />
          {t('officialFuc.kicker', { year: official.year })}
        </p>
        <h2 id="official-fuc-heading" className="mt-3 text-2xl font-semibold tracking-tight">
          {t('officialFuc.title')}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t('officialFuc.description')}</p>
      </div>
      <a href={official.url} target="_blank" rel="noopener noreferrer"
        className="inline-flex min-h-11 items-center gap-2 border border-foreground bg-brand-cyan px-4 py-2 text-sm font-semibold text-brand-ink hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        {t('officialFuc.source')} <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
      </a>
    </div>
    <div className="grid gap-6 border-t border-input p-5 sm:p-7 lg:grid-cols-2">
      <div>
        <h3 className="font-semibold">{t('officialFuc.topics')}</h3>
        <ul className="mt-3 space-y-2">{official.topics.map((topic, i) =>
          <li key={`${topic}-${i}`} className="flex items-start gap-3 text-sm leading-relaxed">
            <span className="mt-0.5 font-mono text-xs text-muted-foreground">{String(i + 1).padStart(2, '0')}</span>
            {topic}
          </li>)}</ul>
        <p className="mt-4 text-xs text-muted-foreground">{t('officialFuc.automatedNotice')}</p>
      </div>
      <div>
        <h3 className="flex items-center gap-2 font-semibold"><ClipboardCheck className="h-5 w-5" aria-hidden="true" />{t('officialFuc.studySteps')}</h3>
        <ol className="mt-3 divide-y divide-input border-y border-input">
          {official.studySteps.map((step, index) => <li key={`${index}-${step.label}`} className="py-3">
            <p className="text-sm font-semibold">{step.label}</p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{step.activity}</p>
          </li>)}
        </ol>
        <Link to={courseMaterialsPath(courseSlug, unitSlug)} className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold underline underline-offset-4">
          {t('officialFuc.openMaterials')}<ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </div>
    <div className="border-t border-input px-5 py-3 text-xs leading-relaxed text-muted-foreground sm:px-7">
      {t('officialFuc.assessmentNotice')}
    </div>
  </section>;
}
