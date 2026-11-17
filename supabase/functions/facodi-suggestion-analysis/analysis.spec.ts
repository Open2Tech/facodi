import { describe, expect, it } from 'vitest';
import {
  agreedUnitIds, aiProviders, listedUnitIds, buildMessages, type Candidate, chaptersFromDescription, classifyAiStatus, evidenceLevel, groundMatches,
  InvalidOutput, type Match, nextUtcDay, parseMatches, parseVideoSummary, resourceText, retryDelayMinutes,
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
      matches: [{ unit_id: 'u1', fit: 'strong', reason: `  ${reason}  `, quote: ' derivadas  parciais ' }],
    }), candidates);
    expect(result.matches).toEqual([expect.objectContaining({
      unit_id: 'id-1', title: 'Análise Matemática II', course_slug: 'lei', reason, quote: 'derivadas parciais',
    })]);
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
      .toEqual([['gemini', 'gemini-2.5-flash'], ['openai', 'gpt-5-mini']]);
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
    quote: 'derivadas parciais', grounded: fit === 'strong',
  });
  const base = {
    title: 'Derivadas <script>', url: 'https://www.youtube.com/watch?v=abcdefghijk', author: 'Canal',
    chosen: { unit_title: null, course_title: 'Engenharia' }, evidence_level: 'metadata_rich' as const,
    provider: 'gemini', matches: [match('u2', 'partial'), match('u1', 'strong')],
  };
  const published = { ...base, decision: { outcome: 'published' as const, unit_id: 'u1', object_slug: 'derivadas-1', object_id: 'o' } };

  it('keeps only strong matches in the AI order', () => {
    expect(strongUnitIds([match('a', 'strong'), match('b', 'partial'), match('c', 'strong')])).toEqual(['a', 'c']);
  });

  it('publishes only the units both models rate strong', () => {
    const primary = [match('a', 'strong'), match('b', 'strong'), match('c', 'partial')];
    expect(agreedUnitIds(primary, [match('b', 'strong'), match('a', 'partial'), match('c', 'strong')])).toEqual(['b']);
    expect(agreedUnitIds(primary, [])).toEqual([]);
    expect(buildNotification(settings, { ...base, decision: { outcome: 'review', reason: 'not_confirmed' } })!.text)
      .toContain('o segundo modelo não a confirmou');
  });

  it('reuses catalog links only inside the chosen course and unit', () => {
    expect(listedUnitIds(['id-2', 'other-course'], candidates, null)).toEqual(['id-2']);
    expect(listedUnitIds(['id-2'], candidates, 'id-1')).toEqual([]);
    expect(listedUnitIds([], candidates, null)).toEqual([]);
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
    expect(mail.text).toContain('não indica um curso');
    expect(mail.text).toContain('Indicado pelo estudante: Engenharia');
    expect(mail.text).toContain('Evidência analisada: Descrição, capítulos');
    expect(buildNotification(settings, { ...base, evidence_level: 'content_video', decision: { outcome: 'review' } })!.text)
      .toContain('Primeiros minutos do vídeo');
    expect(mail.text).toContain('https://facodi.com/editor/suggestions');
  });

  it('respects the switches', () => {
    expect(buildNotification({ ...settings, notification_email_enabled: false }, published)).toBeNull();
    expect(buildNotification({ ...settings, notify_on_auto_publish: false }, published)).toBeNull();
    expect(buildNotification({ ...settings, notify_on_review: false }, { ...base, decision: { outcome: 'review' } })).toBeNull();
    expect(buildNotification(settings, { ...base, decision: { outcome: 'skipped' } })).toBeNull();
  });
});

