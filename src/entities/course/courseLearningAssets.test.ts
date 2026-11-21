import { describe, expect, it } from 'vitest';
import { COURSE_MATERIAL_PREVIEW, COURSE_MATERIAL_PAGE, composeCourseLearningAssets, filterCourseLearningAssets, nextCourseMaterialVisibleCount } from './courseLearningAssets';

const parentIds = ['course', 'unit-1', 'unit-2'];
const labels = new Map([['unit-1', 'Fiscalidade I'], ['unit-2', 'Fiscalidade II']]);

describe('composeCourseLearningAssets', () => {
  it('surfaces assets related to curricular units, even without direct course links', () => {
    const result = composeCourseLearningAssets(parentIds, labels, [
      { parent_object_id: 'unit-1', child_object_id: 'p1', position: 1 },
      { parent_object_id: 'unit-1', child_object_id: 'r1', position: 2 },
    ], [
      { id: 'p1', slug: 'playlist-1', title: 'Fiscalidade', description: null, source_url: 'https://example.com/p', object_type: 'playlist' },
      { id: 'r1', slug: 'reading-1', title: 'Código do IVA', description: null, source_url: 'https://example.com/r', object_type: 'external_resource' },
    ]);
    expect(result.playlists.map(x => x.slug)).toEqual(['playlist-1']);
    expect(result.references[0].unitTitles).toEqual(['Fiscalidade I']);
    expect(result.references[0].unitIds).toEqual(['unit-1']);
  });

  it('deduplicates shared references while retaining every linked unit', () => {
    const result = composeCourseLearningAssets(parentIds, labels, [
      { parent_object_id: 'unit-2', child_object_id: 'r1', position: 1 },
      { parent_object_id: 'unit-1', child_object_id: 'r1', position: 1 },
      { parent_object_id: 'unit-1', child_object_id: 'r1', position: 1 },
    ], [{ id: 'r1', slug: 'reading', title: 'SNC', description: '', source_url: null, object_type: 'external_resource' }]);
    expect(result.references).toHaveLength(1);
    expect(result.references[0].unitTitles).toEqual(['Fiscalidade I', 'Fiscalidade II']);
    expect(result.references[0].unitIds).toEqual(['unit-1', 'unit-2']);
  });

  it('preserves curricular order and ignores out-of-scope objects', () => {
    const result = composeCourseLearningAssets(parentIds, labels, [
      { parent_object_id: 'unit-2', child_object_id: 'g2', position: 1 },
      { parent_object_id: 'unit-1', child_object_id: 'g1', position: 1 },
      { parent_object_id: 'elsewhere', child_object_id: 'p1', position: 1 },
      { parent_object_id: 'unit-1', child_object_id: 'v1', position: 2 },
    ], [
      { id: 'g1', slug: 'guide-1', title: 'Guia 1', description: '', source_url: null, object_type: 'document' },
      { id: 'g2', slug: 'guide-2', title: 'Guia 2', description: '', source_url: null, object_type: 'document' },
      { id: 'p1', slug: 'playlist', title: 'Other', description: null, source_url: null, object_type: 'playlist' },
      { id: 'v1', slug: 'video', title: 'Video', description: null, source_url: null, object_type: 'video' },
    ]);
    expect(result.guides.map(x => x.slug)).toEqual(['guide-1', 'guide-2']);
    expect(result.videos.map(x => x.slug)).toEqual(['video']);
    expect(result.playlists).toHaveLength(0);
    expect(result.references).toHaveLength(0);
  });
});

describe('filterCourseLearningAssets', () => {
  const assets = composeCourseLearningAssets(parentIds, labels, [
    { parent_object_id: 'course', child_object_id: 'shared', position: 1 },
    { parent_object_id: 'unit-1', child_object_id: 'read-1', position: 1 },
    { parent_object_id: 'unit-2', child_object_id: 'read-2', position: 1 },
    { parent_object_id: 'unit-1', child_object_id: 'p1', position: 2 },
  ], [
    { id: 'shared', slug: 'common', title: 'Manual geral', description: null, source_url: 'https://example.com', object_type: 'external_resource' },
    { id: 'read-1', slug: 'iva', title: 'Cálculo do IVA', description: 'Impostos', source_url: null, object_type: 'external_resource' },
    { id: 'read-2', slug: 'personalidade', title: 'Personalidade', description: 'Outro tema', source_url: null, object_type: 'external_resource' },
    { id: 'p1', slug: 'playlist', title: 'Introdução à fiscalidade', description: null, source_url: null, object_type: 'playlist' },
  ]);

  it('filters by exact unit identity without leaking same-title materials', () => {
    const result = filterCourseLearningAssets(assets, 'unit-1', '');
    expect(result.references.map(item => item.slug)).toEqual(['common', 'iva']);
    expect(result.playlists.map(item => item.slug)).toEqual(['playlist']);
  });

  it('normalizes accents and searches titles, descriptions and unit labels', () => {
    expect(filterCourseLearningAssets(assets, null, 'calculo').references.map(item => item.slug)).toEqual(['iva']);
    expect(filterCourseLearningAssets(assets, null, 'IMPOSTOS').references.map(item => item.slug)).toEqual(['iva']);
    expect(filterCourseLearningAssets(assets, null, 'Fiscalidade I').playlists.map(item => item.slug)).toEqual(['playlist']);
  });

  it('finds resources by exact or partial curricular-unit codes without affecting unit titles', () => {
    const unitCodes = new Map([['unit-1', '18021027'], ['unit-2', '18021028']]);
    expect(filterCourseLearningAssets(assets, null, '18021027', unitCodes).references.map(item => item.slug))
      .toEqual(['iva']);
    expect(filterCourseLearningAssets(assets, null, '18021027', unitCodes).playlists.map(item => item.slug))
      .toEqual(['playlist']);
    expect(filterCourseLearningAssets(assets, null, '18021028', unitCodes).references.map(item => item.slug))
      .toEqual(['personalidade']);
    expect(filterCourseLearningAssets(assets, 'unit-2', '18021027', unitCodes).references)
      .toEqual([]);
    expect(filterCourseLearningAssets(assets, null, '18021027').playlists)
      .toEqual([]);
  });

  it('handles combined filters and no results without mutating original collections', () => {
    const result = filterCourseLearningAssets(assets, 'unit-2', 'IVA');
    expect(result.references).toHaveLength(0);
    expect(result.playlists).toHaveLength(0);
    expect(assets.references).toHaveLength(3);
  });
});


