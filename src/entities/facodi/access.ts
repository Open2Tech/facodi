/** FACODI roles are taken only from Supabase Auth app_metadata. */
export type FacodiRole = 'user' | 'editor' | 'admin';

export function facodiRole(appMetadata: Record<string, unknown> | undefined): FacodiRole {
  const role = appMetadata?.role;
  return role === 'editor' || role === 'admin' ? role : 'user';
}

export function canAccessFacodiRoute(role: FacodiRole, required: 'editor' | 'admin'): boolean {
  return role === 'admin' || (required === 'editor' && role === 'editor');
}
