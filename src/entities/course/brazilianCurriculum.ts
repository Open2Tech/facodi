/**
 * UFES curriculum credits are Brazilian academic credits, not ECTS.
 * Keep the source metadata as the single source of truth for the contact
 * hours and the elective group, without guessing at a conversion rate.
 */
const GROUPS = [
  'opt_english_linguistics',
  'opt_english_literature',
  'opt_general_linguistics',
  'opt_general_literature',
] as const;

export type UfesElectiveGroup = typeof GROUPS[number];

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown> : null;
}

function positiveNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
    ? value : null;
}

/** Official full course hours from a Brazilian PPC. */
export function courseHours(metadata: unknown): number | null {
  return positiveNumber(record(metadata)?.official_course_hours);
}

/** Official per-subject semester contact hours. */
export function unitHours(metadata: unknown): number | null {
  return positiveNumber(record(metadata)?.official_hours);
}

/** Preserve local credit units in their original, non-ECTS system. */
export function brazilianCredits(metadata: unknown): number | null {
  return positiveNumber(record(metadata)?.brazilian_course_credits);
}

export function ufesElectiveGroup(metadata: unknown): UfesElectiveGroup | null {
  const group = record(metadata)?.elective_group;
  return typeof group === 'string' && GROUPS.some(value => value === group)
    ? group as UfesElectiveGroup : null;
}

export function ufesElectiveGroupOrder(group: UfesElectiveGroup | null): number {
  return group === null ? -1 : GROUPS.indexOf(group);
}
