import { test, expect } from '../../fixtures/auth.fixture';
import { TaskSessionPage } from '../../page-objects/task-session.page';
import { mockNextTask, mockSubmitTask } from '../../fixtures/api-mocks';
import {
  TEST_MATCHING_TASK,
  TEST_TASK_SUBMIT_CORRECT,
  TEST_TASK_SUBMIT_INCORRECT,
} from '../../fixtures/test-data';

test.describe('Task Session — Matching', () => {
  test.beforeEach(async ({ studentPage }) => {
    await mockNextTask(studentPage, 'Matching');
  });

  test('should display matching question with left and right items', async ({ studentPage }) => {
    const session = new TaskSessionPage(studentPage);
    await session.goto('topic-geography');
    await session.expectTaskLoaded();

    await expect(studentPage.locator('body')).toContainText(TEST_MATCHING_TASK.question);
    await expect(session.leftItems).toHaveCount(TEST_MATCHING_TASK.leftItems.length);
    await expect(session.rightItems).toHaveCount(TEST_MATCHING_TASK.rightItems.length);
  });

  test('should display item content in left and right columns', async ({ studentPage }) => {
    const session = new TaskSessionPage(studentPage);
    await session.goto('topic-geography');
    await session.expectTaskLoaded();

    for (const item of TEST_MATCHING_TASK.leftItems) {
      await expect(session.leftItems.filter({ hasText: item.content })).toBeVisible();
    }
    for (const item of TEST_MATCHING_TASK.rightItems) {
      await expect(session.rightItems.filter({ hasText: item.content })).toBeVisible();
    }
  });

  test('should have submit disabled before all matches made', async ({ studentPage }) => {
    const session = new TaskSessionPage(studentPage);
    await session.goto('topic-geography');
    await session.expectTaskLoaded();
    await session.expectSubmitDisabled();
  });

  test('should create a match by clicking left then right', async ({ studentPage }) => {
    const session = new TaskSessionPage(studentPage);
    await session.goto('topic-geography');
    await session.expectTaskLoaded();

    // Match Україна → Київ
    await session.createMatch(0, 1);

    // Should show the match in summary or visually indicate pairing
    await expect(session.matchesSummary).toBeVisible();
  });

  test('should enable submit after all items matched', async ({ studentPage }) => {
    const session = new TaskSessionPage(studentPage);
    await session.goto('topic-geography');
    await session.expectTaskLoaded();

    // Correct matching: Україна→Київ, Франція→Париж, Японія→Токіо
    await session.createMatch(0, 1); // Україна → Київ
    await session.createMatch(1, 2); // Франція → Париж
    await session.createMatch(2, 0); // Японія → Токіо

    await session.expectSubmitEnabled();
  });

  test('should show correct feedback for correct matches', async ({ studentPage }) => {
    await mockSubmitTask(studentPage, true);
    const session = new TaskSessionPage(studentPage);
    await session.goto('topic-geography');
    await session.expectTaskLoaded();

    await session.createMatch(0, 1);
    await session.createMatch(1, 2);
    await session.createMatch(2, 0);
    await session.submit();

    await session.expectCorrectFeedback();
    await session.expectXpEarned(TEST_TASK_SUBMIT_CORRECT.xpEarned);
  });

  test('should show incorrect feedback for wrong matches', async ({ studentPage }) => {
    await mockSubmitTask(studentPage, false);
    const session = new TaskSessionPage(studentPage);
    await session.goto('topic-geography');
    await session.expectTaskLoaded();

    // Wrong matches
    await session.createMatch(0, 0); // Україна → Токіо (wrong)
    await session.createMatch(1, 1); // Франція → Київ (wrong)
    await session.createMatch(2, 2); // Японія → Париж (wrong)
    await session.submit();

    await session.expectIncorrectFeedback();
  });

  test('should clear all matches with clear button', async ({ studentPage }) => {
    const session = new TaskSessionPage(studentPage);
    await session.goto('topic-geography');
    await session.expectTaskLoaded();

    await session.createMatch(0, 1);
    await session.createMatch(1, 2);

    await session.clearMatchesButton.click();
    await session.expectSubmitDisabled();
  });

  test('should highlight selected left item before right is chosen', async ({ studentPage }) => {
    const session = new TaskSessionPage(studentPage);
    await session.goto('topic-geography');
    await session.expectTaskLoaded();

    await session.leftItems.first().click();
    await expect(session.leftItems.first()).toHaveClass(/selected|active/);
  });
});
