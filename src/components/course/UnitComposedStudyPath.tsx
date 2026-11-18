import { ArrowRight, BookOpenCheck, ListVideo, PlayCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { SequenceSummary } from '@/entities/sequence/sequence';
import type { ComposedStudyPath } from '@/entities/course/composedStudyPath';
import type { LinkedCatalogAsset } from '@/features/courses/queries/useLinkedCatalogAssets';

/** Curriculum -> thematic sections -> existing editorial playlists.
 * Each playlist retains its own course-independent media, progress and public URL.
 */
export function UnitComposedStudyPath({
  config, sequences, modules,
}: {
  config: ComposedStudyPath;
  sequences: SequenceSummary[];
  modules: LinkedCatalogAsset[];
}) {
  const { t, i18n } = useTranslation();
  const locale = (['pt', 'en', 'es', 'fr'] as const)
    .find(candidate => i18n.language.toLowerCase().startsWith(candidate)) ?? 'pt';
  const bySlug = new Map(sequences.map(item => [item.slug, item]));
  const first = config.sections[0]?.sequenceSlugs[0];
  return <section id="unit-study-path" aria-labelledby="unit-composed-heading" className="scroll-mt-28 border-t border-foreground pt-9">
    <p className="font-mono text-label uppercase tracking-wide text-muted-foreground">{t('composedPath.eyebrow')}</p>
    <h2 id="unit-composed-heading" className="mt-2 text-2xl font-semibold tracking-tight">{t('composedPath.title')}</h2>
    <p className="mt-3 max-w-prose text-sm leading-relaxed text-muted-foreground">{t('composedPath.description')}</p>
    {first && <Link to={`/sequences/${encodeURIComponent(first)}`}
      className="mt-6 inline-flex items-center gap-2 border border-foreground bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90">
      <PlayCircle className="h-4 w-4" aria-hidden="true" />{t('composedPath.start')}
      <ArrowRight className="h-4 w-4" aria-hidden="true" />
    </Link>}
    <ol className="mt-7 space-y-5">
      {config.sections.map((section, index) => <li key={section.id} className="border border-input p-5">
        <div className="flex items-start gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center border border-foreground font-mono text-sm">{index + 1}</span>
          <div>
            <h3 className="text-lg font-semibold">{section.labels[locale]}</h3>
            <p className="mt-1 text-xs text-muted-foreground">{t('composedPath.sequenceCount', { count: section.sequenceSlugs.length })}</p>
          </div>
        </div>
        <ul className="mt-4 divide-y divide-input border-t border-input">
          {section.sequenceSlugs.map(slug => {
            const sequence = bySlug.get(slug);
            if (!sequence) return null;
            return <li key={slug}>
              <Link to={`/sequences/${encodeURIComponent(slug)}`} className="group flex items-center justify-between gap-4 py-3 text-sm hover:bg-muted/40">
                <span className="min-w-0">
                  <span className="block font-semibold group-hover:underline group-hover:underline-offset-4">{sequence.title}</span>
                  <span className="mt-1 block text-xs text-muted-foreground">{t('composedPath.lessonCount', { count: sequence.itemCount })}</span>
                </span>
                <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
              </Link>
            </li>;
          })}
        </ul>
      </li>)}
    </ol>
    <p className="mt-4 text-xs leading-relaxed text-muted-foreground">{t('composedPath.progressNotice')}</p>

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
            <Link to={`/sequences/${encodeURIComponent(slug)}`}
              className="inline-flex items-center gap-2 text-sm font-semibold underline underline-offset-4">
              {sequence.title}<ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
            </Link>
          </li>;
        })}
      </ul>
    </div>}
  </section>;
}
