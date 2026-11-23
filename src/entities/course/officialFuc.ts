/** Structured pointers to official UAlg FUCs. These fields are editorial extraction aids,
 * not a FACODI representation of the University's complete assessment rules. */
export interface OfficialFuc {
  year: string;
  url: string;
  topics: string[];
  studySteps: { label: string; activity: string }[];
  method: string;
}

const asRecord = (input: unknown): Record<string, unknown> | null =>
  input !== null && typeof input === 'object' && !Array.isArray(input)
    ? input as Record<string, unknown> : null;

export function readOfficialFuc(metadata: unknown, unitCode?: string | null): OfficialFuc | null {
  const m = asRecord(metadata);
  if (!m || m.official_fuc_checked !== true || m.official_fuc_verified_year !== '2026/27') return null;
  const url = m.official_fuc_url;
  if (typeof url !== 'string') return null;
  try {
    const target = new URL(url);
    if (target.protocol !== 'https:' || target.hostname !== 'academico.ualg.pt'
      || target.pathname !== '/netpa/doc' || target.searchParams.get('anoLectivo') !== '202627'
      || !/^\d{8}$/.test(target.searchParams.get('codeDiscip') ?? '')) return null;
    if (unitCode && target.searchParams.get('codeDiscip') !== unitCode) return null;
  } catch { return null; }
  const topics = (Array.isArray(m.official_fuc_program_topics) ? m.official_fuc_program_topics : [])
    .filter((item): item is string => typeof item === 'string')
    .map(item => item.replace(/^\s*[.\-•]+\s*/, '').trim())
    .filter(Boolean).slice(0, 8);
  const guide = asRecord(m.facodi_editorial_study_guide);
  const steps = (Array.isArray(guide?.steps) ? guide.steps : []).flatMap(item => {
    const row = asRecord(item);
    if (typeof row?.label !== 'string' || typeof row?.activity !== 'string') return [];
    return [{ label: row.label.trim(), activity: row.activity.trim() }];
  }).filter(row => row.label && row.activity).slice(0, 4);
  if (!topics.length) return null;
  return { year: '2026/27', url, topics, studySteps: steps,
    method: typeof m.official_fuc_review_method === 'string' ? m.official_fuc_review_method : 'unknown' };
}
