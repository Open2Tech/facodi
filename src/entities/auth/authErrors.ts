const CODE_KEYS: Record<string, string> = {
  invalid_credentials: 'auth.error.invalidCredentials',
  email_not_confirmed: 'auth.error.emailNotConfirmed',
  email_exists: 'auth.error.emailExists',
  user_already_exists: 'auth.error.emailExists',
  email_address_invalid: 'auth.error.invalidEmail',
  weak_password: 'auth.error.weakPassword',
  same_password: 'auth.error.samePassword',
  reauthentication_needed: 'auth.error.reauthenticationNeeded',
  over_email_send_rate_limit: 'auth.error.rateLimited',
  over_request_rate_limit: 'auth.error.rateLimited',
  signup_disabled: 'auth.error.signupDisabled',
  session_not_found: 'auth.error.sessionRequired',
  session_expired: 'auth.error.sessionRequired',
  refresh_token_not_found: 'auth.error.sessionRequired',
  refresh_token_already_used: 'auth.error.sessionRequired',
  user_not_found: 'auth.error.sessionRequired',
};

/** Maps a Supabase Auth failure to an i18n key so raw English API text never reaches the UI. */
export function authErrorKey(error: unknown): string {
  if (!error || typeof error !== 'object') return 'common.error';
  const { code, message, status } = error as { code?: unknown; message?: unknown; status?: unknown };
  if (typeof code === 'string' && CODE_KEYS[code]) return CODE_KEYS[code];
  if (typeof message === 'string' && message.startsWith('auth.error.')) return message;
  if (status === 429) return 'auth.error.rateLimited';
  return 'common.error';
}
