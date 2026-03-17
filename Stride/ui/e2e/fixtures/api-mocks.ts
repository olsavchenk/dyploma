import { Page, Route } from '@playwright/test';
import {
  API_BASE,
  TEST_STUDENT,
  TEST_JWT_TOKEN,
  TEST_GAMIFICATION_STATS,
  TEST_GAMIFICATION_STATS_EMPTY,
  TEST_ACHIEVEMENTS,
  TEST_SUBJECTS,
  TEST_TOPICS,
  TEST_CONTINUE_LEARNING,
  TEST_STUDENT_CLASSES,
  TEST_MULTIPLE_CHOICE_TASK,
  TEST_FILL_BLANK_TASK,
  TEST_TRUE_FALSE_TASK,
  TEST_MATCHING_TASK,
  TEST_ORDERING_TASK,
  TEST_TASK_SUBMIT_CORRECT,
  TEST_TASK_SUBMIT_INCORRECT,
  TEST_LEADERBOARD,
  TEST_LEADERBOARD_PREVIEW,
  TEST_STUDENT_PROFILE,
  TEST_TEACHER_PROFILE,
  TEST_CLASSES,
  TEST_CLASS_QUICK_STATS,
  TEST_CLASS_STUDENTS,
  TEST_CLASS_ANALYTICS,
  TEST_ASSIGNMENTS,
  TEST_STUDENT_DETAIL,
  TEST_TASK_TEMPLATES,
  TEST_ADMIN_DASHBOARD,
  TEST_ADMIN_USERS,
  TEST_REVIEW_QUEUE,
} from './test-data';

type TaskType = 'MultipleChoice' | 'FillBlank' | 'TrueFalse' | 'Matching' | 'Ordering';

const TASK_MAP: Record<TaskType, object> = {
  MultipleChoice: TEST_MULTIPLE_CHOICE_TASK,
  FillBlank: TEST_FILL_BLANK_TASK,
  TrueFalse: TEST_TRUE_FALSE_TASK,
  Matching: TEST_MATCHING_TASK,
  Ordering: TEST_ORDERING_TASK,
};

// ─── Auth mocks ──────────────────────────────────────────────────────────────

export async function mockLoginSuccess(page: Page): Promise<void> {
  await page.route(`${API_BASE}/auth/login`, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ token: TEST_JWT_TOKEN, user: TEST_STUDENT }),
    }),
  );
}

export async function mockLoginFailure(page: Page, message = 'Невірні облікові дані'): Promise<void> {
  await page.route(`${API_BASE}/auth/login`, (route) =>
    route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({ message }),
    }),
  );
}

export async function mockRegisterSuccess(page: Page): Promise<void> {
  const newUser = { ...TEST_STUDENT, hasCompletedOnboarding: false };
  await page.route(`${API_BASE}/auth/register`, (route) =>
    route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({ token: TEST_JWT_TOKEN, user: newUser }),
    }),
  );
}

export async function mockRegisterDuplicateEmail(page: Page): Promise<void> {
  await page.route(`${API_BASE}/auth/register`, (route) =>
    route.fulfill({
      status: 409,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'Користувач з таким email вже існує' }),
    }),
  );
}

export async function mockSelectRole(page: Page): Promise<void> {
  await page.route(`${API_BASE}/auth/select-role`, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ token: TEST_JWT_TOKEN, user: { ...TEST_STUDENT, hasCompletedOnboarding: true } }),
    }),
  );
}

export async function mockForgotPassword(page: Page): Promise<void> {
  await page.route(`${API_BASE}/auth/forgot-password`, (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }),
  );
}

// ─── Learning mocks ──────────────────────────────────────────────────────────

export async function mockSubjects(page: Page): Promise<void> {
  await page.route(`${API_BASE}/subjects`, (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(TEST_SUBJECTS) }),
  );
}

export async function mockSubjectTopics(page: Page, subjectId = 'subj-math'): Promise<void> {
  await page.route(`${API_BASE}/subjects/${subjectId}/topics`, (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(TEST_TOPICS) }),
  );
}

