import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import i18n from '@/i18n/config';
import { renderWithProviders } from '@/shared/test/renderWithProviders';
import { LegalDocument } from './LegalDocument';

describe('LegalDocument', () => {
  it("renders FACODI responsibility separately from public UAlg institutional identifiers", () => {
    renderWithProviders(<LegalDocument id="legal" />, { route: '/legal' });

    expect(screen.getByRole('heading', { level: 1, name: i18n.t('legal.legal.title') })).toBeInTheDocument();
    expect(screen.queryByText(i18n.t('legal.common.pending'))).not.toBeInTheDocument();
    expect(screen.getByText(/505 387 271/)).toBeInTheDocument();
    expect(screen.getByText(/Campus da Penha/)).toBeInTheDocument();
    expect(screen.getAllByRole('link').some(link => link.getAttribute('href') === 'https://www.ualg.pt/')).toBe(true);
    const related = screen.getByRole('navigation', { name: i18n.t('legal.common.related') });
    expect(within(related).getByText(i18n.t('legal.nav.legal'))).toHaveAttribute('aria-current', 'page');
    expect(within(related).getAllByRole('link')).toHaveLength(5);
    const firstSection = i18n.t('legal.legal.sections.0.title');
    expect(screen.getAllByRole('link', { name: new RegExp(firstSection) })[0]).toHaveAttribute('href', '#identity');
  });
});
