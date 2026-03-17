import { Page, Locator, expect } from '@playwright/test';

export class AdminDashboardPage {
  readonly page: Page;
  readonly pageTitle: Locator;
  readonly kpiCards: Locator;
  readonly activityFeed: Locator;
  readonly quickLinks: Locator;
  readonly loadingSpinner: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageTitle = page.locator('h1').filter({ hasText: /Панель адміністратора|Адмін/i });
    this.kpiCards = page.locator('.kpi-card, .stat-card, mat-card.kpi');
    this.activityFeed = page.locator('.activity-feed, .recent-activity');
    this.quickLinks = page.locator('.quick-links, .quick-actions');
    this.loadingSpinner = page.locator('mat-spinner');
  }

  async goto(): Promise<void> {
    await this.page.goto('/admin');
    await this.page.waitForLoadState('networkidle');
  }

  async expectPageLoaded(): Promise<void> {
    await expect(this.pageTitle).toBeVisible({ timeout: 10_000 });
  }

  async expectKpiCardCount(count: number): Promise<void> {
    await expect(this.kpiCards).toHaveCount(count);
  }

  async expectKpiText(text: string): Promise<void> {
    await expect(this.page.locator('.kpi-card, .stat-card').filter({ hasText: text })).toBeVisible();
  }
}

export class AiReviewPage {
  readonly page: Page;
  readonly pageTitle: Locator;
  readonly reviewTable: Locator;
  readonly reviewRows: Locator;
  readonly filters: Locator;
  readonly approveButtons: Locator;
  readonly rejectButtons: Locator;
  readonly emptyState: Locator;
  readonly loadingSpinner: Locator;
  readonly expandButtons: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageTitle = page.locator('h1').filter({ hasText: /Черга перевірки AI|Перевірка AI/i });
    this.reviewTable = page.locator('mat-table, table').first();
    this.reviewRows = page.locator('mat-row, tr').filter({ has: page.locator('td, mat-cell') });
    this.filters = page.locator('.filters, .filter-section');
    this.approveButtons = page.locator('button').filter({ hasText: /Схвалити/i });
    this.rejectButtons = page.locator('button').filter({ hasText: /Відхилити/i });
    this.emptyState = page.locator('.empty-state');
    this.loadingSpinner = page.locator('mat-spinner');
    this.expandButtons = page.locator('button').filter({ hasText: /expand_more|Деталі/i });
  }

  async goto(): Promise<void> {
    await this.page.goto('/admin/ai-review');
    await this.page.waitForLoadState('networkidle');
  }

  async expectPageLoaded(): Promise<void> {
    await expect(this.pageTitle).toBeVisible({ timeout: 10_000 });
  }

  async expectReviewCount(count: number): Promise<void> {
    await expect(this.reviewRows).toHaveCount(count);
  }

  async approveItem(index: number): Promise<void> {
    await this.approveButtons.nth(index).click();
  }

  async rejectItem(index: number): Promise<void> {
    await this.rejectButtons.nth(index).click();
  }
}

export class RejectDialog {
  readonly page: Page;
  readonly dialog: Locator;
  readonly reasonTextarea: Locator;
  readonly submitButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.dialog = page.locator('mat-dialog-container');
    this.reasonTextarea = page.locator('mat-dialog-container textarea');
    this.submitButton = page.locator('mat-dialog-container button').filter({ hasText: /Відхилити|підтвердити/i });
    this.cancelButton = page.locator('mat-dialog-container button').filter({ hasText: /Скасувати/i });
  }

  async expectOpen(): Promise<void> {
    await expect(this.dialog).toBeVisible();
  }

  async fillReason(reason: string): Promise<void> {
    await this.reasonTextarea.fill(reason);
  }

  async submit(): Promise<void> {
    await this.submitButton.click();
  }
}

export class UsersPage {
  readonly page: Page;
  readonly pageTitle: Locator;
  readonly searchInput: Locator;
  readonly userTable: Locator;
  readonly userRows: Locator;
  readonly roleFilter: Locator;
  readonly loadingSpinner: Locator;
  readonly changeRoleButtons: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageTitle = page.locator('h1').filter({ hasText: /Користувачі|Управління/i });
    this.searchInput = page.locator('input[type="search"], input[placeholder*="Пошук"], input').first();
    this.userTable = page.locator('mat-table, table').first();
    this.userRows = page.locator('mat-row, tr').filter({ has: page.locator('td, mat-cell') });
    this.roleFilter = page.locator('mat-select').first();
    this.loadingSpinner = page.locator('mat-spinner');
    this.changeRoleButtons = page.locator('button').filter({ hasText: /Змінити роль|role/i });
  }

  async goto(): Promise<void> {
    await this.page.goto('/admin/users');
    await this.page.waitForLoadState('networkidle');
  }

  async expectPageLoaded(): Promise<void> {
    await expect(this.pageTitle).toBeVisible({ timeout: 10_000 });
  }

  async expectUserCount(count: number): Promise<void> {
    await expect(this.userRows).toHaveCount(count);
  }

  async searchUsers(query: string): Promise<void> {
    await this.searchInput.fill(query);
  }
}

export class ChangeRoleDialog {
  readonly page: Page;
  readonly dialog: Locator;
  readonly roleSelect: Locator;
  readonly confirmButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.dialog = page.locator('mat-dialog-container');
    this.roleSelect = page.locator('mat-dialog-container mat-select');
    this.confirmButton = page.locator('mat-dialog-container button').filter({ hasText: /Підтвердити|Змінити/i });
    this.cancelButton = page.locator('mat-dialog-container button').filter({ hasText: /Скасувати/i });
  }

  async expectOpen(): Promise<void> {
    await expect(this.dialog).toBeVisible();
  }

  async selectRole(role: string): Promise<void> {
    await this.roleSelect.click();
    await this.page.locator('mat-option').filter({ hasText: role }).click();
  }

  async confirm(): Promise<void> {
    await this.confirmButton.click();
  }
}
