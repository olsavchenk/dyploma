import { Page, Locator, expect } from '@playwright/test';

export class LearnBrowsePage {
  readonly page: Page;
  readonly pageTitle: Locator;
  readonly searchInput: Locator;
  readonly searchClearButton: Locator;
  readonly subjectCards: Locator;
  readonly joinClassButton: Locator;
  readonly joinCodeInput: Locator;
  readonly emptyState: Locator;
  readonly noResults: Locator;
  readonly classHeaders: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageTitle = page.locator('h1').filter({ hasText: 'Навчання' });
    this.searchInput = page.locator('input[formControl="searchControl"], input[placeholder*="Шукати"], input[type="search"]').first();
    this.searchClearButton = page.locator('button').filter({ hasText: 'close' }).first();
    this.subjectCards = page.locator('.subject-card');
    this.joinClassButton = page.locator('button').filter({ hasText: 'Приєднатися до класу' });
    this.joinCodeInput = page.locator('input[formControl="joinCodeControl"], input[maxlength="6"]').first();
    this.emptyState = page.locator('.empty-state');
    this.noResults = page.locator('.empty-state').filter({ hasText: 'search_off' });
    this.classHeaders = page.locator('.class-header, .class-section h2, .class-name');
  }

  async goto(): Promise<void> {
    await this.page.goto('/learn');
    await this.page.waitForLoadState('networkidle');
  }

  async expectPageLoaded(): Promise<void> {
    await expect(this.pageTitle).toBeVisible({ timeout: 10_000 });
  }

  async expectSubjectCount(count: number): Promise<void> {
    await expect(this.subjectCards).toHaveCount(count);
  }

  async searchSubjects(query: string): Promise<void> {
    await this.searchInput.fill(query);
  }

  async clickSubject(index: number): Promise<void> {
    await this.subjectCards.nth(index).click();
  }

  async expectSubjectCardText(index: number, text: string): Promise<void> {
    await expect(this.subjectCards.nth(index)).toContainText(text);
  }

  async expectEmptyState(): Promise<void> {
    await expect(this.emptyState).toBeVisible();
  }
}
