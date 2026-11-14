import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, screen, render as rtlRender, renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { AuthProvider, useAuth } from './useAuth';

const signInWithEmailMock = vi.fn();
const signUpWithEmailMock = vi.fn();
const signOutUserMock = vi.fn();

vi.mock('@/entities/auth/auth.api', () => ({
  signInWithEmail: (...args: unknown[]) => signInWithEmailMock(...args),
  signUpWithEmail: (...args: unknown[]) => signUpWithEmailMock(...args),
  signOutUser: () => signOutUserMock(),
}));

const onAuthStateChangeMock = vi.fn();
const getSessionMock = vi.fn();
let queryClient: QueryClient;

function render(ui: ReactNode) {
  return rtlRender(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

vi.mock('@/shared/api/supabase/supabaseClient', () => ({
  supabase: {
    auth: {
      onAuthStateChange: (...args: unknown[]) => onAuthStateChangeMock(...args),
      getSession: () => getSessionMock(),
    },
  },
}));

function TestConsumer() {
  const { user, session, loading, signIn, role } = useAuth();

  return (
    <div>
      <span>{loading ? 'loading' : 'ready'}</span>
      <span>{user?.email ?? 'no-user'}</span>
      <span>{session?.access_token ?? 'no-token'}</span>
      <span>{role}</span>
      <button type="button" onClick={() => signIn('test@example.com', 'secret')}>
        sign-in
      </button>
    </div>
  );
}

beforeEach(() => {
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  onAuthStateChangeMock.mockReset();
  getSessionMock.mockReset();
  signInWithEmailMock.mockReset();
  signUpWithEmailMock.mockReset();
  signOutUserMock.mockReset();

  onAuthStateChangeMock.mockReturnValue({
    data: { subscription: { unsubscribe: vi.fn() } },
  });

  getSessionMock.mockResolvedValue({ data: { session: null } });
});

describe('useAuth', () => {
  it('throws when used outside AuthProvider', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const suppressExpectedWindowError = (event: ErrorEvent) => {
      if (event.error instanceof Error && event.error.message.includes('useAuth must be used within an AuthProvider')) {
        event.preventDefault();
      }
    };

    window.addEventListener('error', suppressExpectedWindowError);
    expect(() => renderHook(() => useAuth())).toThrow('useAuth must be used within an AuthProvider');
    window.removeEventListener('error', suppressExpectedWindowError);
    consoleErrorSpy.mockRestore();
  });

  it('waits for INITIAL_SESSION before displaying an authenticated or signed-out state', () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    expect(screen.getByText('loading')).toBeInTheDocument();

    act(() => {
      onAuthStateChangeMock.mock.calls[0][0]('SIGNED_OUT', null);
    });

    expect(screen.getByText('loading')).toBeInTheDocument();

    act(() => {
      onAuthStateChangeMock.mock.calls[0][0]('INITIAL_SESSION', {
        user: { id: 'alice', email: 'alice@example.com' },
      });
    });

    expect(screen.getByText('ready')).toBeInTheDocument();
    expect(screen.getByText('alice@example.com')).toBeInTheDocument();
    expect(getSessionMock).not.toHaveBeenCalled();

    screen.getByRole('button', { name: /sign-in/i }).click();

    expect(signInWithEmailMock).toHaveBeenCalledWith('test@example.com', 'secret');
  });

  it('keeps session changes in sync after hydration', () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    const notify = onAuthStateChangeMock.mock.calls[0][0];
    act(() => notify('INITIAL_SESSION', { user: { id: 'alice', email: 'alice@example.com' } }));
    act(() => notify('TOKEN_REFRESHED', { user: { id: 'alice', email: 'alice@example.com' }, access_token: 'rotated-test-token' }));

    expect(screen.getByText('alice@example.com')).toBeInTheDocument();
    expect(screen.getByText('rotated-test-token')).toBeInTheDocument();

    act(() => notify('SIGNED_OUT', null));
    expect(screen.getByText('ready')).toBeInTheDocument();
    expect(screen.getByText('no-user')).toBeInTheDocument();
  });

  it('initializes an anonymous session and handles a later sign-in', () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    const notify = onAuthStateChangeMock.mock.calls[0][0];
    act(() => notify('INITIAL_SESSION', null));
    expect(screen.getByText('ready')).toBeInTheDocument();
    expect(screen.getByText('no-user')).toBeInTheDocument();

    act(() => notify('SIGNED_IN', { user: { id: 'alice', email: 'alice@example.com' } }));
    expect(screen.getByText('alice@example.com')).toBeInTheDocument();

    act(() => notify('USER_UPDATED', { user: { id: 'alice', email: 'updated@example.com' } }));
    expect(screen.getByText('updated@example.com')).toBeInTheDocument();
  });

  it('unsubscribes from auth events when the provider unmounts', () => {
    const unsubscribe = vi.fn();
    onAuthStateChangeMock.mockReturnValue({ data: { subscription: { unsubscribe } } });

    const { unmount } = render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    unmount();
    expect(unsubscribe).toHaveBeenCalledOnce();
  });

  it('clears private queries and mutations on logout, identity change and role downgrade, but not token renewal', () => {
    render(<AuthProvider><TestConsumer /></AuthProvider>);
    const notify = onAuthStateChangeMock.mock.calls[0][0];
    act(() => notify('INITIAL_SESSION', { user: { id: 'alice', app_metadata: { role: 'editor' } } }));
    queryClient.setQueryData(['facodi', 'private', 'alice'], ['draft']);
    act(() => notify('TOKEN_REFRESHED', { user: { id: 'alice', app_metadata: { role: 'editor' } }, access_token: 'fresh' }));
    expect(queryClient.getQueryData(['facodi', 'private', 'alice'])).toEqual(['draft']);
    act(() => notify('USER_UPDATED', { user: { id: 'alice', app_metadata: { role: 'unknown' } } }));
    expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
    expect(screen.getByText('user')).toBeInTheDocument();
    queryClient.setQueryData(['private'], 'alice');
    act(() => notify('SIGNED_IN', { user: { id: 'bob', app_metadata: {} } }));
    expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
    queryClient.setQueryData(['private'], 'bob');
    act(() => notify('SIGNED_OUT', null));
    expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
    expect(queryClient.getMutationCache().getAll()).toHaveLength(0);
  });
});
