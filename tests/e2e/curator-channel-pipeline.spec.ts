import { test, expect } from '@playwright/test';

const PIPELINE_URL = '/curator/channel-pipeline';
const EDITOR_EMAIL = 'test-fun@monynha.com';
const EDITOR_PASSWORD = 'monynha.com';

async function dismissDevelopmentModal(page: Parameters<Parameters<typeof test>[1]>[0]['page']) {
  const authDialog = page.getByRole('dialog').filter({ has: page.locator('input[type="email"]') });
  if (await authDialog.isVisible().catch(() => false)) {
    return;
  }

  const devDialog = page.getByRole('dialog', { name: /plataforma em desenvolvimento/i });
  if (await devDialog.isVisible().catch(() => false)) {
    await devDialog.getByRole('button', { name: /fechar/i }).first().click({ timeout: 1_500 }).catch(() => undefined);
    await expect(devDialog).not.toBeVisible({ timeout: 2_000 }).catch(() => undefined);
  }
}

async function signIn(
  page: Parameters<Parameters<typeof test>[1]>[0]['page'],
  email: string,
  password: string,
) {
  await dismissDevelopmentModal(page);
  const dialog = page.getByRole('dialog').filter({ has: page.locator('input[type="email"]') });
  if (!(await dialog.isVisible().catch(() => false))) {
    const loginBtn = page.getByRole('button', { name: 'Entrar' }).first();
    await loginBtn.click({ timeout: 8_000 });
  }
  await expect(dialog).toBeVisible();
  await dialog.locator('input[type="email"]').fill(email);
  await dialog.locator('input[type="password"]').fill(password);
  await dialog.getByRole('button', { name: /entrar/i }).last().click();
  await expect(dialog).not.toBeVisible({ timeout: 10_000 });
}

async function ensurePipelineAccess(page: Parameters<Parameters<typeof test>[1]>[0]['page']) {
  await page.goto(PIPELINE_URL);
  await dismissDevelopmentModal(page);

  const channelInput = page.getByRole('textbox', { name: /canal/i });
  if (await channelInput.isVisible().catch(() => false)) {
    return true;
  }

  const loginBtn = page.getByRole('button', { name: 'Entrar' }).first();
  const authModal = page.getByRole('dialog').filter({ has: page.locator('input[type="email"]') });

  if (await loginBtn.isVisible().catch(() => false)) {
    await signIn(page, EDITOR_EMAIL, EDITOR_PASSWORD);
    await page.goto(PIPELINE_URL);
  } else if (await authModal.isVisible().catch(() => false)) {
    await authModal.locator('input[type="email"]').fill(EDITOR_EMAIL);
    await authModal.locator('input[type="password"]').fill(EDITOR_PASSWORD);
    await authModal.getByRole('button', { name: /entrar/i }).last().click();
    await expect(authModal).not.toBeVisible({ timeout: 10_000 });
    await page.goto(PIPELINE_URL);
  }

  const permissionDenied = page.getByText(/acesso negado|permiss/i);
  await Promise.race([
    channelInput.waitFor({ state: 'visible', timeout: 12_000 }),
    permissionDenied.waitFor({ state: 'visible', timeout: 12_000 }),
  ]).catch(() => undefined);

  if (await channelInput.isVisible().catch(() => false)) {
    return true;
  }

  test.skip(true, 'Pipeline indisponivel para a conta atual (requer role editor/admin).');
  return false;
}

test.describe('Curator Channel Pipeline - access control', () => {
  test('unauthenticated: pipeline route shows auth requirement', async ({ page }) => {
    await page.goto(PIPELINE_URL);
    await dismissDevelopmentModal(page);
    const authModal = page
      .getByRole('dialog')
      .filter({ has: page.locator('input[type="email"]') });
    const loginBtn = page.getByRole('button', { name: 'Entrar' });
    if (await authModal.isVisible().catch(() => false)) {
      await expect(authModal).toBeVisible();
      return;
    }
    await expect(loginBtn.first()).toBeVisible({ timeout: 8_000 });
  });
});

test.describe('Curator Channel Pipeline - v2 surface', () => {
  test('pipeline page loads with all 6 panels and no degraded fallback', async ({ page }) => {
    if (!(await ensurePipelineAccess(page))) {
      return;
    }

    await expect(page.getByRole('heading', { name: /pipeline por canal/i })).toBeVisible({
      timeout: 8_000,
    });
    await expect(page.getByRole('heading', { name: /importar canal/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /crit.rios/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /descobrir/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /infer.ncia de playlist/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /mapeamento/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /revis.o editorial/i })).toBeVisible();
    await expect(page.getByText(/modo degradado/i)).not.toBeVisible();
    await expect(page.getByText(/backend v2/i)).toBeVisible();
  });

  test('publish action is v2-only and disabled until videos are selected', async ({ page }) => {
    if (!(await ensurePipelineAccess(page))) {
      return;
    }

    await expect(page.getByText(/aceite no fluxo v2 de classifica..o/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /aceitar classifica..es v2/i })).toBeDisabled();
    await expect(page.getByText(/modo degradado/i)).not.toBeVisible();
  });
});