export async function mockTopic(page: Page, topicId = 'topic-algebra'): Promise<void> {
  await page.route(`${API_BASE}/topics/${topicId}`, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(TEST_TOPICS.find((t) => t.id === topicId) ?? TEST_TOPICS[0]),
    }),
  );
}

export async function mockStudentClasses(page: Page): Promise<void> {
  await page.route(`${API_BASE}/classes/my`, (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(TEST_STUDENT_CLASSES) }),
  );
}

export async function mockJoinClass(page: Page, success = true): Promise<void> {
  await page.route(`${API_BASE}/classes/join`, (route) =>
    success
      ? route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(TEST_STUDENT_CLASSES[0]) })
      : route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ message: 'Клас не знайдено' }) }),
  );
}

export async function mockContinueLearning(page: Page, empty = false): Promise<void> {
  await page.route(`${API_BASE}/learning/continue*`, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(empty ? [] : TEST_CONTINUE_LEARNING),
    }),
  );
}

// ─── Task mocks ──────────────────────────────────────────────────────────────

export async function mockNextTask(page: Page, taskType: TaskType = 'MultipleChoice'): Promise<void> {
  await page.route(`${API_BASE}/tasks/next*`, (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(TASK_MAP[taskType]) }),
  );
}

export async function mockSubmitTask(page: Page, correct = true): Promise<void> {
  await page.route(`${API_BASE}/tasks/*/submit`, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(correct ? TEST_TASK_SUBMIT_CORRECT : TEST_TASK_SUBMIT_INCORRECT),
    }),
  );
}

export async function mockTaskHistory(page: Page): Promise<void> {
  await page.route(`${API_BASE}/tasks/history*`, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ items: [], totalCount: 0, page: 1, pageSize: 20 }),
    }),
  );
}

// ─── Gamification mocks ──────────────────────────────────────────────────────

export async function mockGamificationStats(page: Page, empty = false): Promise<void> {
  await page.route(`${API_BASE}/gamification/stats`, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(empty ? TEST_GAMIFICATION_STATS_EMPTY : TEST_GAMIFICATION_STATS),
    }),
  );
}

export async function mockAchievements(page: Page): Promise<void> {
  await page.route(`${API_BASE}/gamification/achievements`, (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(TEST_ACHIEVEMENTS) }),
  );
}

export async function mockStreakFreeze(page: Page, success = true): Promise<void> {
  await page.route(`${API_BASE}/gamification/streak/freeze`, (route) =>
    success
      ? route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ...TEST_GAMIFICATION_STATS, streakFreezes: TEST_GAMIFICATION_STATS.streakFreezes - 1 }) })
      : route.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ message: 'Недостатньо XP' }) }),
  );
}

export async function mockStreakRepair(page: Page, success = true): Promise<void> {
  await page.route(`${API_BASE}/gamification/streak/repair`, (route) =>
    success
      ? route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ...TEST_GAMIFICATION_STATS, currentStreak: 1 }) })
      : route.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ message: 'Недостатньо XP' }) }),
  );
}

// ─── Leaderboard mocks ──────────────────────────────────────────────────────

export async function mockLeaderboard(page: Page): Promise<void> {
  await page.route(`${API_BASE}/leaderboard?*`, (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(TEST_LEADERBOARD) }),
  );
  // Also handle without query params
  await page.route(`${API_BASE}/leaderboard`, (route) => {
    if (route.request().url().includes('preview')) return route.continue();
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(TEST_LEADERBOARD) });
  });
}

export async function mockLeaderboardPreview(page: Page): Promise<void> {
  await page.route(`${API_BASE}/leaderboard/preview`, (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(TEST_LEADERBOARD_PREVIEW) }),
  );
}

// ─── Profile mocks ──────────────────────────────────────────────────────────

export async function mockUserProfile(page: Page, role: 'Student' | 'Teacher' = 'Student'): Promise<void> {
  const profile = role === 'Student' ? TEST_STUDENT_PROFILE : TEST_TEACHER_PROFILE;
  await page.route(`${API_BASE}/users/me`, (route) => {
    if (route.request().method() === 'GET') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(profile) });
    }
    if (route.request().method() === 'PUT') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ...profile, displayName: 'Оновлене Імʼя' }) });
    }
    if (route.request().method() === 'DELETE') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    }
    return route.continue();
  });
}

