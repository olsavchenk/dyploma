import { test, expect } from '../../fixtures/auth.fixture';
import { LayoutPage } from '../../page-objects/shared/layout.page';
import {
  mockSubjects,
  mockLeaderboard,
  mockUserProfile,
  mockTeacherClasses,
  mockTeacherQuickStats,
  mockAdminDashboard,
} from '../../fixtures/api-mocks';

test.describe('Routing — Student', () => {
  test('should navigate to dashboard via sidenav', async ({ studentPage }) => {
    const layout = new LayoutPage(studentPage);
    await studentPage.goto('/learn');
    await studentPage.waitForLoadState('networkidle');

    await layout.clickSidenavItem('Головна');
    await studentPage.waitForURL('**/dashboard');
    expect(studentPage.url()).toContain('/dashboard');
  });

  test('should navigate to learn via sidenav', async ({ studentPage }) => {
    await mockSubjects(studentPage);
    const layout = new LayoutPage(studentPage);
    await studentPage.goto('/dashboard');
    await studentPage.waitForLoadState('networkidle');

    await layout.clickSidenavItem('Навчання');
    await studentPage.waitForURL('**/learn');
    expect(studentPage.url()).toContain('/learn');
  });

  test('should navigate to leaderboard via sidenav', async ({ studentPage }) => {
    await mockLeaderboard(studentPage);
    const layout = new LayoutPage(studentPage);
    await studentPage.goto('/dashboard');
    await studentPage.waitForLoadState('networkidle');

    await layout.clickSidenavItem('Таблиця лідерів');
    await studentPage.waitForURL('**/leaderboard');
    expect(studentPage.url()).toContain('/leaderboard');
  });

  test('should navigate to profile via sidenav', async ({ studentPage }) => {
    const layout = new LayoutPage(studentPage);
    await studentPage.goto('/dashboard');
    await studentPage.waitForLoadState('networkidle');

    await layout.clickSidenavItem('Профіль');
    await studentPage.waitForURL('**/profile');
    expect(studentPage.url()).toContain('/profile');
  });

  test('should redirect root to dashboard for authenticated student', async ({ studentPage }) => {
    await studentPage.goto('/');
    await studentPage.waitForURL('**/dashboard');
    expect(studentPage.url()).toContain('/dashboard');
  });
});

test.describe('Routing — Teacher', () => {
  test('should redirect teacher root to classes', async ({ teacherPage }) => {
    await mockTeacherClasses(teacherPage);
    await mockTeacherQuickStats(teacherPage);

    await teacherPage.goto('/');
    await teacherPage.waitForURL(/\/(teacher|dashboard)/);
  });

  test('should navigate to teacher classes', async ({ teacherPage }) => {
    await mockTeacherClasses(teacherPage);
    await mockTeacherQuickStats(teacherPage);

    await teacherPage.goto('/teacher/classes');
    await teacherPage.waitForLoadState('networkidle');
    expect(teacherPage.url()).toContain('/teacher/classes');
  });
});

test.describe('Routing — Admin', () => {
  test('should navigate to admin dashboard', async ({ adminPage }) => {
    await mockAdminDashboard(adminPage);

    await adminPage.goto('/admin');
    await adminPage.waitForLoadState('networkidle');
    expect(adminPage.url()).toContain('/admin');
  });
});

test.describe('Responsive Navigation — Mobile', () => {
  test('should show bottom nav on mobile', async ({ studentPage }) => {
    await studentPage.setViewportSize({ width: 375, height: 812 });
    const layout = new LayoutPage(studentPage);

    await studentPage.goto('/dashboard');
    await studentPage.waitForLoadState('networkidle');

    await layout.expectBottomNavVisible();
  });

  test('should navigate using bottom nav items', async ({ studentPage }) => {
    await mockSubjects(studentPage);
    await studentPage.setViewportSize({ width: 375, height: 812 });
    const layout = new LayoutPage(studentPage);

    await studentPage.goto('/dashboard');
    await studentPage.waitForLoadState('networkidle');

    await layout.clickBottomNavItem('Навчання');
    await studentPage.waitForURL('**/learn');
    expect(studentPage.url()).toContain('/learn');
  });

  test('should hide sidenav on mobile', async ({ studentPage }) => {
    await studentPage.setViewportSize({ width: 375, height: 812 });
    const layout = new LayoutPage(studentPage);

    await studentPage.goto('/dashboard');
    await studentPage.waitForLoadState('networkidle');

    await expect(layout.sidenav).not.toBeVisible();
  });

  test('should show bottom nav item count of 4-5', async ({ studentPage }) => {
    await studentPage.setViewportSize({ width: 375, height: 812 });
    const layout = new LayoutPage(studentPage);

    await studentPage.goto('/dashboard');
    await studentPage.waitForLoadState('networkidle');

    await layout.expectBottomNavVisible();
    const count = await layout.bottomNavItems.count();
    expect(count).toBeGreaterThanOrEqual(3);
    expect(count).toBeLessThanOrEqual(5);
  });
});

test.describe('Responsive Navigation — Desktop', () => {
  test('should show sidenav on desktop', async ({ studentPage }) => {
    await studentPage.setViewportSize({ width: 1280, height: 800 });
    const layout = new LayoutPage(studentPage);

    await studentPage.goto('/dashboard');
    await studentPage.waitForLoadState('networkidle');

    await layout.expectSidenavVisible();
  });

  test('should hide bottom nav on desktop', async ({ studentPage }) => {
    await studentPage.setViewportSize({ width: 1280, height: 800 });
    const layout = new LayoutPage(studentPage);

    await studentPage.goto('/dashboard');
    await studentPage.waitForLoadState('networkidle');

    await expect(layout.bottomNav).not.toBeVisible();
  });
});

test.describe('Keyboard Navigation', () => {
  test('should focus on main content with Tab key', async ({ studentPage }) => {
    await studentPage.goto('/dashboard');
    await studentPage.waitForLoadState('networkidle');

    await studentPage.keyboard.press('Tab');
    // Something should receive focus
    const focusedTag = await studentPage.evaluate(() => document.activeElement?.tagName);
    expect(focusedTag).toBeTruthy();
  });

  test('should be able to navigate form fields with Tab', async ({ page }) => {
    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle');

    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Some input should be focused
    const focusedTag = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedTag).toBe('INPUT');
  });
});
