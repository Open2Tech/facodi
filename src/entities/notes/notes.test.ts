import { describe, expect, it } from 'vitest';
import {
  countNoteViews, createNote, formatTimestamp, groupNotesByResource, notebookToMarkdown, notesToMarkdown, parseNotebook, parseNoteView,
  parseStartParam, parseTags, searchNotes, sortNotes, tagCounts,
} from './notes';

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

  describe('notebook across resources', () => {
    const other = { id: 'r2', slug: 'regressao', title: 'Regressão linear', type: 'video' };
    const notes = [
      note({ id: 'a', title: 'Fit only on train', body: 'Avoid `leakage`', tags: ['exam', 'sklearn'], timestamp: 30, updatedAt: '2026-01-02T00:00:00Z' }),
      note({ id: 'b', title: 'Pipeline order', tags: ['sklearn'], pinned: true, updatedAt: '2026-01-01T00:00:00Z' }),
      { ...createNote(other, { title: 'Mínimos quadrados', body: 'Função de custo', tags: ['exam'], timestamp: 95 }), id: 'c', updatedAt: '2026-01-03T00:00:00Z' },
    ];

    it('matches every word across note text, tags and resource title, ignoring accents and case', () => {
      expect(searchNotes(notes, { query: 'minimos REGRESSAO' }).map(item => item.id)).toEqual(['c']);
      expect(searchNotes(notes, { query: '#sklearn leakage' }).map(item => item.id)).toEqual(['a']);
      expect(searchNotes(notes, { query: 'pipelines' }).map(item => item.id)).toEqual(['a', 'b']);
      expect(searchNotes(notes, { query: '  ' })).toHaveLength(3);
    });

    it('combines the tag and view filters with the search', () => {
      expect(searchNotes(notes, { tag: 'exam', view: 'timed' }).map(item => item.id)).toEqual(['a', 'c']);
      expect(searchNotes(notes, { tag: 'sklearn', view: 'pinned' }).map(item => item.id)).toEqual(['b']);
      expect(searchNotes(notes, { view: 'code' }).map(item => item.id)).toEqual(['a']);
      expect(countNoteViews(notes)).toEqual({ all: 3, pinned: 1, timed: 2, code: 1 });
      expect(parseNoteView('pinned')).toBe('pinned');
      expect(parseNoteView('<script>')).toBe('all');
    });

    it('ranks tags by use, then alphabetically', () => {
      expect(tagCounts(notes)).toEqual([{ tag: 'exam', count: 2 }, { tag: 'sklearn', count: 2 }]);
    });

    it('groups by resource, latest edit first, with notes in notebook order and the known resource type', () => {
      const groups = groupNotesByResource(notes);
      expect(groups.map(group => [group.slug, group.type, group.notes.map(item => item.id)])).toEqual([
        ['regressao', 'video', ['c']],
        ['pipelines', undefined, ['b', 'a']],
      ]);
    });

    it('exports the whole notebook with one section per resource and no dead links for hidden resources', () => {
      const hidden = { ...note({ id: 'd', title: 'Orphan', timestamp: 12 }), resourceId: 'gone', resourceSlug: '', resourceTitle: '', updatedAt: '2025-01-01T00:00:00Z' };
      const markdown = notebookToMarkdown(groupNotesByResource([notes[2], hidden]), 'https://app.test',
        { title: 'Notebook', source: 'Source', exportedAt: 'Exported on', unavailable: 'Unavailable' }, new Date('2026-02-03T10:00:00Z'));
      expect(markdown).toBe([
        '# Notebook', '', 'Exported on: 2026-02-03',
        '', '## Regressão linear', '', 'Source: https://app.test/resources/regressao',
        '', '### [01:35](https://app.test/resources/regressao?t=95) Mínimos quadrados', '', 'Função de custo', '', '#exam',
        '', '## Unavailable', '', '### Orphan', '',
      ].join('\n'));
    });
  });
});
