# Stride — Final Bug Report (Parallel QA Run)

**Date:** 2026-05-10
**Environment:** https://192.168.31.30
**Test accounts:** student@test.com / teacher@test.com (both `Test1234!`), join code `TEST01`
**QA approach:** 13 parallel Claude-in-Chrome agents, each scoped to a specific area
**Total bugs found:** 76

---

## Severity Summary

| Severity | Count |
|----------|-------|
| 🔴 CRITICAL / BLOCKER | 11 |
| 🟠 HIGH | 19 |
| 🟡 MEDIUM | 31 |
| 🟢 LOW | 15 |

---

## 🔴 CRITICAL / BLOCKER — fix before ship

### CR-1. Profile page never renders — `l.earned is not iterable`
**Where:** `Stride/ui/src/app/features/profile/profile.component.ts:88`
**Why:** Frontend type `AchievementsResponse` ([gamification.models.ts:26](Stride/ui/src/app/core/models/gamification.models.ts:26)) expects `{earned, locked}`, but backend `GET /api/v1/gamification/achievements` returns a flat array with `isUnlocked` flag.
**Fix:** Either backend wraps as `{earned, locked}` or frontend splits by `isUnlocked`.

### CR-2. Empty leaderboard crashes UI permanently
**Where:** Leaderboard component
**Symptoms:** API returns 200 with `topPlayers: []`. UI stuck on "Завантаження..." forever, throws `Cannot read properties of undefined (reading 'find')` and `... 'length'`.
**Fix:** Add empty state + null guards.

### CR-3. Topic card click does NOT navigate to task session
**Where:** `Stride/ui/src/app/features/learn/subject-detail/subject-detail.component.ts`
**Symptoms:** Clicking topic button on `/learn/subjects/:id` produces no URL change, no network request, no console error. Students cannot enter sessions through UI.

### CR-4. No login rate limiting / brute-force fully open
**Symptoms:** 15 parallel + 8 sequential bad logins for same account → all 401 in <1s, no 429, no lockout, no CAPTCHA.
**Note:** Other agents observed lockout-after-5 once, suggesting threshold is **inconsistent** (per-IP vs per-account vs per-window). Investigate.
**Fix:** Add per-account exponential backoff + per-IP rate limit; surface in UI.

### CR-5. PWA Service Worker not registered (3 compounding causes)
1. `navigator.serviceWorker.getRegistrations() === []`, no `ngsw-worker.js` link in index.html
2. `/ngsw-worker.js`, `/ngsw.json`, `/service-worker.js` return **HTML SPA fallback** (nginx `try_files` matches them as routes)
3. Manual register fails with SSL error (self-signed cert)

**Fix:** (a) ensure `ServiceWorkerModule.register('ngsw-worker.js', {enabled: environment.production})` is wired and prod build is deployed; (b) configure nginx to serve `/ngsw*.js`, `/ngsw.json`, `/service-worker.js`, `/safety-worker.js` as static files BEFORE SPA fallback; (c) install local TLS cert in trusted roots on test devices.

### CR-6. Sidenav "Перевірка" link logs teacher out
**Symptoms:** Click on "Перевірка" in teacher sidenav → redirect to `/auth/login`. Reproducible, blocks Task Review feature.

### CR-7. Class edit/archive/delete unimplemented
**Symptoms:** `PUT /api/v1/classes/{id}` → 405 Method Not Allowed. `DELETE` → 405. No UI buttons.
**Impact:** Created classes cannot be modified or removed via product UI/API.

### CR-8. `returnUrl` deep-link lost after login
**Symptoms:** `?returnUrl=%2Fteacher%2Fclasses%2F<id>` → after login lands on `/teacher/classes` (not the deep-link).
**Note:** A separate auth-tester observation flagged that `returnUrl` accepts external URLs (open-redirect vector) — admin-guards-tester verified login still lands on safe internal route, so the practical exploit is mitigated, but the input is still unvalidated. Validate that `returnUrl` is relative-only.

