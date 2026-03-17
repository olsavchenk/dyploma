import { test, expect } from '@playwright/test';
import { test as authTest } from '../../fixtures/auth.fixture';
import { LayoutPage } from '../../page-objects/shared/layout.page';
import { API_BASE, TEST_STUDENT } from '../../fixtures/test-data';

authTest.describe('Logout', () => {
  authTest('should logout and redirect to login page', async ({ studentPage }) => {
    const layout = new LayoutPage(studentPage);
    await studentPage.goto('/dashboard');
    await studentPage.waitForLoadState('networkidle');

    await layout.clickLogout();

    await studentPage.waitForURL('**/auth/login');
    expect(studentPage.url()).toContain('/auth/login');
  });

  authTest('should clear localStorage on logout', async ({ studentPage }) => {
    await studentPage.goto('/dashboard');
    await studentPage.waitForLoadState('networkidle');

    const layout = new LayoutPage(studentPage);
    await layout.clickLogout();
    await studentPage.waitForURL('**/auth/login');

    const token = await studentPage.evaluate(() => localStorage.getItem('stride_access_token'));
    expect(token).toBeNull();
  });

  authTest('should not access dashboard after logout', async ({ studentPage }) => {
    await studentPage.goto('/dashboard');
    await studentPage.waitForLoadState('networkidle');

    const layout = new LayoutPage(studentPage);
    await layout.clickLogout();
    await studentPage.waitForURL('**/auth/login');

    // Try navigating back — should stay on login
    await studentPage.goto('/dashboard');
    await studentPage.waitForURL('**/auth/login');
    expect(studentPage.url()).toContain('/auth/login');
  });
});

test.describe('Auth Guards', () => {
  test('should redirect unauthenticated user to login from /dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForURL('**/auth/login');
    expect(page.url()).toContain('/auth/login');
  });

  test('should redirect unauthenticated user to login from /learn', async ({ page }) => {
    await page.goto('/learn');
    await page.waitForURL('**/auth/login');
    expect(page.url()).toContain('/auth/login');
  });

  test('should redirect unauthenticated user to login from /profile', async ({ page }) => {
    await page.goto('/profile');
    await page.waitForURL('**/auth/login');
    expect(page.url()).toContain('/auth/login');
  });

  test('should redirect unauthenticated user to login from /leaderboard', async ({ page }) => {
    await page.goto('/leaderboard');
    await page.waitForURL('**/auth/login');
    expect(page.url()).toContain('/auth/login');
  });

  test('should redirect unauthenticated user to login from /teacher/classes', async ({ page }) => {
    await page.goto('/teacher/classes');
    await page.waitForURL('**/auth/login');
    expect(page.url()).toContain('/auth/login');
  });

  test('should redirect unauthenticated user to login from /admin', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForURL('**/auth/login');
    expect(page.url()).toContain('/auth/login');
  });
});

authTest.describe('Role Guards', () => {
  authTest('student cannot access /teacher/classes', async ({ studentPage }) => {
    await studentPage.goto('/teacher/classes');
    // Should redirect away — either to dashboard or show forbidden
    await studentPage.waitForURL(/\/(dashboard|forbidden|$)/);
    expect(studentPage.url()).not.toContain('/teacher/classes');
  });

  authTest('student cannot access /admin', async ({ studentPage }) => {
    await studentPage.goto('/admin');
    await studentPage.waitForURL(/\/(dashboard|forbidden|$)/);
    expect(studentPage.url()).not.toContain('/admin');
  });

  authTest('teacher cannot access /admin', async ({ teacherPage }) => {
    await teacherPage.goto('/admin');
    await teacherPage.waitForURL(/\/(teacher|dashboard|forbidden|$)/);
    expect(teacherPage.url()).not.toContain('/admin');
  });
});
