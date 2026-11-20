import { describe, expect, it } from 'vitest';
import { composeCourseLearningAssets, filterCourseLearningAssets } from './courseLearningAssets';

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

  it('preserves curricular order and ignores non-public or out-of-scope objects', () => {
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

  it('handles combined filters and no results without mutating original collections', () => {
    const result = filterCourseLearningAssets(assets, 'unit-2', 'IVA');
    expect(result.references).toHaveLength(0);
    expect(result.playlists).toHaveLength(0);
    expect(assets.references).toHaveLength(3);
  });
});
