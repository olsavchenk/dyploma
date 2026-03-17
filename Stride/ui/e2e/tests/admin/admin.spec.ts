import { test, expect } from '../../fixtures/auth.fixture';
import {
  AdminDashboardPage,
  AiReviewPage,
  RejectDialog,
  UsersPage,
  ChangeRoleDialog,
} from '../../page-objects/admin/admin.page';
import {
  mockAdminDashboard,
  mockAdminUsers,
  mockAdminReviewQueue,
} from '../../fixtures/api-mocks';
import {
  TEST_ADMIN_DASHBOARD,
  TEST_ADMIN_USERS,
  TEST_REVIEW_QUEUE,
  API_BASE,
} from '../../fixtures/test-data';

test.describe('Admin — Dashboard', () => {
  test.beforeEach(async ({ adminPage }) => {
    await mockAdminDashboard(adminPage);
  });

  test('should display admin dashboard with title', async ({ adminPage }) => {
    const dashboard = new AdminDashboardPage(adminPage);
    await dashboard.goto();
    await dashboard.expectPageLoaded();
  });

  test('should show KPI cards', async ({ adminPage }) => {
    const dashboard = new AdminDashboardPage(adminPage);
    await dashboard.goto();
    await dashboard.expectPageLoaded();

    // Should display total users KPI
    await dashboard.expectKpiText(String(TEST_ADMIN_DASHBOARD.totalUsers));
  });

  test('should show active users stats', async ({ adminPage }) => {
    const dashboard = new AdminDashboardPage(adminPage);
    await dashboard.goto();
    await dashboard.expectPageLoaded();

    await dashboard.expectKpiText(String(TEST_ADMIN_DASHBOARD.activeUsersToday));
  });

  test('should show pending AI reviews count', async ({ adminPage }) => {
    const dashboard = new AdminDashboardPage(adminPage);
    await dashboard.goto();
    await dashboard.expectPageLoaded();

    await dashboard.expectKpiText(String(TEST_ADMIN_DASHBOARD.pendingAIReviews));
  });

  test('should show average accuracy', async ({ adminPage }) => {
    const dashboard = new AdminDashboardPage(adminPage);
    await dashboard.goto();
    await dashboard.expectPageLoaded();

    await expect(adminPage.locator('body')).toContainText(String(TEST_ADMIN_DASHBOARD.averageAccuracy));
  });
});

test.describe('Admin — AI Review Queue', () => {
  test.beforeEach(async ({ adminPage }) => {
    await mockAdminDashboard(adminPage);
    await mockAdminReviewQueue(adminPage);
  });

  test('should display review queue page', async ({ adminPage }) => {
    const review = new AiReviewPage(adminPage);
    await review.goto();
    await review.expectPageLoaded();
  });

  test('should show review items', async ({ adminPage }) => {
    const review = new AiReviewPage(adminPage);
    await review.goto();
    await review.expectPageLoaded();
    await review.expectReviewCount(TEST_REVIEW_QUEUE.items.length);
  });

  test('should display review item details', async ({ adminPage }) => {
    const review = new AiReviewPage(adminPage);
    await review.goto();
    await review.expectPageLoaded();

    await expect(review.reviewRows.first()).toContainText(TEST_REVIEW_QUEUE.items[0].subjectName);
    await expect(review.reviewRows.first()).toContainText(TEST_REVIEW_QUEUE.items[0].taskType);
  });

  test('should approve a review item', async ({ adminPage }) => {
    const review = new AiReviewPage(adminPage);
    await review.goto();
    await review.expectPageLoaded();

    await review.approveItem(0);

    // Item should be removed or status updated
    await adminPage.waitForTimeout(500);
  });

  test('should reject a review item with reason', async ({ adminPage }) => {
    const review = new AiReviewPage(adminPage);
    const rejectDialog = new RejectDialog(adminPage);

    await review.goto();
    await review.expectPageLoaded();

    await review.rejectItem(0);
    await rejectDialog.expectOpen();

    await rejectDialog.fillReason('Неправильне формулювання задачі');
    await rejectDialog.submit();

    await expect(rejectDialog.dialog).not.toBeVisible();
  });

  test('should cancel rejection', async ({ adminPage }) => {
    const review = new AiReviewPage(adminPage);
    const rejectDialog = new RejectDialog(adminPage);

    await review.goto();
    await review.expectPageLoaded();

    await review.rejectItem(0);
    await rejectDialog.expectOpen();

    await rejectDialog.cancelButton.click();
    await expect(rejectDialog.dialog).not.toBeVisible();
  });

  test('should show provider info for each item', async ({ adminPage }) => {
    const review = new AiReviewPage(adminPage);
    await review.goto();
    await review.expectPageLoaded();

    await expect(review.reviewRows.first()).toContainText(TEST_REVIEW_QUEUE.items[0].provider);
  });
});

test.describe('Admin — User Management', () => {
  test.beforeEach(async ({ adminPage }) => {
    await mockAdminDashboard(adminPage);
    await mockAdminUsers(adminPage);
  });

  test('should display users page', async ({ adminPage }) => {
    const users = new UsersPage(adminPage);
    await users.goto();
    await users.expectPageLoaded();
  });

  test('should show user list', async ({ adminPage }) => {
    const users = new UsersPage(adminPage);
    await users.goto();
    await users.expectPageLoaded();
    await users.expectUserCount(TEST_ADMIN_USERS.users.length);
  });

  test('should display user details in table', async ({ adminPage }) => {
    const users = new UsersPage(adminPage);
    await users.goto();
    await users.expectPageLoaded();

    await expect(users.userRows.first()).toContainText(TEST_ADMIN_USERS.users[0].displayName);
    await expect(users.userRows.first()).toContainText(TEST_ADMIN_USERS.users[0].email);
    await expect(users.userRows.first()).toContainText(TEST_ADMIN_USERS.users[0].role);
  });

  test('should search users', async ({ adminPage }) => {
    const users = new UsersPage(adminPage);
    await users.goto();
    await users.expectPageLoaded();

    await users.searchUsers('Олена');
    await adminPage.waitForTimeout(500);
    // Search should filter or trigger API call
  });

  test('should change user role', async ({ adminPage }) => {
    const users = new UsersPage(adminPage);
    const roleDialog = new ChangeRoleDialog(adminPage);

    await users.goto();
    await users.expectPageLoaded();

    await users.changeRoleButtons.first().click();
    await roleDialog.expectOpen();

    await roleDialog.selectRole('Teacher');
    await roleDialog.confirm();

    await expect(roleDialog.dialog).not.toBeVisible();
  });

  test('should cancel role change', async ({ adminPage }) => {
    const users = new UsersPage(adminPage);
    const roleDialog = new ChangeRoleDialog(adminPage);

    await users.goto();
    await users.expectPageLoaded();

    await users.changeRoleButtons.first().click();
    await roleDialog.expectOpen();

    await roleDialog.cancelButton.click();
    await expect(roleDialog.dialog).not.toBeVisible();
  });
});
