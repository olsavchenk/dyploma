import { test, expect } from '@playwright/test';
import { LoginPage } from '../../page-objects/auth/login.page';
import {
  mockLoginSuccess,
  mockLoginFailure,
  mockGamificationStats,
  mockContinueLearning,
  mockLeaderboardPreview,
  mockUserProfile,
} from '../../fixtures/api-mocks';
import { TEST_STUDENT, API_BASE } from '../../fixtures/test-data';

test.describe('Login Page', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
  });

  test('should display login form with all elements', async ({ page }) => {
    await loginPage.goto();
    await loginPage.expectFormVisible();
    await expect(loginPage.forgotPasswordLink).toBeVisible();
    await expect(loginPage.registerLink).toBeVisible();
    await expect(loginPage.googleButton).toBeVisible();
  });

  test('should have submit button disabled with empty form', async ({ page }) => {
    await loginPage.goto();
    await expect(loginPage.submitButton).toBeDisabled();
  });

  test('should show validation errors for invalid email', async ({ page }) => {
    await loginPage.goto();
    await loginPage.emailInput.fill('not-an-email');
    await loginPage.passwordInput.click(); // blur email
    await expect(page.locator('mat-error')).toBeVisible();
  });

  test('should show validation error for short password', async ({ page }) => {
    await loginPage.goto();
    await loginPage.emailInput.fill(TEST_STUDENT.email);
    await loginPage.passwordInput.fill('ab');
    await loginPage.emailInput.click(); // blur password
    await expect(page.locator('mat-error')).toBeVisible();
  });

  test('should toggle password visibility', async ({ page }) => {
    await loginPage.goto();
    await loginPage.passwordInput.fill('TestPass123!');
    await expect(loginPage.passwordInput).toHaveAttribute('type', 'password');

    await loginPage.passwordToggle.click();
    await expect(loginPage.passwordInput).toHaveAttribute('type', 'text');

    await loginPage.passwordToggle.click();
    await expect(loginPage.passwordInput).toHaveAttribute('type', 'password');
  });

  test('should login successfully and redirect to dashboard', async ({ page }) => {
    await mockLoginSuccess(page);
    await mockGamificationStats(page);
    await mockContinueLearning(page);
    await mockLeaderboardPreview(page);
    await mockUserProfile(page);

    await loginPage.goto();
    await loginPage.login(TEST_STUDENT.email, TEST_STUDENT.password);

    await page.waitForURL('**/dashboard');
    expect(page.url()).toContain('/dashboard');
  });

  test('should store token and user in localStorage after login', async ({ page }) => {
    await mockLoginSuccess(page);
    await mockGamificationStats(page);
    await mockContinueLearning(page);
    await mockLeaderboardPreview(page);
    await mockUserProfile(page);

    await loginPage.goto();
    await loginPage.login(TEST_STUDENT.email, TEST_STUDENT.password);
    await page.waitForURL('**/dashboard');

    const token = await page.evaluate(() => localStorage.getItem('stride_access_token'));
    const user = await page.evaluate(() => localStorage.getItem('stride_user'));
    expect(token).toBeTruthy();
    expect(user).toBeTruthy();
    const parsed = JSON.parse(user!);
    expect(parsed.email).toBe(TEST_STUDENT.email);
  });

  test('should display error banner on invalid credentials', async ({ page }) => {
    await mockLoginFailure(page);

    await loginPage.goto();
    await loginPage.login(TEST_STUDENT.email, 'WrongPassword');
    await loginPage.expectErrorMessage('Невірні облікові дані');
  });

  test('should display custom error message from server', async ({ page }) => {
    await mockLoginFailure(page, 'Акаунт заблоковано');

    await loginPage.goto();
    await loginPage.login(TEST_STUDENT.email, TEST_STUDENT.password);
    await loginPage.expectErrorMessage('Акаунт заблоковано');
  });

  test('should show loading spinner during login request', async ({ page }) => {
    // Delay the response to observe loading state
    await page.route(`${API_BASE}/auth/login`, async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ token: 'test', user: TEST_STUDENT }),
      });
    });

    await loginPage.goto();
    await loginPage.emailInput.fill(TEST_STUDENT.email);
    await loginPage.passwordInput.fill(TEST_STUDENT.password);
    await loginPage.submitButton.click();

    await expect(loginPage.spinner).toBeVisible();
  });

  test('should navigate to register page', async ({ page }) => {
    await loginPage.goto();
    await loginPage.registerLink.click();
    await page.waitForURL('**/auth/register');
    expect(page.url()).toContain('/auth/register');
  });

  test('should navigate to forgot password page', async ({ page }) => {
    await loginPage.goto();
    await loginPage.forgotPasswordLink.click();
    await page.waitForURL('**/auth/forgot-password');
    expect(page.url()).toContain('/auth/forgot-password');
  });

  test('should clear error after successful re-submission', async ({ page }) => {
    await mockLoginFailure(page);
    await loginPage.goto();
    await loginPage.login(TEST_STUDENT.email, 'Wrong');
    await loginPage.expectErrorMessage('Невірні облікові дані');

    // Now mock success and resubmit
    await page.unrouteAll();
    await mockLoginSuccess(page);
    await mockGamificationStats(page);
    await mockContinueLearning(page);
    await mockLeaderboardPreview(page);
    await mockUserProfile(page);

    await loginPage.passwordInput.clear();
    await loginPage.passwordInput.fill(TEST_STUDENT.password);
    await loginPage.submitButton.click();

    await page.waitForURL('**/dashboard');
    expect(page.url()).toContain('/dashboard');
  });

  test('should redirect authenticated user away from login page', async ({ page }) => {
    // Pre-set auth
    await page.addInitScript(({ token, user }) => {
      localStorage.setItem('stride_access_token', token);
      localStorage.setItem('stride_user', JSON.stringify(user));
    }, { token: 'fake-token', user: TEST_STUDENT });

    await mockGamificationStats(page);
    await mockContinueLearning(page);
    await mockLeaderboardPreview(page);
    await mockUserProfile(page);
    await page.route(`${API_BASE}/auth/refresh`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ token: 'fake-token' }) }),
    );

    await page.goto('/auth/login');
    await page.waitForURL('**/dashboard');
    expect(page.url()).toContain('/dashboard');
  });
});
