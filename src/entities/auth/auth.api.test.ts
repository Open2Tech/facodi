import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  signUpWithEmail, resendSignupConfirmation, requestPasswordReset,
  updateAccount, updateUserPassword, processAuthLink,
} from './auth.api';

const { signUp, resend, resetPasswordForEmail, getUser, updateUser, exchangeCodeForSession } = vi.hoisted(() => ({
  signUp: vi.fn(),
  resend: vi.fn(),
  resetPasswordForEmail: vi.fn(),
  getUser: vi.fn(),
  updateUser: vi.fn(),
  exchangeCodeForSession: vi.fn(),
}));

vi.mock('@/shared/api/supabase/supabaseClient', () => ({
  supabase: { auth: {
    signUp, resend, resetPasswordForEmail, getUser, updateUser, exchangeCodeForSession,
  } },
}));

beforeEach(() => {
  vi.clearAllMocks();
  signUp.mockResolvedValue({ data: { user: null, session: null }, error: null });
  resend.mockResolvedValue({ data: {}, error: null });
  resetPasswordForEmail.mockResolvedValue({ data: {}, error: null });
  getUser.mockResolvedValue({ data: { user: { email: 'original@example.com' } }, error: null });
  updateUser.mockResolvedValue({ data: {}, error: null });
  exchangeCodeForSession.mockResolvedValue({ data: { session: { access_token: 'test-token' } }, error: null });
});

describe('FACODI email authentication flows', () => {
  it('tags FACODI signup and preserves a safe PKCE callback', async () => {
    await signUpWithEmail('student@example.com', 'secure-pass', 'Estudante', '/playlists/submit');
    expect(signUp).toHaveBeenCalledWith({
      email: 'student@example.com',
      password: 'secure-pass',
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=%2Fplaylists%2Fsubmit`,
        data: { full_name: 'Estudante', client_app: 'facodi' },
      },
    });
  });

  it('does not allow attacker-controlled external return locations', async () => {
    await signUpWithEmail('student@example.com', 'secure-pass', 'Estudante', '//untrusted.example');
    expect(signUp.mock.calls[0][0].options.emailRedirectTo).toBe(
      `${window.location.origin}/auth/callback?next=%2Fdashboard`,
    );
  });

  it('resends signup confirmation using a FACODI PKCE URL', async () => {
    await resendSignupConfirmation('student@example.com', '/profile');
    expect(resend).toHaveBeenCalledWith({
      type: 'signup',
      email: 'student@example.com',
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=%2Fprofile`,
      },
    });
  });

  it('surfaces the provider response when resend is rejected', async () => {
    resend.mockResolvedValueOnce({ data: {}, error: new Error('email rate limit reached') });
    await expect(resendSignupConfirmation('student@example.com')).rejects.toThrow('email rate limit reached');
  });

  it('requests recovery via the dedicated FACODI password page', async () => {
    await requestPasswordReset('student@example.com');
    expect(resetPasswordForEmail).toHaveBeenCalledWith('student@example.com', {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
  });

  it('updates account email with profile callback; name-only edits do not email-change', async () => {
    await updateAccount({ name: 'Estudante', email: 'updated@example.com' });
    expect(updateUser).toHaveBeenCalledWith({
      data: { full_name: 'Estudante' }, email: 'updated@example.com',
    }, {
      emailRedirectTo: `${window.location.origin}/auth/callback?next=/profile`,
    });
    await updateAccount({ name: 'Estudante', email: 'original@example.com' });
    expect(updateUser.mock.calls[1][0]).toEqual({ data: { full_name: 'Estudante' } });
  });

  it('does not update an account without a valid authenticated user', async () => {
    getUser.mockResolvedValueOnce({ data: { user: null }, error: null });
    await expect(updateAccount({ name: 'Test', email: 'test@example.com' })).rejects.toThrow();
    expect(updateUser).not.toHaveBeenCalled();
  });

  it('exchanges PKCE confirmation/recovery code for a session', async () => {
    const callback = new URL(`${window.location.origin}/auth/callback?code=valid-code`);
    const session = await processAuthLink(callback);
    expect(exchangeCodeForSession).toHaveBeenCalledWith('valid-code');
    expect(session.access_token).toBe('test-token');
  });

  it('rejects invalid, missing and errored auth links before exchanging a session', async () => {
    await expect(processAuthLink(new URL(`${window.location.origin}/auth/callback`))).rejects.toThrow();
    await expect(processAuthLink(new URL(`${window.location.origin}/auth/callback?error=access_denied&code=still-present`))).rejects.toThrow();
    expect(exchangeCodeForSession).not.toHaveBeenCalled();
  });

  it('updates passwords through Supabase Auth rather than a custom email endpoint', async () => {
    await updateUserPassword('new-secure-password');
    expect(updateUser).toHaveBeenCalledWith({ password: 'new-secure-password' });
  });
});
