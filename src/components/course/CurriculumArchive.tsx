import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ArrowUpRight, History } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import { safeExternalUrl } from '@/shared/lib/navigation';

interface ArchivedUnit {
  code: string;
  title: string;
  year: number | null;
  semester: number | null;
  ects: number | null;
  hours: number | null;
  brazilianCredits: number | null;
  optionGroup: string | null;
  category: string | null;
}
type Equivalence = { from_2006: string; to_2019: string };

function parseArchivedUnits(raw: Json): ArchivedUnit[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap(item => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return [];
    const { code, title, year, semester, ects, hours, brazilian_credits, option_group, category } = item;
    if (typeof code !== 'string' || typeof title !== 'string') return [];
    return [{
      code, title,
      year: typeof year === 'number' ? year : null,
      semester: typeof semester === 'number' ? semester : null,
      ects: typeof ects === 'number' ? ects : null,
      hours: typeof hours === 'number' ? hours : null,
      brazilianCredits: typeof brazilian_credits === 'number' ? brazilian_credits : null,
      optionGroup: typeof option_group === 'string' ? option_group : null,
      category: typeof category === 'string' ? category : null,
    }];
  });
}

function comparisonInfo(value: Json): { exactOverlap: number | null; equivalences: Equivalence[] } {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return { exactOverlap: null, equivalences: [] };
  const exactOverlap = typeof value.exact_code_overlap === 'number' ? value.exact_code_overlap : null;
  const raw = value.listed_equivalences;
  if (!Array.isArray(raw)) return { exactOverlap, equivalences: [] };
  const equivalences: Equivalence[] = raw.flatMap(item => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return [];
    const { from_2006, to_2019 } = item;
    if (typeof from_2006 !== 'string' || typeof to_2019 !== 'string') return [];
    return [{ from_2006, to_2019 }];
  });
  return { exactOverlap, equivalences };
}

/**
 * Archives from different institutions use different credit systems.
 * In particular, UFES Brazilian course credits and workloads are not ECTS.
 */
