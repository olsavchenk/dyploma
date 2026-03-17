import { Page, Locator, expect } from '@playwright/test';

export class SubjectDetailPage {
  readonly page: Page;
  readonly breadcrumbs: Locator;
  readonly subjectName: Locator;
  readonly subjectDescription: Locator;
  readonly topicTree: Locator;
  readonly topicNodes: Locator;
  readonly progressBar: Locator;
  readonly loadingSkeleton: Locator;
  readonly emptyState: Locator;

  constructor(page: Page) {
    this.page = page;
    this.breadcrumbs = page.locator('.breadcrumbs a, .breadcrumb a');
    this.subjectName = page.locator('.subject-header h1, .subject-name').first();
    this.subjectDescription = page.locator('.subject-description, .subject-header p').first();
    this.topicTree = page.locator('mat-tree');
    this.topicNodes = page.locator('mat-tree-node, mat-nested-tree-node');
    this.progressBar = page.locator('.progress-bar, mat-progress-bar').first();
    this.loadingSkeleton = page.locator('.skeleton, .loading-skeleton');
    this.emptyState = page.locator('.empty-state');
  }

  async goto(subjectId: string): Promise<void> {
    await this.page.goto(`/learn/subjects/${subjectId}`);
    await this.page.waitForLoadState('networkidle');
  }

  async expectPageLoaded(): Promise<void> {
    await expect(this.subjectName).toBeVisible({ timeout: 10_000 });
  }

  async expectTopicCount(count: number): Promise<void> {
    await expect(this.topicNodes).toHaveCount(count);
  }

  async expectBreadcrumbCount(count: number): Promise<void> {
    await expect(this.breadcrumbs).toHaveCount(count);
  }

  async clickTopic(name: string): Promise<void> {
    await this.page.locator('mat-tree-node, mat-nested-tree-node').filter({ hasText: name }).click();
  }

  async expectMasteryBadge(topicName: string, masteryText: string): Promise<void> {
    const node = this.page.locator('mat-tree-node, mat-nested-tree-node').filter({ hasText: topicName });
    await expect(node).toContainText(masteryText);
  }

  async expectEmptyState(): Promise<void> {
    await expect(this.emptyState).toBeVisible();
  }
}
