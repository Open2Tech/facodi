import { describe, expect, it } from 'vitest';
import {
  type Candidate, classifyAiStatus, InvalidOutput, nextUtcDay, parseMatches, retryDelayMinutes, timingSafeEqual,
} from './analysis.ts';

const unit = (id: string, title: string): Candidate => ({
  id, code: null, title, summary: null, slug: title.toLowerCase(), course_code: 'LEI', course_slug: 'lei', course_title: 'Engenharia',
});
const candidates = [unit('u1', 'Análise Matemática II'), unit('u2', 'Estatística I')];
const reason = 'Derivadas parciais fazem parte do programa desta unidade.';

describe('parseMatches', () => {
  it('keeps valid matches and enriches them from the shortlist', () => {
    const result = parseMatches(JSON.stringify({
      topics: ['Derivadas parciais', '  ', 'x'.repeat(41), 'a', 'b', 'c', 'd', 'e'],
      matches: [{ unit_id: 'u1', fit: 'strong', reason: `  ${reason}  ` }],
    }), candidates);
    expect(result.matches).toEqual([expect.objectContaining({ unit_id: 'u1', title: 'Análise Matemática II', course_slug: 'lei', reason })]);
    expect(result.topics).toEqual(['Derivadas parciais', 'a', 'b', 'c', 'd']);
  });

  it('accepts an empty answer', () => {
    expect(parseMatches({ topics: [], matches: [] }, candidates).matches).toEqual([]);
  });

  it.each([
    ['not json', '{'],
    ['unknown unit', { matches: [{ unit_id: 'u9', fit: 'strong', reason }] }],
    ['duplicate unit', { matches: [{ unit_id: 'u1', fit: 'strong', reason }, { unit_id: 'u1', fit: 'partial', reason }] }],
    ['bad fit', { matches: [{ unit_id: 'u1', fit: 'perfect', reason }] }],
    ['short reason', { matches: [{ unit_id: 'u1', fit: 'strong', reason: 'boa' }] }],
    ['too many', { matches: ['u1', 'u2', 'u1', 'u2'].map((id) => ({ unit_id: id, fit: 'partial', reason })) }],
  ])('rejects %s', (_label, raw) => {
    expect(() => parseMatches(raw, candidates)).toThrow(InvalidOutput);
  });
});

describe('worker policy', () => {
  it('retries only transient AI errors, at most three attempts', () => {
    expect(classifyAiStatus(429).transient).toBe(true);
    expect(classifyAiStatus(503).transient).toBe(true);
    expect(classifyAiStatus(400)).toMatchObject({ code: 'ai_rejected', transient: false });
    expect(classifyAiStatus(429, 'credit_balance_exhausted')).toMatchObject({ code: 'ai_quota', transient: false });
    expect([1, 2, 3].map(retryDelayMinutes)).toEqual([1, 5, null]);
  });

  it('waits for the next UTC day when the budget is spent', () => {
    expect(nextUtcDay(new Date('2026-11-16T23:59:00Z')).toISOString()).toBe('2026-11-17T00:05:00.000Z');
  });

  it('compares the worker secret exactly', () => {
    expect(timingSafeEqual('a'.repeat(40), 'a'.repeat(40))).toBe(true);
    expect(timingSafeEqual('a'.repeat(40), `${'a'.repeat(39)}b`)).toBe(false);
    expect(timingSafeEqual('a'.repeat(40), 'a'.repeat(39))).toBe(false);
  });
});