export function CurriculumArchive({ courseId }: { courseId: string }) {
  const { t } = useTranslation();
  const query = useQuery({
    queryKey: ['facodi', 'curriculum-archives', courseId],
    queryFn: async ({ signal }) => {
      const { data, error } = await supabase
        .from('course_curriculum_archives')
        .select('id,academic_year,unique_unit_count,programme_ects,official_source_url,plan,comparison')
        .eq('course_id', courseId)
        .eq('status', 'archived')
        .eq('published', true)
        .order('academic_year', { ascending: false })
        .limit(3)
        .abortSignal(signal);
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 10 * 60_000,
  });

  if (query.isPending) return <p role="status" className="mt-6 text-sm text-muted-foreground">{t('common.loading')}</p>;
  if (query.error) return <div role="alert" className="mt-6 text-sm text-destructive">
    <p>{t('courseArchive.error')}</p>
    <button type="button" onClick={() => void query.refetch()} className="mt-2 font-semibold underline underline-offset-4">{t('common.retry')}</button>
  </div>;
  if (!query.data?.length) return null;

  return <section className="mt-12 border-t border-foreground pt-9" aria-labelledby="historical-curriculum-title">
    <h2 id="historical-curriculum-title" className="flex items-center gap-3 text-2xl font-semibold">
      <History className="h-6 w-6" aria-hidden="true" />{t('courseArchive.title')}
    </h2>
    <p className="mt-3 max-w-3xl text-sm text-muted-foreground">{t('courseArchive.notice')}</p>
    {query.data.map(archive => {
      const units = parseArchivedUnits(archive.plan);
      const { exactOverlap, equivalences } = comparisonInfo(archive.comparison);
      const source = safeExternalUrl(archive.official_source_url);
      const useBrazilianHours = archive.programme_ects == null;
      const years = [...new Set(units.map(unit => unit.year).filter((n): n is number => n != null))]
        .sort((a, b) => a - b);
      if (units.some(unit => unit.year == null)) years.push(0);

      return <details key={archive.id} className="mt-5 border border-input">
        <summary className="cursor-pointer list-inside px-5 py-4 font-semibold hover:bg-muted">
          {archive.academic_year} · {t('courseArchive.unitCount', { count: archive.unique_unit_count })}
        </summary>
        <div className="space-y-5 border-t border-input px-5 py-6">
          <p className="text-sm text-muted-foreground">
            {useBrazilianHours ? t('courseArchive.brazilianCreditsNotice') : t('courseArchive.credits', { count: archive.programme_ects })}
            {exactOverlap != null ? ' · ' + t('courseArchive.codeOverlap', { count: exactOverlap }) : ''}
          </p>
          <p className="text-sm">{t('courseArchive.equivalenceNoticeGeneral')}</p>
          {source && <a href={source} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm font-semibold underline underline-offset-4">
            {t('courseArchive.officialSourceGeneral')}<ArrowUpRight className="h-4 w-4" />
          </a>}
          {years.map(year => {
            const yearUnits = units.filter(unit => year === 0 ? unit.year == null : unit.year === year);
            if (!yearUnits.length) return null;
            return <section key={year} aria-label={year === 0 ? t('courseArchive.unscheduled') : t('catalog.year', { value: year })}>
              <h3 className="mb-3 text-lg font-semibold">
                {year === 0 ? t('courseArchive.unscheduled') : t('catalog.year', { value: year })}
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[34rem] border-collapse text-left text-sm">
                  <thead><tr className="border-b border-foreground text-muted-foreground">
                    <th scope="col" className="py-2 pr-4">{t('courseArchive.unit')}</th>
                    <th scope="col" className="py-2 pr-4">{t('courseArchive.term')}</th>
                    <th scope="col" className="py-2 pr-4">{useBrazilianHours ? t('courseArchive.hours') : 'ECTS'}</th>
                  </tr></thead>
                  <tbody>{yearUnits.map(unit => <tr key={unit.code} className="border-b border-input">
                    <td className="py-3 pr-4">
                      <span className="font-medium">{unit.title}</span>
                      <span className="block font-mono text-label text-muted-foreground">{unit.code}</span>
                      {unit.category && <span className="block text-xs text-muted-foreground">
                        {t(`courseArchive.categories.${unit.category}`, { defaultValue: unit.category })}
                      </span>}
                      {!unit.category && unit.optionGroup && <span className="text-xs text-muted-foreground">
                        {t('courseArchive.elective', { group: unit.optionGroup })}
                      </span>}
                    </td>
                    <td className="py-3 pr-4 whitespace-nowrap">
                      {unit.semester == null ? t('courseArchive.notScheduled') : unit.semester === 0
                        ? t('courseArchive.annual') : t('catalog.semester', { value: unit.semester })}
                    </td>
                    <td className="py-3 pr-4 font-mono tabular-nums">
                      {useBrazilianHours ? unit.hours == null ? '—' : `${unit.hours} h` : unit.ects ?? '—'}
                    </td>
                  </tr>)}</tbody>
                </table>
              </div>
            </section>;
          })}
          {equivalences.length > 0 && <details className="border border-input">
            <summary className="cursor-pointer px-4 py-3 text-sm font-semibold">
              {t('courseArchive.equivalences', { count: equivalences.length })}
            </summary>
            <div className="space-y-4 px-4 pb-4">
              <p className="text-sm text-muted-foreground">{t('courseArchive.equivalencesWarning')}</p>
              <div className="max-h-[32rem] overflow-y-auto">
                <table className="w-full border-collapse text-left text-xs">
                  <thead><tr className="border-b border-foreground">
                    <th className="py-2 pr-4">{t('courseArchive.priorCode')}</th>
                    <th className="py-2 pr-4">{t('courseArchive.currentCode')}</th>
                  </tr></thead>
                  <tbody>{equivalences.map((entry, index) => <tr key={`${entry.from_2006}-${entry.to_2019}-${index}`}
                    className="border-b border-input">
                    <td className="py-2 pr-4 font-mono">{entry.from_2006}</td>
                    <td className="py-2 pr-4 font-mono">{entry.to_2019}</td>
                  </tr>)}</tbody>
                </table>
              </div>
            </div>
          </details>}
        </div>
      </details>;
    })}
  </section>;
}
