import type { Completion } from './milestones';
import type { SequenceSummary } from './sequence';

/**
 * Unit codes the learner has "explored": at least one lesson marked as done in a sequence linked to
 * that unit. Private by construction: it only reads the learner's own completions.
 */
export function exploredUnitCodes(completions: readonly Completion[], sequences: readonly Pick<SequenceSummary, 'id' | 'unitCodes'>[]) {
  const touched = new Set(completions.map(completion => completion.playlistId));
  const codes = new Set<string>();
  for (const sequence of sequences) {
    if (!touched.has(sequence.id)) continue;
    for (const code of sequence.unitCodes) codes.add(code);
  }
  return codes;
}

export function countExplored(units: readonly { code: string | null }[], explored: ReadonlySet<string>) {
  return units.reduce((total, unit) => total + (unit.code && explored.has(unit.code) ? 1 : 0), 0);
}