describe('evidence and calibration', () => {
  const input = { title: 'Neurociência cognitiva', canonical_url: 'https://www.youtube.com/watch?v=abcdefghijk',
    provider: 'youtube', object_type: 'video', language: 'pt', tags: ['análise matemática'] };
  const evidence = {
    level: 'content_video' as const, sources: ['submission' as const, 'youtube_oembed' as const],
    title: 'Derivadas Parciais — Cálculo II', author: 'Canal', description: 'Nesta aula vemos a regra da cadeia.',
    chapters: ['Gradiente e direção'], content_summary: 'O professor resolve exercícios de máximos e mínimos.',
    content_topics: ['multiplicadores de Lagrange'],
  };
  const text = resourceText(evidence);
  const proposal = (fit: Match['fit'], quote: string): Match => ({
    unit_id: 'id-1', code: null, title: 'Análise Matemática II', slug: 'am2', course_code: null, course_slug: 'lei',
    fit, reason, quote, grounded: false,
  });
  const fitOf = (quote: string, from = text) => groundMatches([proposal('strong', quote)], from)[0];

  it('keeps a strong match only when its quote comes from the video, ignoring accents and case', () => {
    expect(fitOf('derivadas parciais')).toMatchObject({ fit: 'strong', grounded: true });
    expect(fitOf('REGRA DA CADEIA')).toMatchObject({ fit: 'strong', grounded: true });
    expect(fitOf('maximos e minimos').fit).toBe('strong');
    expect(fitOf('Multiplicadores de Lagrange').fit).toBe('strong');
    expect(fitOf('Direção do gradiente')).toMatchObject({ fit: 'partial', grounded: false });
  });

  it('never grounds on what the learner typed, so one standard applies to Gemini and OpenAI', () => {
    expect(fitOf('Neurociência cognitiva').fit).toBe('partial');
    expect(fitOf('análise matemática').fit).toBe('partial');
    const typedOnly = { ...evidence, sources: ['submission' as const], title: input.title };
    expect(fitOf('Neurociência cognitiva', resourceText(typedOnly)).fit).toBe('partial');
  });

  it('downgrades invented, empty or partial-word quotes', () => {
    expect(fitOf('integrais múltiplas').fit).toBe('partial');
    expect(fitOf('').fit).toBe('partial');
    expect(fitOf('ivadas parc').fit).toBe('partial');
    expect(groundMatches([proposal('partial', 'nada disto')], text)[0].fit).toBe('partial');
  });

  it('tells the model what it saw and gives it the platform title', () => {
    const [system, user] = buildMessages(input, evidence, candidates);
    expect(system.content).toContain('first minutes of the video');
    expect(user.content).toContain('"platform_title":"Derivadas Parciais — Cálculo II"');
    expect(user.content).toContain('"video_topics":["multiplicadores de Lagrange"]');
    expect(buildMessages(input, { ...evidence, content_summary: null }, candidates)[0].content).toContain('only see metadata');
  });

  it('reads chapters only from timestamped description lines', () => {
    expect(chaptersFromDescription('Intro\n00:00 Introdução\n1:02:03 - Regra da cadeia\nhttps://x')).toEqual(['Introdução', 'Regra da cadeia']);
    expect(chaptersFromDescription('00:00 Só um')).toEqual([]);
  });

  it('labels what was actually read', () => {
    expect(evidenceLevel({ ...evidence, content_summary: null, description: null, chapters: [] })).toBe('metadata_only');
    expect(evidenceLevel({ ...evidence, content_summary: null })).toBe('metadata_rich');
    expect(evidenceLevel(evidence)).toBe('content_video');
  });

  it('accepts only a usable video summary', () => {
    const summary = 'Aula sobre a sonda Voyager e a exploração do sistema solar exterior.';
    expect(parseVideoSummary(JSON.stringify({ summary, topics: [' Voyager ', '', 3], language: 'PT' })))
      .toEqual({ summary, topics: ['Voyager'], language: 'pt' });
    expect(parseVideoSummary({ summary, topics: 'x', language: 'portuguese' })).toEqual({ summary, topics: [], language: null });
    expect(parseVideoSummary({ summary: 'curto', topics: [] })).toBeNull();
    expect(parseVideoSummary('{')).toBeNull();
    expect(parseVideoSummary(null)).toBeNull();
  });
});
