import { test, expect } from '@playwright/test';
import { RegisterPage } from '../../page-objects/auth/register.page';
import {
  mockRegisterSuccess,
  mockRegisterDuplicateEmail,
  mockSelectRole,
} from '../../fixtures/api-mocks';
import { TEST_NEW_USER, API_BASE } from '../../fixtures/test-data';

test.describe('Register Page', () => {
  let registerPage: RegisterPage;

  test.beforeEach(async ({ page }) => {
    registerPage = new RegisterPage(page);
  });

  test('should display registration form with all fields', async () => {
    await registerPage.goto();
    await registerPage.expectFormVisible();
    await expect(registerPage.loginLink).toBeVisible();
    await expect(registerPage.googleButton).toBeVisible();
  });

  test('should have submit button disabled with empty form', async () => {
    await registerPage.goto();
    await expect(registerPage.submitButton).toBeDisabled();
  });

  test('should show validation error for invalid email', async ({ page }) => {
    await registerPage.goto();
    await registerPage.emailInput.fill('bad-email');
    await registerPage.passwordInput.click(); // blur
    await expect(page.locator('mat-error')).toBeVisible();
  });

  test('should show validation error for mismatched passwords', async ({ page }) => {
    await registerPage.goto();
    await registerPage.displayNameInput.fill(TEST_NEW_USER.displayName);
    await registerPage.emailInput.fill(TEST_NEW_USER.email);
    await registerPage.passwordInput.fill(TEST_NEW_USER.password);
    await registerPage.confirmPasswordInput.fill('DifferentPass1!');
    await registerPage.displayNameInput.click(); // blur
    await expect(page.locator('mat-error')).toBeVisible();
  });

  test('should show validation error for short display name', async ({ page }) => {
    await registerPage.goto();
    await registerPage.displayNameInput.fill('A');
    await registerPage.emailInput.click(); // blur
    await expect(page.locator('mat-error')).toBeVisible();
  });

  test('should require GDPR consent', async ({ page }) => {
    await registerPage.goto();
    await registerPage.displayNameInput.fill(TEST_NEW_USER.displayName);
    await registerPage.emailInput.fill(TEST_NEW_USER.email);
    await registerPage.passwordInput.fill(TEST_NEW_USER.password);
    await registerPage.confirmPasswordInput.fill(TEST_NEW_USER.password);
    // Don't check GDPR
    await expect(registerPage.submitButton).toBeDisabled();
  });

  test('should register successfully and redirect to role selection', async ({ page }) => {
    await mockRegisterSuccess(page);
    await mockSelectRole(page);

    await registerPage.goto();
    await registerPage.register(
      TEST_NEW_USER.displayName,
      TEST_NEW_USER.email,
      TEST_NEW_USER.password,
    );

    await page.waitForURL('**/auth/select-role');
    expect(page.url()).toContain('/auth/select-role');
  });

  test('should show error for duplicate email', async ({ page }) => {
    await mockRegisterDuplicateEmail(page);

    await registerPage.goto();
    await registerPage.register(
      TEST_NEW_USER.displayName,
      'existing@test.com',
      TEST_NEW_USER.password,
    );

    await registerPage.expectErrorMessage('Користувач з таким email вже існує');
  });

  test('should toggle password visibility', async ({ page }) => {
    await registerPage.goto();
    await registerPage.passwordInput.fill('TestPass123!');
    await expect(registerPage.passwordInput).toHaveAttribute('type', 'password');

    await registerPage.passwordToggle.click();
    await expect(registerPage.passwordInput).toHaveAttribute('type', 'text');
  });

  test('should navigate to login page', async ({ page }) => {
    await registerPage.goto();
    await registerPage.loginLink.click();
    await page.waitForURL('**/auth/login');
    expect(page.url()).toContain('/auth/login');
  });

  test('should show loading state during submission', async ({ page }) => {
    await page.route(`${API_BASE}/auth/register`, async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ token: 'test', user: TEST_NEW_USER }),
      });
    });

    await registerPage.goto();
    await registerPage.register(
      TEST_NEW_USER.displayName,
      TEST_NEW_USER.email,
      TEST_NEW_USER.password,
    );

    await expect(page.locator('mat-spinner')).toBeVisible();
  });
});
