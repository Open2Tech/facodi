import { describe, expect, it } from 'vitest';
import { isStudyTopic, studyTopics } from './topicTags';

describe('study topic tags', () => {
  it('keeps study topics and drops editorial bookkeeping, whatever the case, accents or separators', () => {
    expect(studyTopics([
      'Análise Matemática II', 'psicologia', 'neurociencias', 'BNCC', 'odoo',
      'youtube', 'recurso-externo', 'apoio-ao-estudo', 'FACODI', 'LESTI', 'ualg', '2026', '2026-27',
      'opt_english_linguistics', 'referência externa', 'recurso complementar', 'Letras Inglês', 'vídeo educativo',
    ])).toEqual(['Análise Matemática II', 'psicologia', 'neurociencias', 'BNCC', 'odoo']);
  });
  it('ignores blanks and missing lists', () => {
    expect(isStudyTopic('  ')).toBe(false);
    expect(studyTopics(null)).toEqual([]);
  });
});
