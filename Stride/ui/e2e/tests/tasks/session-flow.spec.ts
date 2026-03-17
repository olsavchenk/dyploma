import { test, expect } from '../../fixtures/auth.fixture';
import { TaskSessionPage } from '../../page-objects/task-session.page';
import { mockNextTask, mockSubmitTask, mockGamificationStats } from '../../fixtures/api-mocks';
import {
  TEST_TASK_SUBMIT_CORRECT,
  TEST_TASK_SUBMIT_INCORRECT,
  TEST_MULTIPLE_CHOICE_TASK,
  API_BASE,
} from '../../fixtures/test-data';

test.describe('Task Session — Full Flow', () => {
  test('should display progress bar and topic name', async ({ studentPage }) => {
    await mockNextTask(studentPage, 'MultipleChoice');
    const session = new TaskSessionPage(studentPage);
    await session.goto('topic-algebra');
    await session.expectTaskLoaded();

    await expect(session.topicName).toBeVisible();
    await expect(session.progressBar).toBeVisible();
  });

  test('should display streak stat in session header', async ({ studentPage }) => {
    await mockNextTask(studentPage, 'MultipleChoice');
    const session = new TaskSessionPage(studentPage);
    await session.goto('topic-algebra');
    await session.expectTaskLoaded();

    await expect(session.streakStat).toBeVisible();
  });

  test('should skip to next task on skip button', async ({ studentPage }) => {
    await mockNextTask(studentPage, 'MultipleChoice');
    const session = new TaskSessionPage(studentPage);
    await session.goto('topic-algebra');
    await session.expectTaskLoaded();

    // Skip should load next task
    await session.skip();

    // Task card should still be visible (new task loaded)
    await session.expectTaskLoaded();
  });

  test('should continue to next task after correct answer', async ({ studentPage }) => {
    await mockNextTask(studentPage, 'MultipleChoice');
    await mockSubmitTask(studentPage, true);

    const session = new TaskSessionPage(studentPage);
    await session.goto('topic-algebra');
    await session.expectTaskLoaded();

    await session.selectMultipleChoiceOption(1);
    await session.submit();

    await session.expectCorrectFeedback();
    await session.continueLearning();

    // Should load next task
    await session.expectTaskLoaded();
  });

  test('should continue to next task after incorrect answer', async ({ studentPage }) => {
    await mockNextTask(studentPage, 'MultipleChoice');
    await mockSubmitTask(studentPage, false);

    const session = new TaskSessionPage(studentPage);
    await session.goto('topic-algebra');
    await session.expectTaskLoaded();

    await session.selectMultipleChoiceOption(0);
    await session.submit();

    await session.expectIncorrectFeedback();
    await session.continueLearning();

    await session.expectTaskLoaded();
  });

  test('should navigate back to subject detail on back button', async ({ studentPage }) => {
    await mockNextTask(studentPage, 'MultipleChoice');
    const session = new TaskSessionPage(studentPage);
    await session.goto('topic-algebra');
    await session.expectTaskLoaded();

    await session.goBack();
    // Should navigate away from session
    await studentPage.waitForURL(/\/(learn|dashboard)/);
  });

  test('should show error state on API failure and allow retry', async ({ studentPage }) => {
    await studentPage.route(`${API_BASE}/tasks/next*`, (route) =>
      route.fulfill({ status: 500, contentType: 'application/json', body: '{"message":"Server error"}' }),
    );

    const session = new TaskSessionPage(studentPage);
    await session.goto('topic-algebra');

    await expect(session.errorState).toBeVisible();
    await expect(session.retryButton).toBeVisible();

    // Now fix the mock and retry
    await studentPage.unrouteAll();
    await mockNextTask(studentPage, 'MultipleChoice');
    await session.retryButton.click();

    await session.expectTaskLoaded();
  });

  test('should update streak in feedback after correct answer', async ({ studentPage }) => {
    await mockNextTask(studentPage, 'MultipleChoice');
    await mockSubmitTask(studentPage, true);

    const session = new TaskSessionPage(studentPage);
    await session.goto('topic-algebra');
    await session.expectTaskLoaded();

    await session.selectMultipleChoiceOption(1);
    await session.submit();

    await session.expectCorrectFeedback();
    // Feedback shows streak info
    await expect(session.feedbackComponent).toContainText(String(TEST_TASK_SUBMIT_CORRECT.currentStreak));
  });
});

test.describe('Task Session — Feedback Details', () => {
  test('should display XP earned on correct answer', async ({ studentPage }) => {
    await mockNextTask(studentPage, 'TrueFalse');
    await mockSubmitTask(studentPage, true);

    const session = new TaskSessionPage(studentPage);
    await session.goto('topic-algebra');
    await session.expectTaskLoaded();

    await session.selectFalse();
    await session.submit();

    await session.expectXpEarned(TEST_TASK_SUBMIT_CORRECT.xpEarned);
  });

  test('should display 0 XP on incorrect answer', async ({ studentPage }) => {
    await mockNextTask(studentPage, 'TrueFalse');
    await mockSubmitTask(studentPage, false);

    const session = new TaskSessionPage(studentPage);
    await session.goto('topic-algebra');
    await session.expectTaskLoaded();

    await session.selectTrue();
    await session.submit();

    await session.expectIncorrectFeedback();
    await session.expectXpEarned(TEST_TASK_SUBMIT_INCORRECT.xpEarned);
  });

  test('should show correct answer in feedback for incorrect submission', async ({ studentPage }) => {
    await mockNextTask(studentPage, 'MultipleChoice');
    await mockSubmitTask(studentPage, false);

    const session = new TaskSessionPage(studentPage);
    await session.goto('topic-algebra');
    await session.expectTaskLoaded();

    await session.selectMultipleChoiceOption(0);
    await session.submit();

    await session.expectIncorrectFeedback();
    await expect(session.feedbackCorrectAnswer).toContainText(TEST_TASK_SUBMIT_INCORRECT.correctAnswer);
  });

  test('should show explanation text in feedback', async ({ studentPage }) => {
    await mockNextTask(studentPage, 'MultipleChoice');
    await mockSubmitTask(studentPage, true);

    const session = new TaskSessionPage(studentPage);
    await session.goto('topic-algebra');
    await session.expectTaskLoaded();

    await session.selectMultipleChoiceOption(1);
    await session.submit();

    await expect(session.feedbackExplanation).toBeVisible();
    await expect(session.feedbackExplanation).toContainText('2x + 6 = 16');
  });

  test('should have continue button in feedback', async ({ studentPage }) => {
    await mockNextTask(studentPage, 'MultipleChoice');
    await mockSubmitTask(studentPage, true);

    const session = new TaskSessionPage(studentPage);
    await session.goto('topic-algebra');
    await session.expectTaskLoaded();

    await session.selectMultipleChoiceOption(1);
    await session.submit();

    await expect(session.feedbackContinueButton).toBeVisible();
    await expect(session.feedbackContinueButton).toBeEnabled();
  });
});
