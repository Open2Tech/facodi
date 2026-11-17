import { describe, expect, it } from 'vitest';
import {
  aiProviders, type Candidate, classifyAiStatus, InvalidOutput, type Match, nextUtcDay, parseMatches, retryDelayMinutes,
  strongUnitIds, timingSafeEqual,
} from './analysis.ts';
import { buildNotification, type PipelineSettings } from './notification.ts';

const unit = (id: string, title: string): Candidate => ({
  id, code: null, title, summary: null, slug: title.toLowerCase(), course_code: 'LEI', course_slug: 'lei', course_title: 'Engenharia',
});
const candidates = [unit('id-1', 'Análise Matemática II'), unit('id-2', 'Estatística I')];
const reason = 'Derivadas parciais fazem parte do programa desta unidade.';

describe('parseMatches', () => {
  it('keeps valid matches and enriches them from the shortlist', () => {
    const result = parseMatches(JSON.stringify({
      topics: ['Derivadas parciais', '  ', 'x'.repeat(41), 'a', 'b', 'c', 'd', 'e'],
      matches: [{ unit_id: 'u1', fit: 'strong', reason: `  ${reason}  ` }],
    }), candidates);
    expect(result.matches).toEqual([expect.objectContaining({ unit_id: 'id-1', title: 'Análise Matemática II', course_slug: 'lei', reason })]);
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

describe('AI providers', () => {
  const env = (vars: Record<string, string>) => (name: string) => vars[name];
  const keys = env({ GEMINI_API_KEY: 'g', OPENAI_API_KEY: 'o' });

  it('uses Gemini first and the cheapest OpenAI model only as fallback', () => {
    expect(aiProviders(keys, { fallbackEnabled: true }).map((p) => [p.name, p.model]))
      .toEqual([['gemini', 'gemini-2.5-flash'], ['openai', 'gpt-5-nano']]);
    expect(aiProviders(keys, { fallbackEnabled: false }).map((p) => p.name)).toEqual(['gemini']);
  });

  it('can force one provider for a dry run', () => {
    expect(aiProviders(keys, { fallbackEnabled: false, force: 'openai' }).map((p) => p.name)).toEqual(['openai']);
    expect(aiProviders(env({ OPENAI_API_KEY: 'o' }), { fallbackEnabled: true }).map((p) => p.name)).toEqual(['openai']);
  });
});

describe('automatic decision notification', () => {
  const settings: PipelineSettings = {
    auto_publish_enabled: true, ai_fallback_enabled: true, notification_email_enabled: true,
    notify_on_auto_publish: true, notify_on_review: true, notification_recipient: 'editor@example.org',
  };
  const match = (unit_id: string, fit: Match['fit']): Match => ({
    unit_id, fit, reason, code: null, title: `Unidade ${unit_id}`, slug: `unidade-${unit_id}`, course_code: null, course_slug: 'lei',
  });
  const base = {
    title: 'Derivadas <script>', url: 'https://www.youtube.com/watch?v=abcdefghijk', author: 'Canal', chosenUnit: null,
    provider: 'gemini', matches: [match('u2', 'partial'), match('u1', 'strong')],
  };
  const published = { ...base, decision: { outcome: 'published' as const, unit_id: 'u1', object_slug: 'derivadas-1', object_id: 'o' } };

  it('keeps only strong matches in the AI order', () => {
    expect(strongUnitIds([match('a', 'strong'), match('b', 'partial'), match('c', 'strong')])).toEqual(['a', 'c']);
  });

  it('links the published resource, its unit and the editor, escaping submitted text', () => {
    const mail = buildNotification(settings, published)!;
    expect(mail.to).toBe('editor@example.org');
    expect(mail.subject).toBe('[FACODI] Publicado: Derivadas <script>');
    expect(mail.text).toContain('https://facodi.com/resources/derivadas-1');
    expect(mail.text).toContain('https://facodi.com/courses/lei/units/unidade-u1');
    expect(mail.text).toContain('https://facodi.com/editor?kind=learning_objects&search=derivadas-1');
    expect(mail.html).not.toContain('<script>');
  });

  it('explains why a suggestion needs review', () => {
    const mail = buildNotification(settings, { ...base, decision: { outcome: 'review', reason: 'no_course' } })!;
    expect(mail.text).toContain('não indica uma unidade curricular');
    expect(mail.text).toContain('https://facodi.com/editor/suggestions');
  });

  it('respects the switches', () => {
    expect(buildNotification({ ...settings, notification_email_enabled: false }, published)).toBeNull();
    expect(buildNotification({ ...settings, notify_on_auto_publish: false }, published)).toBeNull();
    expect(buildNotification({ ...settings, notify_on_review: false }, { ...base, decision: { outcome: 'review' } })).toBeNull();
    expect(buildNotification(settings, { ...base, decision: { outcome: 'skipped' } })).toBeNull();
  });
});
