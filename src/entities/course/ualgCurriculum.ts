import type { CurricularUnit } from '@/entities/course/course.types';

/** Programmes with bespoke rules; any other course is read only from its curriculum_placements. */
export type UalgProgram = 'LPSI' | 'MNCN' | (string & {});
export type UalgSpecialization = 'Neurociências Cognitivas' | 'Neuropsicologia';
/** Official 2026/27 completion route depends on the specialization. */
export function completionTrack(specialization: UalgSpecialization): 'investigação' | 'profissional' {
  return specialization === 'Neuropsicologia' ? 'profissional' : 'investigação';
}

/** Do not present a conflicting source ECTS value as verified. */
export function ectsVerificationPending(metadata: unknown): boolean {
  return isRecord(metadata) && metadata.ects_requires_fchs_confirmation === true;
}
export type UalgCurricularUnit = Pick<CurricularUnit, 'id' | 'slug' | 'title' | 'code' | 'ects' | 'year' | 'semester' | 'position' | 'metadata'>;
export type UalgPlacementRole = 'mandatory' | 'alternative' | 'listed_variant';

export interface UalgSection {
  key: string;
  year: number;
  semester: number | null;
  role: UalgPlacementRole;
  optionGroup: string | null;
  units: UalgCurricularUnit[];
}

interface Placement {
  year: number;
  semester: number | null;
  role: UalgPlacementRole;
  group: string | null;
  specialization: string | null;
  track: string | null;
}

const ROLE_ORDER: Record<UalgPlacementRole, number> = {
  mandatory: 0, alternative: 1, listed_variant: 2,
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

/** Placements shared by every branch of a programme. */
export const COMMON_TRUNK = 'Tronco Comum';

function parsePlacement(value: unknown): Placement | null {
  if (!isRecord(value)) return null;
  if (typeof value.year !== 'number' || !Number.isInteger(value.year) || value.year < 1) return null;
  if (value.role !== 'mandatory' && value.role !== 'alternative' && value.role !== 'listed_variant') return null;
  return {
    year: value.year,
    semester: typeof value.semester === 'number' && Number.isInteger(value.semester) ? value.semester : null,
    role: value.role,
    group: typeof value.group === 'string' && value.group.trim() ? value.group.trim() : null,
    specialization: typeof value.specialization === 'string' ? value.specialization : null,
    track: typeof value.track === 'string' ? value.track : null,
  };
}

const placementsOf = (unit: UalgCurricularUnit) => {
  const metadata = isRecord(unit.metadata) ? unit.metadata : {};
  return Array.isArray(metadata.curriculum_placements)
    ? metadata.curriculum_placements.flatMap(value => parsePlacement(value) ?? [])
    : [];
};

/** True when every unit states where it sits in the plan, so the plan can be drawn from placements alone. */
export function hasCurriculumPlacements(units: readonly UalgCurricularUnit[]) {
  return units.length > 0 && units.every(unit => placementsOf(unit).length > 0);
}

/** Branches (ramos) a programme splits into after the common trunk, in plan order. */
export function curriculumBranches(units: readonly UalgCurricularUnit[]) {
  const branches: string[] = [];
  const ordered = [...units].sort((a, b) => (a.position ?? 999) - (b.position ?? 999));
  for (const unit of ordered) for (const placement of placementsOf(unit)) {
    const name = placement.specialization;
    if (name && name !== COMMON_TRUNK && !branches.includes(name)) branches.push(name);
  }
  return branches;
}

/** The published 2026/27 programme contains repeated elective listings.
 * Resolve the official completion route by specialization, never inventing
 * an NP research pathway or counting alternatives as cumulative ECTS.
 */
export function buildUalgSections(
  units: readonly UalgCurricularUnit[],
  program: UalgProgram,
  specialization: string | null = 'Neurociências Cognitivas',
): UalgSection[] {
  const candidate = new Map<string, { unit: UalgCurricularUnit; placement: Placement }>();
  for (const unit of units) {
    const placements = placementsOf(unit);
    const visible = placements.filter(placement =>
      (program === 'LPSI'
        ? placement.specialization === COMMON_TRUNK
        : program === 'MNCN'
          ? placement.specialization === specialization &&
            (placement.year < 2 || placement.track === completionTrack(specialization as UalgSpecialization))
          // Any other programme: the common trunk plus the selected branch (a missing specialization is common).
          : (placement.specialization ?? COMMON_TRUNK) === COMMON_TRUNK || placement.specialization === specialization));
    for (const placement of visible) {
      // Some source tables repeat a UC as required and optional in one term.
      // Prefer the required placement in that term, without suppressing
      // legitimate alternatives when the same UC belongs to two choice groups.
      if (placement.role !== 'mandatory' && visible.some(other =>
        other.role === 'mandatory' &&
        other.year === placement.year && other.semester === placement.semester)) continue;
      const key = [
        unit.code ?? unit.id,
        placement.year,
        placement.semester ?? 'annual',
        placement.role,
        placement.group ?? '',
      ].join(':');
      if (!candidate.has(key)) candidate.set(key, { unit, placement });
    }
  }

  const groups = new Map<string, UalgSection>();
  for (const { unit, placement } of candidate.values()) {
    const groupName = placement.role === 'mandatory' ? null : placement.group;
    const key = [placement.year, placement.semester ?? 'annual', placement.role, groupName ?? ''].join(':');
    const section = groups.get(key) ?? {
      key, year: placement.year, semester: placement.semester, role: placement.role,
      optionGroup: groupName, units: [],
    };
    section.units.push(unit);
    groups.set(key, section);
  }

  for (const section of groups.values()) {
    section.units.sort((a, b) =>
      (a.position ?? 999) - (b.position ?? 999) ||
      a.title.localeCompare(b.title, 'pt') || a.id.localeCompare(b.id));
  }
  return [...groups.values()].sort((a, b) =>
    a.year - b.year ||
    (a.semester ?? 3) - (b.semester ?? 3) ||
    ROLE_ORDER[a.role] - ROLE_ORDER[b.role] ||
    (a.optionGroup ?? '').localeCompare(b.optionGroup ?? '', 'pt'));
}
