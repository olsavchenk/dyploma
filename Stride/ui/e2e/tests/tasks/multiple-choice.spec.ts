import { test, expect } from '../../fixtures/auth.fixture';
import { TaskSessionPage } from '../../page-objects/task-session.page';
import { mockNextTask, mockSubmitTask } from '../../fixtures/api-mocks';
import {
  TEST_MULTIPLE_CHOICE_TASK,
  TEST_TASK_SUBMIT_CORRECT,
  TEST_TASK_SUBMIT_INCORRECT,
} from '../../fixtures/test-data';

test.describe('Task Session — Multiple Choice', () => {
  test.beforeEach(async ({ studentPage }) => {
    await mockNextTask(studentPage, 'MultipleChoice');
  });

  test('should display multiple choice question and options', async ({ studentPage }) => {
    const session = new TaskSessionPage(studentPage);
    await session.goto('topic-algebra');
    await session.expectTaskLoaded();

    await expect(studentPage.locator('body')).toContainText(TEST_MULTIPLE_CHOICE_TASK.question);
    await session.expectMultipleChoiceOptionsCount(TEST_MULTIPLE_CHOICE_TASK.options.length);
  });

  test('should have submit disabled before selection', async ({ studentPage }) => {
    const session = new TaskSessionPage(studentPage);
    await session.goto('topic-algebra');
    await session.expectTaskLoaded();
    await session.expectSubmitDisabled();
  });

  test('should enable submit after selecting an option', async ({ studentPage }) => {
    const session = new TaskSessionPage(studentPage);
    await session.goto('topic-algebra');
    await session.expectTaskLoaded();

    await session.selectMultipleChoiceOption(1);
    await session.expectSubmitEnabled();
  });

  test('should show correct feedback on correct answer', async ({ studentPage }) => {
    await mockSubmitTask(studentPage, true);
    const session = new TaskSessionPage(studentPage);
    await session.goto('topic-algebra');
    await session.expectTaskLoaded();

    await session.selectMultipleChoiceOption(1); // x = 5 (correct)
    await session.submit();

    await session.expectCorrectFeedback();
    await session.expectXpEarned(TEST_TASK_SUBMIT_CORRECT.xpEarned);
  });

  test('should show incorrect feedback on wrong answer', async ({ studentPage }) => {
    await mockSubmitTask(studentPage, false);
    const session = new TaskSessionPage(studentPage);
    await session.goto('topic-algebra');
    await session.expectTaskLoaded();

    await session.selectMultipleChoiceOption(0); // x = 3 (wrong)
    await session.submit();

    await session.expectIncorrectFeedback();
    await expect(session.feedbackCorrectAnswer).toContainText(TEST_TASK_SUBMIT_INCORRECT.correctAnswer);
  });

  test('should show explanation after submit', async ({ studentPage }) => {
    await mockSubmitTask(studentPage, true);
    const session = new TaskSessionPage(studentPage);
    await session.goto('topic-algebra');
    await session.expectTaskLoaded();

    await session.selectMultipleChoiceOption(1);
    await session.submit();

    await expect(session.feedbackExplanation).toContainText('2x + 6 = 16');
  });

  test('should change selected option before submitting', async ({ studentPage }) => {
    const session = new TaskSessionPage(studentPage);
    await session.goto('topic-algebra');
    await session.expectTaskLoaded();

    await session.selectMultipleChoiceOption(0);
    await session.expectSubmitEnabled();

    await session.selectMultipleChoiceOption(2);
    // Should still be enabled — just different selection
    await session.expectSubmitEnabled();
  });

  test('should select option using keyboard shortcuts (1-4)', async ({ studentPage }) => {
    await mockSubmitTask(studentPage, true);
    const session = new TaskSessionPage(studentPage);
    await session.goto('topic-algebra');
    await session.expectTaskLoaded();

    // Press '2' for second option
    await studentPage.keyboard.press('2');
    await session.expectSubmitEnabled();
  });
});
