import { beforeEach, describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/shared/test/renderWithProviders';
import i18n from '@/i18n/config';
import { CourseUnitQuickFinder } from './CourseUnitQuickFinder';

const units = Array.from({ length: 13 }, (_, i) => ({
  id: `unit-${i}`,
  slug: `unidade-${i}`,
  title: i === 3 ? 'Cálculo Avançado' : `Unidade Curricular ${i}`,
  code: i === 3 ? '1432100' : `19320${i}`,
  year: Math.floor(i / 5) + 1,
  semester: 1,
  position: i,
}));
const coverage = [
  { curricular_unit_id: 'unit-3', video_count: 2, reading_count: 1 },
  { curricular_unit_id: 'unit-1', video_count: 0, reading_count: 4 },
];
beforeEach(async () => {
  await i18n.changeLanguage('pt');
});

describe('CourseUnitQuickFinder', () => {
  it('finds a UC by accent-insensitive title or exact code and deep-links to its materials', async () => {
    renderWithProviders(<CourseUnitQuickFinder courseSlug="marketing" units={units} coverage={coverage} />);
    const input = screen.getByRole('searchbox', { name: 'Nome ou código da UC' });
    await userEvent.setup().type(input, 'calculo');
    expect(screen.getByRole('link', { name: 'Cálculo Avançado' }))
      .toHaveAttribute('href', '/courses/marketing/units/unidade-3');
    expect(screen.getByRole('link', { name: 'Ver materiais' }))
      .toHaveAttribute('href', '/courses/marketing?materialsUnit=unidade-3#course-materials');
    expect(screen.getByRole('status')).toHaveTextContent('1 UCs encontradas');
    await userEvent.setup().clear(input);
    await userEvent.setup().type(input, '1432100');
    expect(screen.getByRole('link', { name: 'Cálculo Avançado' })).toBeInTheDocument();
  });

  it('filters UCs with published video or reading coverage', async () => {
    renderWithProviders(<CourseUnitQuickFinder courseSlug="marketing" units={units} coverage={coverage} />);
    await userEvent.setup().click(screen.getByRole('checkbox', { name: 'Só UCs com materiais' }));
    expect(screen.getByRole('status')).toHaveTextContent('2 UCs encontradas');
    expect(screen.getByRole('link', { name: 'Cálculo Avançado' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Unidade Curricular 5' })).not.toBeInTheDocument();
  });

  it('returns keyboard focus to the search field after clearing', async () => {
    renderWithProviders(<CourseUnitQuickFinder courseSlug="marketing" units={units} coverage={coverage} />);
    const input = screen.getByRole('searchbox', { name: 'Nome ou código da UC' });
    await userEvent.setup().type(input, '1432100');
    await userEvent.setup().click(screen.getByRole('button', { name: 'Limpar pesquisa' }));
    expect(input).toHaveValue('');
    expect(input).toHaveFocus();
  });

  it('keeps the page compact for short curricula', () => {
    renderWithProviders(<CourseUnitQuickFinder courseSlug="astronomia" units={units.slice(0, 10)} coverage={[]} />);
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
  });
});

describe('coverage loading and playlist-only UCs', () => {
  it('includes playlist-only disciplines when filtering to units with study materials', async () => {
    const additional = [
      { curricular_unit_id: 'unit-5', video_count: 0, reading_count: 0, playlist_count: 3, guide_count: 0 },
    ];
    renderWithProviders(<CourseUnitQuickFinder courseSlug="marketing" units={units} coverage={[...coverage, ...additional]} />);
    await userEvent.setup().click(screen.getByRole('checkbox', { name: 'Só UCs com materiais' }));
    expect(screen.getByRole('status')).toHaveTextContent('3 UCs encontradas');
    expect(screen.getByRole('link', { name: 'Unidade Curricular 5' })).toBeInTheDocument();
    expect(screen.getByText(/3 playlists/)).toBeInTheDocument();
  });

  it('disables material-only filtering while counts are loading or unavailable but keeps search working', async () => {
    renderWithProviders(<CourseUnitQuickFinder courseSlug="marketing" units={units} coverage={[]} coverageLoading />);
    expect(screen.getByRole('checkbox', { name: 'Só UCs com materiais' })).toBeDisabled();
    expect(screen.getByText(/A carregar a disponibilidade dos materiais/)).toBeInTheDocument();
    await userEvent.setup().type(screen.getByRole('searchbox', { name: 'Nome ou código da UC' }), 'calculo');
    expect(screen.getByRole('link', { name: 'Cálculo Avançado' })).toBeInTheDocument();
  });
});
