import { describe, expect, it } from 'vitest';
import { buildMail, type MailEvent, type MailKind } from './mail.ts';

const event = (kind: MailKind): MailEvent => ({
  id: 'event', event_key: 'event-key', recipient_user_id: 'user',
  playlist_id: null, suggestion_id: 'suggestion', template_name: kind,
  event_payload: { title: '<img src=x onerror=alert(1)>', review_note: '<script>unsafe</script>' },
  attempts: 0, created_at: '2026-11-22T00:00:00Z', first_attempt_at: null,
});

describe('FACODI contributor email presentation', () => {
  for (const language of ['pt', 'en', 'es', 'fr']) {
    for (const kind of ['playlist_received', 'playlist_approved', 'playlist_rejected',
      'suggestion_received', 'suggestion_approved', 'suggestion_rejected'] as MailKind[]) {
      it(`${language}: ${kind} preserves safe links and escapes submitted content`, () => {
        const mail = buildMail(event(kind), language, 'recurso-seguro');
        expect(mail.html).toContain(`lang="${language === 'pt' ? 'pt-PT' : language}"`);
        expect(mail.html).toContain('&lt;img');
        expect(mail.html).not.toMatch(/<script|<img/i);
        expect(mail.html).toContain(kind.startsWith('playlist_')
          ? 'https://facodi.com/playlists/submit' : 'https://facodi.com/suggest');
        if (kind === 'suggestion_approved') expect(mail.html).toContain('https://facodi.com/resources/recurso-seguro');
        expect(mail.html).toContain('#37bdd2');
        expect(mail.html).toContain('#ff70a7');
        expect(mail.text).toContain('<img src=x onerror=alert(1)>');
      });
    }
  }
  it('keeps received emails free of review notes and falls back to Portuguese', () => {
    const mail = buildMail(event('suggestion_received'), 'unknown');
    expect(mail.html).toContain('lang="pt-PT"');
    expect(mail.html).not.toContain('&lt;script&gt;unsafe');
    expect(mail.html).toContain('Obrigado por partilhares conhecimento!');
  });
});
