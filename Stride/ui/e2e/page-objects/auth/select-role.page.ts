import { Page, Locator, expect } from '@playwright/test';

export class SelectRolePage {
  readonly page: Page;
  readonly studentCard: Locator;
  readonly teacherCard: Locator;
  readonly confirmButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.studentCard = page.locator('.role-card').filter({ hasText: 'Учень' });
    this.teacherCard = page.locator('.role-card').filter({ hasText: 'Вчитель' });
    this.confirmButton = page.locator('button.confirm-button');
    this.errorMessage = page.locator('.error-banner');
  }

  async goto(): Promise<void> {
    await this.page.goto('/auth/select-role');
    await this.page.waitForSelector('.select-role-container');
  }

  async selectStudent(): Promise<void> {
    await this.studentCard.click();
  }

  async selectTeacher(): Promise<void> {
    await this.teacherCard.click();
  }

  async confirm(): Promise<void> {
    await this.confirmButton.click();
  }

  async expectBothRolesVisible(): Promise<void> {
    await expect(this.studentCard).toBeVisible();
    await expect(this.teacherCard).toBeVisible();
  }

  async expectConfirmDisabled(): Promise<void> {
    await expect(this.confirmButton).toBeDisabled();
  }

  async expectCardSelected(role: 'student' | 'teacher'): Promise<void> {
    const card = role === 'student' ? this.studentCard : this.teacherCard;
    await expect(card).toHaveClass(/selected/);
  }
}
