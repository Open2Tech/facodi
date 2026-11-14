import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ArrowUpRight, History } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import { safeExternalUrl } from '@/shared/lib/navigation';

interface ArchivedUnit {
  code: string;
  title: string;
  year: number;
  semester: number;
  ects: number;
  optionGroup: string | null;
}

function parseArchivedUnits(raw: Json): ArchivedUnit[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap(item => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return [];
    const { code, title, year, semester, ects, option_group } = item;
    if (typeof code !== 'string' || typeof title !== 'string' ||
      typeof year !== 'number' || typeof semester !== 'number' || typeof ects !== 'number') return [];
    return [{ code, title, year, semester, ects, optionGroup: typeof option_group === 'string' ? option_group : null }];
  });
}

function exactOverlap(value: Json): number | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return typeof value.exact_code_overlap === 'number' ? value.exact_code_overlap : null;
}

/** Public, read-only archive. 2025/26 options never join the current 2026/27 course units. */
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
      const overlap = exactOverlap(archive.comparison);
      const source = safeExternalUrl(archive.official_source_url);
      return <details key={archive.id} className="mt-5 border border-input">
        <summary className="cursor-pointer list-inside px-5 py-4 font-semibold hover:bg-muted">
          {archive.academic_year} · {t('courseArchive.unitCount', { count: archive.unique_unit_count })}
        </summary>
        <div className="space-y-5 border-t border-input px-5 py-6">
          <p className="text-sm text-muted-foreground">
            {t('courseArchive.credits', { count: archive.programme_ects })}
            {overlap != null ? ' · ' + t('courseArchive.codeOverlap', { count: overlap }) : ''}
          </p>
          <p className="text-sm">{t('courseArchive.equivalenceNotice')}</p>
          {source && <a href={source} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm font-semibold underline underline-offset-4">
            {t('courseArchive.officialSource')}<ArrowUpRight className="h-4 w-4" />
          </a>}
          {[1, 2, 3].map(year => {
            const yearUnits = units.filter(unit => unit.year === year);
            if (!yearUnits.length) return null;
            return <section key={year} aria-label={t('catalog.year', { value: year })}>
              <h3 className="mb-3 text-lg font-semibold">{t('catalog.year', { value: year })}</h3>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[34rem] border-collapse text-left text-sm">
                  <thead><tr className="border-b border-foreground text-muted-foreground">
                    <th scope="col" className="py-2 pr-4">{t('courseArchive.unit')}</th>
                    <th scope="col" className="py-2 pr-4">{t('courseArchive.term')}</th>
                    <th scope="col" className="py-2 pr-4">ECTS</th>
                  </tr></thead>
                  <tbody>{yearUnits.map(unit => <tr key={unit.code} className="border-b border-input">
                    <td className="py-3 pr-4">
                      <span className="font-medium">{unit.title}</span>
                      <span className="block font-mono text-xs text-muted-foreground">{unit.code}</span>
                      {unit.optionGroup && <span className="text-xs text-muted-foreground">{t('courseArchive.elective', { group: unit.optionGroup })}</span>}
                    </td>
                    <td className="py-3 pr-4 whitespace-nowrap">{unit.semester === 0
                      ? t('courseArchive.annual')
                      : t('catalog.semester', { value: unit.semester })}</td>
                    <td className="py-3 pr-4 font-mono tabular-nums">{unit.ects}</td>
                  </tr>)}</tbody>
                </table>
              </div>
            </section>;
          })}
        </div>
      </details>;
    })}
  </section>;
}
