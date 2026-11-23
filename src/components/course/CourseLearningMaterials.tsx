import { useEffect, useState } from 'react';
import { ArrowRight, ArrowUpRight, BookOpen, Layers3, ListVideo, PlayCircle } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SearchInput } from '@/components/catalog/SearchInput';
import { useCourseLearningAssets } from '@/features/courses/queries/useCourseLearningAssets';
import { useSequences } from '@/features/sequences/useSequences';
import { SequenceList } from '@/components/sequence/SequenceList';
import { VideoThumbnail } from '@/components/resource/VideoCard';
import { videoInfo } from '@/entities/course/video';
import { safeExternalUrl } from '@/shared/lib/navigation';
import { unitPath } from '@/entities/course/course.paths';
import { plainText } from '@/shared/lib/text';
import { COURSE_MATERIAL_PAGE, COURSE_MATERIAL_PREVIEW, nextCourseMaterialVisibleCount, filterCourseLearningAssets, normalizeCourseMaterialTerm, emptyCourseLearningAssets, type CourseLearningAsset } from '@/entities/course/courseLearningAssets';

export interface CourseLearningUnit {
  learningObjectId: string | null;
  title: string;
  code: string | null;
  slug: string;
}

/** All learning material already linked to the course or its public units.
 * External YouTube playlists are intentionally distinct from FACODI editorial sequences. */
