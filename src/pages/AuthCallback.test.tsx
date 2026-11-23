import { afterEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { renderWithProviders } from '@/shared/test/renderWithProviders';
import AuthCallback from '@/pages/AuthCallback';

const { exchangeCodeForSession } = vi.hoisted(() => ({ exchangeCodeForSession: vi.fn() }));
vi.mock('@/shared/api/supabase/supabaseClient', () => ({ supabase: { auth: { exchangeCodeForSession } } }));
vi.mock('@/features/courses/queries/useCourses', () => ({ useCatalogCounts: () => ({ data: undefined }) }));

function Destination() {
  const { pathname, search, hash } = useLocation();
  return <p>{pathname}{search}{hash}</p>;
}
function callback(query: string) {
  window.history.replaceState(null, '', `/auth/callback${query}`);
  renderWithProviders(<Routes>
    <Route path="/auth/callback" element={<AuthCallback />} />
    <Route path="*" element={<Destination />} />
  </Routes>, { route: `/auth/callback${query}` });
}
afterEach(() => {
  vi.clearAllMocks();
  window.history.replaceState(null, '', '/');
});

describe('OAuth callback', () => {
  it.each([
    ['/sequences/intro?notes=open#lesson', '/sequences/intro?notes=open#lesson'],
    ['https://untrusted.example', '/dashboard'],
  ])('exchanges the code then returns to a safe destination', async (next, expected) => {
    exchangeCodeForSession.mockResolvedValue({ data: { session: { access_token: 'test-token' } }, error: null });
    callback(`?code=google-code&next=${encodeURIComponent(next)}`);
    expect(await screen.findByText(expected)).toBeInTheDocument();
    expect(exchangeCodeForSession).toHaveBeenCalledExactlyOnceWith('google-code');
    expect(window.location.search).not.toContain('code=');
  });

  it('explains cancellation, removes provider parameters and preserves the retry destination', async () => {
    callback('?error=access_denied&error_description=untrusted-text&next=%2Fsuggest');
    expect(await screen.findByText('Google sign-in was cancelled.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/login?next=%2Fsuggest');
    expect(screen.queryByText('untrusted-text')).not.toBeInTheDocument();
    expect(exchangeCodeForSession).not.toHaveBeenCalled();
    await waitFor(() => expect(window.location.search).toBe(''));
  });

  it('keeps expired email links distinct from Google cancellation', async () => {
    callback('?error=access_denied&error_code=otp_expired');
    expect(await screen.findByText('Invalid or expired authentication link.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Forgot password' })).toBeInTheDocument();
  });
});
