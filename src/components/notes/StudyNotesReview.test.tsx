import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/shared/test/renderWithProviders';
import i18n from '@/i18n/config';
import { createNote } from '@/entities/notes/notes';
import { StudyNotesReview } from './StudyNotesReview';

const useNotebook = vi.hoisted(() => vi.fn());
vi.mock('@/features/notes/useNotebook', () => ({ useNotebook }));

const note = createNote({ id: 'video-1', slug: 'derivadas', title: 'Derivadas', type: 'video' }, {
  title: 'Regra da cadeia', body: 'Derivar uma função composta.', tags: ['exame'], timestamp: 74,
}, new Date('2026-11-22T00:00:00Z'));

beforeEach(async () => {
  await i18n.changeLanguage('pt');
  useNotebook.mockReset();
  useNotebook.mockReturnValue({ ready: true, failed: false, all: [note], retry: vi.fn() });
});

describe('StudyNotesReview', () => {
  it('shows original note and returns to its exact video moment', () => {
    renderWithProviders(<StudyNotesReview kind="unit" resources={[
      { id: 'uc-1', title: 'Cálculo I', path: '/courses/bioquimica/units/calculo-1', scope: 'unit' },
      { id: 'video-1', title: 'Derivadas', path: '/resources/derivadas', scope: 'open', timed: true },
    ]} />);
    expect(screen.getByRole('heading', { name: 'Rever as notas desta UC' })).toBeInTheDocument();
    expect(screen.getByText('Regra da cadeia')).toBeInTheDocument();
    expect(screen.getByText('01:14')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Abrir «Regra da cadeia» no contexto de estudo' }))
      .toHaveAttribute('href', '/resources/derivadas?notes=open&t=74');
  });

  it('opens the same note from a sequence without writing a second copy', () => {
    renderWithProviders(<StudyNotesReview kind="sequence" resources={[
      { id: 'video-1', title: 'Derivadas', path: '/sequences/calculo?v=video-1', scope: 'open', timed: true },
    ]} />);
    expect(screen.getByRole('link', { name: /Abrir «Regra da cadeia»/ }))
      .toHaveAttribute('href', '/sequences/calculo?v=video-1&notes=open&t=74');
    expect(useNotebook).toHaveBeenCalled();
  });

  it('shows a contextual first-note action instead of inventing study notes', () => {
    useNotebook.mockReturnValue({ ready: true, failed: false, all: [], retry: vi.fn() });
    renderWithProviders(<StudyNotesReview kind="unit" resources={[
      { id: 'uc-1', title: 'Cálculo I', path: '/courses/bioquimica/units/calculo-1', scope: 'unit' },
    ]} />);
    expect(screen.getByText(/Ainda não tens notas/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Criar uma anotação' }))
      .toHaveAttribute('href', '/courses/bioquimica/units/calculo-1?notes=unit');
  });

  it('does not show an empty notebook before loading, and exposes retry on failure', () => {
    useNotebook.mockReturnValue({ ready: false, failed: false, all: [], retry: vi.fn() });
    const { unmount } = renderWithProviders(<StudyNotesReview kind="course" resources={[]} />);
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByText(/Ainda não tens notas/i)).not.toBeInTheDocument();
    unmount();
    useNotebook.mockReturnValue({ ready: false, failed: true, all: [], retry: vi.fn() });
    renderWithProviders(<StudyNotesReview kind="course" resources={[]} />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /tentar/i })).toBeInTheDocument();
  });
});
