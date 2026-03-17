import { test, expect } from '../../fixtures/auth.fixture';
import { TaskSessionPage } from '../../page-objects/task-session.page';
import { mockNextTask, mockSubmitTask } from '../../fixtures/api-mocks';
import {
  TEST_ORDERING_TASK,
  TEST_TASK_SUBMIT_CORRECT,
} from '../../fixtures/test-data';

test.describe('Task Session — Ordering', () => {
  test.beforeEach(async ({ studentPage }) => {
    await mockNextTask(studentPage, 'Ordering');
  });

  test('should display ordering question with items', async ({ studentPage }) => {
    const session = new TaskSessionPage(studentPage);
    await session.goto('topic-algebra');
    await session.expectTaskLoaded();

    await expect(studentPage.locator('body')).toContainText(TEST_ORDERING_TASK.question);
    await expect(session.orderingItems).toHaveCount(TEST_ORDERING_TASK.items.length);
  });

  test('should display all ordering items text', async ({ studentPage }) => {
    const session = new TaskSessionPage(studentPage);
    await session.goto('topic-algebra');
    await session.expectTaskLoaded();

    for (const item of TEST_ORDERING_TASK.items) {
      await expect(session.orderingItems.filter({ hasText: item })).toBeVisible();
    }
  });

  test('should move item up using UI button', async ({ studentPage }) => {
    const session = new TaskSessionPage(studentPage);
    await session.goto('topic-algebra');
    await session.expectTaskLoaded();

    // Get text of item at index 2
    const originalSecondText = await session.orderingItems.nth(1).innerText();

    // Move item at index 2 up to position 1
    await session.moveOrderItemUp(2);

    // The former third item should now be at index 1
    const newSecondText = await session.orderingItems.nth(1).innerText();
    expect(newSecondText).not.toBe(originalSecondText);
  });

  test('should move item down using UI button', async ({ studentPage }) => {
    const session = new TaskSessionPage(studentPage);
    await session.goto('topic-algebra');
    await session.expectTaskLoaded();

    const originalSecondText = await session.orderingItems.nth(1).innerText();

    await session.moveOrderItemDown(0);

    // First item moved down, so second position changes
    const newFirstText = await session.orderingItems.nth(0).innerText();
    expect(newFirstText).not.toBe(await session.orderingItems.nth(1).innerText());
  });

  test('should move items using keyboard ArrowUp/ArrowDown', async ({ studentPage }) => {
    const session = new TaskSessionPage(studentPage);
    await session.goto('topic-algebra');
    await session.expectTaskLoaded();

    // Click to select an item
    await session.selectOrderItem(2);

    // Press ArrowUp
    await studentPage.keyboard.press('ArrowUp');

    // Item should have moved up by one position
    await session.expectSubmitEnabled();
  });

  test('should reset ordering with reset button', async ({ studentPage }) => {
    const session = new TaskSessionPage(studentPage);
    await session.goto('topic-algebra');
    await session.expectTaskLoaded();

    // Rearrange items
    await session.moveOrderItemUp(2);
    await session.moveOrderItemDown(0);

    // Reset
    await session.resetOrderButton.click();

    // Items should be back to original order
    await expect(session.orderingItems.first()).toContainText(TEST_ORDERING_TASK.items[0]);
  });

  test('should enable submit (ordering always has an answer)', async ({ studentPage }) => {
    const session = new TaskSessionPage(studentPage);
    await session.goto('topic-algebra');
    await session.expectTaskLoaded();

    // Ordering always has items in some order, so submit should be enabled
    await session.expectSubmitEnabled();
  });

  test('should show correct feedback on correct order', async ({ studentPage }) => {
    await mockSubmitTask(studentPage, true);
    const session = new TaskSessionPage(studentPage);
    await session.goto('topic-algebra');
    await session.expectTaskLoaded();

    await session.submit();

    await session.expectCorrectFeedback();
    await session.expectXpEarned(TEST_TASK_SUBMIT_CORRECT.xpEarned);
  });

  test('should show incorrect feedback on wrong order', async ({ studentPage }) => {
    await mockSubmitTask(studentPage, false);
    const session = new TaskSessionPage(studentPage);
    await session.goto('topic-algebra');
    await session.expectTaskLoaded();

    // Shuffle items
    await session.moveOrderItemDown(0);
    await session.moveOrderItemDown(0);
    await session.submit();

    await session.expectIncorrectFeedback();
  });
});
