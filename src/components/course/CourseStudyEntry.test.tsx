import { beforeEach, describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/shared/test/renderWithProviders';
import i18n from '@/i18n/config';
import { CourseStudyEntry } from './CourseStudyEntry';

const units = [
  { id: 'first', slug: 'first', title: 'Matemática I', code: 'C01', year: 1, semester: 1, position: 1 },
  { id: 'next', slug: 'next', title: 'Matemática II', code: 'C02', year: 1, semester: 2, position: 1 },
];

beforeEach(async () => { await i18n.changeLanguage('pt'); });

describe('CourseStudyEntry resource coverage', () => {
  it('shows confirmed playlists even when there are no standalone videos or readings', () => {
    renderWithProviders(<CourseStudyEntry courseSlug="matematica" units={units}
      coverage={[{ curricular_unit_id: 'next', video_count: 0, reading_count: 0, playlist_count: 2, guide_count: 0 }]} />);
    expect(screen.getByText('1 UCs com playlists')).toBeInTheDocument();
    expect(screen.getByText('Playlists: 2')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Matemática II/i })).toHaveAttribute('href', '/courses/matematica/units/next');
  });

  it('does not falsely announce an empty course while loading coverage', () => {
    renderWithProviders(<CourseStudyEntry courseSlug="matematica" units={units} coverage={[]} loading />);
    expect(screen.getByText(/A consultar os materiais disponíveis/i)).toBeInTheDocument();
    expect(screen.queryByText(/indicadores de materiais ainda não estão disponíveis/i)).not.toBeInTheDocument();
  });

  it('shows an honest fallback if the coverage request fails', () => {
    renderWithProviders(<CourseStudyEntry courseSlug="matematica" units={units} coverage={[]} hasError />);
    expect(screen.getByText(/Não foi possível confirmar a cobertura/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Matemática I/i })).toBeInTheDocument();
  });
});
