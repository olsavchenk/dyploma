import { test, expect } from '../../fixtures/auth.fixture';
import {
  TeacherClassesPage,
  ClassDetailPage,
  StudentDetailPage,
  CreateClassDialog,
} from '../../page-objects/teacher/teacher.page';
import {
  mockTeacherClasses,
  mockTeacherQuickStats,
  mockClassDetail,
  mockStudentDetail,
  mockSubjects,
  mockSubjectTopics,
  mockTaskReview,
} from '../../fixtures/api-mocks';
import {
  TEST_CLASSES,
  TEST_CLASS_STUDENTS,
  TEST_STUDENT_DETAIL,
  TEST_ASSIGNMENTS,
  API_BASE,
} from '../../fixtures/test-data';

test.describe('Teacher — Classes List', () => {
  test.beforeEach(async ({ teacherPage }) => {
    await mockTeacherClasses(teacherPage);
    await mockTeacherQuickStats(teacherPage);
  });

  test('should display classes page with title', async ({ teacherPage }) => {
    const classes = new TeacherClassesPage(teacherPage);
    await classes.goto();
    await classes.expectPageLoaded();
  });

  test('should show class cards', async ({ teacherPage }) => {
    const classes = new TeacherClassesPage(teacherPage);
    await classes.goto();
    await classes.expectPageLoaded();
    await classes.expectClassCount(TEST_CLASSES.length);
  });

  test('should display class name on each card', async ({ teacherPage }) => {
    const classes = new TeacherClassesPage(teacherPage);
    await classes.goto();
    await classes.expectPageLoaded();

    await expect(classes.classCards.first()).toContainText(TEST_CLASSES[0].name);
    await expect(classes.classCards.nth(1)).toContainText(TEST_CLASSES[1].name);
  });

  test('should display quick stats', async ({ teacherPage }) => {
    const classes = new TeacherClassesPage(teacherPage);
    await classes.goto();
    await classes.expectPageLoaded();
    await classes.expectQuickStatsVisible();
  });

  test('should show create class button', async ({ teacherPage }) => {
    const classes = new TeacherClassesPage(teacherPage);
    await classes.goto();
    await classes.expectPageLoaded();
    await expect(classes.createButton).toBeVisible();
  });

  test('should open create class dialog', async ({ teacherPage }) => {
    const classes = new TeacherClassesPage(teacherPage);
    const dialog = new CreateClassDialog(teacherPage);

    await classes.goto();
    await classes.expectPageLoaded();
    await classes.openCreateDialog();

    await dialog.expectOpen();
    await expect(dialog.nameInput).toBeVisible();
    await expect(dialog.gradeLevelSelect).toBeVisible();
  });

  test('should create a new class', async ({ teacherPage }) => {
    const classes = new TeacherClassesPage(teacherPage);
    const dialog = new CreateClassDialog(teacherPage);

    await classes.goto();
    await classes.expectPageLoaded();
    await classes.openCreateDialog();
    await dialog.expectOpen();

    await dialog.fillForm('Новий 9-В клас', 9);
    await dialog.submitButton.click();

    // Dialog should close
    await expect(dialog.dialog).not.toBeVisible();
  });

  test('should navigate to class detail on card click', async ({ teacherPage }) => {
    await mockClassDetail(teacherPage);

    const classes = new TeacherClassesPage(teacherPage);
    await classes.goto();
    await classes.expectPageLoaded();
    await classes.clickClass(0);

    await teacherPage.waitForURL(/\/teacher\/classes\//);
  });
});

test.describe('Teacher — Class Detail', () => {
  test.beforeEach(async ({ teacherPage }) => {
    await mockTeacherClasses(teacherPage);
    await mockClassDetail(teacherPage);
  });

  test('should display class name and join code', async ({ teacherPage }) => {
    const detail = new ClassDetailPage(teacherPage);
    await detail.goto('class-001');
    await detail.expectPageLoaded();

    await expect(detail.className).toContainText(TEST_CLASSES[0].name);
    await detail.expectJoinCodeVisible();
    await expect(detail.joinCode).toContainText(TEST_CLASSES[0].joinCode);
  });

  test('should display student roster', async ({ teacherPage }) => {
    const detail = new ClassDetailPage(teacherPage);
    await detail.goto('class-001');
    await detail.expectPageLoaded();

    await detail.expectStudentCount(TEST_CLASS_STUDENTS.length);
  });

  test('should display student info in roster', async ({ teacherPage }) => {
    const detail = new ClassDetailPage(teacherPage);
    await detail.goto('class-001');
    await detail.expectPageLoaded();

    await expect(detail.studentRows.first()).toContainText(TEST_CLASS_STUDENTS[0].displayName);
  });

  test('should switch between tabs (students, analytics, assignments)', async ({ teacherPage }) => {
    const detail = new ClassDetailPage(teacherPage);
    await detail.goto('class-001');
    await detail.expectPageLoaded();

    // Tab count should be 3+
    await expect(detail.tabs.first()).toBeVisible();

    // Switch to analytics tab
    await detail.switchTab(1);
    await expect(detail.analyticsSection).toBeVisible();
  });

  test('should display assignments', async ({ teacherPage }) => {
    const detail = new ClassDetailPage(teacherPage);
    await detail.goto('class-001');
    await detail.expectPageLoaded();

    // Switch to assignments tab
    await detail.switchTab(2);
    await expect(detail.assignmentCards.first()).toBeVisible();
    await expect(detail.assignmentCards.first()).toContainText(TEST_ASSIGNMENTS[0].title);
  });

  test('should show create assignment button', async ({ teacherPage }) => {
    const detail = new ClassDetailPage(teacherPage);
    await detail.goto('class-001');
    await detail.expectPageLoaded();

    await detail.switchTab(2);
    await expect(detail.createAssignmentButton).toBeVisible();
  });

  test('should navigate to student detail on student click', async ({ teacherPage }) => {
    await mockStudentDetail(teacherPage);

    const detail = new ClassDetailPage(teacherPage);
    await detail.goto('class-001');
    await detail.expectPageLoaded();
    await detail.clickStudent(0);

    await teacherPage.waitForURL(/\/students\//);
  });
});

test.describe('Teacher — Student Detail', () => {
  test.beforeEach(async ({ teacherPage }) => {
    await mockTeacherClasses(teacherPage);
    await mockClassDetail(teacherPage);
    await mockStudentDetail(teacherPage);
  });

  test('should display student name', async ({ teacherPage }) => {
    const student = new StudentDetailPage(teacherPage);
    await student.goto('class-001', 'student-001');
    await student.expectPageLoaded();
    await student.expectStudentName(TEST_STUDENT_DETAIL.displayName);
  });

  test('should display overall stats', async ({ teacherPage }) => {
    const student = new StudentDetailPage(teacherPage);
    await student.goto('class-001', 'student-001');
    await student.expectPageLoaded();
    await expect(student.overallStats).toBeVisible();
  });

  test('should display strengths and weaknesses', async ({ teacherPage }) => {
    const student = new StudentDetailPage(teacherPage);
    await student.goto('class-001', 'student-001');
    await student.expectPageLoaded();

    await expect(student.strengthsList).toBeVisible();
    await expect(student.weaknessesList).toBeVisible();

    // Check content
    await expect(student.strengthsList).toContainText(TEST_STUDENT_DETAIL.strengths[0]);
    await expect(student.weaknessesList).toContainText(TEST_STUDENT_DETAIL.weaknesses[0]);
  });

  test('should display topic performance', async ({ teacherPage }) => {
    const student = new StudentDetailPage(teacherPage);
    await student.goto('class-001', 'student-001');
    await student.expectPageLoaded();

    await expect(student.topicPerformance).toBeVisible();
    await expect(student.topicPerformance).toContainText(TEST_STUDENT_DETAIL.topicPerformance[0].topicName);
  });

  test('should display recent activity', async ({ teacherPage }) => {
    const student = new StudentDetailPage(teacherPage);
    await student.goto('class-001', 'student-001');
    await student.expectPageLoaded();

    await expect(student.recentActivity).toBeVisible();
  });

  test('should navigate back to class detail', async ({ teacherPage }) => {
    const student = new StudentDetailPage(teacherPage);
    await student.goto('class-001', 'student-001');
    await student.expectPageLoaded();

    await student.backButton.click();
    await teacherPage.waitForURL(/\/teacher\/classes\/class-001/);
  });
});

test.describe('Teacher — Task Review', () => {
  test.beforeEach(async ({ teacherPage }) => {
    await mockTeacherClasses(teacherPage);
    await mockTaskReview(teacherPage);
  });

  test('should display task review table', async ({ teacherPage }) => {
    const { TaskReviewPage } = await import('../../page-objects/teacher/teacher.page');
    const review = new TaskReviewPage(teacherPage);
    await review.goto('topic-algebra');
    await review.expectPageLoaded();
  });

  test('should show approve and reject buttons', async ({ teacherPage }) => {
    const { TaskReviewPage } = await import('../../page-objects/teacher/teacher.page');
    const review = new TaskReviewPage(teacherPage);
    await review.goto('topic-algebra');
    await review.expectPageLoaded();

    await expect(review.approveButtons.first()).toBeVisible();
    await expect(review.rejectButtons.first()).toBeVisible();
  });
});