export async function mockAvatarUpload(page: Page): Promise<void> {
  await page.route(`${API_BASE}/users/me/avatar`, (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ avatarUrl: 'http://localhost:9000/avatars/test.jpg' }) }),
  );
}

export async function mockDataExport(page: Page): Promise<void> {
  await page.route(`${API_BASE}/users/me/data-export`, (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ downloadUrl: 'http://localhost:9000/exports/test.zip' }) }),
  );
}

// ─── Teacher mocks ──────────────────────────────────────────────────────────

export async function mockTeacherClasses(page: Page): Promise<void> {
  await page.route(`${API_BASE}/classes`, (route) => {
    if (route.request().method() === 'GET') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(TEST_CLASSES) });
    }
    if (route.request().method() === 'POST') {
      const newClass = { ...TEST_CLASSES[0], id: 'class-new', name: 'Новий клас', joinCode: 'NEW123' };
      return route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(newClass) });
    }
    return route.continue();
  });
}

export async function mockTeacherQuickStats(page: Page): Promise<void> {
  await page.route(`${API_BASE}/classes/stats`, (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(TEST_CLASS_QUICK_STATS) }),
  );
}

export async function mockClassDetail(page: Page, classId = 'class-001'): Promise<void> {
  await page.route(`${API_BASE}/classes/${classId}`, (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(TEST_CLASSES[0]) }),
  );

  await page.route(`${API_BASE}/classes/${classId}/students`, (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(TEST_CLASS_STUDENTS) }),
  );

  await page.route(`${API_BASE}/classes/${classId}/analytics`, (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(TEST_CLASS_ANALYTICS) }),
  );

  await page.route(`${API_BASE}/classes/${classId}/assignments`, (route) => {
    if (route.request().method() === 'GET') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(TEST_ASSIGNMENTS) });
    }
    if (route.request().method() === 'POST') {
      return route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ ...TEST_ASSIGNMENTS[0], id: 'assign-new' }) });
    }
    return route.continue();
  });
}

export async function mockStudentDetail(page: Page, classId = 'class-001', studentId = 'student-001'): Promise<void> {
  await page.route(`${API_BASE}/classes/${classId}/students/${studentId}`, (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(TEST_STUDENT_DETAIL) }),
  );
}

export async function mockTaskReview(page: Page, topicId = 'topic-algebra'): Promise<void> {
  await page.route(`${API_BASE}/topics/${topicId}/tasks?*`, (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(TEST_TASK_TEMPLATES) }),
  );
  await page.route(`${API_BASE}/topics/${topicId}/tasks`, (route) => {
    if (route.request().method() === 'GET') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(TEST_TASK_TEMPLATES) });
    }
    return route.continue();
  });
  await page.route(`${API_BASE}/topics/${topicId}/tasks/*/approve`, (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }),
  );
  await page.route(`${API_BASE}/topics/${topicId}/tasks/*/reject`, (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }),
  );
  await page.route(`${API_BASE}/topics/${topicId}/tasks/bulk-action`, (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }),
  );
}

// ─── Admin mocks ─────────────────────────────────────────────────────────────

export async function mockAdminDashboard(page: Page): Promise<void> {
  await page.route(`${API_BASE}/admin/analytics/dashboard`, (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(TEST_ADMIN_DASHBOARD) }),
  );
}

export async function mockAdminUsers(page: Page): Promise<void> {
  await page.route(`${API_BASE}/admin/users*`, (route) => {
    if (route.request().method() === 'GET') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(TEST_ADMIN_USERS) });
    }
    return route.continue();
  });
  await page.route(`${API_BASE}/admin/users/*/role`, (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }),
  );
}

export async function mockAdminReviewQueue(page: Page): Promise<void> {
  await page.route(`${API_BASE}/admin/ai/review-queue*`, (route) => {
    if (route.request().method() === 'GET') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(TEST_REVIEW_QUEUE) });
    }
    return route.continue();
  });
  await page.route(`${API_BASE}/admin/ai/review-queue/*/approve`, (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }),
  );
  await page.route(`${API_BASE}/admin/ai/review-queue/*/reject`, (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }),
  );
}
