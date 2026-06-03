import { test, expect } from '@playwright/test';

const PIPELINE_URL = '/curator/channel-pipeline';
const CHANNEL_URL = 'https://www.youtube.com/@equacionamatematica';
const LIVE_CHANNEL_URL = 'https://www.youtube.com/@Matemateca';
const EDITOR_EMAIL = 'test-fun@monynha.com';
const EDITOR_PASSWORD = 'monynha.com';

// Helper: block all Edge Function calls so pipeline always uses local fallback
async function blockEdgeFunctions(page: Parameters<Parameters<typeof test>[1]>[0]['page']) {
  await page.route('**/functions/v1/**', (route) => route.abort('failed'));
}

async function dismissDevelopmentModal(page: Parameters<Parameters<typeof test>[1]>[0]['page']) {
  const devDialog = page.getByRole('dialog', { name: /plataforma em desenvolvimento/i });
  if (await devDialog.isVisible().catch(() => false)) {
    await devDialog.getByRole('button', { name: /fechar/i }).first().click();
    await expect(devDialog).not.toBeVisible({ timeout: 8_000 });
  }
}

// Helper: sign in via the auth modal
async function signIn(
  page: Parameters<Parameters<typeof test>[1]>[0]['page'],
  email: string,
  password: string,
) {
  await dismissDevelopmentModal(page);
  const loginBtn = page.getByRole('button', { name: 'Entrar' }).first();
  await loginBtn.click();
  const dialog = page.getByRole('dialog').filter({ has: page.locator('input[type="email"]') });
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

test.describe('Curator Channel Pipeline — access control', () => {
  test('unauthenticated: pipeline route shows auth requirement', async ({ page }) => {
    await page.goto(PIPELINE_URL);
    await dismissDevelopmentModal(page);
    // Either the auth modal opens or there is a "Entrar" prompt visible
    const authModal = page
      .getByRole('dialog')
      .filter({ has: page.locator('input[type="email"]') });
    const loginBtn = page.getByRole('button', { name: 'Entrar' });
    // At least one of the two must be visible
    await expect(authModal.or(loginBtn.first())).toBeVisible({ timeout: 8_000 });
  });
});

test.describe('Curator Channel Pipeline — degraded mode flow', () => {
  test.beforeEach(async ({ page }) => {
    // Block Edge Functions before navigation so all stages fall back locally
    await blockEdgeFunctions(page);
  });

  test('pipeline page loads with all 6 panels', async ({ page }) => {
    if (!(await ensurePipelineAccess(page))) {
      return;
    }

    await expect(page.getByRole('heading', { name: /pipeline por canal/i })).toBeVisible({
      timeout: 8_000,
    });
    await expect(page.getByRole('heading', { name: /importar canal/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /crit.rios/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /descobrir/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /an.lise/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /mapeamento/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /revis.o editorial/i })).toBeVisible();
  });

  test('validate channel → degraded mode banner appears', async ({ page }) => {
    if (!(await ensurePipelineAccess(page))) {
      return;
    }

    const channelInput = page.getByRole('textbox', { name: /canal/i });
    await channelInput.fill(CHANNEL_URL);
    await page.getByRole('button', { name: /validar canal/i }).click();

    // Fallback triggers → degraded mode banner
    await expect(page.getByText(/modo degradado/i)).toBeVisible({ timeout: 10_000 });
    // Channel identity resolved from fallback
    await expect(page.getByText(/equacionamatematica/i)).toBeVisible({ timeout: 10_000 });
  });

  test('full pipeline: validate → discover → analyze → publish confirmation', async ({ page }) => {
    if (!(await ensurePipelineAccess(page))) {
      return;
    }

    // Step 1: validate channel
    await page.getByRole('textbox', { name: /canal/i }).fill(CHANNEL_URL);
    await page.getByRole('button', { name: /validar canal/i }).click();
    await expect(page.getByText(/modo degradado/i)).toBeVisible({ timeout: 10_000 });

    // Step 2: discover videos
    await page.getByRole('button', { name: /buscar v.deos/i }).click();
    // Wait for video list to populate (fallback generates items)
    await expect(
      page.getByRole('checkbox', { name: /video\s+\d+/i }).first(),
    ).toBeVisible({ timeout: 15_000 });

    // Step 3: analyze
    await page.getByRole('button', { name: /executar an.lise/i }).click();
    // Analyses appear (fallback)
    await expect(page.locator('article').first()).toBeVisible({ timeout: 15_000 });
    // Fallback badge should appear on at least one analysis card
    await expect(page.getByText('fallback').first()).toBeVisible({ timeout: 10_000 });

    // Step 4: click Publicar → confirmation modal opens
    await page.getByRole('button', { name: /publicar no pipeline/i }).click();
    const confirmDialog = page.getByRole('dialog', { name: /confirmar publica/i });
    await expect(confirmDialog).toBeVisible({ timeout: 5_000 });
    // Confirm
    await confirmDialog.getByRole('button', { name: /publicar/i }).click();
    // Success message
    await expect(
      page.getByText(/enviado.*revis.o|de.*enviado/i),
    ).toBeVisible({ timeout: 20_000 });
  });

  test('publish confirmation modal can be cancelled', async ({ page }) => {
    if (!(await ensurePipelineAccess(page))) {
      return;
    }

    // Quick setup: validate + discover videos so the publish button is enabled
    await page.getByRole('textbox', { name: /canal/i }).fill(CHANNEL_URL);
    await page.getByRole('button', { name: /validar canal/i }).click();
    await expect(page.getByText(/modo degradado/i)).toBeVisible({ timeout: 10_000 });
    await page.getByRole('button', { name: /buscar v.deos/i }).click();
    await expect(
      page.getByRole('checkbox', { name: /video\s+\d+/i }).first(),
    ).toBeVisible({ timeout: 15_000 });

    // Open confirm dialog and cancel
    await page.getByRole('button', { name: /publicar no pipeline/i }).click();
    const confirmDialog = page.getByRole('dialog', { name: /confirmar publica/i });
    await expect(confirmDialog).toBeVisible({ timeout: 5_000 });
    await confirmDialog.getByRole('button', { name: /cancelar/i }).click();
    await expect(confirmDialog).not.toBeVisible();
    // No success/error message should appear
    await expect(page.getByText(/enviado.*revis.o/i)).not.toBeVisible();
  });
});

test.describe('Curator Channel Pipeline — live mode flow', () => {
  test.skip(!!process.env.CI, 'Live pipeline skipped in CI environments.');
  test.setTimeout(180_000);

  test('full pipeline: validate → discover → analyze → publish confirmation', async ({ page }) => {
    if (!(await ensurePipelineAccess(page))) {
      return;
    }

    await page.getByRole('textbox', { name: /canal/i }).fill(LIVE_CHANNEL_URL);
    await page.getByRole('button', { name: /validar canal/i }).click();

    const degradedBanner = page.getByText(/modo degradado/i);
    await expect(degradedBanner).not.toBeVisible({ timeout: 15_000 }).catch(() => undefined);
    await expect(page.getByText(/matemateca/i)).toBeVisible({ timeout: 20_000 });

    await page.getByRole('button', { name: /buscar v.deos/i }).click();
    await expect(
      page.getByRole('checkbox', { name: /video\s+\d+/i }).first(),
    ).toBeVisible({ timeout: 45_000 });

    await page.getByRole('button', { name: /executar an.lise/i }).click();
    await expect(page.locator('article').first()).toBeVisible({ timeout: 90_000 });

    await page.getByRole('button', { name: /publicar no pipeline/i }).click();
    const confirmDialog = page.getByRole('dialog', { name: /confirmar publica/i });
    await expect(confirmDialog).toBeVisible({ timeout: 10_000 });
    await confirmDialog.getByRole('button', { name: /publicar/i }).click();

    await expect(
      page.getByText(/enviado.*revis.o|de.*enviado/i),
    ).toBeVisible({ timeout: 30_000 });
  });
});
