import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { renderWithProviders } from '@/shared/test/renderWithProviders';
import i18n from '@/i18n/config';

const auth = vi.hoisted(() => ({ user: null as { id: string } | null, role: 'user', loading: false, signOut: vi.fn() }));
vi.mock('@/features/auth/useAuth', () => ({ useAuth: () => auth }));

beforeEach(async () => {
  auth.user = null;
  auth.role = 'user';
  auth.signOut.mockReset().mockResolvedValue(undefined);
  await i18n.changeLanguage('en');
});

describe('SiteHeader', () => {
  it.each(['user', 'editor', 'admin'])('keeps %s account actions labelled and respects editorial permissions', async role => {
    auth.user = { id: 'learner' };
    auth.role = role;
    renderWithProviders(<SiteHeader />);
    await userEvent.click(screen.getByRole('button', { name: 'Account' }));
    const menu = screen.getByRole('menu');
    for (const title of ['My space', 'Notebook', 'Profile', 'Suggest a resource', 'Contribute', 'Sign out']) {
      expect(within(menu).getByRole('menuitem', { name: title })).toBeVisible();
    }
    expect(within(menu).queryByRole('menuitem', { name: 'Editorial workspace' }) !== null).toBe(role !== 'user');
    expect(within(menu).queryByRole('menuitem', { name: 'Administration' }) !== null).toBe(role === 'admin');
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.getByRole('button', { name: 'Account' })).toHaveFocus());
  });

  it('lets visitors sign in and dismisses the mobile menu even when selecting the current route', async () => {
    renderWithProviders(<SiteHeader />, { route: '/about' });
    expect(screen.getByRole('link', { name: 'Sign in' })).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Account' })).not.toBeInTheDocument();
    const trigger = screen.getByRole('button', { name: 'Open menu' });
    await userEvent.click(trigger);
    const panel = screen.getByRole('dialog', { name: 'Main navigation' });
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(within(panel).getByRole('searchbox', { name: 'Search the library' })).toBeVisible();
    await userEvent.click(within(panel).getByRole('link', { name: 'About' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('closes search with Escape and restores focus to its trigger', async () => {
    renderWithProviders(<SiteHeader />);
    const trigger = screen.getByRole('button', { name: 'Search the library' });
    await userEvent.click(trigger);
    expect(screen.getByRole('searchbox', { name: 'Search the library' })).toHaveFocus();
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('signs out from the account menu', async () => {
    auth.user = { id: 'learner' };
    renderWithProviders(<SiteHeader />);
    await userEvent.click(screen.getByRole('button', { name: 'Account' }));
    await userEvent.click(screen.getByRole('menuitem', { name: 'Sign out' }));
    expect(auth.signOut).toHaveBeenCalledOnce();
  });
});
