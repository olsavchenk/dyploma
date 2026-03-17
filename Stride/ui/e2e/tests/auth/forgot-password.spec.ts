import { test, expect } from '@playwright/test';
import { ForgotPasswordPage } from '../../page-objects/auth/forgot-password.page';
import { mockForgotPassword } from '../../fixtures/api-mocks';
import { TEST_STUDENT, API_BASE } from '../../fixtures/test-data';

test.describe('Forgot Password Page', () => {
  let forgotPage: ForgotPasswordPage;

  test.beforeEach(async ({ page }) => {
    forgotPage = new ForgotPasswordPage(page);
  });

  test('should display forgot password form', async () => {
    await forgotPage.goto();
    await forgotPage.expectFormVisible();
    await expect(forgotPage.backToLoginLink).toBeVisible();
  });

  test('should have submit disabled with empty email', async () => {
    await forgotPage.goto();
    await expect(forgotPage.submitButton).toBeDisabled();
  });

  test('should show validation error for invalid email', async ({ page }) => {
    await forgotPage.goto();
    await forgotPage.emailInput.fill('not-an-email');
    await page.locator('body').click(); // blur
    await expect(page.locator('mat-error')).toBeVisible();
  });

  test('should submit successfully and show success message', async ({ page }) => {
    await mockForgotPassword(page);

    await forgotPage.goto();
    await forgotPage.submitEmail(TEST_STUDENT.email);
    await forgotPage.expectSuccessMessage();
  });

  test('should navigate back to login', async ({ page }) => {
    await forgotPage.goto();
    await forgotPage.backToLoginLink.click();
    await page.waitForURL('**/auth/login');
    expect(page.url()).toContain('/auth/login');
  });

  test('should show error on server failure', async ({ page }) => {
    await page.route(`${API_BASE}/auth/forgot-password`, (route) =>
      route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ message: 'Помилка сервера' }) }),
    );

    await forgotPage.goto();
    await forgotPage.submitEmail(TEST_STUDENT.email);
    await expect(forgotPage.errorBanner).toBeVisible();
  });
});
