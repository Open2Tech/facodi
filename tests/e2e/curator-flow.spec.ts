import { expect, test } from '@playwright/test';

async function dismissDevelopmentModal(page: Parameters<Parameters<typeof test>[1]>[0]['page']) {
  const devDialog = page.getByRole('dialog', { name: /plataforma em desenvolvimento/i });
  if (await devDialog.isVisible().catch(() => false)) {
    await devDialog.getByRole('button', { name: /fechar/i }).first().click();
    await expect(devDialog).not.toBeVisible({ timeout: 8_000 });
  }
}

test.describe('Curator v2 flow', () => {
  test('anonymous users do not see protected curator/admin navigation', async ({ page }) => {
    await page.goto('/');
    await dismissDevelopmentModal(page);

    await expect(page.getByRole('navigation').getByRole('button', { name: /pipeline de canal/i })).not.toBeVisible();
    await expect(page.getByRole('navigation').getByRole('button', { name: /painel admin/i })).not.toBeVisible();
    await expect(page.getByRole('navigation').getByRole('button', { name: /ser curador/i })).not.toBeVisible();
  });

  test('manual submission routes are retired', async ({ page }) => {
    for (const route of ['/curator/submit', '/curator/submissions', '/admin/conteudos']) {
      await page.goto(route);
      await dismissDevelopmentModal(page);
      await expect(page.getByText('Página não encontrada')).toBeVisible();
    }
  });

  test('v2 protected routes request authentication instead of rendering legacy submissions', async ({ page }) => {
    for (const route of ['/curator/channel-pipeline', '/curator/admin-review', '/curator/apply']) {
      await page.goto(route);
      await dismissDevelopmentModal(page);
      await expect(page.getByText(/autenticado|entrar/i).first()).toBeVisible({ timeout: 8_000 });
      await expect(page.getByText(/submiss.es manuais|submiss.es recentes/i)).not.toBeVisible();
      await expect(page.locator('a[href="/curator/submit"], a[href="/curator/submissions"]')).toHaveCount(0);
    }
  });
});
