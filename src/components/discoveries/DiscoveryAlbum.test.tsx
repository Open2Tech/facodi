import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it } from 'vitest';
import { CampusDiscovery } from '@/components/discoveries/CampusDiscovery';
import { discoveryLinks } from '@/features/discoveries/catalog';
import { DiscoveryAlbum } from '@/components/discoveries/DiscoveryAlbum';
import i18n from '@/i18n/config';
import { renderWithProviders } from '@/shared/test/renderWithProviders';

it('records a keyboard discovery once and restores the album after remounting', async () => {
  await i18n.changeLanguage('pt');
  localStorage.clear();
  const user = userEvent.setup();
  const view = renderWithProviders(<><CampusDiscovery discovery="compass" /><DiscoveryAlbum /></>);
  await user.tab();
  await user.keyboard('{Enter}');
  expect(screen.getByText(/Perdeste o norte/)).toBeVisible();
  expect(screen.getByText(`1 de ${discoveryLinks.length} descobertas`)).toBeVisible();

  await user.keyboard('{Enter}{Enter}');
  expect(screen.getByText(`1 de ${discoveryLinks.length} descobertas`)).toBeVisible();
  view.unmount();

  renderWithProviders(<DiscoveryAlbum />);
  expect(screen.getByText(`1 de ${discoveryLinks.length} descobertas`)).toBeVisible();
  await user.click(screen.getByText('Álbum de descobertas'));
  expect(screen.getByRole('link', { name: /bússola.*Descoberta registada/ })).toHaveAttribute('href', '/#discovery-compass');
  expect(screen.getByRole('link', { name: 'Próxima pista' })).toHaveAttribute('href', '/sequences#discovery-chain');
  await user.click(screen.getByRole('checkbox', { name: 'Só por descobrir' }));
  expect(screen.queryByRole('link', { name: /bússola.*Descoberta registada/ })).not.toBeInTheDocument();
  localStorage.clear();
});
