import { describe, expect, it } from 'vitest';
import { canPresentComposedStudyPath, isComposedPathPending, parseComposedStudyPath, resolveClassroomPath } from './composedStudyPath';

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


describe('universal classroom', () => {
  const publicSequences = sequences.map(item => ({ ...item, title: item.slug }));
  it('preserves authored chapters and adds newly published sequences once', () => {
    const result = resolveClassroomPath(parseComposedStudyPath(raw), [
      ...publicSequences, { slug: 'seq-new', itemCount: 4, title: 'New' },
    ], playlists, modules);
    expect(result?.sections.flatMap(section => section.sequenceSlugs)).toEqual(['seq-a', 'seq-b', 'seq-c']);
    expect(result?.supplementarySequenceSlugs).toEqual(['seq-d', 'seq-new']);
  });
  it('uses the linked editorial order without inventing topic labels', () => {
    const result = resolveClassroomPath(null, publicSequences, [...playlists].reverse(), modules);
    expect(result?.sections.map(section => section.sequenceSlugs[0])).toEqual(['seq-d', 'seq-c', 'seq-b', 'seq-a']);
    expect(result?.sections[0].labels.pt).toBe('seq-d');
  });
  it('ignores unavailable or empty sequences and handles no coverage', () => {
    const result = resolveClassroomPath(parseComposedStudyPath(raw), [{ slug: 'seq-b', title: 'B', itemCount: 2 }, { slug: 'seq-c', title: 'C', itemCount: 0 }], playlists, []);
    expect(result?.sections.flatMap(section => section.sequenceSlugs)).toEqual(['seq-b']);
    expect(result?.guideModuleSlugs).toEqual([]);
    expect(resolveClassroomPath(null, [], playlists, modules)).toBeNull();
  });
  it('accepts more than eight chapters', () => {
    const input = structuredClone(raw);
    input.facodi_study_path_v2.sections = Array.from({ length: 10 }, (_, i) => ({
      id: 'chapter-' + i, labels: { pt: 'P', en: 'E', es: 'S', fr: 'F' }, sequence_slugs: ['sequence-' + i],
    }));
    expect(parseComposedStudyPath(input)?.sections).toHaveLength(10);
  });
});
