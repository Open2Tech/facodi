import { describe, expect, it } from 'vitest';
import { canPresentComposedStudyPath, isComposedPathPending, parseComposedStudyPath } from './composedStudyPath';

const raw = {
  facodi_study_path_v2: {
    version: 2,
    sections: [
      { id: 'fundamentos', labels: { pt: 'Fundamentos', en: 'Fundamentals', es: 'Fundamentos', fr: 'Fondements' },
        sequence_slugs: ['seq-a', 'seq-b'] },
      { id: 'pratica', labels: { pt: 'Prática', en: 'Practice', es: 'Práctica', fr: 'Pratique' },
        sequence_slugs: ['seq-c'] },
    ],
    supplementary_sequence_slugs: ['seq-d'],
    guide_module_slugs: ['guide-a'],
  },
};

const sequences = ['seq-a', 'seq-b', 'seq-c', 'seq-d'].map(slug => ({ slug, itemCount: 3 }));
const playlists = sequences.map(({ slug }) => ({ slug }));
const modules = [{ slug: 'guide-a' }];

describe('curricular-unit playlist composition', () => {
  it('parses a versioned grouping without creating new learning objects', () => {
    const config = parseComposedStudyPath(raw);
    expect(config?.sections.map(s => s.sequenceSlugs)).toEqual([['seq-a', 'seq-b'], ['seq-c']]);
    expect(canPresentComposedStudyPath(config!, sequences, playlists, modules)).toBe(true);
  });

  it('does not activate if public resources have drifted or disappeared', () => {
    const config = parseComposedStudyPath(raw)!;
    expect(canPresentComposedStudyPath(config, sequences.slice(1), playlists, modules)).toBe(false);
    expect(canPresentComposedStudyPath(config, sequences, playlists.slice(1), modules)).toBe(false);
    expect(canPresentComposedStudyPath(config, sequences, playlists, [])).toBe(false);
    expect(canPresentComposedStudyPath(config, [{ ...sequences[0], itemCount: 0 }, ...sequences.slice(1)], playlists, modules)).toBe(false);
  });

  it('rejects duplicates, broken labels and invalid slugs', () => {
    const cloned = structuredClone(raw);
    cloned.facodi_study_path_v2.sections[1].sequence_slugs = ['seq-a'];
    expect(parseComposedStudyPath(cloned)).toBeNull();
    cloned.facodi_study_path_v2.sections[1].sequence_slugs = ['seq-c'];
    cloned.facodi_study_path_v2.supplementary_sequence_slugs = ['seq-a'];
    expect(parseComposedStudyPath(cloned)).toBeNull();
    cloned.facodi_study_path_v2.supplementary_sequence_slugs = ['seq-d'];
    cloned.facodi_study_path_v2.sections[0].labels.pt = '';
    expect(parseComposedStudyPath(cloned)).toBeNull();
  });

  it('keeps old units and the existing statistics v1 layout unchanged', () => {
    expect(parseComposedStudyPath({})).toBeNull();
    expect(parseComposedStudyPath(null)).toBeNull();
    expect(parseComposedStudyPath({ facodi_study_path_v1: { version: 1 } })).toBeNull();
  });
  it('suppresses the legacy catalog while a configured path is loading, but not on failure', () => {
    const configured = parseComposedStudyPath(raw);
    expect(isComposedPathPending(configured, ['success', 'pending', 'success'])).toBe(true);
    expect(isComposedPathPending(configured, ['success', 'error', 'success'])).toBe(false);
    expect(isComposedPathPending(configured, ['success', 'success', 'success'])).toBe(false);
    expect(isComposedPathPending(null, ['pending', 'pending', 'pending'])).toBe(false);
  });

});
