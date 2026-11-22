import { describe, expect, it } from 'vitest';
import { contextNoteHref, contextualStudyNotes, noteCountsByResource, type StudyNoteContextResource } from './studyNoteContext';
import { createNote } from './notes';

const draft = { title: 'Key concept', body: 'Explain the method', tags: ['exam'], timestamp: null };
const unit: StudyNoteContextResource = { id: 'unit-1', title: 'Cálculo I', path: '/courses/bioquimica/units/calculo-1', scope: 'unit' };
const video: StudyNoteContextResource = { id: 'video-1', title: 'Derivadas', path: '/resources/derivadas', scope: 'open', timed: true };
const seqVideo: StudyNoteContextResource = { ...video, path: '/sequences/sequencia-de-calculo?v=video-1' };

describe('contextual study notes', () => {
  it('reuses only notes for published resources in the current curricular context', () => {
    const notes = [
      { ...createNote({ id: unit.id, slug: 'calculo-1', title: unit.title }, draft), id: 'unit-note', pinned: true },
      { ...createNote({ id: video.id, slug: 'derivadas', title: video.title }, { ...draft, timestamp: 85 }), id: 'video-note' },
      { ...createNote({ id: 'unrelated', slug: 'random', title: 'Other course' }, draft), id: 'other-note' },
    ];
    const found = contextualStudyNotes(notes, [unit, video, video]);
    expect(found.map(item => item.note.id)).toEqual(['unit-note', 'video-note']);
    expect(found.map(item => item.href)).toEqual([
      '/courses/bioquimica/units/calculo-1?notes=unit',
      '/resources/derivadas?notes=open&t=85',
    ]);
    expect(notes).toHaveLength(3);
  });

  it('returns an in-sequence link that selects the exact lesson and timestamp', () => {
    expect(contextNoteHref(seqVideo, 123)).toBe('/sequences/sequencia-de-calculo?v=video-1&notes=open&t=123');
    expect(contextNoteHref(seqVideo, null)).toBe('/sequences/sequencia-de-calculo?v=video-1&notes=open');
    expect(contextNoteHref(unit, 123)).toBe('/courses/bioquimica/units/calculo-1?notes=unit');
  });

  it('preserves pin priority and note identity rather than creating inferred duplicates', () => {
    const older = { ...createNote({ id: video.id, slug: 'derivadas', title: video.title }, draft), id: 'old', updatedAt: '2026-01-01' };
    const pinned = { ...older, id: 'pin', pinned: true, updatedAt: '2025-01-01' };
    const newer = { ...older, id: 'new', updatedAt: '2026-11-20' };
    expect(contextualStudyNotes([older, newer, pinned], [video]).map(x => x.note.id)).toEqual(['pin', 'new', 'old']);
    expect([...noteCountsByResource([older, newer, pinned]).entries()]).toEqual([['video-1', 3]]);
  });

  it('omits unknown and unsafe resource routes rather than linking to the wrong course', () => {
    const note = createNote({ id: unit.id, slug: 'uc', title: 'UC' }, draft);
    expect(contextualStudyNotes([note], [{ ...unit, path: '//external.example' }])).toEqual([]);
    expect(contextualStudyNotes([note], [{ ...unit, path: '' }])).toEqual([]);
  });

  it('does not add time to non-video notes or invalid timestamps', () => {
    expect(contextNoteHref(video, -1)).toBe('/resources/derivadas?notes=open');
    expect(contextNoteHref(video, 1.2)).toBe('/resources/derivadas?notes=open');
  });
});
