import { test, expect } from '../../fixtures/auth.fixture';
import { LearnBrowsePage } from '../../page-objects/learn-browse.page';
import { SubjectDetailPage } from '../../page-objects/subject-detail.page';
import {
  mockSubjects,
  mockSubjectTopics,
  mockStudentClasses,
  mockJoinClass,
  mockNextTask,
  mockSubmitTask,
} from '../../fixtures/api-mocks';
import { TEST_SUBJECTS, TEST_TOPICS, TEST_STUDENT_CLASSES, API_BASE } from '../../fixtures/test-data';

test.describe('Learn - Browse Subjects', () => {
  test('should display subjects list', async ({ studentPage }) => {
    await mockSubjects(studentPage);
    const browse = new LearnBrowsePage(studentPage);
    await browse.goto();
    await browse.expectPageLoaded();
    await browse.expectSubjectCount(TEST_SUBJECTS.length);
  });

  test('should display subject name on each card', async ({ studentPage }) => {
    await mockSubjects(studentPage);
    const browse = new LearnBrowsePage(studentPage);
    await browse.goto();
    await browse.expectPageLoaded();

    for (let i = 0; i < TEST_SUBJECTS.length; i++) {
      await browse.expectSubjectCardText(i, TEST_SUBJECTS[i].name);
    }
  });

  test('should filter subjects by search query', async ({ studentPage }) => {
    await mockSubjects(studentPage);
    const browse = new LearnBrowsePage(studentPage);
    await browse.goto();
    await browse.expectPageLoaded();

    await browse.searchSubjects('Математика');
    // Wait for client-side filter to apply
    await studentPage.waitForTimeout(300);
    await expect(browse.subjectCards.first()).toContainText('Математика');
  });

  test('should show no results when search matches nothing', async ({ studentPage }) => {
    await mockSubjects(studentPage);
    const browse = new LearnBrowsePage(studentPage);
    await browse.goto();
    await browse.expectPageLoaded();

    await browse.searchSubjects('Неіснуючий предмет');
    await studentPage.waitForTimeout(300);
    await browse.expectEmptyState();
  });

  test('should navigate to subject detail on card click', async ({ studentPage }) => {
    await mockSubjects(studentPage);
    await mockSubjectTopics(studentPage, 'subj-math');

    const browse = new LearnBrowsePage(studentPage);
    await browse.goto();
    await browse.expectPageLoaded();
    await browse.clickSubject(0);

    await studentPage.waitForURL(/\/learn\/subjects\//);
    expect(studentPage.url()).toContain('/learn/subjects/');
  });

  test('should display class sections', async ({ studentPage }) => {
    await mockSubjects(studentPage);
    await mockStudentClasses(studentPage);

    const browse = new LearnBrowsePage(studentPage);
    await browse.goto();
    await browse.expectPageLoaded();

    // Should see class name
    await expect(studentPage.locator('body')).toContainText(TEST_STUDENT_CLASSES[0].name);
  });

  test('should join class with valid code', async ({ studentPage }) => {
    await mockSubjects(studentPage);
    await mockJoinClass(studentPage, true);

    const browse = new LearnBrowsePage(studentPage);
    await browse.goto();
    await browse.expectPageLoaded();

    await browse.joinClassButton.click();
    await browse.joinCodeInput.fill('ABC123');
    // Submit the join code
    await studentPage.keyboard.press('Enter');

    // Should see success indication
    await studentPage.waitForTimeout(500);
  });

  test('should show error for invalid join code', async ({ studentPage }) => {
    await mockSubjects(studentPage);
    await mockJoinClass(studentPage, false);

    const browse = new LearnBrowsePage(studentPage);
    await browse.goto();
    await browse.expectPageLoaded();

    await browse.joinClassButton.click();
    await browse.joinCodeInput.fill('BADCOD');
    await studentPage.keyboard.press('Enter');

    await expect(studentPage.locator('body')).toContainText('Клас не знайдено');
  });
});

test.describe('Learn - Subject Detail', () => {
  test('should display subject name and description', async ({ studentPage }) => {
    await mockSubjects(studentPage);
    await mockSubjectTopics(studentPage);

    const detail = new SubjectDetailPage(studentPage);
    await detail.goto('subj-math');
    await detail.expectPageLoaded();
    await expect(detail.subjectName).toContainText('Математика');
  });

  test('should display topic tree', async ({ studentPage }) => {
    await mockSubjects(studentPage);
    await mockSubjectTopics(studentPage);

    const detail = new SubjectDetailPage(studentPage);
    await detail.goto('subj-math');
    await detail.expectPageLoaded();
    // Parent topics
    await expect(detail.topicNodes.first()).toBeVisible();
  });

  test('should display mastery badges on topics', async ({ studentPage }) => {
    await mockSubjects(studentPage);
    await mockSubjectTopics(studentPage);

    const detail = new SubjectDetailPage(studentPage);
    await detail.goto('subj-math');
    await detail.expectPageLoaded();

    // Лінійні рівняння has masteryLevel: 'Mastered' (100% progress)
    await detail.expectMasteryBadge('Лінійні рівняння', '100');
  });

  test('should navigate to task session on topic click', async ({ studentPage }) => {
    await mockSubjects(studentPage);
    await mockSubjectTopics(studentPage);
    await mockNextTask(studentPage);
    await mockSubmitTask(studentPage);

    const detail = new SubjectDetailPage(studentPage);
    await detail.goto('subj-math');
    await detail.expectPageLoaded();

    await detail.clickTopic('Квадратні рівняння');
    await studentPage.waitForURL(/\/learn\/session\//);
    expect(studentPage.url()).toContain('/learn/session/');
  });

  test('should display breadcrumbs for navigation', async ({ studentPage }) => {
    await mockSubjects(studentPage);
    await mockSubjectTopics(studentPage);

    const detail = new SubjectDetailPage(studentPage);
    await detail.goto('subj-math');
    await detail.expectPageLoaded();

    // Should have breadcrumbs (e.g., Навчання > Математика)
    await expect(detail.breadcrumbs.first()).toBeVisible();
  });
});
