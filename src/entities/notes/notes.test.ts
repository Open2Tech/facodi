import { describe, expect, it } from 'vitest';
import { createNote, formatTimestamp, notesToMarkdown, parseNotebook, parseStartParam, parseTags, sortNotes } from './notes';

const resource = { id: 'r1', slug: 'pipelines', title: 'Pipelines' };
const note = (patch: Partial<ReturnType<typeof createNote>>) => ({ ...createNote(resource, { title: 'Note', body: '', tags: [], timestamp: null }, new Date('2026-01-01T00:00:00Z')), ...patch });

describe('study notes', () => {
  it('keeps valid notes and drops corrupt entries instead of losing the notebook', () => {
    const valid = note({ id: 'ok' });
    expect(parseNotebook(JSON.stringify([valid, { id: 'broken' }, 'text']))).toEqual([valid]);
    expect(parseNotebook('{not json')).toEqual([]);
    expect(parseNotebook(JSON.stringify({ notes: [] }))).toEqual([]);
  });

  it('normalises tags and caps their number', () => {
    expect(parseTags('#Exam, sklearn  #exam ##tip')).toEqual(['exam', 'sklearn', 'tip']);
    expect(parseTags(Array.from({ length: 20 }, (_, index) => `t${index}`).join(' '))).toHaveLength(12);
  });

  it('orders pinned notes first, then by moment in the video, untimed last', () => {
    const notes = [note({ id: 'untimed' }), note({ id: 'late', timestamp: 90 }), note({ id: 'early', timestamp: 5 }), note({ id: 'pinned', timestamp: 300, pinned: true })];
    expect(sortNotes(notes).map(item => item.id)).toEqual(['pinned', 'early', 'late', 'untimed']);
  });

  it('accepts only whole-second ?t= values', () => {
    expect(parseStartParam('754')).toBe(754);
    expect(parseStartParam('-4')).toBeNull();
    expect(parseStartParam('1e3')).toBeNull();
    expect(parseStartParam(null)).toBeNull();
    expect(formatTimestamp(3725)).toBe('1:02:05');
    expect(formatTimestamp(65.9)).toBe('01:05');
  });

  it('exports Markdown with timestamps linking back into the video', () => {
    const markdown = notesToMarkdown(resource, [note({ title: 'Leakage', timestamp: 1122, body: 'Use `fit` on train only.', tags: ['exam'] }), note({ title: 'General' })],
      'https://app.test/resources/pipelines', { source: 'Source', exportedAt: 'Exported on' }, new Date('2026-02-03T10:00:00Z'));
    expect(markdown).toBe([
      '# Pipelines', '', 'Source: https://app.test/resources/pipelines', 'Exported on: 2026-02-03',
      '', '## [18:42](https://app.test/resources/pipelines?t=1122) Leakage', '', 'Use `fit` on train only.', '', '#exam',
      '', '## General', '',
    ].join('\n'));
  });
});
