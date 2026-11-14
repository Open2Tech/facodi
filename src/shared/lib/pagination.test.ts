import { describe, expect, it } from 'vitest';
import { pageWindow } from '@/shared/lib/pagination';

describe('pageWindow', () => {
  it('keeps first, last and neighbours, collapsing gaps', () => {
    expect(pageWindow(1, 1)).toEqual([1]);
    expect(pageWindow(2, 3)).toEqual([1, 2, 3]);
    expect(pageWindow(5, 10)).toEqual([1, null, 4, 5, 6, null, 10]);
    expect(pageWindow(10, 10)).toEqual([1, null, 9, 10]);
  });
});
