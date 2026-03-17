import { Page, Locator, expect } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly googleButton: Locator;
  readonly errorBanner: Locator;
  readonly forgotPasswordLink: Locator;
  readonly registerLink: Locator;
  readonly passwordToggle: Locator;
  readonly spinner: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator('input[formControlName="email"]');
    this.passwordInput = page.locator('input[formControlName="password"]');
    this.submitButton = page.locator('button.login-button');
    this.googleButton = page.locator('button.google-button');
    this.errorBanner = page.locator('.error-banner');
    this.forgotPasswordLink = page.locator('a[routerLink="/auth/forgot-password"]');
    this.registerLink = page.locator('a[routerLink="/auth/register"]');
    this.passwordToggle = page.locator('button[aria-label="Показати пароль"]');
    this.spinner = page.locator('mat-spinner');
  }

  async goto(): Promise<void> {
    await this.page.goto('/auth/login');
    await this.page.waitForSelector('.login-container');
  }

  async login(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async expectFormVisible(): Promise<void> {
    await expect(this.emailInput).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
    await expect(this.submitButton).toBeVisible();
  }

  async expectErrorMessage(text: string): Promise<void> {
    await expect(this.errorBanner).toBeVisible();
    await expect(this.errorBanner).toContainText(text);
  }

  async expectNoError(): Promise<void> {
    await expect(this.errorBanner).not.toBeVisible();
  }
}
