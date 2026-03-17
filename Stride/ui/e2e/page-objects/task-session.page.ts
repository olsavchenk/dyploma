import { Page, Locator, expect } from '@playwright/test';

export class TaskSessionPage {
  readonly page: Page;
  // Header
  readonly backButton: Locator;
  readonly topicName: Locator;
  readonly streakStat: Locator;
  readonly progressText: Locator;
  readonly progressBar: Locator;
  readonly progressPercentage: Locator;
  // Task area
  readonly taskCard: Locator;
  readonly loadingState: Locator;
  readonly errorState: Locator;
  readonly retryButton: Locator;
  // Actions
  readonly submitButton: Locator;
  readonly skipButton: Locator;
  // Feedback
  readonly feedbackComponent: Locator;

  constructor(page: Page) {
    this.page = page;
    this.backButton = page.locator('button.back-button');
    this.topicName = page.locator('.topic-name');
    this.streakStat = page.locator('.streak-stat');
    this.progressText = page.locator('.progress-text');
    this.progressBar = page.locator('.session-progress');
    this.progressPercentage = page.locator('.progress-percentage');
    this.taskCard = page.locator('.task-card');
    this.loadingState = page.locator('.loading-state');
    this.errorState = page.locator('.error-state');
    this.retryButton = page.locator('.error-state button');
    this.submitButton = page.locator('button.submit-button');
    this.skipButton = page.locator('button.skip-button');
    this.feedbackComponent = page.locator('app-answer-feedback');
  }

  async goto(topicId: string): Promise<void> {
    await this.page.goto(`/learn/session/${topicId}`);
    await this.page.waitForLoadState('networkidle');
  }

  async expectTaskLoaded(): Promise<void> {
    await expect(this.taskCard).toBeVisible({ timeout: 10_000 });
  }

  async expectProgressText(text: string): Promise<void> {
    await expect(this.progressText).toContainText(text);
  }

  async expectSubmitDisabled(): Promise<void> {
    await expect(this.submitButton).toBeDisabled();
  }

  async expectSubmitEnabled(): Promise<void> {
    await expect(this.submitButton).toBeEnabled();
  }

  async submit(): Promise<void> {
    await this.submitButton.click();
  }

  async skip(): Promise<void> {
    await this.skipButton.click();
  }

  async goBack(): Promise<void> {
    await this.backButton.click();
  }

  // ─── Multiple Choice ──────────────────────────────────────────────────

  get multipleChoiceOptions(): Locator {
    return this.page.locator('app-multiple-choice-task mat-radio-button');
  }

  async selectMultipleChoiceOption(index: number): Promise<void> {
    await this.multipleChoiceOptions.nth(index).click();
  }

  async expectMultipleChoiceOptionsCount(count: number): Promise<void> {
    await expect(this.multipleChoiceOptions).toHaveCount(count);
  }

  // ─── Fill Blank ───────────────────────────────────────────────────────

  get fillBlankInputs(): Locator {
    return this.page.locator('app-fill-blank-task input[matInput]');
  }

  async fillBlank(index: number, text: string): Promise<void> {
    await this.fillBlankInputs.nth(index).fill(text);
  }

  async expectFillBlankInputCount(count: number): Promise<void> {
    await expect(this.fillBlankInputs).toHaveCount(count);
  }

  // ─── True/False ───────────────────────────────────────────────────────

  get trueButton(): Locator {
    return this.page.locator('app-true-false-task .true-button');
  }

  get falseButton(): Locator {
    return this.page.locator('app-true-false-task .false-button');
  }

  async selectTrue(): Promise<void> {
    await this.trueButton.click();
  }

  async selectFalse(): Promise<void> {
    await this.falseButton.click();
  }

  // ─── Matching ─────────────────────────────────────────────────────────

  get leftItems(): Locator {
    return this.page.locator('app-matching-task .left-column .match-item');
  }

  get rightItems(): Locator {
    return this.page.locator('app-matching-task .right-column .match-item');
  }

  get matchesSummary(): Locator {
    return this.page.locator('app-matching-task .matches-summary');
  }

  get clearMatchesButton(): Locator {
    return this.page.locator('app-matching-task button.clear-button');
  }

  async createMatch(leftIndex: number, rightIndex: number): Promise<void> {
    await this.leftItems.nth(leftIndex).click();
    await this.rightItems.nth(rightIndex).click();
  }

  // ─── Ordering ─────────────────────────────────────────────────────────

  get orderingItems(): Locator {
    return this.page.locator('app-ordering-task .order-item');
  }

  get resetOrderButton(): Locator {
    return this.page.locator('app-ordering-task button').filter({ hasText: 'Скинути порядок' });
  }

  async selectOrderItem(index: number): Promise<void> {
    await this.orderingItems.nth(index).click();
  }

  async moveOrderItemUp(index: number): Promise<void> {
    await this.orderingItems.nth(index).click();
    await this.page.locator('app-ordering-task .move-button[aria-label="Перемістити вгору"]').click();
  }

  async moveOrderItemDown(index: number): Promise<void> {
    await this.orderingItems.nth(index).click();
    await this.page.locator('app-ordering-task .move-button[aria-label="Перемістити вниз"]').click();
  }

  // ─── Feedback ─────────────────────────────────────────────────────────

  get feedbackTitle(): Locator {
    return this.page.locator('app-answer-feedback .feedback-title');
  }

  get feedbackCorrectAnswer(): Locator {
    return this.page.locator('app-answer-feedback .correct-answer');
  }

  get feedbackExplanation(): Locator {
    return this.page.locator('app-answer-feedback .explanation-text');
  }

  get feedbackXpEarned(): Locator {
    return this.page.locator('app-answer-feedback .xp-earned .stat-value');
  }

  get feedbackContinueButton(): Locator {
    return this.page.locator('app-answer-feedback button.continue-button');
  }

  async expectCorrectFeedback(): Promise<void> {
    await expect(this.feedbackTitle).toContainText('Правильно!');
  }

  async expectIncorrectFeedback(): Promise<void> {
    await expect(this.feedbackTitle).toContainText('Не зовсім правильно');
  }

  async expectXpEarned(xp: number): Promise<void> {
    await expect(this.feedbackXpEarned).toContainText(`+${xp}`);
  }

  async continueLearning(): Promise<void> {
    await this.feedbackContinueButton.click();
  }
}
