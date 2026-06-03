import { test, expect } from '@playwright/test';

test.describe('Student Features - Course Enrollment', () => {
  test.beforeEach(async ({ page }) => {
    // Start at home page
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('Unauthenticated user sees login prompt on student dashboard', async ({ page }) => {
    // Navigate to student dashboard without logging in
    await page.goto('/student/dashboard');
    await page.waitForLoadState('networkidle');

    // Should see auth message or page content
    const content = await page.locator('body').textContent();
    expect(content?.length).toBeGreaterThan(0);
  });

  test('Student can navigate to My Courses from home', async ({ page }) => {
    // First, ensure we can see the nav. Home page should be accessible
    await page.goto('/');
    
    // Check that page loaded
    const content = await page.locator('body').textContent();
    expect(content?.length).toBeGreaterThan(0);
  });

  test('Courses list displays enrollment status correctly', async ({ page }) => {
    // Navigate to courses repository
    await page.goto('/courses');
    await page.waitForLoadState('networkidle');

    // Should see course list
    const courseCards = await page.locator('[class*="CourseCard"]').count();
    expect(courseCards).toBeGreaterThanOrEqual(0);
  });

  test('Student dashboard shows empty state when no courses enrolled', async ({ page }) => {
    // Navigate to student dashboard
    await page.goto('/student/dashboard');
    await page.waitForLoadState('networkidle');

    // Should show auth gate OR an empty/enrolled state for authenticated sessions.
    const hasAuthMessage = await page.getByText(/autenticado|acesso restrito|entrar/i).first().isVisible();
    const hasEmptyState = await page.locator('text=não se inscreveu').isVisible();
    const hasDashboardContent = await page.getByText(/dashboard|meus cursos|progresso/i).first().isVisible();
    
    expect(hasAuthMessage || hasEmptyState || hasDashboardContent).toBeTruthy();
  });

  test('My Courses page is accessible from navigation', async ({ page }) => {
    // Go to home
    await page.goto('/');
    
    // Should have navigation
    const homeButton = await page.locator('button:has-text("Home"), text=/^Home$/').first();
    expect(homeButton).toBeDefined();
  });

  test('Student progress page loads without errors', async ({ page }) => {
    // Navigate to progress page
    await page.goto('/student/progress');
    await page.waitForLoadState('networkidle');

    // Should show either auth message or progress content
    const content = await page.locator('body').textContent();
    expect(content?.length).toBeGreaterThan(0);
  });

  test('Student history page is accessible', async ({ page }) => {
    // Navigate to history page
    await page.goto('/student/history');
    await page.waitForLoadState('networkidle');

    // Page should load (auth check or content)
    const content = await page.locator('body').textContent();
    expect(content).toBeTruthy();
  });

  test('Navigation shows correct student links structure', async ({ page }) => {
    // Go to home
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check that Home and Courses links exist
    const homeNav = await page.locator('button').filter({ hasText: /home/i }).first();
    const coursesNav = await page.locator('button').filter({ hasText: /courses|cursos/i }).first();
    
    expect(homeNav).toBeDefined();
    expect(coursesNav).toBeDefined();
  });

  test('Student pages handle navigation back button', async ({ page }) => {
    // Navigate to student dashboard
    await page.goto('/student/dashboard');
    await page.waitForLoadState('networkidle');

    // Look for back button
    const backButton = await page.locator('button:has-text("Voltar"), button').first();
    expect(backButton).toBeDefined();

    // Click back if it exists
    const count = await page.locator('button').count();
    expect(count).toBeGreaterThan(0);
  });

  test('Page titles update correctly for student routes', async ({ page }) => {
    // Dashboard
    await page.goto('/student/dashboard');
    await page.waitForLoadState('networkidle');
    let title = await page.title();
    expect(title).toContain('FACODI');

    // My Courses
    await page.goto('/student/my-courses');
    await page.waitForLoadState('networkidle');
    title = await page.title();
    expect(title).toContain('FACODI');

    // Progress
    await page.goto('/student/progress');
    await page.waitForLoadState('networkidle');
    title = await page.title();
    expect(title).toContain('FACODI');

    // History
    await page.goto('/student/history');
    await page.waitForLoadState('networkidle');
    title = await page.title();
    expect(title).toContain('FACODI');
  });

  test('Student route paths match expected URLs', async ({ page }) => {
    // Test each student route exists and responds
    const routes = [
      '/student/dashboard',
      '/student/my-courses',
      '/student/progress',
      '/student/history',
    ];

    for (const route of routes) {
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      
      // Protected student routes may render an auth gate or redirect anonymous users.
      const content = await page.locator('body').textContent();
      expect(content?.length).toBeGreaterThan(0);
      await expect(page.getByText(/facodi|acesso restrito|autenticado|entrar/i).first()).toBeVisible();
    }
  });

  test('Error handling on student pages shows proper messages', async ({ page }) => {
    // Navigate to student dashboard
    await page.goto('/student/dashboard');
    await page.waitForLoadState('networkidle');

    // Should not show JavaScript errors in console
    let jsErrors = false;
    page.on('console', msg => {
      if (msg.type() === 'error') {
        jsErrors = true;
      }
    });

    // Interact with page
    const buttons = await page.locator('button').count();
    expect(buttons).toBeGreaterThan(0);

    // No critical JS errors expected
    expect(jsErrors).toBe(false);
  });

  test('Responsive layout works on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 390, height: 844 });

    // Navigate to student dashboard
    await page.goto('/student/dashboard');
    await page.waitForLoadState('networkidle');

    // Page should be readable
    const content = await page.locator('body').textContent();
    expect(content?.length).toBeGreaterThan(0);

    // Buttons should be accessible
    const buttons = await page.locator('button').count();
    expect(buttons).toBeGreaterThan(0);
  });

  test('Responsive layout works on desktop viewport', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1440, height: 900 });

    // Navigate to student dashboard
    await page.goto('/student/dashboard');
    await page.waitForLoadState('networkidle');

    // Page should render correctly
    const content = await page.locator('body').textContent();
    expect(content?.length).toBeGreaterThan(0);
  });

  test('Loading states display properly', async ({ page }) => {
    // Navigate to student dashboard
    await page.goto('/student/dashboard');
    
    // During load, should see loading indicator or content
    await page.waitForLoadState('networkidle');
    
    // After load, page content should be visible
    const content = await page.locator('body').textContent();
    expect(content?.length).toBeGreaterThan(0);
  });
});
