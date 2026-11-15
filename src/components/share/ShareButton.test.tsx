import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/shared/test/renderWithProviders';
import i18n from '@/i18n/config';
import { ShareButton } from './ShareButton';

const toastMock = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));

vi.mock('sonner', () => ({ toast: toastMock }));

const originalShare = Object.getOwnPropertyDescriptor(navigator, 'share');
const originalClipboard = Object.getOwnPropertyDescriptor(navigator, 'clipboard');

function stubShare(share: ((data: ShareData) => Promise<void>) | undefined) {
  Object.defineProperty(navigator, 'share', { configurable: true, value: share });
}

function stubClipboard(writeText: (text: string) => Promise<void>) {
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
}

function restoreNavigatorProperty(name: 'share' | 'clipboard', descriptor: PropertyDescriptor | undefined) {
  if (descriptor) Object.defineProperty(navigator, name, descriptor);
  else Reflect.deleteProperty(navigator, name);
}

describe('ShareButton', () => {
  beforeEach(() => vi.clearAllMocks());

  afterEach(() => {
    restoreNavigatorProperty('share', originalShare);
    restoreNavigatorProperty('clipboard', originalClipboard);
  });

  it('uses native sharing with a canonical URL and retains the selected sequence item', async () => {
    const user = userEvent.setup();
    const share = vi.fn().mockResolvedValue(undefined);
    const writeText = vi.fn().mockResolvedValue(undefined);
    stubShare(share);
    stubClipboard(writeText);
    renderWithProviders(<ShareButton title="Study sequence" />, {
      route: '/sequences/trail?v=video-1&notes=open&utm_source=tracking#lesson',
    });

    await user.click(screen.getByRole('button', { name: i18n.t('common.share') }));

    await waitFor(() => expect(share).toHaveBeenCalledWith({
      title: 'Study sequence',
      url: 'https://facodi.com/sequences/trail?v=video-1#lesson',
    }));
    expect(writeText).not.toHaveBeenCalled();
  });

  it('copies the canonical deep link when native sharing is unavailable', async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    stubShare(undefined);
    stubClipboard(writeText);
    renderWithProviders(<ShareButton title="Video lesson" />, {
      route: '/resources/lesson?t=35&notes=open&utm_source=tracking#player',
    });

    await user.click(screen.getByRole('button', { name: i18n.t('common.share') }));

    await waitFor(() => expect(writeText).toHaveBeenCalledWith(
      'https://facodi.com/resources/lesson?t=35#player',
    ));
    expect(toastMock.success).toHaveBeenCalledWith(i18n.t('common.linkCopied'));
  });

  it('does not copy or report an error when the visitor cancels native sharing', async () => {
    const user = userEvent.setup();
    const share = vi.fn().mockRejectedValue(Object.assign(new Error('Dismissed'), { name: 'AbortError' }));
    const writeText = vi.fn().mockResolvedValue(undefined);
    stubShare(share);
    stubClipboard(writeText);
    renderWithProviders(<ShareButton title="Course" />, { route: '/courses/example' });

    await user.click(screen.getByRole('button', { name: i18n.t('common.share') }));

    await waitFor(() => expect(share).toHaveBeenCalled());
    expect(writeText).not.toHaveBeenCalled();
    expect(toastMock.error).not.toHaveBeenCalled();
  });

  it('reports a clipboard failure instead of silently ignoring it', async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockRejectedValue(new Error('Clipboard unavailable'));
    stubShare(undefined);
    stubClipboard(writeText);
    renderWithProviders(<ShareButton title="Course" />, { route: '/courses/example' });

    await user.click(screen.getByRole('button', { name: i18n.t('common.share') }));

    await waitFor(() => expect(toastMock.error).toHaveBeenCalledWith(i18n.t('common.copyFailed')));
  });

  it('reports a native sharing failure without silently switching to copy', async () => {
    const user = userEvent.setup();
    const share = vi.fn().mockRejectedValue(new Error('Share unavailable'));
    const writeText = vi.fn().mockResolvedValue(undefined);
    stubShare(share);
    stubClipboard(writeText);
    renderWithProviders(<ShareButton title="Course" />, { route: '/courses/example' });

    await user.click(screen.getByRole('button', { name: i18n.t('common.share') }));

    await waitFor(() => expect(toastMock.error).toHaveBeenCalledWith(i18n.t('common.shareFailed')));
    expect(writeText).not.toHaveBeenCalled();
  });
});