describe('course-linked video discovery', () => {
  const videos = composeCourseLearningAssets(parentIds, labels, [
    { parent_object_id: 'unit-1', child_object_id: 'v1', position: 10 },
    { parent_object_id: 'unit-2', child_object_id: 'v1', position: 10 },
    { parent_object_id: 'unit-2', child_object_id: 'v2', position: 11 },
    { parent_object_id: 'elsewhere', child_object_id: 'v3', position: 1 },
  ], [
    { id: 'v1', slug: 'algebra-linear', title: 'Álgebra Linear — Matrizes', description: 'Introdução às matrizes', source_url: 'https://www.youtube.com/watch?v=J7DzL2_Na80', metadata: { youtube_video_id: 'J7DzL2_Na80' }, object_type: 'video' },
    { id: 'v2', slug: 'estatistica', title: 'Estatística Aplicada', description: null, source_url: null, object_type: 'video' },
    { id: 'v3', slug: 'fora', title: 'Vídeo externo a este curso', description: null, source_url: null, object_type: 'video' },
  ]);

  it('deduplicates published video assets from multiple UCs without mixing with playlists', () => {
    expect(videos.videos.map(v => v.slug)).toEqual(['algebra-linear', 'estatistica']);
    expect(videos.videos[0].unitIds).toEqual(['unit-1', 'unit-2']);
    expect(videos.videos[0].metadata).toEqual({ youtube_video_id: 'J7DzL2_Na80' });
    expect(videos.videos[1].metadata).toBeUndefined();
    expect(videos.playlists).toHaveLength(0);
    expect(videos.videos.every(v => v.id !== 'v3')).toBe(true);
  });

  it('filters video lessons by curricular unit and accent-insensitive title', () => {
    expect(filterCourseLearningAssets(videos, 'unit-1', 'algebra').videos.map(v => v.slug)).toEqual(['algebra-linear']);
    expect(filterCourseLearningAssets(videos, 'unit-1', 'estatistica').videos).toEqual([]);
    expect(filterCourseLearningAssets(videos, 'unit-2', 'ESTATISTICA').videos.map(v => v.slug)).toEqual(['estatistica']);
  });
});

describe('lightweight PostgREST video metadata projection', () => {
  it('reconstructs the same minimal metadata needed for thumbnails and duration', () => {
    const result = composeCourseLearningAssets(parentIds, labels, [
      { parent_object_id: 'unit-1', child_object_id: 'v-projected', position: 1 },
    ], [{
      id: 'v-projected', slug: 'material-video', title: 'Vídeo com duração', description: null,
      source_url: 'https://www.youtube.com/watch?v=J7DzL2_Na80',
      youtube_video_id: 'J7DzL2_Na80', duration_seconds: 1507, object_type: 'video',
    }]);
    expect(result.videos).toHaveLength(1);
    expect(result.videos[0].metadata).toEqual({ youtube_video_id: 'J7DzL2_Na80', duration_seconds: 1507 });
  });

  it('allows video sources without either metadata field (fallback to source URL)', () => {
    const result = composeCourseLearningAssets(parentIds, labels, [
      { parent_object_id: 'unit-1', child_object_id: 'video-fallback', position: 1 },
    ], [{
      id: 'video-fallback', slug: 'video-fallback', title: 'Vídeo legado', description: null,
      source_url: 'https://www.youtube.com/watch?v=J7DzL2_Na80',
      youtube_video_id: null, duration_seconds: null, object_type: 'video',
    }]);
    expect(result.videos[0].metadata).toBeUndefined();
    expect(result.videos[0].sourceUrl).toContain('youtube.com/watch');
  });
});

describe('progressive rendering of course materials', () => {
  it('starts with six and progressively reveals 24 more without exceeding the total', () => {
    expect(COURSE_MATERIAL_PREVIEW).toBe(6);
    expect(COURSE_MATERIAL_PAGE).toBe(24);
    expect(nextCourseMaterialVisibleCount(601)).toBe(30);
    expect(nextCourseMaterialVisibleCount(601, 30)).toBe(54);
    expect(nextCourseMaterialVisibleCount(40, 30)).toBe(40);
    expect(nextCourseMaterialVisibleCount(6, 6)).toBe(6);
  });

  it('works when filtering reduces a previously expanded list', () => {
    expect(nextCourseMaterialVisibleCount(3, 54)).toBe(3);
    expect(nextCourseMaterialVisibleCount(24, COURSE_MATERIAL_PREVIEW)).toBe(24);
  });
});
