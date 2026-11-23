import { ArrowRight, ArrowUpRight, BookOpenCheck, Clapperboard, Film, Mic2, PlayCircle, RadioTower } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { SectionLink } from '@/components/layout/SectionLink';
import { useSequences } from '@/features/sequences/useSequences';

const featured = [
  { slug: 'facodi-lcc-pt-media-lab-podcast-radio-ualg', icon: RadioTower, color: 'bg-brand-pink' },
  { slug: 'facodi-lcc-pt-media-lab-do-guiao-aos-planos', icon: BookOpenCheck, color: 'bg-brand-cyan' },
  { slug: 'facodi-lcc-pt-media-lab-captacao-camera-iluminacao-som', icon: Clapperboard, color: 'bg-brand-mint' },
  { slug: 'facodi-lcc-pt-media-lab-pos-producao-creditos-etica', icon: Film, color: 'bg-primary' },
] as const;

/**
 * The LCC course already includes its full learning-material catalogue below.
 * This small entrance uses the same public sequence RPC and links rather than
 * duplicating, hardcoding or reimplementing a lesson catalogue.
 */
export function CommunicationMediaLab({ unitCodes }: { unitCodes: readonly string[] }) {
  const { t } = useTranslation();
  const [allPaths, setAllPaths] = useState(false);
  const { data } = useSequences();
  const visible = featured.flatMap(item => {
    const sequence = data?.find(value => value.slug === item.slug && value.itemCount > 0);
    return sequence ? [{ ...item, sequence }] : [];
  });

  // The curriculum itself determines the additional video paths. The four
  // highlighted sequences above are the only editorially hand-picked cards.
  const eligibleCodes = new Set(unitCodes);
  const spotlight = new Set<string>(featured.map(item => item.slug));
  const extra = (data ?? []).filter(sequence =>
    sequence.itemCount > 0 && !spotlight.has(sequence.slug)
    && sequence.unitCodes.some(code => eligibleCodes.has(code)))
    .sort((a, b) => a.title.localeCompare(b.title, 'pt'));

  // Only published, reviewed sequences create working links; missing items disappear safely.
  if (!visible.length && !extra.length) return null;

  return <section id="lcc-media-lab" aria-labelledby="lcc-media-lab-title"
    className="mb-12 scroll-mt-28 border border-foreground border-t-4 border-t-brand-cyan bg-card">
    <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_minmax(15rem,0.65fr)] lg:gap-10">
      <div>
        <p className="inline-flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <RadioTower className="h-4 w-4 text-brand-cyan" aria-hidden="true" />{t('lccMediaLab.eyebrow')}
        </p>
        <h2 id="lcc-media-lab-title" className="mt-3 max-w-2xl text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">
          {t('lccMediaLab.title')}
        </h2>
        <p className="mt-3 max-w-prose text-sm leading-relaxed text-muted-foreground">
          {t('lccMediaLab.description')}
        </p>
      </div>
      <div className="flex flex-col justify-between gap-4 border border-foreground bg-brand-pink p-5 text-brand-ink">
        <Mic2 className="h-7 w-7" aria-hidden="true" />
        <div>
          <p className="text-xs font-bold uppercase tracking-wider">{t('lccMediaLab.localStory')}</p>
          <p className="mt-2 text-lg font-semibold leading-snug">{t('lccMediaLab.localStoryTitle')}</p>
          <p className="mt-2 text-sm leading-relaxed">{t('lccMediaLab.localStoryDescription')}</p>
        </div>
        <Link to="/resources/facodi-lcc-pt-media-lab-ear0mijd-ta"
          className="inline-flex min-h-11 items-center gap-2 self-start text-sm font-bold underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-ink">
          {t('lccMediaLab.openCase')}<ArrowUpRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </div>
    <div className="grid gap-3 border-t border-input p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-4">
      {visible.map(({ slug, icon: Icon, color, sequence }, index) => <Link
        key={slug} to={`/sequences/${encodeURIComponent(sequence.slug)}`}
        className="group flex min-w-0 flex-col border border-input bg-background p-4 transition-colors hover:border-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <div className="flex items-center justify-between gap-3">
          <span className={`grid h-12 w-12 place-items-center border border-foreground text-brand-ink ${color}`}>
            <Icon className="h-6 w-6" aria-hidden="true" />
          </span>
          <span className="font-mono text-xs font-semibold text-muted-foreground">
            {String(index + 1).padStart(2, '0')}
          </span>
        </div>
        <h3 className="mt-4 text-base font-semibold leading-snug group-hover:underline group-hover:underline-offset-4">{sequence.title}</h3>
        <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground">{sequence.description}</p>
        <span className="mt-auto inline-flex items-center gap-2 pt-5 text-xs font-semibold">
          <PlayCircle className="h-4 w-4" aria-hidden="true" />
          {t('lccMediaLab.lessons', { count: sequence.itemCount })}
          <ArrowRight className="ml-auto h-4 w-4" aria-hidden="true" />
        </span>
      </Link>)}
    </div>
    {!!extra.length && <div className="border-t border-input p-5 sm:p-7">
      <h3 className="text-lg font-semibold tracking-[-0.02em]">{t('lccMediaLab.moreTopics')}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{t('lccMediaLab.moreTopicsDescription')}</p>
      <ul className="mt-4 grid gap-2 md:grid-cols-2">
        {(allPaths ? extra : extra.slice(0, 8)).map(sequence => <li key={sequence.id}>
          <Link to={`/sequences/${encodeURIComponent(sequence.slug)}`}
            className="group flex min-h-16 items-center gap-3 border border-input bg-background px-4 py-3 transition-colors hover:border-foreground hover:bg-brand-cyan/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <BookOpenCheck className="h-5 w-5 shrink-0" aria-hidden="true" />
            <span className="min-w-0 flex-1 text-sm font-semibold leading-snug group-hover:underline group-hover:underline-offset-4">{sequence.title}</span>
            <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">{t('lccMediaLab.lessons', { count: sequence.itemCount })}</span>
            <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
          </Link>
        </li>)}
      </ul>
      {extra.length > 8 && <button type="button" onClick={() => setAllPaths(previous => !previous)}
        aria-expanded={allPaths}
        className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        {t(allPaths ? 'lccMediaLab.showFewer' : 'lccMediaLab.showAll', { count: extra.length })}
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </button>}
    </div>}
    <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t border-input px-5 py-4">
      <p className="text-xs text-muted-foreground">{t('lccMediaLab.sourceNote')}</p>
      <SectionLink hash="#course-materials" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold underline underline-offset-4">
        {t('lccMediaLab.allMaterials')}<ArrowRight className="h-4 w-4" aria-hidden="true" />
      </SectionLink>
    </div>
  </section>;
}
