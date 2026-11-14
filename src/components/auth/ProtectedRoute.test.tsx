import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import type { User } from '@supabase/supabase-js';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/features/auth/useAuth';
import { facodiRole } from '@/entities/facodi/access';
import i18n from '@/i18n/config';

vi.mock('@/features/auth/useAuth', () => ({ useAuth: vi.fn() }));
function user(role?: string): User {
  return { id: 'test-user', app_metadata: { role }, user_metadata: { role: 'admin' }, aud: 'authenticated', created_at: '2026-01-01T00:00:00Z' };
}
function LoginLocation() {
  const location = useLocation();
  return <p>login:{location.search}</p>;
}
function route({ role, signedIn = true, loading = false, required }: { role?: string; signedIn?: boolean; loading?: boolean; required?: 'editor' | 'admin' }) {
  const account = signedIn ? user(role) : null;
  vi.mocked(useAuth).mockReturnValue({ user: account, session: null, role: facodiRole(account?.app_metadata), loading, signUp: vi.fn(), signIn: vi.fn(), signOut: vi.fn() });
  render(<I18nextProvider i18n={i18n}><MemoryRouter initialEntries={['/editor?view=units']}><Routes>
    <Route path="/login" element={<LoginLocation />} />
    <Route element={<ProtectedRoute required={required} />}><Route path="/editor" element={<h1>Protected workspace</h1>} /></Route>
  </Routes></MemoryRouter></I18nextProvider>);
}
describe('protected route entry', () => {
  it('waits for session hydration before redirecting', () => {
    route({ loading: true, signedIn: false, required: 'editor' });
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByText(/login:/)).not.toBeInTheDocument();
    expect(screen.queryByText('Protected workspace')).not.toBeInTheDocument();
  });
  it('preserves the internal destination for visitors entering directly', () => {
    route({ signedIn: false, required: 'editor' });
    expect(screen.getByText('login:?next=%2Feditor%3Fview%3Dunits')).toBeInTheDocument();
  });
  it.each([
    { role: undefined, required: undefined, allowed: true },
    { role: 'unknown', required: 'editor' as const, allowed: false },
    { role: undefined, required: 'admin' as const, allowed: false },
    { role: 'editor', required: 'editor' as const, allowed: true },
    { role: 'editor', required: 'admin' as const, allowed: false },
    { role: 'admin', required: 'editor' as const, allowed: true },
    { role: 'admin', required: 'admin' as const, allowed: true },
  ])('enforces app_metadata-only access for $role / $required', ({ role, required, allowed }) => {
    route({ role, required });
    expect(!!screen.queryByText('Protected workspace')).toBe(allowed);
    if (!allowed) expect(screen.getByText('You do not have permission to access this area.')).toBeInTheDocument();
  });
});