### CR-9. i18n is essentially non-functional
**Symptoms:** `localStorage.app_language` updates on EN click but **no UI text changes**. Only **1 file** (the language-switcher itself) uses `| translate` pipe — every header/sidenav/dashboard/profile string is hardcoded Ukrainian. `document.documentElement.lang` stays `uk`.
**Console:** `NG05604: Missing translation` fires on dashboard load.
**Note:** "uk.json" and "en.json" files exist (358 lines) but are unused.

### CR-10. Focus indicator invisible (A11Y CRITICAL)
**Symptoms:** `outline-style: none` on `:focus-visible` for buttons/links/inputs across all routes. Keyboard users cannot see focus.
**Fix:** Restore `outline-style: solid` (or use `box-shadow` ring) on `:focus-visible`.

### CR-11. Account lockout missing UI feedback
**Symptoms:** After ~5 failed logins, server returns `{"message":"Account is locked. Please try again in 30 minutes"}`. **UI shows no countdown, no informative banner — only the same generic invalid-creds error**.
**Fix:** Display lockout state with retry-after time.

---

## 🟠 HIGH — fix soon

### H-1. Continue Learning carousel missing from dashboard
Backend `/api/v1/learning/continue` returns 200, frontend renders nothing. No "До предметів" CTA. Major dashboard feature gap.

### H-2. Period/Class tabs in leaderboard don't filter
"Весь час" / "Клас" tabs fire same `/api/v1/leaderboard?league=Bronze` — no `period`/`scope` query params. Server ignores them anyway.

### H-3. SignalR `/hubs/leaderboard` not wired in UI
Hub endpoint exists server-side (returns 401 not 404), but no negotiate request observed from leaderboard page. Real-time promise broken.

### H-4. SignalR `/hubs/notifications` rarely connects
Lifecycle log shows "Disconnected from all hubs" on every route change — auto-connect on dashboard load not observed in normal nav.

### H-5. JWT in localStorage (XSS = full account takeover)
`localStorage.stride_access_token`. Any reflected XSS = total compromise. Per CLAUDE.md spec, JWT should be in memory only.

### H-6. Refresh token returned in JSON response body
`POST /auth/login` returns `refreshToken` in JSON, not in HttpOnly cookie. Spec violation + XSS exposure.

### H-7. Missing security response headers
None of: `Strict-Transport-Security`, `Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`. Enable in nginx.

### H-8. `/api/v1/gamification/stats` 403 race condition
Returns 403 intermittently with valid student token. Triggers DashboardComponent error state. Also called for **teachers** (returns 403, polls every 60s).

### H-9. `/api/v1/learning/continue` 401 race
Same pattern as H-8 — student gets 401 even with valid token. Dashboard logs error.

### H-10. Role guard redirects to `/auth/login` instead of `/dashboard` or 403
Student visiting `/admin` or `/teacher/classes` → `/auth/login?returnUrl=...` (looks like logged out). Either roleGuard runs before authGuard or hits a 401 endpoint that triggers auto-logout.

### H-11. Default avatar 404 / broken
`/assets/images/default-avatar.png` returns broken (`naturalWidth === 0`). Visible icon bug for any user without uploaded avatar.

### H-12. Color contrast fail on "Рівень" label
`rgba(255,255,255,0.9)` on `rgb(250,247,241)` cream → **1.07:1** (WCAG min 4.5). White-on-cream illegible.

### H-13. No HTTP compression on JS/CSS
nginx 1.22.1 doesn't gzip/brotli. `transferSize == decodedBodySize` for every chunk. ~60% bandwidth waste (~570KB savings on initial load).

### H-14. Duplicate API calls (no request dedup)
Same URL fetched 2-4× per route load:
- `/api/v1/gamification/stats` × 4 on /dashboard, × 3 on /leaderboard
- `/api/v1/leaderboard?league=Bronze` × 4 on /leaderboard
- `/api/v1/learning/continue` × 2 on /dashboard
**Fix:** `shareReplay({bufferSize:1, refCount:true})` on shared HTTP observables.

### H-15. Subject + Description fields missing from class create
Spec requires `subject` and `description`. Form has only `name` + `gradeLevel`. Backend response object lacks them too.

