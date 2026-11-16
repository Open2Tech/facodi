import { describe, expect, it } from 'vitest';
import { groupStudyPathLessons, parseStudyPath } from './studyPath';
import type { Sequence } from '@/entities/sequence/sequence';

const meta = {
  facodi_study_path_v1: {
    version: 1,
    sequence_slug: 'stats-sequence',
    guide_module_slug: 'stats-guide',
    sections: [
      { id: 'data', labels: { pt: 'Dados', en: 'Data', es: 'Datos', fr: 'Données' }, youtube_ids: ['XE4UHson59Y'] },
      { id: 'models', labels: { pt: 'Modelos', en: 'Models', es: 'Modelos', fr: 'Modèles' }, youtube_ids: ['x2IwKEB8pdQ'] },
    ],
    supplementary_sequence_slugs: ['extra-sequence'],
    standalone_resource_slugs: ['extra-video'],
  },
};

const sequence: Sequence = {
  id: 'sequence-id', slug: 'stats-sequence', title: 'Statistics',
  description: '', language: 'pt', verifiedCount: 2, units: [],
  items: [
    { position: 1, videoId: 'resource-1', slug: 'video-1', youtubeId: 'XE4UHson59Y',
      title: 'Intro', channel: 'Creator', language: 'pt', youtubeUrl: null, thumbnail: null, metadataVerified: true },
    { position: 2, videoId: 'resource-2', slug: 'video-2', youtubeId: 'x2IwKEB8pdQ',
      title: 'Models', channel: 'Creator', language: 'pt', youtubeUrl: null, thumbnail: null, metadataVerified: true },
  ],
};

describe('optional curricular study path', () => {
  it('uses existing sequence items and preserves their stable progress IDs', () => {
    const config = parseStudyPath(meta);
    expect(config).not.toBeNull();
    const groups = groupStudyPathLessons(config!, sequence);
    expect(groups?.map(group => group.items.map(item => item.videoId))).toEqual([['resource-1'], ['resource-2']]);
  });

  it('does not render a partial path if the sequence changed', () => {
    const config = parseStudyPath(meta)!;
    expect(groupStudyPathLessons(config, { ...sequence, items: sequence.items.slice(0, 1) })).toBeNull();
    expect(groupStudyPathLessons(config, { ...sequence, items: [
      ...sequence.items.slice(0, 1), { ...sequence.items[1], youtubeId: 'AAAAAAAAAAA' },
    ] })).toBeNull();
  });

  it('rejects duplicated membership and invalid IDs', () => {
    const root = structuredClone(meta);
    root.facodi_study_path_v1.sections[1].youtube_ids = ['XE4UHson59Y'];
    expect(parseStudyPath(root)).toBeNull();
    root.facodi_study_path_v1.sections[1].youtube_ids = ['bad!'];
    expect(parseStudyPath(root)).toBeNull();
  });

  it('leaves unconfigured units on their current catalog layout', () => {
    expect(parseStudyPath({})).toBeNull();
    expect(parseStudyPath(null)).toBeNull();
  });
});
