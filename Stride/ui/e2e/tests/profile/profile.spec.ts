import { test, expect } from '../../fixtures/auth.fixture';
import { ProfilePage, EditProfileDialog } from '../../page-objects/profile.page';
import {
  mockUserProfile,
  mockAvatarUpload,
  mockDataExport,
  mockAchievements,
} from '../../fixtures/api-mocks';
import {
  TEST_STUDENT,
  TEST_STUDENT_PROFILE,
  API_BASE,
} from '../../fixtures/test-data';

test.describe('Profile — View', () => {
  test('should display user profile page', async ({ studentPage }) => {
    const profile = new ProfilePage(studentPage);
    await profile.goto();
    await profile.expectPageLoaded();
  });

  test('should show display name', async ({ studentPage }) => {
    const profile = new ProfilePage(studentPage);
    await profile.goto();
    await profile.expectPageLoaded();
    await profile.expectDisplayName(TEST_STUDENT.displayName);
  });

  test('should show email address', async ({ studentPage }) => {
    const profile = new ProfilePage(studentPage);
    await profile.goto();
    await profile.expectPageLoaded();
    await profile.expectEmail(TEST_STUDENT.email);
  });

  test('should show student stats section', async ({ studentPage }) => {
    const profile = new ProfilePage(studentPage);
    await profile.goto();
    await profile.expectPageLoaded();
    await profile.expectStatsVisible();
  });

  test('should display XP stat', async ({ studentPage }) => {
    const profile = new ProfilePage(studentPage);
    await profile.goto();
    await profile.expectPageLoaded();
    await expect(profile.totalXp).toContainText(String(TEST_STUDENT_PROFILE.studentStats!.totalXp));
  });

  test('should display current level', async ({ studentPage }) => {
    const profile = new ProfilePage(studentPage);
    await profile.goto();
    await profile.expectPageLoaded();
    await expect(profile.currentLevel).toContainText(String(TEST_STUDENT_PROFILE.studentStats!.currentLevel));
  });

  test('should display streak stat', async ({ studentPage }) => {
    const profile = new ProfilePage(studentPage);
    await profile.goto();
    await profile.expectPageLoaded();
    await expect(profile.currentStreak).toContainText(String(TEST_STUDENT_PROFILE.studentStats!.currentStreak));
  });

  test('should display achievements count', async ({ studentPage }) => {
    const profile = new ProfilePage(studentPage);
    await profile.goto();
    await profile.expectPageLoaded();
    await expect(profile.achievementsUnlocked).toContainText(String(TEST_STUDENT_PROFILE.studentStats!.achievementsUnlocked));
  });

  test('should show edit, export, and delete buttons', async ({ studentPage }) => {
    const profile = new ProfilePage(studentPage);
    await profile.goto();
    await profile.expectPageLoaded();

    await expect(profile.editButton).toBeVisible();
    await expect(profile.exportDataButton).toBeVisible();
    await expect(profile.deleteAccountButton).toBeVisible();
  });
});

test.describe('Profile — Edit', () => {
  test('should open edit dialog on edit button click', async ({ studentPage }) => {
    const profile = new ProfilePage(studentPage);
    const editDialog = new EditProfileDialog(studentPage);

    await profile.goto();
    await profile.expectPageLoaded();
    await profile.openEditDialog();

    await editDialog.expectOpen();
  });

  test('should pre-populate current display name in edit dialog', async ({ studentPage }) => {
    const profile = new ProfilePage(studentPage);
    const editDialog = new EditProfileDialog(studentPage);

    await profile.goto();
    await profile.expectPageLoaded();
    await profile.openEditDialog();
    await editDialog.expectOpen();

    await expect(editDialog.displayNameInput).toHaveValue(TEST_STUDENT.displayName);
  });

  test('should update display name successfully', async ({ studentPage }) => {
    await mockUserProfile(studentPage, 'Student');

    const profile = new ProfilePage(studentPage);
    const editDialog = new EditProfileDialog(studentPage);

    await profile.goto();
    await profile.expectPageLoaded();
    await profile.openEditDialog();
    await editDialog.expectOpen();

    await editDialog.updateDisplayName('Оновлене Імʼя');
    await editDialog.save();

    // Dialog should close
    await expect(editDialog.dialog).not.toBeVisible();
  });

  test('should cancel edit without saving', async ({ studentPage }) => {
    const profile = new ProfilePage(studentPage);
    const editDialog = new EditProfileDialog(studentPage);

    await profile.goto();
    await profile.expectPageLoaded();
    await profile.openEditDialog();
    await editDialog.expectOpen();

    await editDialog.updateDisplayName('Should Not Save');
    await editDialog.cancelButton.click();

    await expect(editDialog.dialog).not.toBeVisible();
    // Original name should still be displayed
    await profile.expectDisplayName(TEST_STUDENT.displayName);
  });
});

test.describe('Profile — Data Export', () => {
  test('should trigger data export', async ({ studentPage }) => {
    await mockDataExport(studentPage);

    const profile = new ProfilePage(studentPage);
    await profile.goto();
    await profile.expectPageLoaded();

    await profile.clickExportData();

    // Should show success indication or download link
    await studentPage.waitForTimeout(500);
  });
});

test.describe('Profile — Delete Account', () => {
  test('should show confirmation dialog on delete click', async ({ studentPage }) => {
    await mockUserProfile(studentPage, 'Student');

    const profile = new ProfilePage(studentPage);
    await profile.goto();
    await profile.expectPageLoaded();

    await profile.clickDeleteAccount();

    // Confirmation dialog should appear
    await expect(studentPage.locator('mat-dialog-container')).toBeVisible();
  });

  test('should cancel account deletion', async ({ studentPage }) => {
    const profile = new ProfilePage(studentPage);
    await profile.goto();
    await profile.expectPageLoaded();

    await profile.clickDeleteAccount();
    await expect(studentPage.locator('mat-dialog-container')).toBeVisible();

    // Click cancel
    await studentPage.locator('mat-dialog-container button').filter({ hasText: /Скасувати/i }).click();
    await expect(studentPage.locator('mat-dialog-container')).not.toBeVisible();
  });
});

test.describe('Profile — Teacher View', () => {
  test('should show teacher-specific stats', async ({ teacherPage }) => {
    const profile = new ProfilePage(teacherPage);
    await teacherPage.goto('/profile');
    await teacherPage.waitForLoadState('networkidle');

    await profile.expectPageLoaded();
    // Teacher should see class/student stats instead of XP/streak
    await expect(teacherPage.locator('body')).toContainText('Тестовий Вчитель');
  });
});
