import { beforeEach, describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/shared/test/renderWithProviders';
import i18n from '@/i18n/config';
import { UnitLearningHighlights } from './UnitLearningHighlights';

beforeEach(async () => { await i18n.changeLanguage('pt'); });

describe('UnitLearningHighlights', () => {
  it('links to real video and reading pages without copying their content', () => {
    renderWithProviders(
      <UnitLearningHighlights
        courseSlug="bioquimica" unitSlug="biologia-celular"
        highlights={[
          { kind: 'video', title: 'Introdução à biologia', href: '/courses/bioquimica/units/biologia-celular?v=video-1#unit-resources' },
          { kind: 'reading', title: 'OpenStax Biology 2e', href: '/resources/openstax-biology' },
        ]}
      />,
    );
    expect(screen.getByRole('heading', { name: 'Começa por aqui' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Introdução à biologia/i })).toHaveAttribute(
      'href', '/courses/bioquimica/units/biologia-celular?v=video-1#unit-resources');
    expect(screen.getByRole('link', { name: /OpenStax Biology 2e/i })).toHaveAttribute('href', '/resources/openstax-biology');
    expect(screen.getByRole('link', { name: /Ver todos os materiais/i })).toHaveAttribute(
      'href', '/courses/bioquimica?materialsUnit=biologia-celular#course-materials');
  });

  it('makes editorial and external playlists visually distinct', () => {
    renderWithProviders(
      <UnitLearningHighlights
        courseSlug="marketing" unitSlug="marketing-digital"
        highlights={[
          { kind: 'sequence', title: 'Sequência validada', href: '/sequences/validada', count: 4 },
          { kind: 'playlist', title: 'Playlist de terceiros', href: '/resources/externa' },
        ]}
      />,
    );
    expect(screen.getByText('Sequência FACODI')).toBeInTheDocument();
    expect(screen.getByText('Playlist externa')).toBeInTheDocument();
    expect(screen.getByText('4 aulas')).toBeInTheDocument();
  });

  it('does not claim absence of materials before requests finish', () => {
    const { rerender } = renderWithProviders(
      <UnitLearningHighlights courseSlug="economia" unitSlug="estatistica" highlights={[]} loading />,
    );
    expect(screen.getByRole('status')).toHaveTextContent('A carregar');
    expect(screen.queryByText(/Ainda não há materiais/i)).not.toBeInTheDocument();
    // The standalone fallback is tested independently to avoid recreating providers.
    expect(rerender).toBeTypeOf('function');
  });

  it('offers course-wide discovery when this UC has no links', () => {
    renderWithProviders(
      <UnitLearningHighlights courseSlug="economia" unitSlug="estatistica" highlights={[]} />,
    );
    expect(screen.getByText(/Ainda não há materiais/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Ver todos os materiais/i })).toHaveAttribute(
      'href', '/courses/economia?materialsUnit=estatistica#course-materials');
  });
});

describe('highlight provenance', () => {
  it('renders the actual original domain as neutral text, not a verification badge', () => {
    renderWithProviders(
      <UnitLearningHighlights courseSlug="bioquimica" unitSlug="calculo-1"
        highlights={[{ kind: 'reading', title: 'OpenStax Calculus', href: '/resources/calculus', sourceHost: 'openstax.org' }]} />,
    );
    expect(screen.getByText('Fonte: openstax.org')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /OpenStax Calculus/i })).toHaveAttribute('href', '/resources/calculus');
    expect(screen.queryByText(/verificado por/i)).not.toBeInTheDocument();
  });
});

describe('educational metadata labels', () => {
  it('displays actual catalogue values without official-level or freshness claims', () => {
    renderWithProviders(
      <UnitLearningHighlights courseSlug="neurociencias-cognitivas-neuropsicologia" unitSlug="neurobiologia"
        highlights={[{
          kind: 'playlist', title: 'Neurobiologia celular', href: '/resources/neuro',
          sourceHost: 'youtube.com', language: 'pt-BR', level: 'intermediate',
          publicationYear: 2024, learningGoal: 'Explicar potencial de ação e libertação de neurotransmissores',
        }]} />,
    );
    expect(screen.getByText('Idioma catalogado: Português (Brasil)')).toBeInTheDocument();
    expect(screen.getByText('Nível editorial: Intermédio')).toBeInTheDocument();
    expect(screen.getByText('Publicado em 2024')).toBeInTheDocument();
    expect(screen.getByText('Objetivo sugerido: Explicar potencial de ação e libertação de neurotransmissores')).toBeInTheDocument();
  });

  it('omits missing fields entirely when no verified metadata exists', () => {
    renderWithProviders(
      <UnitLearningHighlights courseSlug="marketing" unitSlug="marketing"
        highlights={[{ kind: 'reading', title: 'Fonte sem data', href: '/resources/sem-data' }]} />,
    );
    expect(screen.queryByText(/Idioma catalogado:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Nível editorial:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Publicado em/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Objetivo sugerido:/)).not.toBeInTheDocument();
  });
});
