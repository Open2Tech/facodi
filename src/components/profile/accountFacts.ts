import type { User } from '@supabase/supabase-js';

export function displayName(user: User | null) {
  const name = typeof user?.user_metadata.full_name === 'string' ? user.user_metadata.full_name.trim() : '';
  return name || user?.email || '';
}

export function initials(label: string) {
  return label.split(/[\s@.]+/).filter(Boolean).slice(0, 2).map(part => part[0]?.toUpperCase()).join('');
}

/** Sign-in providers recorded by Supabase Auth, e.g. `email` or `google`. */
export function signInProviders(user: User | null): string[] {
  const providers = user?.app_metadata.providers;
  if (Array.isArray(providers)) return providers.filter((item): item is string => typeof item === 'string');
  return typeof user?.app_metadata.provider === 'string' ? [user.app_metadata.provider] : [];
}
