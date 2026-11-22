import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { MailEvent } from './mail';
const mailEvent = (): MailEvent => ({ id: 'event-1', event_key: 'facodi:event-1', recipient_user_id: 'author-1', playlist_id: null, suggestion_id: 'suggestion-1', template_name: 'suggestion_received', attempts: 0, created_at: new Date().toISOString(), first_attempt_at: null, event_payload: { title: 'Aula' } });

type Row = Record<string, unknown>;
const mocks = vi.hoisted(() => ({ createClient: vi.fn() }));
vi.mock('npm:@supabase/supabase-js@2.110.0', () => mocks);
let handler: (req: Request) => Promise<Response>;
let env: Record<string, string>;
let rows: Record<string, Row[]>;
let fetchMock: ReturnType<typeof vi.fn>;
let recipientLookup: ReturnType<typeof vi.fn>;
let readErrors: Set<string>;
let snapshotSaveFails: boolean;
const secret = 'worker-secret-'.repeat(4);
const playlistId = '11111111-1111-1111-1111-111111111111';

// Small in-memory adapter exercises real handler filtering and compare-and-set,
// without any network or dependency on production data.
function from(table: string) {
  let changes: Row | undefined;
  let single = false;
  const filters: Array<(r: Row) => boolean> = [];
  const query = {
    select: () => query,
    update: (value: Row) => { changes = value; return query; },
    eq: (key: string, value: unknown) => { filters.push(r => r[key] === value); return query; },
    in: (key: string, values: unknown[]) => { filters.push(r => values.includes(r[key])); return query; },
    lt: (key: string, value: string | number) => { filters.push(r => r[key] != null && r[key] < value); return query; },
    lte: (key: string, value: string | number) => { filters.push(r => r[key] != null && r[key] <= value); return query; },
    gte: (key: string, value: number) => { filters.push(r => Number(r[key]) >= value); return query; },
    order: () => query,
    limit: () => query,
    maybeSingle: () => { single = true; return query; },
    then: (resolve: (r: unknown) => unknown, reject: (error: unknown) => unknown) => Promise.resolve().then(() => {
      if ((!changes && readErrors.has(table)) || (snapshotSaveFails && changes?.event_payload)) {
        return { data: null, error: { message: 'simulated persistence/lookup failure' } };
      }
      const matched = (rows[table] ?? []).filter(r => filters.every(f => f(r)));
      if (changes) matched.forEach(r => Object.assign(r, changes));
      return { data: structuredClone(single ? matched[0] ?? null : matched), error: null };
    }).then(resolve, reject),
  };
  return query;
}
const request = (body: unknown = {}, headers: Record<string, string> = { 'x-facodi-worker-secret': secret }) =>
  new Request('https://example.test', { method: 'POST', headers, body: JSON.stringify(body) });

beforeAll(async () => {
  vi.stubGlobal('Deno', { env: { get: (key: string) => env[key] }, serve: (fn: typeof handler) => { handler = fn; } });
  await import('./index');
});
afterEach(() => { vi.useRealTimers(); });
beforeEach(() => {
  readErrors = new Set();
  snapshotSaveFails = false;
  recipientLookup = vi.fn().mockResolvedValue({ data: { user: { email: 'contributor@example.test', user_metadata: {} } }, error: null });
  env = { SUPABASE_URL: 'https://example.test', SUPABASE_ANON_KEY: 'anon', SUPABASE_SERVICE_ROLE_KEY: 'service',
    FACODI_SUGGESTION_WORKER_SECRET: secret, FACODI_RESEND_API_KEY: 'test-only', FACODI_EMAIL_FROM: 'FACODI <noreply@facodi.com>' };
  rows = {
    email_outbox: [{ ...mailEvent(), state: 'pending', next_attempt_at: new Date(0).toISOString() }],
    resource_suggestions: [{ id: 'suggestion-1', submitted_by: 'author-1', status: 'approved' }],
    playlists: [{ id: playlistId, submitted_by: 'author-1', status: 'pending' }],
  };
  mocks.createClient.mockReturnValue({ schema: () => ({ from }), auth: {
    getUser: async (jwt: string) => ({ data: { user: jwt === 'valid-owner' ? { id: 'author-1', app_metadata: {} }
      : jwt === 'valid-other' ? { id: 'other', app_metadata: {} } : null }, error: null }),
    admin: { getUserById: (...args: unknown[]) => recipientLookup(...args) },
  } });
  fetchMock = vi.fn().mockImplementation(async () => Response.json({ id: 'provider-id' }));
  vi.stubGlobal('fetch', fetchMock);
});

