import { describe, expect, it } from 'vitest';
import { readOfficialFuc } from './officialFuc';

const valid = {
  official_fuc_checked: true,
  official_fuc_verified_year: '2026/27',
  official_fuc_url: 'https://academico.ualg.pt/netpa/doc?_event=publicacaoFUC&anoLectivo=202627&codeDiscip=14561505',
  official_fuc_program_topics: ['Escalas de grandeza do plano', '. Ângulos de tomada de vista'],
  facodi_editorial_study_guide: { steps: [{ label: 'Aplicação', activity: 'Produz um exercício e documenta as decisões.' }] },
};
describe('readOfficialFuc', () => {
  it('reads validated programme topics and FACODI authored study steps', () => {
    const fuc = readOfficialFuc(valid);
    expect(fuc?.topics).toEqual(['Escalas de grandeza do plano', 'Ângulos de tomada de vista']);
    expect(fuc?.studySteps[0].label).toBe('Aplicação');
    expect(fuc?.url).toContain('codeDiscip=14561505');
  });
  it('rejects non-UAlg, old-year and unverified FUC pointers', () => {
    expect(readOfficialFuc({ ...valid, official_fuc_url: 'https://malicious.example/netpa/doc?anoLectivo=202627&codeDiscip=14561505' })).toBeNull();
    expect(readOfficialFuc({ ...valid, official_fuc_verified_year: '2025/26' })).toBeNull();
    expect(readOfficialFuc({ ...valid, official_fuc_checked: false })).toBeNull();
    expect(readOfficialFuc({ ...valid, official_fuc_program_topics: [] })).toBeNull();
    expect(readOfficialFuc(null)).toBeNull();
  });
});
