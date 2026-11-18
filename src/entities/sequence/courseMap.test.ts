import { describe, expect, it } from 'vitest';
import { countExplored, exploredUnitCodes } from './courseMap';

const done = (playlistId: string) => ({ playlistId, videoId: 'v', completedAt: '2026-11-18T10:00:00Z' });

describe('exploredUnitCodes', () => {
  it('collects the units of every sequence with a finished lesson', () => {
    const codes = exploredUnitCodes([done('a'), done('a'), done('c')], [
      { id: 'a', unitCodes: ['14181086', '14181177'] },
      { id: 'b', unitCodes: ['14181178'] },
      { id: 'c', unitCodes: ['14181177'] },
    ]);
    expect([...codes].sort()).toEqual(['14181086', '14181177']);
  });
  it('is empty without completions', () => {
    expect(exploredUnitCodes([], [{ id: 'a', unitCodes: ['1'] }]).size).toBe(0);
  });
});

describe('countExplored', () => {
  it('counts units whose code was explored, ignoring units without a code', () => {
    expect(countExplored([{ code: '1' }, { code: '2' }, { code: null }], new Set(['2', '3']))).toBe(1);
  });
});
