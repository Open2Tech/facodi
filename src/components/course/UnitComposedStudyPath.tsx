import { ArrowRight, BookOpenCheck, ListVideo, PlayCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { SequenceSummary } from '@/entities/sequence/sequence';
import type { ComposedStudyPath } from '@/entities/course/composedStudyPath';
import { sequenceInUnitPath } from '@/entities/course/course.paths';
import type { LinkedCatalogAsset } from '@/features/courses/queries/useLinkedCatalogAssets';

/** Curriculum -> thematic sections -> existing editorial playlists.
 * Each playlist retains its own course-independent media, progress and public URL.
 */
export function UnitComposedStudyPath({
  config, sequences, modules, courseSlug, unitSlug, authored = true,
}: {
  config: ComposedStudyPath;
  courseSlug?: string;
  unitSlug?: string;
  authored?: boolean;
  sequences: SequenceSummary[];
  modules: LinkedCatalogAsset[];
}) {
  const { t, i18n } = useTranslation();
  const locale = (['pt', 'en', 'es', 'fr'] as const)
    .find(candidate => i18n.language.toLowerCase().startsWith(candidate)) ?? 'pt';
  const bySlug = new Map(sequences.map(item => [item.slug, item]));
  const first = config.sections[0]?.sequenceSlugs[0];
  const href = (slug: string) => courseSlug && unitSlug ? sequenceInUnitPath(slug, courseSlug, unitSlug) : '/sequences/' + encodeURIComponent(slug);
  return <section id="unit-study-path" aria-labelledby="unit-composed-heading" className="scroll-mt-28 border-t border-foreground pt-9">
    {authored && <p className="font-mono text-xs uppercase tracking-wide text-muted-foreground">{t('composedPath.eyebrow')}</p>}
    <h2 id="unit-composed-heading" className="mt-2 text-2xl font-semibold tracking-tight">{t(authored ? 'composedPath.title' : 'sequences.forUnit')}</h2>
    <p className="mt-3 max-w-prose text-sm leading-relaxed text-muted-foreground">{t(authored ? 'composedPath.description' : 'composedPath.progressNotice')}</p>
    {authored && first && <Link to={href(first)}
      className="mt-6 inline-flex items-center gap-2 border border-foreground bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90">
      <PlayCircle className="h-4 w-4" aria-hidden="true" />{t('composedPath.start')}
      <ArrowRight className="h-4 w-4" aria-hidden="true" />
    </Link>}
    <ol className="mt-7 space-y-5">
      {config.sections.map((section, index) => !authored && section.sequenceSlugs.length === 1 ? <li key={section.id}>
        <Link to={href(section.sequenceSlugs[0])} className="group flex min-h-16 items-center gap-4 border border-input border-l-4 border-l-brand-cyan bg-card p-4 hover:border-foreground hover:bg-brand-cyan/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <ListVideo className="h-5 w-5 shrink-0" aria-hidden="true" />
          <span className="min-w-0 flex-1"><span className="block font-semibold group-hover:underline group-hover:underline-offset-4">{section.labels[locale]}</span><span className="mt-1 block text-xs text-muted-foreground">{t('composedPath.lessonCount', { count: bySlug.get(section.sequenceSlugs[0])?.itemCount ?? 0 })}</span></span>
          <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
        </Link>
      </li> : <li key={section.id} className="border border-input border-l-4 border-l-brand-cyan bg-card">
        <details open={index === 0} className="group/chapter">
        <summary className="flex cursor-pointer list-none items-start gap-3 p-5 [&::-webkit-details-marker]:hidden">
          <span className="grid h-9 w-9 shrink-0 place-items-center border border-foreground font-mono text-sm">{index + 1}</span>
          <div>
            <h3 className="text-lg font-semibold">{section.labels[locale]}</h3>
            <p className="mt-1 text-xs text-muted-foreground">{t('composedPath.sequenceCount', { count: section.sequenceSlugs.length })}</p>
          </div>
          <ArrowRight className="ml-auto mt-2 h-4 w-4 shrink-0 transition-transform group-open/chapter:rotate-90" aria-hidden="true" />
        </summary>
        <ul className="divide-y divide-input border-t border-input px-5">
          {section.sequenceSlugs.map(slug => {
            const sequence = bySlug.get(slug);
            if (!sequence) return null;
            return <li key={slug}>
              <Link to={href(slug)} className="group flex items-center justify-between gap-4 py-3 text-sm hover:bg-muted/40">
                <span className="min-w-0">
                  <span className="block font-semibold group-hover:underline group-hover:underline-offset-4">{sequence.title}</span>
                  <span className="mt-1 block text-xs text-muted-foreground">{t('composedPath.lessonCount', { count: sequence.itemCount })}</span>
                </span>
                <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
              </Link>
            </li>;
          })}
        </ul>
        </details>
      </li>)}
    </ol>
    {authored && <p className="mt-4 text-xs leading-relaxed text-muted-foreground">{t('composedPath.progressNotice')}</p>}

    {!!config.guideModuleSlugs.length && <div className="mt-8 border-t border-input pt-6">
      <h3 className="flex items-center gap-2 text-lg font-semibold"><BookOpenCheck className="h-5 w-5" aria-hidden="true" />{t('composedPath.guides')}</h3>
      <ul className="mt-4 space-y-3">
        {config.guideModuleSlugs.map(slug => {
          const module = modules.find(module => module.slug === slug);
          return module && <li key={slug}>
            <Link to={`/modules/${encodeURIComponent(slug)}`}
              className="inline-flex items-center gap-2 text-sm font-semibold underline underline-offset-4">
              {module.title}<ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
            </Link>
          </li>;
        })}
      </ul>
    </div>}

    {!!config.supplementarySequenceSlugs.length && <div className="mt-8 border-t border-input pt-6">
      <h3 className="flex items-center gap-2 text-lg font-semibold"><ListVideo className="h-5 w-5" aria-hidden="true" />{t('composedPath.extra')}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{t('composedPath.extraDescription')}</p>
      <ul className="mt-4 space-y-3">
        {config.supplementarySequenceSlugs.map(slug => {
          const sequence = bySlug.get(slug);
          return sequence && <li key={slug}>
            <Link to={href(slug)}
              className="inline-flex items-center gap-2 text-sm font-semibold underline underline-offset-4">
              {sequence.title}<ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
            </Link>
          </li>;
        })}
      </ul>
    </div>}
  </section>;
}
