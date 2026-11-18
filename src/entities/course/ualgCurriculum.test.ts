import { describe, expect, it } from 'vitest';
import { buildUalgSections, completionTrack, curriculumBranches, ectsVerificationPending, hasCurriculumPlacements, type UalgCurricularUnit } from './ualgCurriculum';

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


  it('draws any programme with branches from placements: the common trunk plus the chosen branch', () => {
    const tec = 'Telecomunicações, Eletrónica e Computadores';
    const ea = 'Energia e Automação';
    const units = [
      u('circuits', [placement('mandatory', 'Tronco Comum', 1, 1)], 1),
      u('data-structures', [placement('mandatory', tec, 2, 1), placement('alternative', ea, 3, 1, 'Opção I - EA')], 2),
      u('machines', [placement('mandatory', ea, 3, 1)], 3),
      u('robotics', [placement('alternative', tec, 3, 1, 'Opção I - TEC'), placement('mandatory', ea, 2, 1)], 4),
    ];
    expect(hasCurriculumPlacements(units)).toBe(true);
    expect(hasCurriculumPlacements([...units, u('loose', [])])).toBe(false);
    expect(curriculumBranches(units)).toEqual([tec, ea]);
    const view = (branch: string) => buildUalgSections(units, 'LEEC', branch)
      .map(section => [section.year, section.role, section.optionGroup, section.units.map(unit => unit.code)]);
    expect(view(tec)).toEqual([
      [1, 'mandatory', null, ['circuits']],
      [2, 'mandatory', null, ['data-structures']],
      [3, 'alternative', 'Opção I - TEC', ['robotics']],
    ]);
    expect(view(ea)).toEqual([
      [1, 'mandatory', null, ['circuits']],
      [2, 'mandatory', null, ['robotics']],
      [3, 'mandatory', null, ['machines']],
      [3, 'alternative', 'Opção I - EA', ['data-structures']],
    ]);
  });

  it('shows a programme without branches as its common trunk with option groups', () => {
    const units = [
      u('core', [placement('mandatory', 'Tronco Comum', 1, 2)]),
      u('choice-a', [placement('alternative', 'Tronco Comum', 1, 2, 'Opção I')]),
    ];
    expect(curriculumBranches(units)).toEqual([]);
    expect(buildUalgSections(units, 'LCBM', null).map(section => [section.role, section.optionGroup])).toEqual([
      ['mandatory', null], ['alternative', 'Opção I'],
    ]);
  });
});

