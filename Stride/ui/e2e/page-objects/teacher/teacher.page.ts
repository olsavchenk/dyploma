import { Page, Locator, expect } from '@playwright/test';

export class TeacherClassesPage {
  readonly page: Page;
  readonly pageTitle: Locator;
  readonly classCards: Locator;
  readonly createButton: Locator;
  readonly quickStats: Locator;
  readonly emptyState: Locator;
  readonly loadingSpinner: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageTitle = page.locator('h1').filter({ hasText: /Класи|Мої класи/i });
    this.classCards = page.locator('.class-card, mat-card.class-card');
    this.createButton = page.locator('button').filter({ hasText: /Створити клас/i });
    this.quickStats = page.locator('.quick-stats, .stats-overview');
    this.emptyState = page.locator('.empty-state');
    this.loadingSpinner = page.locator('mat-spinner');
  }

  async goto(): Promise<void> {
    await this.page.goto('/teacher/classes');
    await this.page.waitForLoadState('networkidle');
  }

  async expectPageLoaded(): Promise<void> {
    await expect(this.pageTitle).toBeVisible({ timeout: 10_000 });
  }

  async expectClassCount(count: number): Promise<void> {
    await expect(this.classCards).toHaveCount(count);
  }

  async clickClass(index: number): Promise<void> {
    await this.classCards.nth(index).click();
  }

  async openCreateDialog(): Promise<void> {
    await this.createButton.click();
  }

  async expectQuickStatsVisible(): Promise<void> {
    await expect(this.quickStats).toBeVisible();
  }
}

export class ClassDetailPage {
  readonly page: Page;
  readonly className: Locator;
  readonly joinCode: Locator;
  readonly copyCodeButton: Locator;
  readonly tabs: Locator;
  readonly studentsTable: Locator;
  readonly studentRows: Locator;
  readonly analyticsSection: Locator;
  readonly assignmentCards: Locator;
  readonly createAssignmentButton: Locator;
  readonly emptyRoster: Locator;

  constructor(page: Page) {
    this.page = page;
    this.className = page.locator('.class-name, h1').first();
    this.joinCode = page.locator('.join-code, .code-value');
    this.copyCodeButton = page.locator('button').filter({ hasText: /копіювати|Копіювати|content_copy/i });
    this.tabs = page.locator('mat-tab-group .mat-mdc-tab');
    this.studentsTable = page.locator('mat-table, table');
    this.studentRows = page.locator('mat-row, tr.student-row, .student-item');
    this.analyticsSection = page.locator('.analytics-section, .analytics-content');
    this.assignmentCards = page.locator('.assignment-card');
    this.createAssignmentButton = page.locator('button').filter({ hasText: /Створити завдання/i });
    this.emptyRoster = page.locator('.empty-state').filter({ hasText: /учнів/i });
  }

  async goto(classId: string): Promise<void> {
    await this.page.goto(`/teacher/classes/${classId}`);
    await this.page.waitForLoadState('networkidle');
  }

  async expectPageLoaded(): Promise<void> {
    await expect(this.className).toBeVisible({ timeout: 10_000 });
  }

  async switchTab(index: number): Promise<void> {
    await this.tabs.nth(index).click();
  }

  async expectStudentCount(count: number): Promise<void> {
    await expect(this.studentRows).toHaveCount(count);
  }

  async clickStudent(index: number): Promise<void> {
    await this.studentRows.nth(index).click();
  }

  async expectJoinCodeVisible(): Promise<void> {
    await expect(this.joinCode).toBeVisible();
  }
}

export class StudentDetailPage {
  readonly page: Page;
  readonly studentName: Locator;
  readonly overallStats: Locator;
  readonly strengthsList: Locator;
  readonly weaknessesList: Locator;
  readonly topicPerformance: Locator;
  readonly recentActivity: Locator;
  readonly backButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.studentName = page.locator('.student-name, h1').first();
    this.overallStats = page.locator('.overall-stats, .stats-overview');
    this.strengthsList = page.locator('.strengths, .strength-list');
    this.weaknessesList = page.locator('.weaknesses, .weakness-list');
    this.topicPerformance = page.locator('.topic-performance');
    this.recentActivity = page.locator('.recent-activity');
    this.backButton = page.locator('button').filter({ hasText: /arrow_back|Назад/i }).first();
  }

  async goto(classId: string, studentId: string): Promise<void> {
    await this.page.goto(`/teacher/classes/${classId}/students/${studentId}`);
    await this.page.waitForLoadState('networkidle');
  }

  async expectPageLoaded(): Promise<void> {
    await expect(this.studentName).toBeVisible({ timeout: 10_000 });
  }

  async expectStudentName(name: string): Promise<void> {
    await expect(this.studentName).toContainText(name);
  }
}

