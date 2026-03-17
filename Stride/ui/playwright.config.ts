import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e/tests',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 1 : 0,
  workers: process.env['CI'] ? 1 : undefined,
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'e2e/playwright-report' }],
  ],
  outputDir: 'e2e/test-results',

  timeout: 30_000,
  expect: { timeout: 5_000 },

  use: {
    baseURL: 'http://localhost:4200',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    locale: 'uk-UA',
    timezoneId: 'Europe/Kyiv',
  },

  projects: [
    // --- Desktop ---
    {
      name: 'desktop-chrome',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
      },
    },
    {
      name: 'desktop-firefox',
      use: {
        ...devices['Desktop Firefox'],
        viewport: { width: 1440, height: 900 },
      },
    },
    {
      name: 'desktop-webkit',
      use: {
        ...devices['Desktop Safari'],
        viewport: { width: 1440, height: 900 },
      },
    },
    // --- Tablet ---
    {
      name: 'tablet-chrome',
      use: {
        ...devices['iPad (gen 7)'],
      },
    },
    // --- Mobile ---
    {
      name: 'mobile-chrome',
      use: {
        ...devices['Pixel 5'],
      },
    },
    {
      name: 'mobile-safari',
      use: {
        ...devices['iPhone 13'],
      },
    },
  ],

  webServer: {
    command: 'npx ng serve --port 4200',
    port: 4200,
    reuseExistingServer: !process.env['CI'],
    timeout: 120_000,
  },
});
