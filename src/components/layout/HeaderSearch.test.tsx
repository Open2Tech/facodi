import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n/config';
import { HeaderSearch } from './HeaderSearch';

function Where() {
  const location = useLocation();
  return <p data-testid="where">{location.pathname + location.search}</p>;
}

describe('HeaderSearch', () => {
  it('sends the term to the library search and clears the field', async () => {
    await i18n.changeLanguage('pt');
    const done = vi.fn();
    render(<I18nextProvider i18n={i18n}><MemoryRouter initialEntries={['/courses']}>
      <HeaderSearch onSubmitted={done} />
      <Routes><Route path="*" element={<Where />} /></Routes>
    </MemoryRouter></I18nextProvider>);
    const field = screen.getByRole('searchbox', { name: 'Pesquisar na biblioteca' });
    await userEvent.type(field, '  derivadas parciais {Enter}');
    expect(screen.getByTestId('where')).toHaveTextContent('/resources?search=derivadas%20parciais');
    expect(field).toHaveValue('');
    expect(done).toHaveBeenCalledOnce();
  });
});
