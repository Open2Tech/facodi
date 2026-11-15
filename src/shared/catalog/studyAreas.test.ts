import { describe, expect, it } from 'vitest';
import { countStudyAreas, isStudyArea, matchesStudyArea, STUDY_AREAS } from './studyAreas';
import { filterSequences, type SequenceSummary } from '@/entities/sequence/sequence';

const sequence = (id: string, title: string, description = '', language = 'pt-BR'): SequenceSummary => ({
  id, slug: id, title, description, language, itemCount: 5, unitCodes: [], cover: null,
});

describe('FACODI thematic study areas', () => {
  it('accepts only supported shareable area IDs', () => {
    expect(STUDY_AREAS).toHaveLength(6);
    expect(isStudyArea('mathematics')).toBe(true);
    expect(isStudyArea('fictional-area')).toBe(false);
  });

  it('classifies accented Portuguese and cross-discipline titles', () => {
    expect(matchesStudyArea('Álgebra e cálculo diferencial', 'mathematics')).toBe(true);
    expect(matchesStudyArea('Introdução à Astronomia e Astrofísica', 'science')).toBe(true);
    expect(matchesStudyArea('Análise de Dados com Python', 'technology')).toBe(true);
    expect(matchesStudyArea('Contabilidade e Gestão', 'management')).toBe(true);
    expect(matchesStudyArea('Língua Inglesa e Literatura', 'languages')).toBe(true);
    expect(matchesStudyArea('Didática de Ensino', 'education')).toBe(true);
    expect(matchesStudyArea('Álgebra', 'unknown')).toBe(false);
    expect(matchesStudyArea('No matching topic', 'mathematics')).toBe(false);
  });

  it('combines areas with accent-insensitive search and language filters before pagination', () => {
    const list = [
      sequence('math', 'Álgebra linear', '', 'pt-BR'),
      sequence('science', 'Astrofísica de estrelas', '', 'pt-PT'),
      sequence('tech', 'Python aplicado', 'Ciência de dados', 'en'),
    ];
    expect(filterSequences(list, '', '', 'mathematics').map(s => s.id)).toEqual(['math']);
    expect(filterSequences(list, 'ALGEBRA', 'pt', 'mathematics').map(s => s.id)).toEqual(['math']);
    expect(filterSequences(list, '', 'en', 'science').map(s => s.id)).toEqual(['tech']);
    expect(filterSequences(list, '', 'fr', 'mathematics')).toEqual([]);
    expect(filterSequences(list, '', '', 'nonexistent')).toEqual([]);
  });

  it('shows area counts across the full matching list and allows overlapping areas', () => {
    const list = [
      sequence('one', 'Estatística aplicada à Gestão'),
      sequence('two', 'Física do espaço'),
      sequence('three', 'Matemática II'),
    ];
    const counts = countStudyAreas(list, s => s.title + ' ' + s.description);
    expect(counts.mathematics).toBe(2);
    expect(counts.management).toBe(1);
    expect(counts.science).toBe(1);
    expect(counts.languages).toBe(0);
  });
});
