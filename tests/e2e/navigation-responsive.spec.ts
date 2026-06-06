import { expect, test, type Page } from '@playwright/test';

const viewports = [
  { width: 360, height: 800 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1024, height: 768 },
  { width: 1280, height: 800 },
  { width: 1440, height: 900 },
];

async function dismissDevelopmentModal(page: Page) {
  const devDialog = page.getByRole('dialog', { name: /plataforma em desenvolvimento/i });
  if (await devDialog.isVisible().catch(() => false)) {
    await devDialog.getByRole('button', { name: /^fechar$/i }).first().click({ timeout: 1_500 }).catch(() => undefined);
    await expect(devDialog).not.toBeVisible({ timeout: 2_000 }).catch(() => undefined);
  }
}

test.describe('responsive global navigation', () => {
  for (const viewport of viewports) {
    test(`videos navigation works at ${viewport.width}x${viewport.height}`, async ({ page }, testInfo) => {
      await page.setViewportSize(viewport);
      await page.goto('/');
      await dismissDevelopmentModal(page);

      const isMobile = viewport.width < 768;

      if (isMobile) {
        const menuButton = page.getByRole('button', { name: /abrir menu/i });
        await expect(menuButton).toHaveAttribute('aria-expanded', 'false');
        await menuButton.focus();
        await page.keyboard.press('Enter');
        await expect(menuButton).toHaveAttribute('aria-expanded', 'true');

        const drawer = page.locator('#mobile-menu');
        await expect(drawer).toHaveAttribute('aria-hidden', 'false');
        await expect(drawer.getByText(/cursos, trilhas, vídeos/i)).toBeVisible();
        await expect(drawer.getByRole('button', { name: /vídeos/i })).toBeVisible();
        await page.screenshot({ path: testInfo.outputPath(`mobile-menu-open-${viewport.width}.png`), fullPage: false });

        await drawer.getByRole('button', { name: /vídeos/i }).click();
        await expect(page).toHaveURL('/videos');
        await expect(drawer).toHaveAttribute('aria-hidden', 'true');
      } else {
        const primaryNav = page.getByRole('navigation', { name: /navegação principal/i });
        const videosLink = primaryNav.getByRole('button', { name: /^vídeos$/i });
        await expect(videosLink).toBeVisible();
        await videosLink.click();
        await expect(page).toHaveURL('/videos');
        await expect(videosLink).toHaveAttribute('aria-current', 'page');
      }

      await expect(page.getByRole('heading', { name: /biblioteca de vídeos facodi/i })).toBeVisible({ timeout: 10_000 });

      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await expect(page.getByRole('contentinfo').getByRole('button', { name: /vídeos/i })).toBeVisible();

      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow).toBeLessThanOrEqual(12);

      await page.screenshot({ path: testInfo.outputPath(`videos-${viewport.width}x${viewport.height}.png`), fullPage: false });
    });
  }

  test('mobile menu closes with Escape and keeps Videos discoverable', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/videos');
    await dismissDevelopmentModal(page);

    await page.getByRole('button', { name: /abrir menu/i }).click();
    const drawer = page.locator('#mobile-menu');
    await expect(drawer).toHaveAttribute('aria-hidden', 'false');
    await expect(drawer.getByRole('button', { name: /vídeos/i })).toHaveAttribute('aria-current', 'page');

    await page.keyboard.press('Escape');
    await expect(drawer).toHaveAttribute('aria-hidden', 'true');
    await page.screenshot({ path: testInfo.outputPath('mobile-menu-closed.png'), fullPage: false });
  });

  test('footer Videos link navigates to /videos', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/courses');
    await dismissDevelopmentModal(page);

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.getByRole('contentinfo').getByRole('button', { name: /vídeos/i }).click();

    await expect(page).toHaveURL('/videos');
    await expect(page.getByRole('navigation', { name: /navegação principal/i }).getByRole('button', { name: /^vídeos$/i })).toHaveAttribute('aria-current', 'page');
  });
});
