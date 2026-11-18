import { describe, expect, it } from 'vitest';
import { approvedContributions, curatorLevel } from './curatorLevel';

describe('curator levels', () => {
  it('counts only contributions the editorial team approved', () => {
    expect(approvedContributions(
      [{ status: 'approved' }, { status: 'pending' }, { status: 'duplicate' }, { status: 'rejected' }],
      [{ status: 'published' }, { status: 'approved' }, { status: 'pending' }],
    )).toBe(3);
  });
  it('moves from no level to collaboration at 1 and curation at 5, with what is left to the next', () => {
    expect(curatorLevel(0)).toEqual({ approved: 0, level: null, next: { key: 'collaboration', number: 1, remaining: 1 } });
    expect(curatorLevel(3)).toEqual({ approved: 3, level: { key: 'collaboration', number: 1 }, next: { key: 'curation', number: 2, remaining: 2 } });
    expect(curatorLevel(9)).toEqual({ approved: 9, level: { key: 'curation', number: 2 }, next: null });
  });
});
