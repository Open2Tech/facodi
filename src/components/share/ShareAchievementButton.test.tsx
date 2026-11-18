import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import { toast } from 'sonner';
import i18n from '@/i18n/config';
import { createAchievementImage } from '@/features/share/achievementCard';
import { ShareAchievementButton } from './ShareAchievementButton';

vi.mock('@/features/share/achievementCard', () => ({ createAchievementImage: vi.fn() }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const renderButton = () => render(<I18nextProvider i18n={i18n}>
  <ShareAchievementButton title="Cálculo — derivadas" path="/sequences/calculo" lessons={7} />
</I18nextProvider>);

describe('ShareAchievementButton', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('shares the story image on devices that accept files, with the sequence link', async () => {
    await i18n.changeLanguage('pt');
    vi.mocked(createAchievementImage).mockResolvedValue(new Blob(['png'], { type: 'image/png' }));
    const share = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { ...navigator, canShare: () => true, share });
    renderButton();
    await userEvent.click(screen.getByRole('button', { name: 'Partilhar conquista' }));
    expect(createAchievementImage).toHaveBeenCalledWith({ eyebrow: 'Sequência concluída', title: 'Cálculo — derivadas', detail: '7 aulas', site: 'facodi.com' });
    expect(share).toHaveBeenCalledWith(expect.objectContaining({ url: 'https://facodi.com/sequences/calculo', text: 'Concluí «Cálculo — derivadas» na FACODI.' }));
  });

  it('saves the image where sharing files is not available', async () => {
    vi.mocked(createAchievementImage).mockResolvedValue(new Blob(['png'], { type: 'image/png' }));
    vi.stubGlobal('URL', Object.assign(URL, { createObjectURL: vi.fn(() => 'blob:x'), revokeObjectURL: vi.fn() }));
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    renderButton();
    await userEvent.click(screen.getByRole('button', { name: 'Partilhar conquista' }));
    expect(click).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith('Imagem guardada. Já a podes partilhar.');
  });
});
