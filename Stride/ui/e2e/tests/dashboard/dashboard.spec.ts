import { test, expect } from '../../fixtures/auth.fixture';
import { DashboardPage } from '../../page-objects/dashboard.page';
import { LayoutPage } from '../../page-objects/shared/layout.page';
import {
  mockContinueLearning,
  mockGamificationStats,
  mockLeaderboardPreview,
  mockSubjects,
  mockNextTask,
  mockSubmitTask,
} from '../../fixtures/api-mocks';
import {
  TEST_STUDENT,
  TEST_GAMIFICATION_STATS,
  TEST_CONTINUE_LEARNING,
} from '../../fixtures/test-data';

test.describe('Student Dashboard', () => {
  test('should display welcome message with student name', async ({ studentPage }) => {
    const dashboard = new DashboardPage(studentPage);
    await dashboard.goto();
    await dashboard.expectWelcomeMessage(TEST_STUDENT.displayName);
  });

  test('should show streak widget with current streak count', async ({ studentPage }) => {
    const dashboard = new DashboardPage(studentPage);
    await dashboard.goto();
    await dashboard.expectFullyLoaded();
    await dashboard.expectStreakCount(TEST_GAMIFICATION_STATS.currentStreak);
  });

  test('should show XP bar with current level', async ({ studentPage }) => {
    const dashboard = new DashboardPage(studentPage);
    await dashboard.goto();
    await dashboard.expectFullyLoaded();
    await dashboard.expectXpLevel(TEST_GAMIFICATION_STATS.currentLevel);
  });

  test('should display continue learning topic cards', async ({ studentPage }) => {
    const dashboard = new DashboardPage(studentPage);
    await dashboard.goto();
    await dashboard.expectFullyLoaded();
    await dashboard.expectContinueLearningCards(TEST_CONTINUE_LEARNING.length);
  });

  test('should display leaderboard preview', async ({ studentPage }) => {
    const dashboard = new DashboardPage(studentPage);
    await dashboard.goto();
    await dashboard.expectFullyLoaded();
    await dashboard.expectLeaderboardPreviewVisible();
  });

  test('should show first-task-of-day bonus when not yet completed', async ({ studentPage }) => {
    const dashboard = new DashboardPage(studentPage);
    await dashboard.goto();
    await dashboard.expectFullyLoaded();

    // TEST_GAMIFICATION_STATS has firstTaskOfDayCompleted: false
    await expect(dashboard.firstTaskBonus).toBeVisible();
  });

  test('should navigate to topic session from continue learning card', async ({ studentPage }) => {
    await mockSubjects(studentPage);
    await mockNextTask(studentPage);
    await mockSubmitTask(studentPage);

    const dashboard = new DashboardPage(studentPage);
    await dashboard.goto();
    await dashboard.expectFullyLoaded();
    await dashboard.clickContinueLearning(0);

    await studentPage.waitForURL(/\/learn\/session\//);
    expect(studentPage.url()).toContain('/learn/session/');
  });

  test('should display header with streak and XP mini bar', async ({ studentPage }) => {
    const layout = new LayoutPage(studentPage);
    const dashboard = new DashboardPage(studentPage);
    await dashboard.goto();
    await dashboard.expectFullyLoaded();

    await layout.expectHeaderVisible();
    await layout.expectStreakVisible();
  });
});

test.describe('Dashboard Empty State', () => {
  test('should show empty state when no continue learning topics', async ({ studentPage }) => {
    await mockContinueLearning(studentPage, true);

    const dashboard = new DashboardPage(studentPage);
    await dashboard.goto();
    await dashboard.expectFullyLoaded();
    await dashboard.expectEmptyState();
  });

  test('should show empty gamification for new user', async ({ studentPage }) => {
    await mockGamificationStats(studentPage, true);
    await mockContinueLearning(studentPage, true);

    const dashboard = new DashboardPage(studentPage);
    await dashboard.goto();
    // New user with 0 XP should still render widgets
    await expect(dashboard.streakWidget).toBeVisible();
    await expect(dashboard.xpBar).toBeVisible();
  });
});

test.describe('Dashboard Responsive', () => {
  test('should show bottom nav on mobile viewport', async ({ studentPage }) => {
    await studentPage.setViewportSize({ width: 375, height: 812 });
    const layout = new LayoutPage(studentPage);
    const dashboard = new DashboardPage(studentPage);

    await dashboard.goto();
    await dashboard.expectFullyLoaded();
    await layout.expectBottomNavVisible();
  });

  test('should show sidenav on desktop viewport', async ({ studentPage }) => {
    await studentPage.setViewportSize({ width: 1280, height: 800 });
    const layout = new LayoutPage(studentPage);
    const dashboard = new DashboardPage(studentPage);

    await dashboard.goto();
    await dashboard.expectFullyLoaded();
    await layout.expectSidenavVisible();
  });
});