### H-16. AI assignment generator broken
Created assignment with 5 tasks shows: **"0 / 150 завдань згенеровано (30 помилок)"** — generator requested 30× expected count and all failed.

### H-17. Negative-day overdue rendering
Existing assignment past due renders as "До **-7 днів тому**" — should be "Прострочено 7 днів тому" or similar.

### H-18. Raw template syntax leaked to teachers in Task Review
Tasks display literal `{{a=range:5-12}} × {{blank}} = {{c=a*range:3-9}}` instead of preview-rendered example. Teachers can't read AI tasks.

### H-19. `returnUrl` accepts external URLs
`/auth/login?returnUrl=https://evil.com/steal` — accepted by frontend. Server-side login currently still lands on safe internal route, but the input should be validated relative-only.

---

## 🟡 MEDIUM

| ID | Bug |
|----|-----|
| M-1 | Forgot-password submit shows no success/error feedback (also potential enumeration risk) |
| M-2 | publicOnlyGuard not enforced — logged-in user visiting `/auth/login` sees blank form (auth state lost) |
| M-3 | Validation errors leak ProblemDetails internals (`traceId`, `BytePositionInLine`) on malformed JSON |
| M-4 | nginx `Server: nginx/1.22.1` header — version disclosure |
| M-5 | Validation 400 lacks `errors[]` array — frontend can't show field-level errors |
| M-6 | Empty join-code: silent rejection (button disabled, but keyboard submit no-op without error toast) |
| M-7 | `/learn/join` shows TEACHER navigation when student is logged in (role-binding mismatch on this route) |
| M-8 | `/api/v1/auth/me` → 404 (frontend probes nonexistent endpoint) |
| M-9 | Token clear bug: after 403 → redirect to login, but `stride_access_token` left in localStorage (inconsistent state) |
| M-10 | `/api/v1/learning/topics?subjectId=1` → 503 (frontend uses wrong path; correct is `/subjects/{id}/topics`) |
| M-11 | Triple-fetch of `/api/v1/gamification/stats` on single load = duplicate subscriptions |
| M-12 | No `Cache-Control` on hashed JS/CSS bundles (only weak ETag) |
| M-13 | HTTP/1.1 used for 79/84 static assets (only 5 over h3) — no HTTP/2 multiplexing |
| M-14 | No app-update banner / `versionchanged` listener (moot until SW registers) |
| M-15 | API responses without `Cache-Control` → SW can't cache when registered |
| M-16 | Dashboard streak widget shows only `currentStreak`; `longestStreak` not visible |
| M-17 | Duplicate class names allowed (no backend uniqueness check) |
| M-18 | No "pending assignments" KPI; no recent-activity feed on teacher dashboard |
| M-19 | No search/filter on classes list |
| M-20 | Class detail header lacks subject info |
| M-21 | No "Edit" button for AI tasks in Task Review |
| M-22 | No "Remove student", "Regenerate join code", "Bulk approve/reject" buttons |
| M-23 | Copy join code button has no toast/snackbar confirmation |
| M-24 | Missing `<main>` landmark + skip-to-content link (A11Y) |
| M-25 | Heading hierarchy gap (h1 → h3, h2 missing) |
| M-26 | No standalone subjects catalog on `/learn` — new students see only join form (UX/spec gap) |
| M-27 | Recent classes item on teacher dashboard not clickable (`<span>` not link) |
| M-28 | Invalid topicId URL doesn't 404 — keeps previous topic data on SPA navigation |
| M-29 | "Створити Новий Клас" dialog occasionally remains in DOM after navigation |
| M-30 | Admin user not seeded — admin module untestable without manual DB intervention |
| M-31 | Account lockout 30 min, no progressive backoff visible — UX problem for QA/legitimate users |

---

## 🟢 LOW

