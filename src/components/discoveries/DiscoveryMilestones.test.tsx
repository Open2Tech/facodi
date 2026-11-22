import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it, vi } from 'vitest';
import { toast } from 'sonner';
import { CampusDiscovery } from '@/components/discoveries/CampusDiscovery';
import { DiscoveryAlbum } from '@/components/discoveries/DiscoveryAlbum';
import { discoveryLinks } from '@/features/discoveries/catalog';
import { renderWithProviders } from '@/shared/test/renderWithProviders';
import i18n from '@/i18n/config';

beforeEach(async () => {
  await i18n.changeLanguage('pt');
  localStorage.clear();
  vi.restoreAllMocks();
});

it.each([
  [1, 'Primeira faísca'],
  [5, 'Olhar curioso'],
  [15, 'Explorador do campus'],
  [25, 'Coleção completa'],
])('unlocks the stamp at %i discoveries and rewards it once', async (target, label) => {
  const previous = discoveryLinks.filter(item => item.id !== 'compass').slice(0, target - 1).map(item => item.id);
  localStorage.setItem('facodi.discoveries.v1', JSON.stringify(previous));
  const reward = vi.spyOn(toast, 'success').mockReturnValue('test-reward');
  const user = userEvent.setup();
  renderWithProviders(<><CampusDiscovery discovery="compass" /><DiscoveryAlbum /></>);

  await user.click(screen.getByText('Álbum de descobertas'));
  const stamp = screen.getByText(label).closest('li');
  expect(stamp).toHaveTextContent('Por conquistar');
  const compass = screen.getByRole('button', { name: 'A bússola da página inicial' });
  await user.click(compass);
  expect(stamp).toHaveTextContent('Conquistado');
  expect(reward).toHaveBeenCalledWith('Selo conquistado!', expect.objectContaining({ description: label }));
  await user.click(compass);
  await user.click(compass);
  expect(reward).toHaveBeenCalledTimes(1);
});

it('keeps the full collection available when the final pending clue is found', async () => {
  const previous = discoveryLinks.filter(item => item.id !== 'compass').map(item => item.id);
  localStorage.setItem('facodi.discoveries.v1', JSON.stringify(previous));
  renderWithProviders(<><CampusDiscovery discovery="compass" /><DiscoveryAlbum /></>);
  const user = userEvent.setup();
  await user.click(screen.getByText('Álbum de descobertas'));
  await user.click(screen.getByRole('checkbox', { name: 'Só por descobrir' }));
  expect(screen.getAllByRole('link')).toHaveLength(2);
  await user.click(screen.getByRole('button', { name: 'A bússola da página inicial' }));
  expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  expect(screen.getAllByRole('link')).toHaveLength(25);
  expect(screen.getByText('Escolhe uma descoberta abaixo para voltar a experimentar.')).toBeVisible();
});