describe('contributor notification handler', () => {
  it('rejects anonymous requests, forged worker secrets and invalid sessions', async () => {
    for (const headers of [{}, { 'x-facodi-worker-secret': 'forged' }, { Authorization: 'Bearer forged' }]) {
      expect((await handler(request({}, headers))).status).toBe(401);
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('only lets a playlist owner dispatch their own events', async () => {
    expect((await handler(request({ playlist_id: playlistId }, { Authorization: 'Bearer valid-other' }))).status).toBe(404);
    expect((await handler(request({}, { Authorization: 'Bearer valid-owner' }))).status).toBe(400);
    expect((await handler(request({ playlist_id: playlistId }, { Authorization: 'Bearer valid-owner' }))).status).toBe(200);
    expect(fetchMock).not.toHaveBeenCalled(); // Suggestion events remain outside the browser playlist scope.
  });
  it('checks configuration without sending or changing the queue', async () => {
    const before = structuredClone(rows);
    expect(await (await handler(request({ dry_run: true }))).json()).toEqual({ transport_configured: true });
    expect(rows).toEqual(before);
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('leaves events pending when FACODI transport is not configured', async () => {
    delete env.FACODI_RESEND_API_KEY;
    expect((await handler(request())).status).toBe(503);
    expect(rows.email_outbox[0].state).toBe('pending');
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('sends only to the real author and prevents a second dispatch', async () => {
    expect(await (await handler(request({ to: 'attacker@example.test', html: 'ignored' }))).json()).toEqual({ sent: 1, skipped: 0, failed: 0 });
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.resend.com/emails');
    expect(JSON.parse(options.body).to).toEqual(['contributor@example.test']);
    expect(JSON.parse(options.body).subject).toContain('Obrigado');
    expect(options.headers['Idempotency-Key']).toBe('facodi:event-1');
    expect(rows.email_outbox[0]).toMatchObject({ state: 'sent', provider_message_id: 'provider-id', attempts: 1, locked_at: null });
    await handler(request());
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it('allows only one concurrent worker to send an event', async () => {
    await Promise.all([handler(request()), handler(request())]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it('retries 429 automatically with the same event key', async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ error: 'limited' }, { status: 429 }));
    await handler(request());
    expect(rows.email_outbox[0]).toMatchObject({ state: 'retry', attempts: 1, failure_code: 'email_provider_http_429' });
    rows.email_outbox[0].next_attempt_at = new Date(0).toISOString();
    await handler(request());
    expect(rows.email_outbox[0].state).toBe('sent');
    expect(fetchMock.mock.calls.map(([, init]) => init.headers['Idempotency-Key'])).toEqual(['facodi:event-1', 'facodi:event-1']);
  });
  it('recovers an abandoned lease and stops at the retry limit', async () => {
    fetchMock.mockRejectedValueOnce(new Error('provider timeout'));
    await handler(request());
    Object.assign(rows.email_outbox[0], { state: 'processing', locked_at: new Date(0).toISOString() });
    await handler(request());
    expect(rows.email_outbox[0].state).toBe('sent');
    Object.assign(rows.email_outbox[0], { state: 'processing', attempts: 5, locked_at: new Date(0).toISOString() });
    await handler(request());
    expect(rows.email_outbox[0]).toMatchObject({ state: 'failed', failure_code: 'retry_limit_reached' });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
  it('does not retry an ambiguous send outside the provider idempotency window', async () => {
    Object.assign(rows.email_outbox[0], { state: 'retry', attempts: 1, first_attempt_at: new Date(0).toISOString() });
    await handler(request());
    expect(rows.email_outbox[0]).toMatchObject({ state: 'failed', failure_code: 'idempotency_window_expired' });
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it.each(['submission', 'recipient'])('does not start the provider window when the %s lookup fails', async (lookup) => {
    vi.useFakeTimers({ toFake: ['Date'] });
    const start = Date.now();
    if (lookup === 'submission') readErrors.add('resource_suggestions');
    else recipientLookup.mockResolvedValueOnce({ data: { user: null }, error: { status: 503 } });
    await handler(request());
    expect(rows.email_outbox[0]).toMatchObject({ state: 'retry', first_attempt_at: null });
    expect(rows.email_outbox[0].event_payload).not.toHaveProperty('_delivery_request');
    expect(fetchMock).not.toHaveBeenCalled();
    vi.setSystemTime(start + 24 * 60 * 60_000);
    readErrors.clear();
    await handler(request());
    expect(rows.email_outbox[0]).toMatchObject({ state: 'sent', attempts: 2 });
    expect(rows.email_outbox[0].first_attempt_at).toBe(new Date().toISOString());
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it('persists the exact request and start time before calling the provider', async () => {
    fetchMock.mockImplementationOnce(async (_url, init) => {
      expect(rows.email_outbox[0].first_attempt_at).toBeTruthy();
      expect((rows.email_outbox[0].event_payload as Row)._delivery_request).toBe(init.body);
      return Response.json({ id: 'provider-id' });
    });
    await handler(request());
    expect(rows.email_outbox[0].state).toBe('sent');
  });
  it('never sends when writing the original request fails; the lease is recoverable', async () => {
    snapshotSaveFails = true;
    expect((await handler(request())).status).toBe(500);
    expect(rows.email_outbox[0]).toMatchObject({ state: 'processing', first_attempt_at: null });
    expect(fetchMock).not.toHaveBeenCalled();
    snapshotSaveFails = false;
    rows.email_outbox[0].locked_at = new Date(0).toISOString();
    await handler(request());
    expect(rows.email_outbox[0].state).toBe('sent');
  });
  it('replays identical bytes after a timeout despite changed address, locale, sender, review and publication', async () => {
    rows.email_outbox[0].template_name = 'suggestion_approved';
    rows.resource_suggestions[0].learning_object_id = 'object-1';
    rows.learning_objects = [{ id: 'object-1', slug: 'original-resource', published: true, status: 'active' }];
    fetchMock.mockRejectedValueOnce(new Error('accepted but response timed out'));
    await handler(request());
    const original = fetchMock.mock.calls[0][1];
    expect(original.body).toContain('https://facodi.com/resources/original-resource');
    rows.email_outbox[0].next_attempt_at = new Date(0).toISOString();
    (rows.email_outbox[0].event_payload as Row).title = 'Edited title';
    Object.assign(rows.learning_objects[0], { slug: 'edited-slug', published: false });
    rows.resource_suggestions[0].status = 'rejected';
    env.FACODI_EMAIL_FROM = 'FACODI <changed@facodi.com>';
    recipientLookup.mockResolvedValue({ data: { user: { email: 'changed@example.test', user_metadata: { locale: 'fr' } } }, error: null });
    readErrors.add('resource_suggestions'); // Replay must not depend on new lookups.
    await handler(request());
    expect(rows.email_outbox[0]).toMatchObject({ state: 'sent', provider_message_id: 'provider-id' });
    const replay = fetchMock.mock.calls[1][1];
    expect(replay.body).toBe(original.body);
    expect(replay.headers['Idempotency-Key']).toBe(original.headers['Idempotency-Key']);
    expect(recipientLookup).toHaveBeenCalledTimes(1);
  });
  it.each([
    ['concurrent_idempotent_requests', 'retry'],
    ['invalid_idempotent_request', 'failed'],
    ['unknown_conflict', 'failed'],
  ])('treats 409 %s as %s', async (name, state) => {
    fetchMock.mockResolvedValueOnce(Response.json({ name }, { status: 409 }));
    await handler(request());
    expect(rows.email_outbox[0].state).toBe(state);
    if (state === 'retry') {
      expect(rows.email_outbox[0].failure_code).toBe('email_provider_concurrent_idempotent_requests');
      rows.email_outbox[0].next_attempt_at = new Date(0).toISOString();
      await handler(request());
      expect(rows.email_outbox[0]).toMatchObject({ state: 'sent', provider_message_id: 'provider-id' });
      expect(fetchMock.mock.calls[1][1].body).toBe(fetchMock.mock.calls[0][1].body);
    }
  });
  it('leaves legacy ambiguous deliveries without an original request for manual inspection', async () => {
    Object.assign(rows.email_outbox[0], { state: 'retry', attempts: 1, first_attempt_at: new Date().toISOString() });
    await handler(request());
    expect(rows.email_outbox[0]).toMatchObject({ state: 'failed', failure_code: 'delivery_snapshot_missing' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

});
