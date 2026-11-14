import { describe, expect, it } from 'vitest';
import { canonicalResourceUrl, classifyLicense, parseSuggestionTags, rankUnits, recognizeUrl } from '@/entities/suggestion/recognition';
import type { UnitOption } from '@/entities/suggestion/suggestion.types';

const unit = (id: string, title: string): UnitOption => ({ id, code: id, title, slug: id, course: { code: 'C', title: 'Curso', slug: 'curso' } });

describe('resource recognition', () => {
  // Same cases the SQL `facodi.normalize_resource_url` was verified against.
  it.each([
    ['https://youtu.be/dQw4w9WgXcQ?si=abc', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'],
    ['https://m.youtube.com/watch?feature=share&v=dQw4w9WgXcQ&t=10', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'],
    ['https://www.youtube.com/shorts/dQw4w9WgXcQ', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'],
    ['https://GitHub.com/Scikit-Learn/scikit-learn.git/', 'https://github.com/scikit-learn/scikit-learn'],
    ['https://www.example.org:443/a/b/?utm_source=x&id=2#top', 'https://example.org/a/b?id=2'],
  ])('normalises %s', (raw, expected) => expect(canonicalResourceUrl(raw)).toBe(expected));

  it('rejects addresses that are not http(s)', () => {
    expect(canonicalResourceUrl('javascript:alert(1)')).toBeNull();
    expect(recognizeUrl('ftp://example.org/file')).toBeNull();
  });

  it('detects the provider and its identifiers', () => {
    expect(recognizeUrl('https://youtu.be/dQw4w9WgXcQ')).toMatchObject({ provider: 'youtube', youtubeId: 'dQw4w9WgXcQ' });
    expect(recognizeUrl('https://github.com/numpy/numpy/tree/main')).toMatchObject({ provider: 'github', githubRepo: 'numpy/numpy' });
    expect(recognizeUrl('https://github.com/topics/python')).toMatchObject({ provider: 'github', githubRepo: null });
    expect(recognizeUrl('https://zenodo.org/records/123456')).toMatchObject({ provider: 'zenodo', zenodoId: '123456' });
    expect(recognizeUrl('https://arxiv.org/abs/2101.00001')).toMatchObject({ provider: 'arxiv', arxivId: '2101.00001' });
    expect(recognizeUrl('https://example.org/notes')).toMatchObject({ provider: 'web' });
  });

  it.each([
    ['CC BY 4.0', 'open'], ['MIT', 'open'], ['cc0-1.0', 'open'], ['BSD-3-Clause', 'open'],
    ['CC BY-NC-ND 4.0', 'restricted'], ['All rights reserved', 'restricted'], ['', 'unknown'], ['Proprietary', 'unknown'],
  ])('classifies the licence %s', (license, expected) => expect(classifyLicense(license)).toBe(expected));

  it('ranks units by shared vocabulary, ignoring accents and function words', () => {
    const units = [unit('a', 'Programação Orientada a Objetos'), unit('b', 'Bases de Dados'), unit('c', 'Matemática Discreta')];
    const [first, ...rest] = rankUnits('Introdução à programacao com objetos em Java', units);
    expect(first.unit.id).toBe('a');
    expect(first.score).toBeGreaterThan(50);
    expect(rest).toEqual([]);
    expect(rankUnits('para com the', units)).toEqual([]);
  });

  it('parses tags the way the database stores them', () => {
    expect(parseSuggestionTags(' #Python, python , Machine   Learning,, ')).toEqual(['python', 'machine learning']);
    expect(parseSuggestionTags(Array.from({ length: 12 }, (_, i) => `t${i}`).join(','))).toHaveLength(8);
  });
});
