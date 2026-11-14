import { describe, expect, it } from 'vitest';
import { plainText, stringList } from './text';

describe('text helpers', () => {
  it('strips markup without executing it', () => {
    expect(plainText('<p>Intro <b>to</b>\n <img src=x onerror="alert(1)">logic</p>')).toBe('Intro to logic');
    expect(plainText(null)).toBe('');
  });
  it('keeps only non-empty string objectives', () => {
    expect(stringList(['Read', 2, ' ', 'Write'])).toEqual(['Read', 'Write']);
    expect(stringList({ goal: 'x' })).toEqual([]);
  });
});
