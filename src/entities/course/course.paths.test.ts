import { describe, expect, it } from 'vitest';
import { courseMaterialsPath, unitPath } from './course.paths';

describe('FACODI course material deep links', () => {
  it('opens the course materials section', () => {
    expect(courseMaterialsPath('ctesp-contabilidade'))
      .toBe('/courses/ctesp-contabilidade#course-materials');
  });

  it('selects the exact UC slug using a shareable query parameter', () => {
    const link = courseMaterialsPath('engenharia-eletrotecnica-computadores', 'algoritmos-e-estrutura-de-dados');
    expect(link).toBe('/courses/engenharia-eletrotecnica-computadores?materialsUnit=algoritmos-e-estrutura-de-dados#course-materials');
    const url = new URL(link, 'https://facodi.com');
    expect(url.searchParams.get('materialsUnit')).toBe('algoritmos-e-estrutura-de-dados');
    expect(url.hash).toBe('#course-materials');
  });

  it('encodes reserved characters in the course and UC slugs', () => {
    const link = courseMaterialsPath('curso exemplo', 'tópico & prática');
    expect(link).toBe('/courses/curso%20exemplo?materialsUnit=t%C3%B3pico%20%26%20pr%C3%A1tica#course-materials');
  });

  it('preserves the existing UC route contract', () => {
    expect(unitPath('ctesp-contabilidade', 'contabilidade-geral'))
      .toBe('/courses/ctesp-contabilidade/units/contabilidade-geral');
  });
});
