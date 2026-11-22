import { describe, expect, it } from 'vitest';
import { highlightLanguage, highlightLevel, publicationYear, specificLearningGoal, unitHighlightFacts } from './unitHighlightFacts';

describe('unitHighlightFacts', () => {
  it('normalizes only known catalogued languages, without pretending unknown audio language', () => {
    expect(highlightLanguage('pt_br')).toBe('pt-BR');
    expect(highlightLanguage('pt-PT')).toBe('pt-PT');
    expect(highlightLanguage('en')).toBe('en');
    expect(highlightLanguage('und')).toBeUndefined();
    expect(highlightLanguage(null)).toBeUndefined();
  });

  it('uses only explicit curricular learning levels and ignores unrelated academic-degree labels', () => {
    expect(highlightLevel({ learning_level: 'foundation' })).toBe('foundation');
    expect(highlightLevel({ learning_level: 'advanced_optional' })).toBe('advanced_optional');
    expect(highlightLevel({ level: 'fundamentals' })).toBe('foundation');
    expect(highlightLevel({ level: 'applied' })).toBeUndefined();
    expect(highlightLevel({ academic_level: 'CTeSP (nível 5)' })).toBeUndefined();
  });

  it('displays a source year only for valid dates not in the future', () => {
    expect(publicationYear({ published_date_on_youtube: '2024-07-03' }, 2026)).toBe(2024);
    expect(publicationYear({ source_publication_date: '2007' }, 2026)).toBe(2007);
    expect(publicationYear({ published_date_on_youtube: '2026-02-30' }, 2026)).toBeUndefined();
    expect(publicationYear({ published_date_on_youtube: '2028-01-01' }, 2026)).toBeUndefined();
    expect(publicationYear({ reviewed_on: '2026-11-22' }, 2026)).toBeUndefined();
    expect(publicationYear({}, 2026)).toBeUndefined();
  });

  it('excludes boilerplate goals but keeps a specific, authored educational goal', () => {
    expect(specificLearningGoal([
      'Percorrer as sequências de vídeo na ordem proposta.',
      'Explicar potencial de ação e libertação de neurotransmissores',
    ])).toBe('Explicar potencial de ação e libertação de neurotransmissores');
    expect(specificLearningGoal([
      'Consultar os materiais complementares nas suas fontes originais.',
      'Relacionar os conceitos com as UCs do plano e as dependências conceituais, sem avaliação ou certificação automática.',
    ])).toBeUndefined();
  });

  it('omits missing facts without returning placeholder labels', () => {
    expect(unitHighlightFacts({ language: 'und', metadata: { review_scope: 'title_and_channel_only' }, objectives: [] })).toEqual({});
  });

  it('uses real metadata of the resource, not its import date', () => {
    expect(unitHighlightFacts({
      language: 'pt-BR',
      metadata: { published_date_on_youtube: '2025-03-20', reviewed_on: '2026-11-22', learning_level: 'introductory' },
      objectives: ['Identificar linhas históricas da Psicologia'],
    })).toEqual({
      language: 'pt-BR', publicationYear: 2025, level: 'introductory',
      learningGoal: 'Identificar linhas históricas da Psicologia',
    });
  });
});
