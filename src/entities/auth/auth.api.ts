import { supabase } from '@/shared/api/supabase/supabaseClient';
import { safeReturnPath } from '@/shared/lib/navigation';

export async function signUpWithEmail(email: string, password: string, name?: string, next?: string) {
  return supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(safeReturnPath(next))}`,
      data: { full_name: name ?? '', client_app: 'facodi' },
    },
  });
}

/** Request a new confirmation email using the same PKCE callback as signup.
 * Delivery and rate limits are enforced by Supabase Auth, not the browser. */
export async function resendSignupConfirmation(email: string, next?: string) {
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(safeReturnPath(next))}`,
    },
  });
  if (error) throw error;
}

export async function signInWithEmail(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

/** Uses the shared PKCE client and callback; no Google API scopes are requested. */
export async function signInWithGoogle(next?: string) {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(safeReturnPath(next))}`,
    },
  });
  if (error) throw error;
}

export async function signOutUser() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function requestPasswordReset(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`,
  });
  if (error) throw error;
}

const profileCallback = () => `${window.location.origin}/auth/callback?next=/profile`;

/** Saves the display name and, when it differs, starts a Supabase email change. */
export async function updateAccount(values: { name: string; email: string }) {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!user) throw new Error('auth.error.sessionRequired');
  const email = values.email.trim();
  const emailChanged = email.toLowerCase() !== (user.email ?? '').toLowerCase();
  const { error } = await supabase.auth.updateUser(
    { data: { full_name: values.name.trim() }, ...(emailChanged ? { email } : {}) },
    { emailRedirectTo: profileCallback() },
  );
  if (error) throw error;
  return { emailChangeRequested: emailChanged };
}

export async function resendEmailChange(email: string) {
  const { error } = await supabase.auth.resend({ type: 'email_change', email, options: { emailRedirectTo: profileCallback() } });
  if (error) throw error;
}

/** Revokes every refresh token except the one held by this browser. */
export async function signOutOtherSessions() {
  const { error } = await supabase.auth.signOut({ scope: 'others' });
  if (error) throw error;
}

export async function updateUserPassword(password: string) {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
}

export async function processAuthLink(url: URL) {
  const fragment = new URLSearchParams(url.hash.slice(1));
  const failure = url.searchParams.has('error') ? url.searchParams : fragment;
  if (failure.has('error')) {
    const code = failure.get('error_code');
    if (code === 'provider_oauth_error') throw new Error('auth.error.oauthFailed');
    if (failure.get('error') === 'access_denied' && !code) throw new Error('auth.error.oauthCancelled');
    throw new Error('auth.error.invalidLink');
  }
  const code = url.searchParams.get('code');
  if (!code) throw new Error('auth.error.invalidLink');
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) throw error;
  if (!data.session) throw new Error('auth.error.invalidLink');
  return data.session;
}
