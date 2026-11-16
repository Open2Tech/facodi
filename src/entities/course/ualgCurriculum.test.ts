import { describe, expect, it } from 'vitest';
import { buildUalgSections, completionTrack, ectsVerificationPending, type UalgCurricularUnit } from './ualgCurriculum';

const u = (code: string, placements: unknown[], position = 1): UalgCurricularUnit => ({
  id: code, slug: code, code, title: code, year: 1, semester: 1, ects: 5, position,
  metadata: { curriculum_placements: placements } as UalgCurricularUnit['metadata'],
});
const placement = (
  role: string, specialization: string, year = 1, semester: number | null = 1, group: string | null = null, track: string | null = null,
) => ({ role, specialization, year, semester, group, track });

describe('UAlg curriculum pathways', () => {
  it('keeps LPSI mandatory units apart from elective groups without adding all options', () => {
    const units = [
      u('mandatory', [placement('mandatory', 'Tronco Comum')]),
      u('option-a', [placement('alternative', 'Tronco Comum', 1, 1, 'Opção I')]),
      u('option-b', [placement('alternative', 'Tronco Comum', 1, 1, 'Opção I')]),
    ];
    const groups = buildUalgSections(units, 'LPSI');
    expect(groups.map(group => [group.role, group.optionGroup, group.units.length])).toEqual([
      ['mandatory', null, 1],
      ['alternative', 'Opção I', 2],
    ]);
  });

  it('uses only the verified second-year completion pathway for each specialization', () => {
    const nc = 'Neurociências Cognitivas';
    const np = 'Neuropsicologia';
    const units = [
      u('common', [placement('mandatory', nc), placement('mandatory', np)]),
      u('neuro-cognitive', [placement('mandatory', nc, 1, 2)]),
      u('neuro-psychology', [placement('mandatory', np, 1, 2)]),
      u('research', [placement('mandatory', nc, 2, null, null, 'investigação'),
                     placement('mandatory', np, 2, null, null, 'investigação')]),
      u('internship', [placement('mandatory', np, 2, null, null, 'profissional')]),
    ];
    const list = (spec: typeof nc | typeof np) =>
      buildUalgSections(units, 'MNCN', spec).flatMap(group => group.units.map(unit => unit.code));
    expect(completionTrack(nc)).toBe('investigação');
    expect(completionTrack(np)).toBe('profissional');
    expect(list(nc)).toEqual(['common', 'neuro-cognitive', 'research']);
    // Even if stale metadata still lists the NP research placement, do not expose that unsupported pathway.
    expect(list(np)).toEqual(['common', 'neuro-psychology', 'internship']);
  });

  it('prefers a mandatory occurrence and still exposes ambiguous official variants distinctly', () => {
    const nc = 'Neurociências Cognitivas';
    const units = [
      u('same-uc', [placement('mandatory', nc, 1, 2), placement('alternative', nc, 1, 2, 'Optativa II')]),
      u('listed-variant', [placement('listed_variant', nc, 1, 2, 'Code variant')]),
      u('malformed', [{ specialization: nc, year: '1', role: 'mandatory' }]),
    ];
    const groups = buildUalgSections(units, 'MNCN', nc);
    expect(groups.flatMap(group => group.units.map(unit => unit.code))).toEqual(['same-uc', 'listed-variant']);
    expect(groups.map(group => group.role)).toEqual(['mandatory', 'listed_variant']);
  });
  it('preserves a unit offered in multiple optional groups without creating distinct UC records', () => {
    const np = 'Neuropsicologia';
    const nc = 'Neurociências Cognitivas';
    const units = [
      u('shared-option', [
        placement('alternative', np, 1, 2, 'Optativa II'),
        placement('alternative', np, 1, 2, 'Optativa III'),
      ]),
      u('cross-specialty', [
        placement('mandatory', np, 1, 2),
        placement('alternative', nc, 1, 2, 'Optativa II'),
      ]),
    ];
    const neuropsychology = buildUalgSections(units, 'MNCN', np);
    expect(neuropsychology.map(group => [
      group.role, group.optionGroup, group.units.map(unit => unit.code),
    ])).toEqual([
      ['mandatory', null, ['cross-specialty']],
      ['alternative', 'Optativa II', ['shared-option']],
      ['alternative', 'Optativa III', ['shared-option']],
    ]);
    expect(buildUalgSections(units, 'MNCN', nc)
      .flatMap(group => group.units.map(unit => unit.code))).toEqual(['cross-specialty']);
  });

  it('flags ECTS values that conflict between the official elective groups', () => {
    expect(ectsVerificationPending({ ects_requires_fchs_confirmation: true })).toBe(true);
    expect(ectsVerificationPending({ ects_requires_fchs_confirmation: false })).toBe(false);
    expect(ectsVerificationPending(null)).toBe(false);
    expect(ectsVerificationPending({})).toBe(false);
  });

});
