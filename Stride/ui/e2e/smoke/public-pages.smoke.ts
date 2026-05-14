// Public-page smoke check for the production build.
// Doesn't require the API — only verifies that public/auth routes render
// without console errors or failed asset requests.

import { test, expect } from '@playwright/test';

interface PageReport {
  path: string;
  consoleErrors: string[];
  consoleWarnings: string[];
  failedRequests: string[];
}

const PUBLIC_PATHS = [
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/forbidden',
  '/offline',
];

test.describe('Public pages smoke', () => {
  for (const path of PUBLIC_PATHS) {
    test(`renders ${path} with no console errors`, async ({ page }) => {
      const report: PageReport = {
        path,
        consoleErrors: [],
        consoleWarnings: [],
        failedRequests: [],
      };

      page.on('console', (msg) => {
        if (msg.type() === 'error') report.consoleErrors.push(msg.text());
        if (msg.type() === 'warning') report.consoleWarnings.push(msg.text());
      });

      page.on('requestfailed', (req) => {
        const url = req.url();
        // Ignore expected backend failures — the API isn't up in this run.
        if (url.includes('/api/') || url.includes('/hubs/')) return;
        // Ignore Google fonts CDN if offline.
        if (url.includes('fonts.googleapis.com') || url.includes('fonts.gstatic.com')) return;
        report.failedRequests.push(`${req.method()} ${url}`);
      });

      await page.goto(path, { waitUntil: 'networkidle', timeout: 15_000 });

      // Filter out network errors for backend calls — the API is not running.
      const cleanErrors = report.consoleErrors.filter(
        (e) =>
          !e.includes('Failed to load resource') &&
          !e.includes('ERR_CONNECTION_REFUSED') &&
          !e.includes('NetworkError') &&
          !e.includes('/api/') &&
          !e.includes('/hubs/'),
      );

      // Log full report regardless — Playwright will capture it.
      console.log(`[smoke] ${path}`, JSON.stringify({ ...report, cleanErrors }, null, 2));

      expect(cleanErrors, `Console errors on ${path}: ${cleanErrors.join(' | ')}`).toHaveLength(0);
      expect(report.failedRequests, `Failed asset requests on ${path}`).toHaveLength(0);
    });
  }
});
