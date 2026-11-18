import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import type { User } from '@supabase/supabase-js';
import { useAuth } from '@/features/auth/useAuth';
import { useMySequences, useSequence, useSequenceProgress } from '@/features/sequences/useSequences';
import i18n from '@/i18n/config';
import { ContinueLearning } from './ContinueLearning';

vi.mock('@/features/auth/useAuth', () => ({ useAuth: vi.fn() }));
vi.mock('@/features/sequences/useSequences', () => ({ useMySequences: vi.fn(), useSequence: vi.fn(), useSequenceProgress: vi.fn() }));

const user = { id: 'student', aud: 'authenticated', created_at: '2026-01-01T00:00:00Z', app_metadata: {}, user_metadata: {} } as User;
const lesson = (videoId: string, title: string) => ({ videoId, title, slug: null, youtubeId: null, channel: null, position: 1 });

function setup({ signedIn = true, items = [] as { slug: string; title: string; total: number; completed: number }[] } = {}) {
  vi.mocked(useAuth).mockReturnValue({ user: signedIn ? user : null, session: null, role: 'user', loading: false, signUp: vi.fn(), signIn: vi.fn(), signOut: vi.fn() } as never);
  vi.mocked(useMySequences).mockReturnValue({ data: { items: items.map(item => ({ ...item, started: item.completed, updatedAt: '' })), total: items.length } } as never);
  vi.mocked(useSequence).mockReturnValue({ data: { id: 'seq', slug: 'calculo', items: [lesson('a', 'Limites'), lesson('b', 'Derivadas')] } } as never);
  vi.mocked(useSequenceProgress).mockReturnValue({ data: new Map([['a', { videoId: 'a', completedAt: '2026-11-18T10:00:00Z' }]]) } as never);
  return render(<I18nextProvider i18n={i18n}><MemoryRouter><ContinueLearning /></MemoryRouter></I18nextProvider>);
}

describe('ContinueLearning', () => {
  beforeEach(() => { void i18n.changeLanguage('pt'); });

  it('sends the learner back to the most recent unfinished sequence and names the next lesson', () => {
    setup({ items: [
      { slug: 'acabada', title: 'Já concluída', total: 3, completed: 3 },
      { slug: 'calculo', title: 'Cálculo — derivadas', total: 2, completed: 1 },
    ] });
    expect(screen.getByRole('heading', { name: 'Cálculo — derivadas' })).toBeInTheDocument();
    expect(screen.getByText('Próxima aula: Derivadas')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Continuar/ })).toHaveAttribute('href', '/sequences/calculo');
    expect(vi.mocked(useSequence)).toHaveBeenLastCalledWith('calculo', true);
  });

  it('stays out of the way for visitors and when nothing is in progress', () => {
    const { container, rerender } = setup({ signedIn: false, items: [{ slug: 'calculo', title: 'Cálculo', total: 2, completed: 1 }] });
    expect(container).toBeEmptyDOMElement();
    setup({ items: [{ slug: 'acabada', title: 'Já concluída', total: 3, completed: 3 }] });
    expect(screen.queryByRole('heading', { name: 'Já concluída' })).not.toBeInTheDocument();
    expect(vi.mocked(useSequence)).toHaveBeenLastCalledWith('', false);
    rerender(<></>);
  });
});
