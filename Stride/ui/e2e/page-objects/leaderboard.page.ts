import { Page, Locator, expect } from '@playwright/test';

export class LeaderboardPage {
  readonly page: Page;
  readonly pageTitle: Locator;
  readonly leagueTabs: Locator;
  readonly refreshButton: Locator;
  readonly loadingSpinner: Locator;
  readonly errorContainer: Locator;
  readonly emptyContainer: Locator;
  readonly leaderboardEntries: Locator;
  readonly currentUserEntry: Locator;
  readonly promotionZoneEntries: Locator;
  readonly demotionZoneEntries: Locator;
  readonly infoBanner: Locator;
  readonly participantCount: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageTitle = page.locator('h1').filter({ hasText: 'Таблиця лідерів' });
    this.leagueTabs = page.locator('.league-tab-label');
    this.refreshButton = page.locator('button.refresh-button');
    this.loadingSpinner = page.locator('mat-spinner');
    this.errorContainer = page.locator('.error-container');
    this.emptyContainer = page.locator('.empty-container');
    this.leaderboardEntries = page.locator('.leaderboard-entry');
    this.currentUserEntry = page.locator('.leaderboard-entry.current-user');
    this.promotionZoneEntries = page.locator('.leaderboard-entry.promotion-zone');
    this.demotionZoneEntries = page.locator('.leaderboard-entry.demotion-zone');
    this.infoBanner = page.locator('.info-banner');
    this.participantCount = page.locator('.info-item').filter({ hasText: 'учасників' });
  }

  async goto(): Promise<void> {
    await this.page.goto('/leaderboard');
    await this.page.waitForLoadState('networkidle');
  }

  async expectPageLoaded(): Promise<void> {
    await expect(this.pageTitle).toBeVisible({ timeout: 10_000 });
  }

  async expectEntriesCount(count: number): Promise<void> {
    await expect(this.leaderboardEntries).toHaveCount(count);
  }

  async expectCurrentUserHighlighted(): Promise<void> {
    await expect(this.currentUserEntry).toBeVisible();
    await expect(this.currentUserEntry).toContainText('Ви');
  }

  async switchLeagueTab(index: number): Promise<void> {
    await this.leagueTabs.nth(index).click();
  }

  async expectLeagueTabCount(count: number): Promise<void> {
    await expect(this.leagueTabs).toHaveCount(count);
  }

  async expectMedalForRank(rank: number, emoji: string): Promise<void> {
    const entry = this.leaderboardEntries.filter({ hasText: emoji });
    await expect(entry).toBeVisible();
  }

  async expectParticipantCount(count: number): Promise<void> {
    await expect(this.participantCount).toContainText(String(count));
  }

  async expectPromotionZoneInfo(): Promise<void> {
    await expect(this.infoBanner.locator('.promotion')).toBeVisible();
  }

  async expectDemotionZoneInfo(): Promise<void> {
    await expect(this.infoBanner.locator('.demotion')).toBeVisible();
  }
}
