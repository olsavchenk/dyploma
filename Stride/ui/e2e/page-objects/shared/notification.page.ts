import { Page, Locator, expect } from '@playwright/test';

export class NotificationComponents {
  readonly page: Page;
  readonly achievementToast: Locator;
  readonly achievementToastName: Locator;
  readonly achievementToastXp: Locator;
  readonly achievementToastClose: Locator;
  readonly levelUpOverlay: Locator;
  readonly levelUpBadge: Locator;
  readonly levelUpTitle: Locator;
  readonly levelUpContinue: Locator;

  constructor(page: Page) {
    this.page = page;
    // Achievement toast
    this.achievementToast = page.locator('app-achievement-toast .achievement-toast');
    this.achievementToastName = page.locator('app-achievement-toast .achievement-name');
    this.achievementToastXp = page.locator('app-achievement-toast .xp-reward');
    this.achievementToastClose = page.locator('app-achievement-toast .close-btn');
    // Level-up celebration
    this.levelUpOverlay = page.locator('app-level-up-celebration .celebration-overlay');
    this.levelUpBadge = page.locator('app-level-up-celebration .level-number');
    this.levelUpTitle = page.locator('app-level-up-celebration .celebration-title');
    this.levelUpContinue = page.locator('app-level-up-celebration .continue-btn');
  }

  async expectAchievementToast(name: string): Promise<void> {
    await expect(this.achievementToast).toBeVisible({ timeout: 5_000 });
    await expect(this.achievementToastName).toContainText(name);
  }

  async closeAchievementToast(): Promise<void> {
    await this.achievementToastClose.click();
  }

  async expectLevelUpCelebration(level: number): Promise<void> {
    await expect(this.levelUpOverlay).toBeVisible({ timeout: 5_000 });
    await expect(this.levelUpBadge).toContainText(String(level));
    await expect(this.levelUpTitle).toContainText('Вітаємо!');
  }

  async dismissLevelUp(): Promise<void> {
    await this.levelUpContinue.click();
  }
}
