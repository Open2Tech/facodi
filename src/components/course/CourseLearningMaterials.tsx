import { useState } from 'react';
import { ArrowRight, ArrowUpRight, BookOpen, Layers3, ListVideo } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCourseLearningAssets } from '@/features/courses/queries/useCourseLearningAssets';
import { useSequences } from '@/features/sequences/useSequences';
import { SequenceList } from '@/components/sequence/SequenceList';
import { safeExternalUrl } from '@/shared/lib/navigation';
import { plainText } from '@/shared/lib/text';
import type { CourseLearningAsset } from '@/entities/course/courseLearningAssets';

const PREVIEW_COUNT = 6;

export interface CourseLearningUnit {
  learningObjectId: string | null;
  title: string;
  code: string | null;
}

/** All learning material already linked to the course or its public units.
 * External YouTube playlists are intentionally distinct from FACODI editorial sequences. */
export function CourseLearningMaterials({
  courseObjectId, units,
}: {
  courseObjectId: string | null;
  units: readonly CourseLearningUnit[];
}) {
  const { t } = useTranslation();
  const assets = useCourseLearningAssets(courseObjectId, units);
  const sequences = useSequences(null, units.some(unit => !!unit.code));
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const codes = new Set(units.flatMap(unit => unit.code ? [unit.code] : []));
  const editorial = (sequences.data ?? []).filter(sequence =>
    sequence.itemCount > 0 && sequence.unitCodes.some(code => codes.has(code)));
  const playlists = assets.data?.playlists ?? [];
  const references = assets.data?.references ?? [];
  const guides = assets.data?.guides ?? [];
  const hasContent = editorial.length + playlists.length + references.length + guides.length > 0;

  if (!hasContent && !assets.isPending && !assets.error && !sequences.isPending && !sequences.error) return null;

  function showMore(key: string, total: number) {
    return total > PREVIEW_COUNT && <button
      type="button"
      aria-expanded={!!expanded[key]}
      onClick={() => setExpanded(previous => ({ ...previous, [key]: !previous[key] }))}
      className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-semibold underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      {expanded[key] ? t('courseMaterials.showLess') : t('courseMaterials.showAll', { count: total })}
      <ArrowRight className="h-4 w-4" aria-hidden="true" />
    </button>;
  }

  function assetList(key: string, values: CourseLearningAsset[]) {
    const shown = expanded[key] ? values : values.slice(0, PREVIEW_COUNT);
    return <>
      <ul className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {shown.map(asset => {
          const external = key === 'references' ? safeExternalUrl(asset.sourceUrl) : undefined;
          const content = <>
            <span className="font-semibold leading-snug group-hover:underline group-hover:underline-offset-4">{asset.title}</span>
            {asset.description && <span className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">{plainText(asset.description)}</span>}
            {!!asset.unitTitles.length && <span className="mt-auto pt-2 text-xs leading-relaxed text-muted-foreground">
              {t('courseMaterials.linkedUnits')}: {asset.unitTitles.slice(0, 2).join(' · ')}
              {asset.unitTitles.length > 2 && <> · {t('courseMaterials.moreUnits', { count: asset.unitTitles.length - 2 })}</>}
            </span>}
            <span className="inline-flex items-center gap-1 pt-1 text-xs font-semibold">
              {external ? t('courseMaterials.openSource') : t('courseMaterials.open')}
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
          </>;
          return <li key={asset.id} className="min-w-0">
            {external
              ? <a href={external} target="_blank" rel="noopener noreferrer"
                className="group flex h-full min-h-36 flex-col gap-2 border border-input p-4 transition-colors hover:border-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:p-5">{content}</a>
              : <Link to={`/resources/${encodeURIComponent(asset.slug)}`}
                className="group flex h-full min-h-36 flex-col gap-2 border border-input p-4 transition-colors hover:border-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:p-5">{content}</Link>}
          </li>;
        })}
      </ul>
      {showMore(key, values.length)}
    </>;
  }

  return <section id="course-materials" aria-labelledby="course-materials-title" className="mb-12 scroll-mt-28 border-t border-foreground pt-9">
    <div className="flex flex-wrap items-center gap-3">
      <div className="grid h-10 w-10 place-items-center bg-brand-mint text-ink" aria-hidden="true"><BookOpen className="h-5 w-5" /></div>
      <h2 id="course-materials-title" className="text-2xl font-semibold tracking-[-0.02em] sm:text-3xl">{t('courseMaterials.title')}</h2>
    </div>
    <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">{t('courseMaterials.description')}</p>

    {assets.isPending && <p role="status" className="mt-5 text-sm text-muted-foreground">{t('common.loading')}</p>}
    {assets.error && <div role="alert" className="mt-5 border border-input p-5 text-sm">
      <p>{t('courseMaterials.loadFailed')}</p>
      <button type="button" onClick={() => void assets.refetch()} className="mt-3 min-h-11 font-semibold underline underline-offset-4">{t('common.retry')}</button>
    </div>}
    {!!editorial.length && <section aria-labelledby="course-editorial-sequences" className="mt-8">
      <h3 id="course-editorial-sequences" className="flex items-center gap-2 text-xl font-semibold"><ListVideo className="h-5 w-5" aria-hidden="true" />{t('courseMaterials.editorialSequences')} <span className="font-mono text-sm text-muted-foreground">({editorial.length})</span></h3>
      <div className="mt-4"><SequenceList sequences={expanded.editorial ? editorial : editorial.slice(0, PREVIEW_COUNT)} headingLevel={4} showUnits={false} /></div>
      {showMore('editorial', editorial.length)}
    </section>}
    {sequences.error && <p role="alert" className="mt-4 text-sm text-muted-foreground">{t('courseMaterials.sequencesFailed')}</p>}

    {!!playlists.length && <section aria-labelledby="course-playlists" className="mt-8">
      <h3 id="course-playlists" className="flex items-center gap-2 text-xl font-semibold"><ListVideo className="h-5 w-5" aria-hidden="true" />{t('courseMaterials.playlists')} <span className="font-mono text-sm text-muted-foreground">({playlists.length})</span></h3>
      <p className="mt-2 text-sm text-muted-foreground">{t('courseMaterials.playlistNotice')}</p>
      {assetList('playlists', playlists)}
    </section>}
    {!!references.length && <section aria-labelledby="course-references" className="mt-8">
      <h3 id="course-references" className="flex items-center gap-2 text-xl font-semibold"><Layers3 className="h-5 w-5" aria-hidden="true" />{t('courseMaterials.references')} <span className="font-mono text-sm text-muted-foreground">({references.length})</span></h3>
      {assetList('references', references)}
    </section>}
    {!!guides.length && <section aria-labelledby="course-guides" className="mt-8">
      <h3 id="course-guides" className="flex items-center gap-2 text-xl font-semibold"><BookOpen className="h-5 w-5" aria-hidden="true" />{t('courseMaterials.guides')} <span className="font-mono text-sm text-muted-foreground">({guides.length})</span></h3>
      {assetList('guides', guides)}
    </section>}
    {hasContent && <p className="mt-6 text-xs leading-relaxed text-muted-foreground">{t('courseMaterials.notice')}</p>}
  </section>;
}
