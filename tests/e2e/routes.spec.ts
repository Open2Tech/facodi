import { test, expect } from '@playwright/test';

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

test('home loads and shows mission statement', async ({ page }) => {
  await page.goto('/');
  await dismissDevelopmentModal(page);
  await expect(page.getByRole('heading', { level: 1, name: /facodi/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /explorar trilhas|explore tracks/i })).toBeVisible();
});

test('courses page lists all degrees', async ({ page }) => {
  await page.goto('/courses');
  const cards = page.locator('[data-testid="course-card"]');
  // Wait for either course cards or the empty state message to appear
  await expect(
    cards.first().or(page.getByText('Nenhum curso disponível neste momento.'))
  ).toBeVisible({ timeout: 10000 });
  const count = await cards.count();
  if (count === 0) {
    await expect(page.getByText('Nenhum curso disponível neste momento.')).toBeVisible();
    return;
  }
  await expect(cards.first()).toBeVisible();
});

test('navigation to courses works', async ({ page }) => {
  await page.goto('/');
  await dismissDevelopmentModal(page);
  await page.getByRole('navigation').getByRole('button', { name: 'Cursos' }).click();
  await expect(page).toHaveURL('/courses');
});

test('current theme is the canonical light FACODI theme', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('html')).not.toHaveClass(/dark/);
});

test('videos page renders the public video surface', async ({ page }) => {
  await page.goto('/videos');
  await expect(page.getByRole('heading', { name: /v.deos/i })).toBeVisible({ timeout: 10_000 });
  await expect(
    page.locator('article').first()
      .or(page.getByText(/nenhum|erro|carregando/i).first()),
  ).toBeVisible({ timeout: 10_000 });
});

test('video submission route is the authenticated v2 entry point', async ({ page }) => {
  await page.goto('/videos/submit');
  await dismissDevelopmentModal(page);
  await expect(page).toHaveURL('/videos/submit');
  const authDialog = page.getByRole('dialog').filter({ has: page.locator('input[type="email"]') });
  if (await authDialog.isVisible().catch(() => false)) {
    await expect(authDialog).toBeVisible();
    return;
  }
  await expect(page.getByText(/acesso restrito|autenticado/i).first()).toBeVisible({ timeout: 8_000 });
});

test('video submission status route is protected by auth', async ({ page }) => {
  await page.goto('/videos/submit/00000000-0000-4000-8000-000000000000');
  await dismissDevelopmentModal(page);
  await expect(page).toHaveURL('/videos/submit/00000000-0000-4000-8000-000000000000');
  const authDialog = page.getByRole('dialog').filter({ has: page.locator('input[type="email"]') });
  if (await authDialog.isVisible().catch(() => false)) {
    await expect(authDialog).toBeVisible();
    return;
  }
  await expect(page.getByText(/acesso restrito|autenticado/i).first()).toBeVisible({ timeout: 8_000 });
});

test('lesson detail renders a video block state', async ({ page }) => {
  await page.goto('/courses/units');

  const cards = page.getByTestId('unit-card');
  const count = await cards.count();
  if (count === 0) {
    await expect(page.getByText('Nenhum resultado nos nós de dados.')).toBeVisible();
    return;
  }

  await cards.first().click();
  await expect(page).toHaveURL(/\/lessons\//);

  const player = page.getByTestId('lesson-video-player');
  const fallback = page.getByTestId('lesson-video-link-fallback');
  const placeholder = page.getByTestId('lesson-video-placeholder');

  const visibleCount =
    (await player.count()) +
    (await fallback.count()) +
    (await placeholder.count());

  expect(visibleCount).toBeGreaterThan(0);
});
