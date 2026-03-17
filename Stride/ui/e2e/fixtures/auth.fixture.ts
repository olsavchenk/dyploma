import { test as base, Page } from '@playwright/test';
import {
  TEST_STUDENT,
  TEST_TEACHER,
  TEST_ADMIN,
  TEST_JWT_TOKEN,
  TEST_TEACHER_TOKEN,
  TEST_ADMIN_TOKEN,
  TEST_GAMIFICATION_STATS,
  TEST_STUDENT_PROFILE,
  TEST_TEACHER_PROFILE,
  TEST_STUDENT_CLASSES,
  TEST_CONTINUE_LEARNING,
  TEST_LEADERBOARD_PREVIEW,
  TEST_CLASSES,
  TEST_CLASS_QUICK_STATS,
  TEST_ADMIN_DASHBOARD,
  API_BASE,
} from './test-data';

/** Set up localStorage-based auth for a given role and mock common endpoints. */
async function authenticateAs(
  page: Page,
  user: typeof TEST_STUDENT,
  token: string,
): Promise<void> {
  // Inject auth state into localStorage before navigating
  await page.addInitScript(
    ({ token, user }) => {
      localStorage.setItem('stride_access_token', token);
      localStorage.setItem('stride_user', JSON.stringify(user));
    },
    { token, user },
  );
}

/** Mock endpoints common to every authenticated session. */
async function mockCommonEndpoints(page: Page, role: string): Promise<void> {
  // Refresh token — always succeed
  await page.route(`${API_BASE}/auth/refresh`, (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ token: TEST_JWT_TOKEN }) }),
  );

  // Logout
  await page.route(`${API_BASE}/auth/logout`, (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }),
  );

  // Gamification stats — used by header, dashboard
  await page.route(`${API_BASE}/gamification/stats`, (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(TEST_GAMIFICATION_STATS) }),
  );

  // i18n translations
  await page.route('**/assets/i18n/*.json', (route) => route.continue());

  if (role === 'Student') {
    // Profile
    await page.route(`${API_BASE}/users/me`, (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(TEST_STUDENT_PROFILE) });
      }
      return route.continue();
    });

    // Classes for learn-browse
    await page.route(`${API_BASE}/classes/my`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(TEST_STUDENT_CLASSES) }),
    );

    // Continue learning
    await page.route(`${API_BASE}/learning/continue*`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(TEST_CONTINUE_LEARNING) }),
    );

    // Leaderboard preview
    await page.route(`${API_BASE}/leaderboard/preview`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(TEST_LEADERBOARD_PREVIEW) }),
    );
  }

  if (role === 'Teacher') {
    await page.route(`${API_BASE}/users/me`, (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(TEST_TEACHER_PROFILE) });
      }
      return route.continue();
    });

    await page.route(`${API_BASE}/classes/stats`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(TEST_CLASS_QUICK_STATS) }),
    );

    await page.route(`${API_BASE}/classes`, (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(TEST_CLASSES) });
      }
      return route.continue();
    });
  }

  if (role === 'Admin') {
    await page.route(`${API_BASE}/users/me`, (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ ...TEST_STUDENT_PROFILE, id: TEST_ADMIN.id, email: TEST_ADMIN.email, displayName: TEST_ADMIN.displayName, role: 'Admin' }),
        });
      }
      return route.continue();
    });

    await page.route(`${API_BASE}/admin/analytics/dashboard`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(TEST_ADMIN_DASHBOARD) }),
    );
  }
}

// ─── Custom fixtures ─────────────────────────────────────────────────────────

type AuthFixtures = {
  studentPage: Page;
  teacherPage: Page;
  adminPage: Page;
};

export const test = base.extend<AuthFixtures>({
  studentPage: async ({ page }, use) => {
    await authenticateAs(page, TEST_STUDENT, TEST_JWT_TOKEN);
    await mockCommonEndpoints(page, 'Student');
    await use(page);
  },

  teacherPage: async ({ page }, use) => {
    await authenticateAs(page, TEST_TEACHER, TEST_TEACHER_TOKEN);
    await mockCommonEndpoints(page, 'Teacher');
    await use(page);
  },

  adminPage: async ({ page }, use) => {
    await authenticateAs(page, TEST_ADMIN, TEST_ADMIN_TOKEN);
    await mockCommonEndpoints(page, 'Admin');
    await use(page);
  },
});

export { expect } from '@playwright/test';
