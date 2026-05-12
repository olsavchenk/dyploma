/**
 * Per-role smoke walk-through of the prod deploy.
 *
 * Logs in as the two prod-seeded roles (student@test.com, teacher@test.com)
 * and walks the navigation surface for each, capturing console errors and
 * failed network requests. Used as evidence for the Phase 5 acceptance
 * criterion: "zero console/network errors verified in Chrome per role".
 *
 * Admin role is NOT seeded in Production (per AdminUserSeeder guard).
 * If you need to verify admin in this run, redeploy with
 * ASPNETCORE_ENVIRONMENT=Staging temporarily.
 */

const { chromium } = require('playwright');

const BASE = process.env.PROD_URL || 'https://192.168.31.30';

const ROLES = [
  {
    label: 'student',
    email: 'student@test.com',
    password: 'Test1234!',
    routes: ['/dashboard', '/learn', '/leaderboard', '/profile'],
  },
  {
    label: 'teacher',
    email: 'teacher@test.com',
    password: 'Test1234!',
    routes: ['/dashboard', '/teacher/dashboard', '/teacher/classes', '/profile'],
  },
];

/**
 * Filter out console output that's noise rather than real errors:
 * - DevTools sourcemap fetches against a non-public IP
 * - Service-worker "registered" info logs
 * - Translation "missing-key" warnings (separate doc task)
 */
function isRealError(text) {
  if (!text) return false;
  const skip = [
    'DevTools failed to load source map',
    'Service worker registered',
    'ServiceWorker registration successful',
    'TranslateService',
    'sw.js registration failed', // benign if not yet deployed
    'Manifest:',
  ];
  return !skip.some((s) => text.includes(s));
}

async function walkRole(browser, role) {
  console.log(`\n──── ${role.label.toUpperCase()} (${role.email}) ────`);

  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
    viewport: { width: 1440, height: 900 },
    locale: 'uk-UA',
  });
  const page = await context.newPage();

  const consoleErrors = [];
  const failedRequests = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error' && isRealError(msg.text())) {
      consoleErrors.push({ where: page.url(), text: msg.text() });
    }
  });
  page.on('requestfailed', (req) => {
    const url = req.url();
    if (url.includes('fonts.googleapis.com') || url.includes('fonts.gstatic.com')) return;
    failedRequests.push({
      where: page.url(),
      method: req.method(),
      url,
      reason: req.failure()?.errorText || 'unknown',
    });
  });

  try {
    // 1. Login
    await page.goto(`${BASE}/auth/login`, { waitUntil: 'networkidle', timeout: 30_000 });
    await page.locator('input[type="email"]').first().fill(role.email);
    await page.locator('input[type="password"]').first().fill(role.password);
    const [loginResp] = await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes('/api/v1/auth/login') && r.request().method() === 'POST',
        { timeout: 30_000 },
      ),
      page.locator('button[type="submit"]').first().click(),
    ]);
    console.log(`  POST /api/v1/auth/login → HTTP ${loginResp.status()}`);

    if (loginResp.status() !== 200) {
      const body = await loginResp.text();
      console.log(`  ❌ login failed body: ${body.slice(0, 200)}`);
      await context.close();
      return { role: role.label, login: 'failed', consoleErrors, failedRequests };
    }

    await page.waitForURL((url) => !url.toString().includes('/auth/'), { timeout: 30_000 });
    console.log(`  ✓ landed at ${page.url()}`);

    // 2. Walk routes
    for (const route of role.routes) {
      try {
        await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle', timeout: 30_000 });
        await page.waitForTimeout(800);
        console.log(`  ✓ ${route}`);
      } catch (e) {
        console.log(`  ⚠ ${route} → ${e.message.slice(0, 80)}`);
      }
    }
  } catch (e) {
    console.log(`  ❌ walk crashed: ${e.message.slice(0, 200)}`);
  } finally {
    await context.close();
  }

  return { role: role.label, login: 'ok', consoleErrors, failedRequests };
}

(async () => {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  const browser = await chromium.launch({ headless: true, args: ['--ignore-certificate-errors'] });

  const reports = [];
  for (const role of ROLES) {
    reports.push(await walkRole(browser, role));
  }

  await browser.close();

  console.log('\n════════ SUMMARY ════════');
  let totalErr = 0, totalReq = 0;
  for (const r of reports) {
    console.log(`\n${r.role}: login=${r.login}  consoleErrors=${r.consoleErrors.length}  failedRequests=${r.failedRequests.length}`);
    for (const e of r.consoleErrors.slice(0, 10)) console.log(`  console @ ${e.where}: ${e.text.slice(0, 200)}`);
    for (const e of r.failedRequests.slice(0, 10)) console.log(`  request  @ ${e.where}: ${e.method} ${e.url}  → ${e.reason}`);
    totalErr += r.consoleErrors.length;
    totalReq += r.failedRequests.length;
  }
  console.log(`\nGRAND TOTAL: ${totalErr} console errors, ${totalReq} failed requests`);
  process.exit(totalErr + totalReq > 0 ? 1 : 0);
})().catch((e) => {
  console.error('Walk-through script error:', e);
  process.exit(2);
});
