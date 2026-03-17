import { test, expect } from '../../fixtures/auth.fixture';
import { TaskSessionPage } from '../../page-objects/task-session.page';
import { mockNextTask, mockSubmitTask } from '../../fixtures/api-mocks';
import {
  TEST_TRUE_FALSE_TASK,
  TEST_TASK_SUBMIT_CORRECT,
  TEST_TASK_SUBMIT_INCORRECT,
} from '../../fixtures/test-data';

test.describe('Task Session — True/False', () => {
  test.beforeEach(async ({ studentPage }) => {
    await mockNextTask(studentPage, 'TrueFalse');
  });

  test('should display true/false question with two buttons', async ({ studentPage }) => {
    const session = new TaskSessionPage(studentPage);
    await session.goto('topic-algebra');
    await session.expectTaskLoaded();

    await expect(studentPage.locator('body')).toContainText(TEST_TRUE_FALSE_TASK.question);
    await expect(session.trueButton).toBeVisible();
    await expect(session.falseButton).toBeVisible();
  });

  test('should have submit disabled before selection', async ({ studentPage }) => {
    const session = new TaskSessionPage(studentPage);
    await session.goto('topic-algebra');
    await session.expectTaskLoaded();
    await session.expectSubmitDisabled();
  });

  test('should enable submit after selecting True', async ({ studentPage }) => {
    const session = new TaskSessionPage(studentPage);
    await session.goto('topic-algebra');
    await session.expectTaskLoaded();

    await session.selectTrue();
    await session.expectSubmitEnabled();
  });

  test('should enable submit after selecting False', async ({ studentPage }) => {
    const session = new TaskSessionPage(studentPage);
    await session.goto('topic-algebra');
    await session.expectTaskLoaded();

    await session.selectFalse();
    await session.expectSubmitEnabled();
  });

  test('should toggle selection between True and False', async ({ studentPage }) => {
    const session = new TaskSessionPage(studentPage);
    await session.goto('topic-algebra');
    await session.expectTaskLoaded();

    await session.selectTrue();
    await expect(session.trueButton).toHaveClass(/selected|active/);

    await session.selectFalse();
    await expect(session.falseButton).toHaveClass(/selected|active/);
  });

  test('should show correct feedback on right answer', async ({ studentPage }) => {
    await mockSubmitTask(studentPage, true);
    const session = new TaskSessionPage(studentPage);
    await session.goto('topic-algebra');
    await session.expectTaskLoaded();

    await session.selectFalse(); // 0 squared is 0, not positive — so false
    await session.submit();

    await session.expectCorrectFeedback();
    await session.expectXpEarned(TEST_TASK_SUBMIT_CORRECT.xpEarned);
  });

  test('should show incorrect feedback on wrong answer', async ({ studentPage }) => {
    await mockSubmitTask(studentPage, false);
    const session = new TaskSessionPage(studentPage);
    await session.goto('topic-algebra');
    await session.expectTaskLoaded();

    await session.selectTrue();
    await session.submit();

    await session.expectIncorrectFeedback();
  });

  test('should accept keyboard shortcut T for True', async ({ studentPage }) => {
    const session = new TaskSessionPage(studentPage);
    await session.goto('topic-algebra');
    await session.expectTaskLoaded();

    await studentPage.keyboard.press('t');
    await session.expectSubmitEnabled();
  });

  test('should accept keyboard shortcut F for False', async ({ studentPage }) => {
    const session = new TaskSessionPage(studentPage);
    await session.goto('topic-algebra');
    await session.expectTaskLoaded();

    await studentPage.keyboard.press('f');
    await session.expectSubmitEnabled();
  });
});
