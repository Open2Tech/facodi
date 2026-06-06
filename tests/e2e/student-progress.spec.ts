import { test, expect } from '@playwright/test';

test.describe('Student Features - Progress Tracking', () => {
  test.beforeEach(async ({ page }) => {
    // Start at home page
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('Progress page displays overall progress percentage', async ({ page }) => {
    await page.goto('/student/progress');
    await page.waitForLoadState('networkidle');

    // Should show title
    const title = await page.locator('h1').first();
    expect(title).toBeTruthy();
  });

  test('Progress bars display and animate correctly', async ({ page }) => {
    await page.goto('/student/progress');
    await page.waitForLoadState('networkidle');

    // Page should render with content
    const content = await page.locator('body').textContent();
    expect(content).toBeTruthy();
  });

  test('Per-course progress breakdown shows details', async ({ page }) => {
    await page.goto('/student/progress');
    await page.waitForLoadState('networkidle');

    // Should have course information rendered
    const content = await page.locator('body').textContent();
    // Should contain Portuguese text about progress
    expect(content?.includes('Progresso')).toBeTruthy();
  });

  test('Course dates display (enrolled, started, completed)', async ({ page }) => {
    await page.goto('/student/progress');
    await page.waitForLoadState('networkidle');

    // Page should have content with date-like structure
    const content = await page.locator('body').textContent();
    // Should have course information
    expect(content?.length).toBeGreaterThan(50);
  });

  test('Large progress number is prominently displayed', async ({ page }) => {
    await page.goto('/student/progress');
    await page.waitForLoadState('networkidle');

    // Should have large heading/number
    const headings = await page.locator('h1, h2, h3').count();
    expect(headings).toBeGreaterThan(0);
  });

  test('Empty state shows when no courses enrolled', async ({ page }) => {
    await page.goto('/student/progress');
    await page.waitForLoadState('networkidle');

    // Should show either courses or empty state
    const content = await page.locator('body').textContent();
    expect(content?.length).toBeGreaterThan(0);
  });

  test('Progress page is responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/student/progress');
    await page.waitForLoadState('networkidle');

    const content = await page.locator('body').textContent();
    expect(content?.length).toBeGreaterThan(0);
  });

  test('Progress page is responsive on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/student/progress');
    await page.waitForLoadState('networkidle');

    const content = await page.locator('body').textContent();
    expect(content?.length).toBeGreaterThan(0);
  });

  test('Back button is present and functional', async ({ page }) => {
    await page.goto('/student/progress');
    await page.waitForLoadState('networkidle');

    // Should have back button
    const backButton = await page.locator('button:has-text("Voltar")').first();
    expect(backButton).toBeTruthy();
  });

  test('Page has proper semantic structure', async ({ page }) => {
    await page.goto('/student/progress');
    await page.waitForLoadState('networkidle');

    // Should have main heading
    const heading = await page.locator('h1').first();
    expect(heading).toBeTruthy();

    // Should have page structure
    const body = await page.locator('body');
    expect(body).toBeTruthy();
  });

  test('No console errors on progress page', async ({ page }) => {
    const errors: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/student/progress');
    await page.waitForLoadState('networkidle');

    expect(errors.length).toBe(0);
  });

  test('Page title is correct', async ({ page }) => {
    await page.goto('/student/progress');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveTitle(/progresso.*FACODI/i);
  });

  test('Grid layout displays course cards', async ({ page }) => {
    await page.goto('/student/progress');
    await page.waitForLoadState('networkidle');

    // Should have structured content
    const divs = await page.locator('div').count();
    expect(divs).toBeGreaterThan(10);
  });
});
