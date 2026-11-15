import { describe, expect, it } from 'vitest';
import { changedPositions, moveVideo } from './sequence-order';

describe('editorial video ordering', () => {
  const initial = ['intro', 'basis', 'examples', 'practice'];
  it('moves a lesson upwards and keeps original list immutable', () => {
    const result = moveVideo(initial, 'practice', 'basis');
    expect(result).toEqual(['intro', 'practice', 'basis', 'examples']);
    expect(initial).toEqual(['intro', 'basis', 'examples', 'practice']);
  });
  it('moves a lesson downwards without adding or removing videos', () => {
    const result = moveVideo(initial, 'intro', 'examples');
    expect(result).toEqual(['basis', 'examples', 'intro', 'practice']);
    expect(result).toHaveLength(initial.length);
    expect(new Set(result)).toEqual(new Set(initial));
  });
  it('does not modify order for unknown or identical IDs', () => {
    expect(moveVideo(initial, 'nonexistent', 'intro')).toEqual(initial);
    expect(moveVideo(initial, 'intro', 'intro')).toEqual(initial);
  });
  it('reports changed positions accurately', () => {
    expect(changedPositions(initial, initial)).toBe(0);
    expect(changedPositions(initial, ['basis', 'intro', 'examples', 'practice'])).toBe(2);
    expect(changedPositions(initial, ['intro'])).toBe(0);
  });
});
