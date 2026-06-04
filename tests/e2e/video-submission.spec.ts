import { expect, test } from '@playwright/test';

const TEST_EMAIL = 'test-fun@monynha.com';
const TEST_PASSWORD = 'monynha.com';

async function signInFromProtectedRoute(page: Parameters<Parameters<typeof test>[1]>[0]['page']) {
  const dialog = page.getByRole('dialog').filter({ has: page.locator('input[type="email"]') });
  await expect(dialog).toBeVisible({ timeout: 8_000 });
  await dialog.locator('input[type="email"]').fill(TEST_EMAIL);
  await dialog.locator('input[type="password"]').fill(TEST_PASSWORD);
  await dialog.locator('button[type="submit"]').click();
  await expect(dialog).not.toBeVisible({ timeout: 12_000 });
}

test.describe('Video submission v2', () => {
  test('authenticated user can open v2 submission form without legacy pipeline calls', async ({ page }) => {
    await page.goto('/videos/submit');
    await signInFromProtectedRoute(page);

    await expect(page).toHaveURL('/videos/submit');
    await expect(page.getByRole('heading', { name: /enviar video/i })).toBeVisible();
    await expect(page.getByText(/envio v2/i)).toBeVisible();

    const submitButton = page.getByRole('button', { name: /enviar para pipeline v2/i });
    await expect(submitButton).toBeDisabled();

    await page.getByLabel(/url do youtube/i).fill('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    await expect(page.getByText('dQw4w9WgXcQ')).toBeVisible();
    await expect(submitButton).toBeEnabled();
  });
});
