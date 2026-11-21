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
