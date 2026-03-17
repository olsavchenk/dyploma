import { Page, Locator, expect } from '@playwright/test';

export class RegisterPage {
  readonly page: Page;
  readonly displayNameInput: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly gdprCheckbox: Locator;
  readonly submitButton: Locator;
  readonly googleButton: Locator;
  readonly errorBanner: Locator;
  readonly loginLink: Locator;
  readonly passwordToggle: Locator;
  readonly confirmPasswordToggle: Locator;

  constructor(page: Page) {
    this.page = page;
    this.displayNameInput = page.locator('input[formControlName="displayName"]');
    this.emailInput = page.locator('input[formControlName="email"]');
    this.passwordInput = page.locator('input[formControlName="password"]');
    this.confirmPasswordInput = page.locator('input[formControlName="confirmPassword"]');
    this.gdprCheckbox = page.locator('mat-checkbox[formControlName="gdprConsent"]');
    this.submitButton = page.locator('button.register-button');
    this.googleButton = page.locator('button.google-button');
    this.errorBanner = page.locator('.error-banner');
    this.loginLink = page.locator('a[routerLink="/auth/login"]');
    this.passwordToggle = page.locator('button[aria-label="Показати пароль"]').first();
    this.confirmPasswordToggle = page.locator('button[aria-label="Показати пароль"]').last();
  }

  async goto(): Promise<void> {
    await this.page.goto('/auth/register');
    await this.page.waitForSelector('.register-container');
  }

  async register(name: string, email: string, password: string, confirmPassword?: string): Promise<void> {
    await this.displayNameInput.fill(name);
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.confirmPasswordInput.fill(confirmPassword ?? password);
    await this.gdprCheckbox.click();
    await this.submitButton.click();
  }

  async expectFormVisible(): Promise<void> {
    await expect(this.displayNameInput).toBeVisible();
    await expect(this.emailInput).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
    await expect(this.confirmPasswordInput).toBeVisible();
    await expect(this.gdprCheckbox).toBeVisible();
    await expect(this.submitButton).toBeVisible();
  }

  async expectErrorMessage(text: string): Promise<void> {
    await expect(this.errorBanner).toBeVisible();
    await expect(this.errorBanner).toContainText(text);
  }
}
