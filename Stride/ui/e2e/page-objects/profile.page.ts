import { Page, Locator, expect } from '@playwright/test';

export class ProfilePage {
  readonly page: Page;
  readonly avatar: Locator;
  readonly displayName: Locator;
  readonly email: Locator;
  readonly roleChip: Locator;
  readonly editButton: Locator;
  readonly exportDataButton: Locator;
  readonly deleteAccountButton: Locator;
  readonly statsSection: Locator;
  readonly notificationToggle: Locator;

  // Student stats
  readonly totalXp: Locator;
  readonly currentLevel: Locator;
  readonly currentStreak: Locator;
  readonly achievementsUnlocked: Locator;

  constructor(page: Page) {
    this.page = page;
    this.avatar = page.locator('.avatar, .profile-avatar').first();
    this.displayName = page.locator('.display-name, .profile-name, h1, h2').first();
    this.email = page.locator('.email, .profile-email');
    this.roleChip = page.locator('.role-chip, mat-chip').first();
    this.editButton = page.locator('button').filter({ hasText: /редагувати|Редагувати/i });
    this.exportDataButton = page.locator('button').filter({ hasText: /Експорт даних/i });
    this.deleteAccountButton = page.locator('button').filter({ hasText: /Видалити акаунт/i });
    this.statsSection = page.locator('.stats-section, .statistics');
    this.notificationToggle = page.locator('mat-slide-toggle').first();

    this.totalXp = page.locator('.stat-item, .stat-card').filter({ hasText: /XP/i }).first();
    this.currentLevel = page.locator('.stat-item, .stat-card').filter({ hasText: /рівень|Рівень/i }).first();
    this.currentStreak = page.locator('.stat-item, .stat-card').filter({ hasText: /серія|Серія/i }).first();
    this.achievementsUnlocked = page.locator('.stat-item, .stat-card').filter({ hasText: /досягнення|Досягнення/i }).first();
  }

  async goto(): Promise<void> {
    await this.page.goto('/profile');
    await this.page.waitForLoadState('networkidle');
  }

  async expectPageLoaded(): Promise<void> {
    await expect(this.displayName).toBeVisible({ timeout: 10_000 });
  }

  async expectDisplayName(name: string): Promise<void> {
    await expect(this.displayName).toContainText(name);
  }

  async expectEmail(email: string): Promise<void> {
    await expect(this.email).toContainText(email);
  }

  async openEditDialog(): Promise<void> {
    await this.editButton.click();
  }

  async expectStatsVisible(): Promise<void> {
    await expect(this.statsSection).toBeVisible();
  }

  async clickExportData(): Promise<void> {
    await this.exportDataButton.click();
  }

  async clickDeleteAccount(): Promise<void> {
    await this.deleteAccountButton.click();
  }
}

export class EditProfileDialog {
  readonly page: Page;
  readonly displayNameInput: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;
  readonly dialog: Locator;

  constructor(page: Page) {
    this.page = page;
    this.dialog = page.locator('mat-dialog-container');
    this.displayNameInput = page.locator('mat-dialog-container input[formControlName="displayName"]');
    this.saveButton = page.locator('mat-dialog-container button').filter({ hasText: /зберегти|Зберегти/i });
    this.cancelButton = page.locator('mat-dialog-container button').filter({ hasText: /скасувати|Скасувати/i });
  }

  async expectOpen(): Promise<void> {
    await expect(this.dialog).toBeVisible();
  }

  async updateDisplayName(name: string): Promise<void> {
    await this.displayNameInput.clear();
    await this.displayNameInput.fill(name);
  }

  async save(): Promise<void> {
    await this.saveButton.click();
  }

  async cancel(): Promise<void> {
    await this.cancelButton.click();
  }
}
