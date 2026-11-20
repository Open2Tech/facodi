import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n/config';
import { HomeHero, type HomeHeroCounts } from './HomeHero';

function LocationProbe() {
  const location = useLocation();
  return <p data-testid="where">{location.pathname + location.search}</p>;
}

function renderHero(counts?: HomeHeroCounts) {
  return render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter initialEntries={['/']}>
        <HomeHero counts={counts} />
        <Routes>
          <Route path="*" element={<LocationProbe />} />
        </Routes>
      </MemoryRouter>
    </I18nextProvider>,
  );
}

describe('HomeHero', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en');
  });

  it('renders core CTAs, campus feature links, and graceful empty/live counts', () => {
    const { rerender } = renderHero();

    expect(screen.getByRole('heading', { level: 1, name: 'Knowledge is everywhere. Find your next step.' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Explore courses' })).toHaveAttribute('href', '/courses');
    expect(screen.getByRole('link', { name: 'Suggest a resource' })).toHaveAttribute('href', '/suggest');
    expect(screen.getByRole('link', { name: 'How it works' })).toHaveAttribute('href', '/how-it-works');
    expect(screen.getByRole('link', { name: /Guided sequences/i })).toHaveAttribute('href', '/sequences');
    expect(screen.getByRole('link', { name: /Study notebook/i })).toHaveAttribute('href', '/notes');
    expect(screen.getByRole('link', { name: /Submit a playlist/i })).toHaveAttribute('href', '/playlists/submit');
    expect(screen.getByText('A question. A resource. A connection that makes sense.')).toBeInTheDocument();

    rerender(
      <I18nextProvider i18n={i18n}>
        <MemoryRouter initialEntries={['/']}>
          <HomeHero counts={{ courses: 22, units: 777, resources: 3268, videos: 1132 }} />
          <Routes>
            <Route path="*" element={<LocationProbe />} />
          </Routes>
        </MemoryRouter>
      </I18nextProvider>,
    );

    expect(screen.getByText(/3,268 published resources across 22 open courses/)).toBeInTheDocument();
  });

  it('routes library search submissions and quick-prompt chips to /resources', async () => {
    const user = userEvent.setup();
    renderHero();

    await user.click(screen.getByRole('button', { name: 'Linear algebra' }));
    expect(screen.getByTestId('where')).toHaveTextContent('/resources?search=Linear%20algebra');

    const field = screen.getByRole('searchbox', { name: 'What do you want to understand next?' });
    await user.type(field, '  logic  ');
    await user.click(screen.getByRole('button', { name: 'Search the catalogue' }));
    expect(screen.getByTestId('where')).toHaveTextContent('/resources?search=logic');
  });

  it('supports switching to the suggest notebook tab, live URL recognition, validation, and /suggest?url= routing', async () => {
    const user = userEvent.setup();
    renderHero();

    await user.click(screen.getByRole('button', { name: 'Suggest an open link' }));
    const urlInput = screen.getByLabelText('Know an open lesson, book or paper?');
    expect(urlInput).toHaveFocus();

    await user.type(urlInput, 'not-a-valid-url');
    await user.click(screen.getByRole('button', { name: 'Analyse resource on the suggestion page' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Enter a valid HTTP or HTTPS address.');
    expect(screen.getByTestId('where')).toHaveTextContent('/');

    await user.clear(urlInput);
    await user.type(urlInput, 'https://www.youtube.com/watch?v=kjBOesZCoqc');
    expect(screen.getByRole('status')).toHaveTextContent('Source recognised: YouTube — ready for curricular matching');

    await user.click(screen.getByRole('button', { name: 'Analyse resource on the suggestion page' }));
    expect(screen.getByTestId('where')).toHaveTextContent('/suggest?url=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3DkjBOesZCoqc');
  });

  it('supports keyboard navigation between notebook tabs', async () => {
    const user = userEvent.setup();
    renderHero();

    const exploreTab = screen.getByRole('tab', { name: 'Field notebook' });
    exploreTab.focus();
    await user.keyboard('{ArrowRight}');

    const suggestTab = screen.getByRole('tab', { name: 'Suggest a resource' });
    expect(suggestTab).toHaveFocus();
    expect(suggestTab).toHaveAttribute('aria-selected', 'true');
  });
});