| ID | Bug |
|----|-----|
| L-1 | NG05604 router error on EVERY navigation — config issue |
| L-2 | Deprecated translate config: `useDefaultLang` / `defaultLanguage` should be `fallbackLang` |
| L-3 | English error "Email is already registered" mixed into UA UI |
| L-4 | Login submit with empty fields = silent no-op (no inline validation) |
| L-5 | Register: after failed submit, checkbox + confirm-password reset, other fields stay (inconsistent) |
| L-6 | Email autofill duplication: `student@test.comstudent@test.com` after re-typing |
| L-7 | "Управляти" / "Переглянути повну таблицю" via accessibility-tree click fails (overlay intercepts; JS `.click()` works) |
| L-8 | `/api/v1/health` → 404, `/health` → 200 (path inconsistency) |
| L-9 | `/api/v1/teacher/classes` → 404 (frontend dead-code; correct is `/api/v1/classes`) |
| L-10 | Frontend probes `/api/v1/learning/subjects`, `/api/v1/learn/subjects`, `/api/v1/curriculum/subjects` → all 4-5 wasted RTTs and 503 noise |
| L-11 | No empty-state illustration on `/offline` (text only) |
| L-12 | `/learn` empty state: "Ти ще не приєднався" — clear but no illustration |
| L-13 | Login response shape uses `token` (not `accessToken`) — possibly inconsistent across backends |
| L-14 | Mobile content padding `padding-bottom: 88px` reserved for bottom-nav, but bottom-nav not visible on desktop responsiveness probes |
| L-15 | `Notification.permission === "default"` — no UI button to request push perm |

---

## ✅ What Works Well

- Backend RBAC is rock-solid: `/api/v1/admin/*` returns 403 for student/teacher tokens; self-role-elevation attempts (mass-assign, login body, header tricks, self-PUT) all rejected
- HTTPS enforced; HTTP requests rejected
- No password / passwordHash in `/me` response
- No user enumeration on login (generic error for both wrong password and non-existent email)
- SQL injection on email field safely rejected
- CORS blocks `Origin: evil.com`
- Cookies have HttpOnly (where used)
- Manifest has proper 192/512 + maskable icons, theme/background colors, lang=uk
- `/offline` route renders correctly with retry button
- Class create generates unique 6-char alphanumeric join codes (TEST01, DVLDKR, ALNVRE, 1Z66RD)
- Lazy-loaded routes work (chunks not in initial bundle)
- API response times: all <200ms on LAN
- No memory leaks observed in 5x route navigation loop
- Page load <200ms LAN
- Form labels + autocomplete + required attribute on login form
- Reduced-motion media query respected (animations → 0.01ms)
- 154 elements with smooth CSS transitions
- Login form responds to Enter
- Wrong credentials show inline `mat-error` "Невірний email або пароль"
- Password strength meter on register
- Refresh persistence works (refresh token in cookie restores session)
- Unknown route `/foo/bar` redirects to `/dashboard`
- 22 AI tasks rendered in Task Review with type/difficulty/status badges; Approve/Reject API works
- AdminController endpoint protection at API level

---

## 📋 Quick-fix priority queue

1. **CR-9** (i18n): wire `| translate` pipe across all UI templates OR remove EN toggle
2. **CR-1** (profile crash): fix achievements API contract — quick frontend split
3. **CR-2** (leaderboard crash): add `?? []` guards
4. **CR-3** (topic click): wire router-link in subject-detail.component
5. **CR-5** (PWA): nginx `location ~ ^/(ngsw|service-worker|safety-worker)\.js$ { try_files $uri =404; }` + manifest registration
6. **CR-6** (teacher logout): debug `/teacher/task-review` route
7. **H-13** (gzip): `gzip on; gzip_types application/javascript text/css application/json;` in nginx
8. **CR-10** (focus): restore `:focus-visible { outline: 2px solid var(--accent); }`
9. **CR-4** (rate limit): add backoff middleware on `/auth/login`
10. **H-14** (request dedup): `shareReplay` on shared observables
11. **CR-7** (class CRUD): implement `PUT/DELETE /api/v1/classes/{id}`
12. **H-7** (security headers): add HSTS / CSP / X-Frame-Options in nginx

---

## 📁 Generated artifacts

- [Test plan](thesis/test_plan_manual.md) — 200+ manual test cases across 15 sections
- [Bug report](thesis/bug_report_final.md) — this file
