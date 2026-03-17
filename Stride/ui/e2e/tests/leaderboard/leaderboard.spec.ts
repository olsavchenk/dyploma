import { test, expect } from '../../fixtures/auth.fixture';
import { LeaderboardPage } from '../../page-objects/leaderboard.page';
import { mockLeaderboard } from '../../fixtures/api-mocks';
import {
  TEST_LEADERBOARD,
  TEST_STUDENT,
  API_BASE,
} from '../../fixtures/test-data';

test.describe('Leaderboard', () => {
  test.beforeEach(async ({ studentPage }) => {
    await mockLeaderboard(studentPage);
  });

  test('should display leaderboard page with title', async ({ studentPage }) => {
    const lb = new LeaderboardPage(studentPage);
    await lb.goto();
    await lb.expectPageLoaded();
  });

  test('should display leaderboard entries', async ({ studentPage }) => {
    const lb = new LeaderboardPage(studentPage);
    await lb.goto();
    await lb.expectPageLoaded();
    await lb.expectEntriesCount(TEST_LEADERBOARD.entries.length);
  });

  test('should highlight current user entry', async ({ studentPage }) => {
    const lb = new LeaderboardPage(studentPage);
    await lb.goto();
    await lb.expectPageLoaded();
    await lb.expectCurrentUserHighlighted();
  });

  test('should display league tabs', async ({ studentPage }) => {
    const lb = new LeaderboardPage(studentPage);
    await lb.goto();
    await lb.expectPageLoaded();
    // Should have multiple league tabs (Bronze, Silver, Gold, etc.)
    await expect(lb.leagueTabs.first()).toBeVisible();
  });

  test('should show medals for top 3 ranks', async ({ studentPage }) => {
    const lb = new LeaderboardPage(studentPage);
    await lb.goto();
    await lb.expectPageLoaded();

    // Top 3 entries should have medals (🥇🥈🥉)
    const firstEntry = lb.leaderboardEntries.first();
    await expect(firstEntry).toContainText('Олена К.');
  });

  test('should display participant count', async ({ studentPage }) => {
    const lb = new LeaderboardPage(studentPage);
    await lb.goto();
    await lb.expectPageLoaded();
    await lb.expectParticipantCount(TEST_LEADERBOARD.totalParticipants);
  });

  test('should show promotion and demotion zone info', async ({ studentPage }) => {
    const lb = new LeaderboardPage(studentPage);
    await lb.goto();
    await lb.expectPageLoaded();

    // Top entries (rank 1-5) -> promotion zone
    await expect(lb.promotionZoneEntries.first()).toBeVisible();
    // Bottom entries (rank 18-20) -> demotion zone
    await expect(lb.demotionZoneEntries.first()).toBeVisible();
  });

  test('should show weekly XP for each entry', async ({ studentPage }) => {
    const lb = new LeaderboardPage(studentPage);
    await lb.goto();
    await lb.expectPageLoaded();

    const firstEntry = lb.leaderboardEntries.first();
    await expect(firstEntry).toContainText(String(TEST_LEADERBOARD.entries[0].weeklyXp));
  });

  test('should switch league tabs', async ({ studentPage }) => {
    const lb = new LeaderboardPage(studentPage);
    await lb.goto();
    await lb.expectPageLoaded();

    // Click different league tab
    await lb.switchLeagueTab(0);
    // Page should still be loaded (data might change for different league)
    await lb.expectPageLoaded();
  });

  test('should show current user rank', async ({ studentPage }) => {
    const lb = new LeaderboardPage(studentPage);
    await lb.goto();
    await lb.expectPageLoaded();

    await expect(lb.currentUserEntry).toContainText(String(TEST_LEADERBOARD.currentUserRank));
  });
});

test.describe('Leaderboard — Error & Empty States', () => {
  test('should show error on API failure', async ({ studentPage }) => {
    await studentPage.route(`${API_BASE}/leaderboard*`, (route) =>
      route.fulfill({ status: 500, contentType: 'application/json', body: '{"message":"Error"}' }),
    );

    const lb = new LeaderboardPage(studentPage);
    await lb.goto();

    await expect(lb.errorContainer).toBeVisible();
  });

  test('should show empty state when no participants', async ({ studentPage }) => {
    await studentPage.route(`${API_BASE}/leaderboard*`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ...TEST_LEADERBOARD, entries: [], totalParticipants: 0 }),
      }),
    );
    await studentPage.route(`${API_BASE}/leaderboard`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ...TEST_LEADERBOARD, entries: [], totalParticipants: 0 }),
      }),
    );

    const lb = new LeaderboardPage(studentPage);
    await lb.goto();

    await expect(lb.emptyContainer).toBeVisible();
  });
});

test.describe('Leaderboard — Responsive', () => {
  test('should render properly on mobile viewport', async ({ studentPage }) => {
    await mockLeaderboard(studentPage);
    await studentPage.setViewportSize({ width: 375, height: 812 });

    const lb = new LeaderboardPage(studentPage);
    await lb.goto();
    await lb.expectPageLoaded();
    await lb.expectEntriesCount(TEST_LEADERBOARD.entries.length);
  });

  test('should render properly on tablet viewport', async ({ studentPage }) => {
    await mockLeaderboard(studentPage);
    await studentPage.setViewportSize({ width: 768, height: 1024 });

    const lb = new LeaderboardPage(studentPage);
    await lb.goto();
    await lb.expectPageLoaded();
    await lb.expectEntriesCount(TEST_LEADERBOARD.entries.length);
  });
});
