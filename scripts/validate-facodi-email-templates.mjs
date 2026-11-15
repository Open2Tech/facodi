import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import assert from 'node:assert/strict';

const root = new URL('../supabase/email-templates/facodi/', import.meta.url);
const linkTemplates = ['confirmation', 'invite', 'recovery', 'magic_link', 'email_change'];
const tokenTemplates = ['reauthentication'];
const notificationTemplates = [
  'password_changed', 'email_changed', 'phone_changed',
  'identity_linked', 'identity_unlinked',
  'mfa_factor_enrolled', 'mfa_factor_unenrolled',
];
let checked = 0;
for (const [type, entries] of [
  ['link', linkTemplates], ['token', tokenTemplates], ['notification', notificationTemplates],
]) {
  for (const name of entries) {
    const file = new URL(name + '.html', root);
    const html = readFileSync(file, 'utf8');
    assert.match(html, /<!doctype html>/i, name + ': doctype');
    assert.match(html, /<html lang="pt-PT">/, name + ': lang');
    assert.match(html, /<title>[^<]+FACODI<\/title>/, name + ': title');
    assert.match(html, /<table role="presentation"/, name + ': email-safe table');
    assert.match(html, /https:\/\/www\.facodi\.com/, name + ': FACODI origin');
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
    checked++;
  }
}
assert.equal(checked, 13);
console.log('FACODI: ' + checked + ' email templates validated (static tests only).');
