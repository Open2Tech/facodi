import { describe, expect, it } from 'vitest';
import { pickUnitHighlights } from './unitHighlights';

const asset = (id: string, title: string) => ({ id, slug: id, title });
const base = {
  courseSlug: 'ctesp-contabilidade', unitSlug: 'contabilidade-de-gestao',
  hasStudyPath: false, sequences: [], videos: [], playlists: [], modules: [], readings: [],
};

describe('pickUnitHighlights', () => {
  it('prefers authored study paths to external playlists and keeps official ordering', () => {
    const result = pickUnitHighlights({
      ...base, hasStudyPath: true,
      sequences: [{ ...asset('seq', 'Sequência Editorial'), itemCount: 7 }],
      playlists: [asset('playlist', 'Playlist externa')],
      modules: [asset('module', 'Conceitos e custos')],
      readings: [asset('ref', 'Instrumentos SNC')],
      videos: [asset('video-123', 'Aula de custos')],
    });
    expect(result.map(x => x.kind)).toEqual(['path', 'module', 'reading']);
    expect(result[0].href).toBe('#unit-study-path');
  });

  it('shows a real published editorial sequence, not a zero-lesson playlist', () => {
    const result = pickUnitHighlights({
      ...base,
      sequences: [{ ...asset('empty', 'Sem aulas'), itemCount: 0 }, { ...asset('order', 'Álgebra Linear'), itemCount: 12 }],
      readings: [asset('reading', 'Livro')],
      videos: [asset('vid-1', 'Aula')],
    });
    expect(result.map(x => x.kind)).toEqual(['sequence', 'reading', 'video']);
    expect(result[0]).toMatchObject({ href: '/sequences/order', count: 12 });
  });

  it('works for playlist-and-reading courses without pretending videos exist', () => {
    const result = pickUnitHighlights({ ...base, playlists: [asset('marketing', 'Marketing Digital')], readings: [asset('official', 'Google Skillshop')] });
    expect(result.map(x => x.kind)).toEqual(['playlist', 'reading']);
    expect(result[0].href).toBe('/resources/marketing');
  });

  it('opens an actual UC video with the existing selection parameter', () => {
    const result = pickUnitHighlights({ ...base, videos: [asset('video-123', 'Aula de Contabilidade')] });
    expect(result).toEqual([{
      kind: 'video', title: 'Aula de Contabilidade',
      href: '/courses/ctesp-contabilidade/units/contabilidade-de-gestao?v=video-123#unit-resources',
    }]);
  });

  it('uses source order, keeps only three complementary entries and handles empty UCs', () => {
    const result = pickUnitHighlights({
      ...base, playlists: [asset('first', 'Primeira'), asset('second', 'Segunda')],
      modules: [asset('m1', 'Primeiro módulo'), asset('m2', 'Segundo módulo')],
      readings: [asset('r1', 'Primeira fonte'), asset('r2', 'Segunda fonte')],
      videos: [asset('v1', 'Vídeo')],
    });
    expect(result.map(x => x.kind)).toEqual(['playlist', 'module', 'reading']);
    expect(result.map(x => x.title)).toEqual(['Primeira', 'Primeiro módulo', 'Primeira fonte']);
    expect(pickUnitHighlights(base)).toEqual([]);
  });
});

describe('source-aware reading highlights', () => {
  it('prefers an on-topic structured course over a broad gateway, preserving the bibliography itself', () => {
    const readings = [
      { ...asset('khan-index', 'Khan Academy em português — referência da Rede de Bibliotecas Escolares'), sourceUrl: 'https://www.rbe.mec.pt/np4/1493.html' },
      { ...asset('calculus', 'OpenStax — Calculus Volume 1'), sourceUrl: 'https://openstax.org/books/calculus-volume-1/pages/1-introduction' },
    ];
    const result = pickUnitHighlights({ ...base, unitTitle: 'Cálculo I', readings });
    expect(result).toEqual([{ kind: 'reading', title: 'OpenStax — Calculus Volume 1', href: '/resources/calculus', sourceHost: 'openstax.org' }]);
    expect(readings[0].slug).toBe('khan-index');
    expect(readings[1].slug).toBe('calculus');
  });

  it('does not highlight an official portal homepage ahead of a linked tax-code reference', () => {
    const result = pickUnitHighlights({
      ...base, unitTitle: 'Direito Fiscal Aplicado I',
      readings: [
        { ...asset('official', 'Diário da República — legislação portuguesa'), sourceUrl: 'https://diariodarepublica.pt/dr/home' },
        { ...asset('civa', 'Código do IVA — Portal das Finanças'), sourceUrl: 'https://info.portaldasfinancas.gov.pt/pt/informacao_fiscal/codigos_tributarios/civa_rep/Pages/codigo-do-iva-indice.aspx' },
      ],
    });
    expect(result[0]).toMatchObject({ kind: 'reading', title: 'Código do IVA — Portal das Finanças', sourceHost: 'info.portaldasfinancas.gov.pt' });
  });

  it('preserves the first item if there is no evidence to prioritize another reading', () => {
    const result = pickUnitHighlights({
      ...base, unitTitle: 'Metodologias',
      readings: [asset('first', 'Introdução'), asset('second', 'Outros materiais')],
    });
    expect(result[0]).toMatchObject({ title: 'Introdução', href: '/resources/first' });
  });

  it('shows only a neutral HTTPS source host and ignores malformed/unsafe URLs', () => {
    const result = pickUnitHighlights({
      ...base, unitTitle: 'Biologia Celular',
      readings: [{ ...asset('biology', 'OpenStax Biology 2e — Capítulo 1'), sourceUrl: 'https://www.openstax.org/books/biology-2e/pages/1-introduction' }],
      playlists: [{ ...asset('yt', 'Playlist externa'), sourceUrl: 'javascript:alert(1)' }],
    });
    expect(result.find(item => item.kind === 'reading')?.sourceHost).toBe('openstax.org');
    expect(result.find(item => item.kind === 'playlist')?.sourceHost).toBeUndefined();
  });
});

describe('real educational metadata on highlights', () => {
  it('reuses published language and upload year from an existing video without generating a level', () => {
    const result = pickUnitHighlights({
      ...base,
      videos: [{
        ...asset('video-1', 'Regra da Cadeia'),
        language: 'pt-BR', metadata: {
          published_date_on_youtube: '2019-05-24', reviewed_on: '2026-11-22',
        },
      }],
    });
    expect(result).toEqual([{
      kind: 'video', title: 'Regra da Cadeia',
      href: '/courses/ctesp-contabilidade/units/contabilidade-de-gestao?v=video-1#unit-resources',
      language: 'pt-BR', publicationYear: 2019,
    }]);
  });

  it('shows editorial level and a specific goal only when stored in the existing playlist', () => {
    const result = pickUnitHighlights({
      ...base,
      playlists: [{
        ...asset('neuro', 'Neurobiologia celular: neurónios e sinapses'),
        language: 'pt-PT', metadata: { learning_level: 'intermediate' },
        objectives: ['Explicar potencial de ação e libertação de neurotransmissores'],
      }],
    });
    expect(result[0]).toMatchObject({
      kind: 'playlist', language: 'pt-PT', level: 'intermediate',
      learningGoal: 'Explicar potencial de ação e libertação de neurotransmissores',
    });
  });
});
