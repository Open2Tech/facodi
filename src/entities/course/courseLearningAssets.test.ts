import { describe, expect, it } from 'vitest';
import { composeCourseLearningAssets } from './courseLearningAssets';

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
  });

  it('deduplicates shared references while retaining every linked unit', () => {
    const result = composeCourseLearningAssets(parentIds, labels, [
      { parent_object_id: 'unit-2', child_object_id: 'r1', position: 1 },
      { parent_object_id: 'unit-1', child_object_id: 'r1', position: 1 },
      { parent_object_id: 'unit-1', child_object_id: 'r1', position: 1 },
    ], [{ id: 'r1', slug: 'reading', title: 'SNC', description: '', source_url: null, object_type: 'external_resource' }]);
    expect(result.references).toHaveLength(1);
    expect(result.references[0].unitTitles).toEqual(['Fiscalidade I', 'Fiscalidade II']);
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
