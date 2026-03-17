import { Page, Locator, expect } from '@playwright/test';

export class ForgotPasswordPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly submitButton: Locator;
  readonly successBanner: Locator;
  readonly errorBanner: Locator;
  readonly backToLoginLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator('input[formControlName="email"]');
    this.submitButton = page.locator('button.submit-button');
    this.successBanner = page.locator('.success-banner');
    this.errorBanner = page.locator('.error-banner');
    this.backToLoginLink = page.locator('a[routerLink="/auth/login"]');
  }

  async goto(): Promise<void> {
    await this.page.goto('/auth/forgot-password');
    await this.page.waitForSelector('.forgot-password-container');
  }

  async submitEmail(email: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.submitButton.click();
  }

  async expectFormVisible(): Promise<void> {
    await expect(this.emailInput).toBeVisible();
    await expect(this.submitButton).toBeVisible();
  }

  async expectSuccessMessage(): Promise<void> {
    await expect(this.successBanner).toBeVisible();
  }
}
