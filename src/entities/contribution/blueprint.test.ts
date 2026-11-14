import { describe, expect, it } from 'vitest';
import { readBlueprint } from '@/entities/contribution/blueprint';

describe('readBlueprint', () => {
  it('reads first-generation unit study paths', () => {
    const view = readBlueprint({
      structure_type: 'module',
      prompt: { unit_id: 'u1' },
      result: { unit_code: '19411006', unit_title: 'POO', course_code: 'LESTI', available_video_links: 2, available_reading_links: 1,
        steps: [{ order: 1, topic: 'Classes', activity: 'Estudar' }] },
    });
    expect(view).toMatchObject({ isCourse: false, code: '19411006', title: 'POO', courseCode: 'LESTI', videoLinks: 2, readingLinks: 1 });
    expect(view.elements).toEqual([{ order: 1, label: 'Classes', code: '', year: null, semester: null, ects: null, activity: 'Estudar' }]);
  });

  it('reads second-generation units and official course maps without losing titles', () => {
    const unit = readBlueprint({
      structure_type: 'module',
      prompt: { unit_code: '18121016', official_course_code: '1812' },
      result: { code: '18121016', title: 'Estágio', ects: 30, year: 2, semester: 4, approved_video_links: 0, approved_reading_links: 3,
        topics: [{ order: 1, title: 'Planeamento', activity: 'Ler' }] },
    });
    expect(unit).toMatchObject({ title: 'Estágio', courseCode: '1812', ects: 30, year: 2, semester: 4, videoLinks: 0, readingLinks: 3 });
    expect(unit.elements[0].label).toBe('Planeamento');

    const map = readBlueprint({
      structure_type: 'curriculum_mapping',
      prompt: { official_course_id: '1812' },
      result: { official_title: 'CTeSP em Sistemas', official_url: 'https://www.ualg.pt/curso/1812/plano', ects_total: 120,
        units: [{ code: '18121019', title: 'Bases de Dados I', year: 1, semester: 1, ects: 6 }] },
    });
    expect(map).toMatchObject({ isCourse: true, code: '1812', title: 'CTeSP em Sistemas', ects: 120, officialUrl: 'https://www.ualg.pt/curso/1812/plano' });
    expect(map.elements[0]).toMatchObject({ code: '18121019', label: 'Bases de Dados I', year: 1, ects: 6 });
  });

  it('drops non-https official links', () => {
    expect(readBlueprint({ structure_type: 'curriculum_mapping', prompt: {}, result: { official_plan: 'javascript:alert(1)' } }).officialUrl).toBeNull();
  });
});
