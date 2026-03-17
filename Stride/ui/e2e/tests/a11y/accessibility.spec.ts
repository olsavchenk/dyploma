import { test, expect } from '../../fixtures/auth.fixture';
import { AxeBuilder } from '@axe-core/playwright';
import {
  mockSubjects,
  mockLeaderboard,
  mockNextTask,
  mockAdminDashboard,
  mockAdminUsers,
  mockAdminReviewQueue,
  mockTeacherClasses,
  mockTeacherQuickStats,
  mockClassDetail,
} from '../../fixtures/api-mocks';

test.describe('Accessibility — Public Pages', () => {
  test('login page should have no critical a11y violations', async ({ page }) => {
    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .exclude('.google-button') // third-party
      .analyze();

    const critical = results.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious');
    expect(critical).toHaveLength(0);
  });

  test('register page should have no critical a11y violations', async ({ page }) => {
    await page.goto('/auth/register');
    await page.waitForLoadState('networkidle');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .exclude('.google-button')
      .analyze();

    const critical = results.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious');
    expect(critical).toHaveLength(0);
  });

  test('forgot-password page should have no critical a11y violations', async ({ page }) => {
    await page.goto('/auth/forgot-password');
    await page.waitForLoadState('networkidle');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    const critical = results.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious');
    expect(critical).toHaveLength(0);
  });
});

test.describe('Accessibility — Student Pages', () => {
  test('dashboard should have no critical a11y violations', async ({ studentPage }) => {
    await studentPage.goto('/dashboard');
    await studentPage.waitForLoadState('networkidle');

    const results = await new AxeBuilder({ page: studentPage })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    const critical = results.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious');
    expect(critical).toHaveLength(0);
  });

  test('learn browse page should have no critical a11y violations', async ({ studentPage }) => {
    await mockSubjects(studentPage);
    await studentPage.goto('/learn');
    await studentPage.waitForLoadState('networkidle');

    const results = await new AxeBuilder({ page: studentPage })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    const critical = results.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious');
    expect(critical).toHaveLength(0);
  });

  test('task session should have no critical a11y violations', async ({ studentPage }) => {
    await mockNextTask(studentPage, 'MultipleChoice');
    await studentPage.goto('/learn/session/topic-algebra');
    await studentPage.waitForLoadState('networkidle');

    const results = await new AxeBuilder({ page: studentPage })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    const critical = results.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious');
    expect(critical).toHaveLength(0);
  });

  test('leaderboard should have no critical a11y violations', async ({ studentPage }) => {
    await mockLeaderboard(studentPage);
    await studentPage.goto('/leaderboard');
    await studentPage.waitForLoadState('networkidle');

    const results = await new AxeBuilder({ page: studentPage })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    const critical = results.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious');
    expect(critical).toHaveLength(0);
  });

  test('profile should have no critical a11y violations', async ({ studentPage }) => {
    await studentPage.goto('/profile');
    await studentPage.waitForLoadState('networkidle');

    const results = await new AxeBuilder({ page: studentPage })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    const critical = results.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious');
    expect(critical).toHaveLength(0);
  });
});

test.describe('Accessibility — Teacher Pages', () => {
  test('teacher classes page should have no critical violations', async ({ teacherPage }) => {
    await mockTeacherClasses(teacherPage);
    await mockTeacherQuickStats(teacherPage);
    await teacherPage.goto('/teacher/classes');
    await teacherPage.waitForLoadState('networkidle');

    const results = await new AxeBuilder({ page: teacherPage })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    const critical = results.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious');
    expect(critical).toHaveLength(0);
  });

  test('class detail page should have no critical violations', async ({ teacherPage }) => {
    await mockTeacherClasses(teacherPage);
    await mockClassDetail(teacherPage);
    await teacherPage.goto('/teacher/classes/class-001');
    await teacherPage.waitForLoadState('networkidle');

    const results = await new AxeBuilder({ page: teacherPage })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    const critical = results.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious');
    expect(critical).toHaveLength(0);
  });
});

test.describe('Accessibility — Admin Pages', () => {
  test('admin dashboard should have no critical violations', async ({ adminPage }) => {
    await mockAdminDashboard(adminPage);
    await adminPage.goto('/admin');
    await adminPage.waitForLoadState('networkidle');

    const results = await new AxeBuilder({ page: adminPage })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    const critical = results.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious');
    expect(critical).toHaveLength(0);
  });

  test('users page should have no critical violations', async ({ adminPage }) => {
    await mockAdminDashboard(adminPage);
    await mockAdminUsers(adminPage);
    await adminPage.goto('/admin/users');
    await adminPage.waitForLoadState('networkidle');

    const results = await new AxeBuilder({ page: adminPage })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    const critical = results.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious');
    expect(critical).toHaveLength(0);
  });

  test('AI review page should have no critical violations', async ({ adminPage }) => {
    await mockAdminDashboard(adminPage);
    await mockAdminReviewQueue(adminPage);
    await adminPage.goto('/admin/ai-review');
    await adminPage.waitForLoadState('networkidle');

    const results = await new AxeBuilder({ page: adminPage })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    const critical = results.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious');
    expect(critical).toHaveLength(0);
  });
});

test.describe('i18n — Ukrainian Language', () => {
  test('login page should display Ukrainian text', async ({ page }) => {
    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle');

    // Page should have Ukrainian content
    await expect(page.locator('body')).toContainText('Вхід');
  });

  test('dashboard should display Ukrainian labels', async ({ studentPage }) => {
    await studentPage.goto('/dashboard');
    await studentPage.waitForLoadState('networkidle');

    // Dashboard contains Ukrainian labels
    await expect(studentPage.locator('body')).toContainText(/(Головна|Вітаємо|Продовжити)/);
  });

  test('learn page should use Ukrainian subject names', async ({ studentPage }) => {
    await mockSubjects(studentPage);
    await studentPage.goto('/learn');
    await studentPage.waitForLoadState('networkidle');

    await expect(studentPage.locator('body')).toContainText('Математика');
    await expect(studentPage.locator('body')).toContainText('Українська мова');
  });

  test('task feedback should show Ukrainian texts', async ({ studentPage }) => {
    await mockNextTask(studentPage, 'MultipleChoice');
    const { mockSubmitTask } = await import('../../fixtures/api-mocks');
    await mockSubmitTask(studentPage, true);

    await studentPage.goto('/learn/session/topic-algebra');
    await studentPage.waitForLoadState('networkidle');

    const { TaskSessionPage } = await import('../../page-objects/task-session.page');
    const session = new TaskSessionPage(studentPage);
    await session.expectTaskLoaded();
    await session.selectMultipleChoiceOption(1);
    await session.submit();

    await expect(studentPage.locator('body')).toContainText('Правильно!');
  });

  test('leaderboard should use Ukrainian labels', async ({ studentPage }) => {
    await mockLeaderboard(studentPage);
    await studentPage.goto('/leaderboard');
    await studentPage.waitForLoadState('networkidle');

    await expect(studentPage.locator('body')).toContainText('Таблиця лідерів');
    await expect(studentPage.locator('body')).toContainText('учасників');
  });

  test('profile page should use Ukrainian labels', async ({ studentPage }) => {
    await studentPage.goto('/profile');
    await studentPage.waitForLoadState('networkidle');

    await expect(studentPage.locator('body')).toContainText(/(Профіль|Редагувати|Експорт)/);
  });
});
