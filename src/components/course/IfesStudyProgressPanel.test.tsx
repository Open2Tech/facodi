import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import type { User } from '@supabase/supabase-js';
import { useAuth } from '@/features/auth/useAuth';
import i18n from '@/i18n/config';
import { IfesStudyProgressPanel } from './IfesStudyProgressPanel';

const mocks = vi.hoisted(() => ({
  read: vi.fn(),
  write: vi.fn(),
}));
vi.mock('@/features/auth/useAuth', () => ({ useAuth: vi.fn() }));
vi.mock('@/features/learning/publicLearningRpc', () => ({
  publicLearningRows: mocks.read,
}));
vi.mock('@/shared/api/supabase/supabaseClient', () => ({
  supabase: { rpc: mocks.write },
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const slug = 'ifes-adm26-estudo-1-estatistica';
const units = [{
  unit_slug: 'ifes-car-adm-2026-ano-1-estatistica',
  unit_title: 'Estatística — 1º ano',
  study_module_slug: slug,
  study_topic_count: 3,
  video_count: 2,
  reading_count: 1,
}];
function setAuth(signedIn: boolean) {
  vi.mocked(useAuth).mockReturnValue({
    user: signedIn ? {
      id: 'facodi-test-student',
      aud: 'authenticated',
      created_at: '2026-01-01T00:00:00Z',
      app_metadata: { role: 'user' },
      user_metadata: {},
    } as User : null,
    session: null, role: 'user', loading: false,
    signUp: vi.fn(), signIn: vi.fn(), signOut: vi.fn(),
  });
}
function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<I18nextProvider i18n={i18n}>
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/courses/ifes-cariacica-administracao-integrado-2026?materialsUnit=matematica#course-materials']}>
        <IfesStudyProgressPanel
          courseSlug="ifes-cariacica-administracao-integrado-2026" units={units}
        />
      </MemoryRouter>
    </QueryClientProvider>
  </I18nextProvider>);
}
beforeEach(() => {
  mocks.read.mockReset();
  mocks.write.mockReset();
  mocks.read.mockResolvedValue([{
    module_slug: slug,
    unit_slug: units[0].unit_slug,
    school_year: 1,
    status: null,
    completed_at: null,
  }]);
  mocks.write.mockResolvedValue({ data: [{ module_id: 'test-completion' }], error: null });
  setAuth(false);
  void i18n.changeLanguage('pt');
});

describe('Ifes optional private progress', () => {
  it('lets anonymous learners browse guides without querying private progress', () => {
    setup();
    expect(screen.getByText('Estatística — 1º ano')).toBeInTheDocument();
    const signIn = screen.getByRole('link', { name: /Entrar e guardar progresso/i });
    expect(signIn).toHaveAttribute('href',
      `/login?next=${encodeURIComponent('/courses/ifes-cariacica-administracao-integrado-2026?materialsUnit=matematica#course-materials')}`);
    expect(mocks.read).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: /Assinalar como concluído/i })).not.toBeInTheDocument();
  });

  it('loads study status only for an authenticated learner', async () => {
    setAuth(true);
    setup();
    expect(await screen.findByRole('button', { name: 'Assinalar como concluído' })).toBeInTheDocument();
    expect(mocks.read).toHaveBeenCalledWith(
      'get_my_course_study_modules_v1',
      { p_course_code: 'IFES-CAR-ADM-INT-2026' },
      expect.anything(),
    );
    expect(screen.getByText(/0 de 1 guias concluídos/i)).toBeInTheDocument();
    expect(screen.getByText(/não é uma nota, avaliação nem certificação oficial/i)).toBeInTheDocument();
  });

  it('records completion through the authenticated RPC rather than client-side storage', async () => {
    setAuth(true);
    setup();
    await userEvent.setup().click(await screen.findByRole('button', { name: 'Assinalar como concluído' }));
    await waitFor(() => expect(mocks.write).toHaveBeenCalledWith(
      'set_my_study_module_completion_v1',
      { p_module_slug: slug, p_completed: true },
    ));
  });

  it('allows a student to reopen a previously completed guide', async () => {
    setAuth(true);
    mocks.read.mockResolvedValue([{
      module_slug: slug, unit_slug: units[0].unit_slug, school_year: 1,
      status: 'completed', completed_at: '2026-11-15T12:00:00Z',
    }]);
    setup();
    const button = await screen.findByRole('button', { name: 'Voltar a estudar' });
    expect(button).toHaveAttribute('aria-pressed', 'true');
    await userEvent.setup().click(button);
    await waitFor(() => expect(mocks.write).toHaveBeenCalledWith(
      'set_my_study_module_completion_v1',
      { p_module_slug: slug, p_completed: false },
    ));
  });
});
