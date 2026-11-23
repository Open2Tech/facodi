import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/shared/test/renderWithProviders';
import { useAuth } from '@/features/auth/useAuth';
import { signInWithGoogle } from '@/entities/auth/auth.api';
import Login from '@/pages/Login';

vi.mock('@/features/auth/useAuth', () => ({ useAuth: vi.fn() }));
vi.mock('@/features/courses/queries/useCourses', () => ({ useCatalogCounts: () => ({ data: undefined }) }));
vi.mock('@/entities/auth/auth.api', () => ({ signInWithGoogle: vi.fn(), resendSignupConfirmation: vi.fn() }));

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(useAuth).mockReturnValue({ user: null, session: null, loading: false, role: 'user', signIn: vi.fn(), signUp: vi.fn(), signOut: vi.fn() });
});

describe('Google sign-in entry', () => {
  it('starts without requiring email fields and blocks duplicate or competing submissions', async () => {
    const user = userEvent.setup();
    vi.mocked(signInWithGoogle).mockReturnValue(new Promise(() => {}));
    renderWithProviders(<Login />, { route: '/login?next=%2Fsequences%2Fintro%3Fnotes%3Dopen%23lesson' });
    await user.click(screen.getByRole('button', { name: 'Continue with Google' }));
    expect(signInWithGoogle).toHaveBeenCalledExactlyOnceWith('/sequences/intro?notes=open#lesson');
    expect(screen.getByRole('button', { name: 'Opening Google…' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeDisabled();
    expect(screen.getByLabelText('Email')).toBeDisabled();
    expect(useAuth().signIn).not.toHaveBeenCalled();
  });

  it('offers the same Google flow when creating an account', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Login />, { route: '/login?next=%2Fsuggest' });
    await user.click(screen.getByRole('button', { name: 'Create an account' }));
    expect(screen.getByLabelText('Name')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Terms of Use' })).toHaveAttribute('href', '/terms');
    await user.click(screen.getByRole('button', { name: 'Continue with Google' }));
    expect(signInWithGoogle).toHaveBeenCalledExactlyOnceWith('/suggest');
    expect(useAuth().signUp).not.toHaveBeenCalled();
  });

  it('announces a startup failure and lets the learner retry or use email', async () => {
    const user = userEvent.setup();
    vi.mocked(signInWithGoogle).mockRejectedValueOnce({ code: 'provider_disabled', message: 'Raw provider error' });
    renderWithProviders(<Login />, { route: '/login?next=https%3A%2F%2Funtrusted.example' });
    await user.click(screen.getByRole('button', { name: 'Continue with Google' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Google sign-in is temporarily unavailable.');
    expect(screen.queryByText('Raw provider error')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continue with Google' })).toBeEnabled();
    expect(screen.getByLabelText('Email')).toBeEnabled();
    expect(signInWithGoogle).toHaveBeenCalledExactlyOnceWith('/dashboard');
    vi.mocked(signInWithGoogle).mockReturnValue(new Promise(() => {}));
    await user.click(screen.getByRole('button', { name: 'Continue with Google' }));
    await waitFor(() => expect(signInWithGoogle).toHaveBeenCalledTimes(2));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
