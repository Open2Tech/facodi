import { describe, expect, it } from 'vitest';
import { buildMail, deliveryFailure, isSuperseded, sameSecret, type MailEvent, type MailKind } from './mail';

export function mailEvent(kind: MailKind = 'suggestion_received'): MailEvent {
  return { id: 'event-1', event_key: 'facodi:event-1', recipient_user_id: 'author-1', playlist_id: null,
    suggestion_id: 'suggestion-1', template_name: kind, attempts: 0, created_at: new Date().toISOString(),
    first_attempt_at: null, event_payload: { title: 'Vetores & matrizes', review_note: 'Uma nota útil.' } };
}

describe('contributor emails', () => {
  it('thanks contributors and promises a second message for suggestions and playlists', () => {
    for (const kind of ['suggestion_received', 'playlist_received'] as const) {
      const mail = buildMail(mailEvent(kind));
      expect(mail.subject).toContain('Obrigado');
      expect(mail.text).toContain('avisar-te por email');
      expect(mail.text).not.toContain('Uma nota útil.');
      expect(mail.html).toContain(kind.startsWith('playlist') ? '/playlists/submit' : '/suggest');
    }
  });
  it('distinguishes editorial approval from publication', () => {
    const event = mailEvent('suggestion_approved');
    expect(buildMail(event).text).toContain('publicação pode ainda estar em preparação');
    expect(buildMail(event).html).not.toContain('/resources/');
    expect(buildMail(event, 'pt', 'vetores-1').html).toContain('https://facodi.com/resources/vetores-1');
    expect(buildMail(event, 'pt', 'vetores-1').text).toContain('já está disponível');
  });
  it('includes the decision note on both review outcomes', () => {
    expect(buildMail(mailEvent('suggestion_approved')).text).toContain('Nota da revisão: Uma nota útil.');
    const rejected = buildMail(mailEvent('suggestion_rejected'));
    expect(rejected.text).toContain('não foi aprovada');
    expect(rejected.text).toContain('Uma nota útil.');
    expect(rejected.html).not.toContain('/resources/');
  });
  it('escapes untrusted titles and multiline review notes', () => {
    const event = mailEvent('suggestion_rejected');
    event.event_payload = { title: '<img src=x onerror="alert(1)">', review_note: '<script>alert(1)</script>\nSegunda linha' };
    const mail = buildMail(event);
    expect(mail.html).not.toContain('<script>');
    expect(mail.html).not.toContain('<img');
    expect(mail.html).toContain('&lt;script&gt;');
    expect(mail.html).toContain('Segunda linha');
    expect(mail.text).toContain('\nSegunda linha');
  });
  it.each([['en-GB', 'Thanks'], ['es', 'Gracias'], ['fr_FR', 'Merci'], ['xx', 'Obrigado']])('uses recipient locale %s', (locale, expected) => {
    expect(buildMail(mailEvent(), locale).subject).toContain(expected);
  });
  it('preserves the legacy playlist payload and link', () => {
    const event = mailEvent('playlist_approved');
    event.event_payload = { playlist_title: 'Playlist anterior' };
    const mail = buildMail(event, 'pt', 'ignored');
    expect(mail.text).toContain('Playlist: Playlist anterior');
    expect(mail.html).toContain('/playlists/submit');
    expect(mail.html).not.toContain('/resources/');
  });
  it('delivers acknowledgement even if review happened before dispatch', () => {
    expect(isSuperseded(mailEvent(), { submitted_by: 'author-1', status: 'approved' })).toBe(false);
    expect(isSuperseded(mailEvent('suggestion_approved'), { submitted_by: 'author-1', status: 'rejected' })).toBe(true);
    expect(isSuperseded(mailEvent(), { submitted_by: 'someone-else', status: 'pending' })).toBe(true);
    expect(isSuperseded(mailEvent(), null)).toBe(true);
  });
  it('retries temporary errors with bounded backoff, fails permanent errors', () => {
    for (const status of [0, 429, 500, 503]) expect(deliveryFailure(status, 0).retry).toBe(true);
    expect(deliveryFailure(503, 4).retry).toBe(false);
    expect(deliveryFailure(422, 0).retry).toBe(false);
    expect(deliveryFailure(429, 3).delaySeconds).toBe(480);
  });
  it('retries only the temporary Resend idempotency conflict, within the attempt limit', () => {
    expect(deliveryFailure(409, 0, 'concurrent_idempotent_requests').retry).toBe(true);
    expect(deliveryFailure(409, 4, 'concurrent_idempotent_requests').retry).toBe(false);
    expect(deliveryFailure(409, 0, 'invalid_idempotent_request').retry).toBe(false);
    expect(deliveryFailure(409, 0).retry).toBe(false);
    expect(deliveryFailure(409, 3, 'concurrent_idempotent_requests').delaySeconds).toBe(480);
  });
  it('rejects missing, short and incorrect worker credentials', () => {
    expect(sameSecret('', '')).toBe(false);
    expect(sameSecret('short', 'short')).toBe(false);
    expect(sameSecret('a'.repeat(32), 'b'.repeat(32))).toBe(false);
    expect(sameSecret('a'.repeat(32), 'a'.repeat(32))).toBe(true);
  });
});
