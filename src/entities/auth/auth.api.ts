import { supabase } from '@/shared/api/supabase/supabaseClient';
import { safeReturnPath } from '@/shared/lib/navigation';

export async function signUpWithEmail(email: string, password: string, name?: string, next?: string) {
  return supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(safeReturnPath(next))}`,
      data: { full_name: name ?? '' },
    },
  });
}

export async function signInWithEmail(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
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

export async function updateAccount(values: { name: string; email: string }) {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!user) throw new Error('auth.error.sessionRequired');
  const { error } = await supabase.auth.updateUser(
    { data: { full_name: values.name }, ...(values.email !== user.email ? { email: values.email } : {}) },
    { emailRedirectTo: `${window.location.origin}/auth/callback?next=/profile` },
  );
  if (error) throw error;
}

export async function updateUserPassword(password: string) {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
}

export async function processAuthLink(url: URL) {
  const fragment = new URLSearchParams(url.hash.slice(1));
  if (url.searchParams.has('error') || fragment.has('error')) throw new Error('auth.error.invalidLink');
  const code = url.searchParams.get('code');
  if (!code) throw new Error('auth.error.invalidLink');
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) throw error;
  if (!data.session) throw new Error('auth.error.invalidLink');
  return data.session;
}
