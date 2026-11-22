import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, BookOpen } from 'lucide-react';
import { unitPath } from '@/entities/course/course.paths';
import { countExplored } from '@/entities/sequence/courseMap';
import { ExploredMark } from './CourseMap';
import { buildUalgSections, completionTrack, curriculumBranches, ectsVerificationPending, type UalgCurricularUnit, type UalgProgram, type UalgSpecialization } from '@/entities/course/ualgCurriculum';

interface UnitCoverage {
  curricular_unit_id: string;
  video_count: number;
  reading_count: number;
  playlist_count?: number;
  guide_count?: number;
}

const SPECIALIZATIONS: UalgSpecialization[] = ['Neurociências Cognitivas', 'Neuropsicologia'];

/**
 * A programme-specific curricular view; the canonical UC rows, codes and links
 * remain unchanged. Specializations and alternative choices are projections
 * of curriculum_placements, not duplicated UCs or additive ECTS.
 */
export function UalgCurriculum({
  program, courseSlug, units, coverage, explored = new Set<string>(), coverageReady = true,
}: {
  program: UalgProgram;
  courseSlug: string;
  units: readonly UalgCurricularUnit[];
  coverage: readonly UnitCoverage[];
  coverageReady?: boolean;
  /** Unit codes the signed-in learner has explored (course map); empty for visitors. */
  explored?: ReadonlySet<string>;
}) {
  const { t } = useTranslation();
  const [specialization, setSpecialization] = useState<UalgSpecialization>(SPECIALIZATIONS[0]);
  const branches = program === 'MNCN' || program === 'LPSI' ? [] : curriculumBranches(units);
  const [chosenBranch, setBranch] = useState<string | null>(null);
  const branch = chosenBranch && branches.includes(chosenBranch) ? chosenBranch : branches[0] ?? null;
  const sections = buildUalgSections(units, program, program === 'MNCN' ? specialization : branch);
  const years = [...new Set(sections.map(section => section.year))];
  const coverageById = new Map(coverage.map(item => [item.curricular_unit_id, item]));
  const isMaster = program === 'MNCN';

  return <div className="mt-7">
    <p className="max-w-prose text-sm leading-relaxed text-muted-foreground">
      {t(isMaster ? 'ualgCurriculum.masterNotice' : 'ualgCurriculum.licenceNotice')}
    </p>
    {branches.length > 1 && <div className="mt-6">
      <h3 id="ualg-branch" className="text-sm font-semibold">{t('ualgCurriculum.branch')}</h3>
      <p className="mt-1 max-w-prose text-sm text-muted-foreground">{t('ualgCurriculum.branchNotice')}</p>
      <div role="group" aria-labelledby="ualg-branch" className="mt-3 flex flex-wrap gap-2">
        {branches.map(value => <button key={value} type="button" aria-pressed={branch === value}
          className={branch === value
            ? 'min-h-11 border border-foreground bg-primary px-4 py-2 text-left text-sm font-semibold text-primary-foreground'
            : 'min-h-11 border border-input px-4 py-2 text-left text-sm font-semibold hover:border-foreground'}
          onClick={() => setBranch(value)}>
          {value}
        </button>)}
      </div>
    </div>}
    {isMaster && <>
      <div className="mt-6">
        <h3 id="ualg-specialization" className="text-sm font-semibold">{t('ualgCurriculum.specialization')}</h3>
        <div role="group" aria-labelledby="ualg-specialization" className="mt-3 flex flex-wrap gap-2">
          {SPECIALIZATIONS.map(value => <button key={value} type="button" aria-pressed={specialization === value}
            className={specialization === value
              ? 'border border-foreground bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground'
              : 'border border-input px-4 py-2 text-sm font-semibold hover:border-foreground'}
            onClick={() => setSpecialization(value)}>
            {t(value === 'Neurociências Cognitivas' ? 'ualgCurriculum.cognitiveNeuroscience' : 'ualgCurriculum.neuropsychology')}
          </button>)}
        </div>
      </div>
      <p className="mt-4 max-w-prose text-sm text-muted-foreground" aria-live="polite">
        {t('ualgCurriculum.verifiedTrack')}:{' '}
        <strong className="text-foreground">
          {t(completionTrack(specialization) === 'investigação'
            ? 'ualgCurriculum.researchTrack'
            : 'ualgCurriculum.professionalTrack')}
        </strong>
      </p>
    </>}
    {years.length > 1 && <nav aria-label={t('course.jumpToYear')} className="mt-6 flex flex-wrap gap-2">
      {years.map(year => <a key={year} href={`#ualg-${program}-year-${year}`}
        className="border border-input px-3 py-1.5 text-sm hover:border-foreground">
        {t('catalog.year', { value: year })}
      </a>)}
    </nav>}
    {years.map(year => <section key={year} id={`ualg-${program}-year-${year}`} className="mt-9 scroll-mt-28">
      <h3 className="border-b border-foreground pb-3 text-2xl font-semibold">{t('catalog.year', { value: year })}</h3>
      <div className="mt-5 grid gap-8 xl:grid-cols-2">
        {sections.filter(section => section.year === year).map(section => {
          const heading = section.role === 'mandatory'
            ? t('ualgCurriculum.required')
            : section.role === 'listed_variant'
              ? t('ualgCurriculum.variant')
              : section.optionGroup ?? t('ualgCurriculum.optional');
          const term = section.semester === null
            ? t('ualgCurriculum.annual')
            : t('catalog.semester', { value: section.semester });
          return <section key={section.key} className="min-w-0" aria-label={`${term} — ${heading}`}>
            <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-input pb-3">
              <h4 className="font-semibold">{term} · {heading}</h4>
              <span className="font-mono text-xs text-muted-foreground">
                {t('course.termSummary', { count: section.units.length })}
                {countExplored(section.units, explored) > 0 && ` · ${t('courseMap.groupExplored', { count: countExplored(section.units, explored) })}`}
              </span>
            </div>
            {section.role === 'alternative' && <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              {t('ualgCurriculum.choicesNotice')}
            </p>}
            {section.role === 'listed_variant' && <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              {t('ualgCurriculum.variantsNotice')}
            </p>}
            <ol className="mt-2 divide-y divide-input">
              {section.units.map(unit => {
                const media = coverageById.get(unit.id);
                const hasMedia = coverageReady && !!media && (media.video_count > 0 || media.reading_count > 0 || (media.playlist_count ?? 0) > 0 || (media.guide_count ?? 0) > 0);
                return <li key={unit.id}>
                  <Link to={unitPath(courseSlug, unit.slug)} className="group flex items-start justify-between gap-4 py-3 hover:bg-muted/30">
                    <span className="min-w-0 flex-1">
                      <span className="font-medium group-hover:underline group-hover:underline-offset-4">
                        {unit.title}
                      </span>
                      {hasMedia && <span className="ml-2 inline-flex h-5 w-5 items-center justify-center bg-brand-mint align-middle text-ink"
                        title={t('course.hasResource')}>
                        <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
                        <span className="sr-only">{t('course.hasResource')}</span>
                      </span>}
                      {explored.has(unit.code) && <ExploredMark />}
                      <span className="block font-mono text-xs text-muted-foreground">{unit.code}</span>
                      {coverageReady && !!media?.video_count && <span className="block text-xs text-muted-foreground">
                        {t('unit.videoChip', { count: media.video_count })}
                      </span>}
                      {coverageReady && !!media?.playlist_count && <span className="block text-xs text-muted-foreground">
                        {t('course.playlistChip', { count: media.playlist_count })}
                      </span>}
                      {coverageReady && !!media?.guide_count && <span className="block text-xs text-muted-foreground">
                        {t('course.guideChip', { count: media.guide_count })}
                      </span>}
                    </span>
                    <span className="shrink-0 text-right">
                      {ectsVerificationPending(unit.metadata)
                        ? <span className="block text-xs text-muted-foreground">{t('ualgCurriculum.ectsPending')}</span>
                        : unit.ects !== null && <span className="block font-mono text-xs tabular-nums text-muted-foreground">{unit.ects} ECTS</span>}
                      <ArrowRight className="ml-auto mt-1 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    </span>
                  </Link>
                </li>;
              })}
            </ol>
          </section>;
        })}
      </div>
    </section>)}
    {!sections.length && <p className="mt-6 text-sm text-muted-foreground">{t('catalog.noUnitsDescription')}</p>}
  </div>;
}
