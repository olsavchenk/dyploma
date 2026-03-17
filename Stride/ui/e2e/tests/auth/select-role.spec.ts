import { test, expect } from '@playwright/test';
import { SelectRolePage } from '../../page-objects/auth/select-role.page';
import { mockSelectRole, mockGamificationStats, mockContinueLearning, mockLeaderboardPreview, mockUserProfile } from '../../fixtures/api-mocks';
import { TEST_NEW_USER, TEST_JWT_TOKEN, API_BASE } from '../../fixtures/test-data';

test.describe('Select Role Page', () => {
  let selectRolePage: SelectRolePage;

  test.beforeEach(async ({ page }) => {
    // Pre-authenticate as new user (no role yet)
    await page.addInitScript(
      ({ token, user }) => {
        localStorage.setItem('stride_access_token', token);
        localStorage.setItem('stride_user', JSON.stringify(user));
      },
      { token: TEST_JWT_TOKEN, user: TEST_NEW_USER },
    );
    await page.route(`${API_BASE}/auth/refresh`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ token: TEST_JWT_TOKEN }) }),
    );
    selectRolePage = new SelectRolePage(page);
  });

  test('should display both role cards', async () => {
    await selectRolePage.goto();
    await selectRolePage.expectBothRolesVisible();
  });

  test('should have confirm button disabled initially', async () => {
    await selectRolePage.goto();
    await selectRolePage.expectConfirmDisabled();
  });

  test('should highlight student card when selected', async () => {
    await selectRolePage.goto();
    await selectRolePage.selectStudent();
    await selectRolePage.expectCardSelected('student');
  });

  test('should highlight teacher card when selected', async () => {
    await selectRolePage.goto();
    await selectRolePage.selectTeacher();
    await selectRolePage.expectCardSelected('teacher');
  });

  test('should enable confirm after role selection', async ({ page }) => {
    await selectRolePage.goto();
    await selectRolePage.selectStudent();
    await expect(selectRolePage.confirmButton).toBeEnabled();
  });

  test('should switch selection between roles', async () => {
    await selectRolePage.goto();
    await selectRolePage.selectStudent();
    await selectRolePage.expectCardSelected('student');

    await selectRolePage.selectTeacher();
    await selectRolePage.expectCardSelected('teacher');
  });

  test('should submit student role and redirect to dashboard', async ({ page }) => {
    await mockSelectRole(page);
    await mockGamificationStats(page);
    await mockContinueLearning(page);
    await mockLeaderboardPreview(page);
    await mockUserProfile(page);

    await selectRolePage.goto();
    await selectRolePage.selectStudent();
    await selectRolePage.confirm();

    await page.waitForURL('**/dashboard');
    expect(page.url()).toContain('/dashboard');
  });
});