export function CourseLearningMaterials({
  courseSlug, courseObjectId, units,
}: {
  courseSlug: string;
  courseObjectId: string | null;
  units: readonly CourseLearningUnit[];
}) {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const assets = useCourseLearningAssets(courseObjectId, units);
  const sequences = useSequences(null, units.some(unit => !!unit.code));
  const [visibleCounts, setVisibleCounts] = useState<Record<string, number>>({});
  const [searchReset, setSearchReset] = useState(0);
  const query = new URLSearchParams(location.search);
  const searchTerm = query.get('materialsSearch') ?? '';
  const requestedSlug = query.get('materialsUnit');
  const selectedUnit = units.find(unit => unit.slug === requestedSlug && !!unit.learningObjectId);
  const selectedUnitId = selectedUnit?.learningObjectId ?? '';
  /** Keep the UC and search in the same shareable URL without touching unrelated params. */
  function updateMaterialFilters(unitSlug: string | null, keyword: string) {
    const next = new URLSearchParams(location.search);
    if (unitSlug) next.set('materialsUnit', unitSlug);
    else next.delete('materialsUnit');
    if (keyword) next.set('materialsSearch', keyword);
    else next.delete('materialsSearch');
    navigate({
      pathname: location.pathname,
      search: next.toString() ? `?${next}` : '',
      hash: '#course-materials',
    }, { replace: true, preventScrollReset: true, state: location.state });
    setVisibleCounts({});
  }
  function selectUnit(id: string) {
    const unit = units.find(item => item.learningObjectId === id);
    updateMaterialFilters(unit?.slug ?? null, searchTerm);
  }
  useEffect(() => {
    if (location.hash !== '#course-materials') return;
    const frame = requestAnimationFrame(() => document.getElementById('course-materials')?.scrollIntoView());
    return () => cancelAnimationFrame(frame);
  }, [location.hash, assets.isPending, sequences.isPending]);
  const search = normalizeCourseMaterialTerm(searchTerm);
  const codes = new Set(units.flatMap(unit => unit.code ? [unit.code] : []));
  const allEditorial = (sequences.data ?? []).filter(sequence =>
    sequence.itemCount > 0 && sequence.unitCodes.some(code => codes.has(code)));
  const editorial = allEditorial.filter(sequence =>
    (!selectedUnit || (selectedUnit.code != null && sequence.unitCodes.includes(selectedUnit.code)))
    && (!search || normalizeCourseMaterialTerm([sequence.title, sequence.description, ...sequence.unitCodes].join(' ')).includes(search)));
  const unitCodesById = new Map<string, string>();
  for (const unit of units) if (unit.learningObjectId && unit.code) unitCodesById.set(unit.learningObjectId, unit.code);
  const sourceAssets = assets.data ?? emptyCourseLearningAssets();
  const filteredAssets = filterCourseLearningAssets(sourceAssets, selectedUnitId || null, searchTerm, unitCodesById);
  const { videos, playlists, references, guides } = filteredAssets;
  const hasContent = allEditorial.length + sourceAssets.videos.length + sourceAssets.playlists.length + sourceAssets.references.length + sourceAssets.guides.length > 0;
  const hasMatches = editorial.length + videos.length + playlists.length + references.length + guides.length > 0;
  const hasFilters = Boolean(search || selectedUnitId);


  function showMore(key: string, total: number) {
    if (total <= COURSE_MATERIAL_PREVIEW) return null;
    const visible = Math.min(total, visibleCounts[key] ?? COURSE_MATERIAL_PREVIEW);
    const allVisible = visible >= total;
    const upcoming = Math.min(COURSE_MATERIAL_PAGE, total - visible);
    return <button
      type="button"
      aria-expanded={visible > COURSE_MATERIAL_PREVIEW}
      onClick={() => setVisibleCounts(previous => ({
        ...previous,
        [key]: allVisible ? COURSE_MATERIAL_PREVIEW : nextCourseMaterialVisibleCount(total, visible),
      }))}
      className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-semibold underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      {allVisible ? t('courseMaterials.showLess') : t('courseMaterials.loadMore', { count: upcoming, visible, total })}
      <ArrowRight className="h-4 w-4" aria-hidden="true" />
    </button>;
  }

  const ASSET_STYLES: Record<string, { card: string; badge: string }> = {
    playlists: { card: 'border-t-brand-pink hover:bg-brand-pink/10', badge: 'bg-brand-pink text-brand-ink' },
    references: { card: 'border-t-brand-cyan hover:bg-brand-cyan/10', badge: 'bg-brand-cyan text-brand-ink' },
    guides: { card: 'border-t-brand-mint hover:bg-brand-mint/10', badge: 'bg-brand-mint text-brand-ink' },
  };

  function assetList(key: string, values: CourseLearningAsset[]) {
    const shown = values.slice(0, visibleCounts[key] ?? COURSE_MATERIAL_PREVIEW);
    const tone = ASSET_STYLES[key]?.card ?? 'border-t-primary';
    const cardClass = `group flex h-full min-h-36 flex-col gap-2 border border-input border-t-4 bg-card transition-colors hover:border-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${key === 'videos' ? '' : 'p-4 sm:p-5'} ${tone}`;
    return <>
      <ul className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {shown.map(asset => {
          const external = key === 'references' ? safeExternalUrl(asset.sourceUrl) : undefined;
          const content = <>
            {key === 'videos' && <VideoThumbnail info={videoInfo(asset.metadata, asset.sourceUrl)} zoom />}
            <span className={key === 'videos' ? 'px-4 pt-3 font-semibold leading-snug group-hover:underline group-hover:underline-offset-4 sm:px-5' : 'font-semibold leading-snug group-hover:underline group-hover:underline-offset-4'}>{asset.title}</span>
            {asset.description && <span className={key === 'videos' ? 'line-clamp-2 px-4 text-sm leading-relaxed text-muted-foreground sm:px-5' : 'line-clamp-2 text-sm leading-relaxed text-muted-foreground'}>{plainText(asset.description)}</span>}
            {!!asset.unitTitles.length && <span className={key === 'videos' ? 'mt-auto px-4 pt-2 text-xs leading-relaxed text-muted-foreground sm:px-5' : 'mt-auto pt-2 text-xs leading-relaxed text-muted-foreground'}>
              {t('courseMaterials.linkedUnits')}: {asset.unitTitles.slice(0, 2).join(' · ')}
              {asset.unitTitles.length > 2 && <> · {t('courseMaterials.moreUnits', { count: asset.unitTitles.length - 2 })}</>}
            </span>}
            <span className={key === 'videos' ? 'inline-flex items-center gap-1 px-4 pb-4 pt-1 text-xs font-semibold sm:px-5' : 'inline-flex items-center gap-1 pt-1 text-xs font-semibold'}>
              {external ? t('courseMaterials.openSource') : t('courseMaterials.open')}
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
          </>;
          return <li key={asset.id} className="min-w-0">
            {external
              ? <a href={external} target="_blank" rel="noopener noreferrer" className={cardClass}>{content}</a>
              : <Link to={`/resources/${encodeURIComponent(asset.slug)}`} className={cardClass}>{content}</Link>}
          </li>;
        })}
      </ul>
      {showMore(key, values.length)}
    </>;
  }

  return <section id="course-materials" aria-labelledby="course-materials-title" className="mb-12 scroll-mt-28 border-t border-foreground pt-9">
    <div className="flex flex-wrap items-center gap-3">
      <div className="grid h-10 w-10 place-items-center border border-foreground bg-brand-mint text-brand-ink" aria-hidden="true"><BookOpen className="h-5 w-5" /></div>
      <h2 id="course-materials-title" className="text-2xl font-semibold tracking-[-0.02em] sm:text-3xl">{t('courseMaterials.title')}</h2>
    </div>
    <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">{t('courseMaterials.description')}</p>
    {hasContent && <div className="mt-6 grid gap-4 border border-foreground border-t-4 border-t-brand-mint bg-card p-5 sm:grid-cols-2" role="search" aria-label={t('courseMaterials.filterTitle')}>
      <div className="min-w-0">
        <label htmlFor="course-material-search" className="mb-2 block text-sm font-semibold">{t('courseMaterials.searchLabel')}</label>
        <SearchInput key={searchReset} id="course-material-search" value={searchTerm} onSearch={value => updateMaterialFilters(selectedUnit?.slug ?? null, value)}
          placeholder={t('courseMaterials.searchPlaceholder')}
          className="min-h-11 w-full min-w-0 border border-input bg-background px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring" />
      </div>
      <div className="min-w-0">
        <label htmlFor="course-material-unit" className="mb-2 block text-sm font-semibold">{t('courseMaterials.unitFilterLabel')}</label>
        <select id="course-material-unit" value={selectedUnitId} onChange={event => selectUnit(event.target.value)}
          className="min-h-11 w-full min-w-0 border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <option value="">{t('courseMaterials.allUnits')}</option>
          {units.filter(unit => unit.learningObjectId).map(unit =>
            <option key={unit.learningObjectId} value={unit.learningObjectId!}>{unit.code ? `${unit.code} · ` : ''}{unit.title}</option>)}
        </select>
      </div>
      {hasFilters && <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm sm:col-span-2">
        <button type="button" className="min-h-11 font-semibold underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onClick={() => { setSearchReset(previous => previous + 1); updateMaterialFilters(null, ''); }}>{t('courseMaterials.clearFilters')}</button>
        {selectedUnit && <Link to={unitPath(courseSlug, selectedUnit.slug)} state={location.state}
          className="inline-flex min-h-11 items-center gap-1.5 font-semibold underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          {t('courseMaterials.openUnit')}<ArrowUpRight className="h-4 w-4" aria-hidden="true" />
        </Link>}
      </div>}
    </div>}

    {!hasContent && !assets.isPending && !sequences.isPending && !assets.error && !sequences.error && <div className="mt-6 border border-input bg-card p-5 sm:p-6">
      <p className="text-sm leading-relaxed text-muted-foreground">{t('courseMaterials.emptyCourse')}</p>
      <Link to="/resources" className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm font-semibold underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        {t('courseMaterials.browseLibrary')}<ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </div>}
    {assets.isPending && <p role="status" className="mt-5 text-sm text-muted-foreground">{t('common.loading')}</p>}
    {assets.error && <div role="alert" className="mt-5 border border-input p-5 text-sm">
      <p>{t('courseMaterials.loadFailed')}</p>
      <button type="button" onClick={() => void assets.refetch()} className="mt-3 min-h-11 font-semibold underline underline-offset-4">{t('common.retry')}</button>
    </div>}
    {hasContent && hasFilters && !hasMatches && !assets.isPending && !sequences.isPending && <p role="status" className="mt-6 border border-input p-5 text-sm text-muted-foreground">{t('courseMaterials.noMatches')}</p>}
    {!!editorial.length && <section aria-labelledby="course-editorial-sequences" className="mt-8">
      <h3 id="course-editorial-sequences" className="flex items-center gap-2 text-xl font-semibold"><ListVideo className="h-5 w-5" aria-hidden="true" />{t('courseMaterials.editorialSequences')} <span className="font-mono text-sm text-muted-foreground">({editorial.length})</span></h3>
      <div className="mt-4"><SequenceList sequences={editorial.slice(0, visibleCounts.editorial ?? COURSE_MATERIAL_PREVIEW)} headingLevel={4} showUnits={false} /></div>
      {showMore('editorial', editorial.length)}
    </section>}
    {sequences.error && <p role="alert" className="mt-4 text-sm text-muted-foreground">{t('courseMaterials.sequencesFailed')}</p>}

    {!!videos.length && <section aria-labelledby="course-video-lessons" className="mt-8">
      <h3 id="course-video-lessons" className="flex items-center gap-2 text-xl font-semibold">
        <PlayCircle className="h-5 w-5" aria-hidden="true" />
        {t('courseMaterials.videoLessons')} <span className="font-mono text-sm text-muted-foreground">({videos.length})</span>
      </h3>
      <p className="mt-2 max-w-prose text-sm text-muted-foreground">{t('courseMaterials.videoNotice')}</p>
      {assetList('videos', videos)}
    </section>}

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
