import { Page, Locator, expect } from '@playwright/test';

export class DashboardPage {
  readonly page: Page;
  readonly welcomeMessage: Locator;
  readonly streakWidget: Locator;
  readonly xpBar: Locator;
  readonly continueLearningSection: Locator;
  readonly topicCards: Locator;
  readonly leaderboardPreview: Locator;
  readonly firstTaskBonus: Locator;
  readonly emptyState: Locator;
  readonly loadingSpinner: Locator;
  readonly refreshButton: Locator;
  readonly quickActions: Locator;

  constructor(page: Page) {
    this.page = page;
    this.welcomeMessage = page.locator('.welcome-section h1, .welcome-section h2').first();
    this.streakWidget = page.locator('app-streak-widget');
    this.xpBar = page.locator('app-xp-bar');
    this.continueLearningSection = page.locator('.continue-learning');
    this.topicCards = page.locator('app-topic-card');
    this.leaderboardPreview = page.locator('app-leaderboard-preview');
    this.firstTaskBonus = page.locator('app-first-task-bonus');
    this.emptyState = page.locator('.empty-state');
    this.loadingSpinner = page.locator('mat-spinner');
    this.refreshButton = page.locator('button').filter({ hasText: 'refresh' });
    this.quickActions = page.locator('.quick-actions');
  }

  async goto(): Promise<void> {
    await this.page.goto('/dashboard');
    await this.page.waitForLoadState('networkidle');
  }

  async expectFullyLoaded(): Promise<void> {
    await expect(this.streakWidget).toBeVisible({ timeout: 10_000 });
    await expect(this.xpBar).toBeVisible();
  }

  async expectWelcomeMessage(name: string): Promise<void> {
    await expect(this.welcomeMessage).toContainText(name);
  }

  async expectStreakCount(count: number): Promise<void> {
    await expect(this.streakWidget).toContainText(String(count));
  }

  async expectXpLevel(level: number): Promise<void> {
    await expect(this.xpBar).toContainText(String(level));
  }

  async expectContinueLearningCards(count: number): Promise<void> {
    await expect(this.topicCards).toHaveCount(count);
  }

  async expectEmptyState(): Promise<void> {
    await expect(this.emptyState).toBeVisible();
  }

  async clickContinueLearning(index: number): Promise<void> {
    await this.topicCards.nth(index).click();
  }

  async expectLeaderboardPreviewVisible(): Promise<void> {
    await expect(this.leaderboardPreview).toBeVisible();
  }
}
