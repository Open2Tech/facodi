import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '@/shared/test/renderWithProviders';
import { LegalRichText } from './LegalRichText';

describe('LegalRichText', () => {
  it('renders internal, mailto and external links with the right behaviour', () => {
    renderWithProviders(<p><LegalRichText text="See [privacy](/privacy#rights), write to [us](mailto:hello@open2.tech) or read [CNPD](https://www.cnpd.pt)." /></p>);

    expect(screen.getByRole('link', { name: 'privacy' })).toHaveAttribute('href', '/privacy#rights');
    const mail = screen.getByRole('link', { name: 'us' });
    expect(mail).toHaveAttribute('href', 'mailto:hello@open2.tech');
    expect(mail).not.toHaveAttribute('target');
    const external = screen.getByRole('link', { name: 'CNPD' });
    expect(external).toHaveAttribute('target', '_blank');
    expect(external).toHaveAttribute('rel', 'noopener noreferrer');
    expect(screen.getByText(/write to/)).toHaveTextContent('See privacy, write to us or read CNPD.');
  });

  it('leaves plain text untouched', () => {
    renderWithProviders(<p>{'x'}<LegalRichText text="No links [here] (at all)." /></p>);
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.getByText(/No links/)).toHaveTextContent('xNo links [here] (at all).');
  });
});
