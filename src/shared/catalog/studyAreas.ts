/** Editorial discovery hints, not formally accredited study areas.
 * Keep regex alternatives aligned with facodi.search_public_resources_v4,
 * which applies the same categorisation before database pagination.
 * A resource or sequence can be relevant to more than one area.
 */
export const STUDY_AREAS = [
  { key: 'mathematics', matcher: /matemat|calculo|algebra|estatistic|probabil|trigonometri|geometri/ },
  { key: 'technology', matcher: /program|software|dados|python|git|linux|sql|excel|web|informat|tecnolog|comput|algorit|react|javascript|cloud/ },
  { key: 'science', matcher: /fisic|physics|chemistr|quimic|astro|biolog|cienc/ },
  { key: 'psychology', matcher: /psicolog|psychol|psicoterap|psiquiatr|psychiatr|neuro|cerebr|brain|cognit|sinaps|synaps|farmacol|pharmacol|dopamin|tdah|\\bmental\\b/ },
  { key: 'management', matcher: /gestao|gestion|administra|contab|financ|empreend|marketing|negoci|econom/ },
  { key: 'languages', matcher: /lingu|idiom|ingles|english|literat|teaching|gramatic/ },
  { key: 'education', matcher: /educa|pedagog|ensino|didatic/ },
] as const;

export type StudyAreaKey = (typeof STUDY_AREAS)[number]['key'];

export function isStudyArea(value: string): value is StudyAreaKey {
  return STUDY_AREAS.some(area => area.key === value);
}

export function matchesStudyArea(text: string, key: string): boolean {
  const area = STUDY_AREAS.find(entry => entry.key === key);
  if (!area) return false;
  const normalised = text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
  return area.matcher.test(normalised);
}

/** Counts across the current non-area search/language filters, not just the visible page. */
export function countStudyAreas<T>(items: readonly T[], text: (item: T) => string): Record<StudyAreaKey, number> {
  const counts = Object.fromEntries(STUDY_AREAS.map(area => [area.key, 0])) as Record<StudyAreaKey, number>;
  for (const item of items) {
    const value = text(item);
    for (const area of STUDY_AREAS) if (matchesStudyArea(value, area.key)) counts[area.key]++;
  }
  return counts;
}
