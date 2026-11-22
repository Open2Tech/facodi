import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const root = new URL('../supabase/email-templates/facodi/', import.meta.url);
const linkTemplates = ['confirmation', 'invite', 'recovery', 'magic_link', 'email_change'];
const tokenTemplates = ['reauthentication'];
const notificationTemplates = [
  'password_changed', 'email_changed', 'phone_changed',
  'identity_linked', 'identity_unlinked',
  'mfa_factor_enrolled', 'mfa_factor_unenrolled',
];
const studyTemplates = ['study_welcome', 'study_reminder'];
let checked = 0;
for (const [type, entries] of [
  ['link', linkTemplates], ['token', tokenTemplates], ['notification', notificationTemplates], ['study', studyTemplates],
]) {
  for (const name of entries) {
    const file = new URL(name + '.html', root);
    const html = readFileSync(file, 'utf8');
    assert.match(html, /<!doctype html>/i, name + ': doctype');
    assert.match(html, /<html lang="pt-PT">/, name + ': lang');
    assert.match(html, /<title>[^<]+FACODI<\/title>/, name + ': title');
    assert.match(html, /<table role="presentation"/, name + ': email-safe table');
    assert.match(html, /https:\/\/facodi\.com/, name + ': FACODI canonical origin');
    assert.doesNotMatch(html, /https:\/\/www\.facodi\.com|facodi\.vercel\.app/i, name + ': legacy FACODI destinations');
    assert.doesNotMatch(html, /<img\b|@import|<link\b/i, name + ': no remote assets');
    for (const color of ['#142948', '#fdfcf7', '#eeff00', '#37bdd2', '#a6e8bd', '#ffad33', '#ff70a7', '#ff8a7a']) {
      assert.ok(html.includes(color), name + ': campus palette ' + color);
    }
    assert.doesNotMatch(html, /Tube O2|tube\.open2\.tech|<script\b|<iframe\b/i, name + ': isolation');
    if (type === 'link') {
      assert.match(html, /href="{{ \.ConfirmationURL }}"/, name + ': Supabase link');
      assert.doesNotMatch(html, /{{ \.Token }}/, name + ': no OTP');
    } else if (type === 'token') {
      assert.match(html, /{{ \.Token }}/, name + ': OTP');
      assert.doesNotMatch(html, /{{ \.ConfirmationURL }}/, name + ': no link');
    } else {
      assert.doesNotMatch(html, /{{ \.Token }}|{{ \.ConfirmationURL }}/, name + ': no auth token');
    }
    if (type === 'study') assert.match(html, /href="{{ \.PreferencesURL }}"/, name + ': opt-out');
    if (name === 'study_reminder') {
      for (const token of ['SequenceTitle', 'NextLessonTitle', 'SequenceURL']) {
        assert.ok(html.includes('{{ .' + token + ' }}'), name + ': ' + token);
      }
    }
    assert.ok(Buffer.byteLength(html) < 20000, name + ': catalog size limit');
    checked++;
  }
}

// Protect the intentionally FACODI-branded global Auth configuration.
// This reads versioned config only; it never pushes settings or sends emails.
const config = readFileSync(new URL('../supabase/config.toml', import.meta.url), 'utf8');
assert.match(config, /site_url = "https:\/\/facodi\.com"/,
  'Auth global site URL must match the FACODI canonical origin');
for (const type of [...linkTemplates, ...tokenTemplates]) {
  assert.ok(config.includes('content_path = "supabase/email-templates/facodi/' + type + '.html"'),
    'Global Auth template must match FACODI file: ' + type);
}
for (const redirect of [
  'https://facodi.com',
  'https://facodi.marcelo-0d6.workers.dev/auth/callback**',
  'https://facodi.marcelo-0d6.workers.dev/auth/reset-password**',
]) assert.ok(config.includes(redirect), 'Auth redirect allowlist missing: ' + redirect);

assert.equal(checked, 15);
console.log('FACODI: ' + checked + ' email templates validated (static tests only).');
