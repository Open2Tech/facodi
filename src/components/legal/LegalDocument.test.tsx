import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import i18n from '@/i18n/config';
import { renderWithProviders } from '@/shared/test/renderWithProviders';
import { LegalDocument } from './LegalDocument';

describe('LegalDocument', () => {
  it('renders the document, its section index and pending institutional data', () => {
    renderWithProviders(<LegalDocument id="legal" />, { route: '/legal' });

    expect(screen.getByRole('heading', { level: 1, name: i18n.t('legal.legal.title') })).toBeInTheDocument();
    expect(screen.getAllByText(i18n.t('legal.common.pending')).length).toBe(4);
    const related = screen.getByRole('navigation', { name: i18n.t('legal.common.related') });
    expect(within(related).getByText(i18n.t('legal.nav.legal'))).toHaveAttribute('aria-current', 'page');
    expect(within(related).getAllByRole('link')).toHaveLength(5);
    const firstSection = i18n.t('legal.legal.sections.0.title');
    expect(screen.getAllByRole('link', { name: new RegExp(firstSection) })[0]).toHaveAttribute('href', '#identity');
  });
});
