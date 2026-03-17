import { test, expect } from '../../fixtures/auth.fixture';
import { TaskSessionPage } from '../../page-objects/task-session.page';
import { mockNextTask, mockSubmitTask } from '../../fixtures/api-mocks';
import {
  TEST_FILL_BLANK_TASK,
  TEST_TASK_SUBMIT_CORRECT,
  TEST_TASK_SUBMIT_INCORRECT,
} from '../../fixtures/test-data';

test.describe('Task Session — Fill Blank', () => {
  test.beforeEach(async ({ studentPage }) => {
    await mockNextTask(studentPage, 'FillBlank');
  });

  test('should display fill-blank question with input fields', async ({ studentPage }) => {
    const session = new TaskSessionPage(studentPage);
    await session.goto('topic-geography');
    await session.expectTaskLoaded();

    // Question has 2 blanks ({{blank}} ... {{blank}})
    await session.expectFillBlankInputCount(2);
  });

  test('should have submit disabled when blanks are empty', async ({ studentPage }) => {
    const session = new TaskSessionPage(studentPage);
    await session.goto('topic-geography');
    await session.expectTaskLoaded();
    await session.expectSubmitDisabled();
  });

  test('should enable submit after filling all blanks', async ({ studentPage }) => {
    const session = new TaskSessionPage(studentPage);
    await session.goto('topic-geography');
    await session.expectTaskLoaded();

    await session.fillBlank(0, 'Київ');
    await session.fillBlank(1, 'Дніпро');
    await session.expectSubmitEnabled();
  });

  test('should keep submit disabled with only partial blanks filled', async ({ studentPage }) => {
    const session = new TaskSessionPage(studentPage);
    await session.goto('topic-geography');
    await session.expectTaskLoaded();

    await session.fillBlank(0, 'Київ');
    // Second blank still empty
    await session.expectSubmitDisabled();
  });

  test('should show correct feedback on right answers', async ({ studentPage }) => {
    await mockSubmitTask(studentPage, true);
    const session = new TaskSessionPage(studentPage);
    await session.goto('topic-geography');
    await session.expectTaskLoaded();

    await session.fillBlank(0, 'Київ');
    await session.fillBlank(1, 'Дніпро');
    await session.submit();

    await session.expectCorrectFeedback();
    await session.expectXpEarned(TEST_TASK_SUBMIT_CORRECT.xpEarned);
  });

  test('should show incorrect feedback on wrong answers', async ({ studentPage }) => {
    await mockSubmitTask(studentPage, false);
    const session = new TaskSessionPage(studentPage);
    await session.goto('topic-geography');
    await session.expectTaskLoaded();

    await session.fillBlank(0, 'Харків');
    await session.fillBlank(1, 'Дунай');
    await session.submit();

    await session.expectIncorrectFeedback();
  });

  test('should tab between blank inputs', async ({ studentPage }) => {
    const session = new TaskSessionPage(studentPage);
    await session.goto('topic-geography');
    await session.expectTaskLoaded();

    await session.fillBlankInputs.first().click();
    await studentPage.keyboard.type('Київ');
    await studentPage.keyboard.press('Tab');

    // Second input should be focused
    await expect(session.fillBlankInputs.nth(1)).toBeFocused();
  });
});