export class TaskReviewPage {
  readonly page: Page;
  readonly taskTable: Locator;
  readonly taskRows: Locator;
  readonly filters: Locator;
  readonly bulkActions: Locator;
  readonly approveButtons: Locator;
  readonly rejectButtons: Locator;
  readonly selectCheckboxes: Locator;
  readonly statusFilter: Locator;
  readonly typeFilter: Locator;

  constructor(page: Page) {
    this.page = page;
    this.taskTable = page.locator('mat-table, table').first();
    this.taskRows = page.locator('mat-row, tr').filter({ has: page.locator('td, mat-cell') });
    this.filters = page.locator('.filters, .filter-section');
    this.bulkActions = page.locator('.bulk-actions');
    this.approveButtons = page.locator('button').filter({ hasText: /Схвалити|approve/i });
    this.rejectButtons = page.locator('button').filter({ hasText: /Відхилити|reject/i });
    this.selectCheckboxes = page.locator('mat-checkbox');
    this.statusFilter = page.locator('mat-select').first();
    this.typeFilter = page.locator('mat-select').nth(1);
  }

  async goto(topicId: string): Promise<void> {
    await this.page.goto(`/teacher/topics/${topicId}/tasks`);
    await this.page.waitForLoadState('networkidle');
  }

  async expectPageLoaded(): Promise<void> {
    await expect(this.taskTable).toBeVisible({ timeout: 10_000 });
  }

  async expectTaskCount(count: number): Promise<void> {
    await expect(this.taskRows).toHaveCount(count);
  }
}

export class CreateClassDialog {
  readonly page: Page;
  readonly dialog: Locator;
  readonly nameInput: Locator;
  readonly gradeLevelSelect: Locator;
  readonly submitButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.dialog = page.locator('mat-dialog-container');
    this.nameInput = page.locator('mat-dialog-container input[formControlName="name"]');
    this.gradeLevelSelect = page.locator('mat-dialog-container mat-select[formControlName="gradeLevel"]');
    this.submitButton = page.locator('mat-dialog-container button[type="submit"], mat-dialog-container button').filter({ hasText: /Створити|створити/i });
    this.cancelButton = page.locator('mat-dialog-container button').filter({ hasText: /Скасувати|скасувати/i });
  }

  async expectOpen(): Promise<void> {
    await expect(this.dialog).toBeVisible();
  }

  async fillForm(name: string, gradeLevel: number): Promise<void> {
    await this.nameInput.fill(name);
    await this.gradeLevelSelect.click();
    await this.page.locator('mat-option').filter({ hasText: String(gradeLevel) }).click();
  }

  async submit(): Promise<void> {
    await this.submitButton.click();
  }

  async cancel(): Promise<void> {
    await this.cancelButton.click();
  }
}

export class CreateAssignmentDialog {
  readonly page: Page;
  readonly dialog: Locator;
  readonly titleInput: Locator;
  readonly descriptionInput: Locator;
  readonly taskCountInput: Locator;
  readonly submitButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.dialog = page.locator('mat-dialog-container');
    this.titleInput = page.locator('mat-dialog-container input[formControlName="title"]');
    this.descriptionInput = page.locator('mat-dialog-container textarea[formControlName="description"]');
    this.taskCountInput = page.locator('mat-dialog-container input[formControlName="taskCount"]');
    this.submitButton = page.locator('mat-dialog-container button[type="submit"], mat-dialog-container button').filter({ hasText: /Створити|створити/i });
    this.cancelButton = page.locator('mat-dialog-container button').filter({ hasText: /Скасувати|скасувати/i });
  }

  async expectOpen(): Promise<void> {
    await expect(this.dialog).toBeVisible();
  }

  async fillForm(title: string, taskCount: number): Promise<void> {
    await this.titleInput.fill(title);
    await this.taskCountInput.clear();
    await this.taskCountInput.fill(String(taskCount));
  }

  async submit(): Promise<void> {
    await this.submitButton.click();
  }
}
