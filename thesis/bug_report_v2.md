# Stride — Bug Report v2 (Verification Run)

**Date:** 2026-05-11
**Environment:** https://192.168.31.30
**Test accounts:** student@test.com / teacher@test.com (`Test1234!`), join code `TEST01`
**Approach:** Re-verification of all 76 bugs from `bug_report_final.md` (2026-05-10) + exploratory testing of newly discovered issues
**Tooling:** Single Claude-in-Chrome session, deep SPA + hard-reload + API probes

---

## Executive summary

| Status                                  | Count |
|-----------------------------------------|-------|
| ✅ FIXED                                | 8     |
| ⚠️ PARTIALLY FIXED (regressed elsewhere)| 3     |
| 🔴 STILL BROKEN                         | 10+ confirmed |
| 🆕 NEW CRITICAL bugs found              | 3     |
| 🆕 NEW HIGH bugs found                  | 2     |
| 🆕 NEW MEDIUM bugs found                | 2     |

The build moved forward on several fronts (leaderboard empty state, topic navigation, class CRUD UI, gzip, subjects catalog). But two new regressions are blockers: a hard page reload now logs the user out completely, and the login page itself shows raw translation keys.

---

## ✅ Verified FIXED since last report

| Old ID | Bug                                          | Evidence                                                                                  |
|--------|----------------------------------------------|-------------------------------------------------------------------------------------------|
| CR-2   | Empty leaderboard crash                       | `/leaderboard` shows "Поки що немає учасників — Стань першим!" empty state                |
| CR-3   | Topic card click did not navigate             | Click → `/learn/session/:id` loads question + 4 answer options                            |
| CR-7   | Class edit/archive/delete unimplemented       | 3-dot menu shows Редагувати / Архівувати / Видалити                                       |
| H-2    | Period/Class tabs in leaderboard didn't filter| Request observed: `/api/v1/leaderboard?league=Bronze&period=week&scope=global`            |
| H-13   | No HTTP compression                           | `content-encoding: gzip` confirmed on `/main-*.js` (34 KB)                                |
| M-26   | No standalone subjects catalog on `/learn`    | "Усі предмети" section now shown below join-class form                                    |
| TC-SESS-002 | Submit correct answer flow              | "Правильно! 73 − 26 = 47, +66 XP" feedback rendered                                       |
| TC-TCH-101/107/207/208 | Class list/detail/regenerate-code/copy-code | All visible and functional                                                  |

## ⚠️ PARTIALLY FIXED

### P-1. CR-1 Profile — fixed via SPA, broken on hard reload
- ✅ Clicking sidenav "profile" link loads profile with stats + achievements grid; `/api/v1/gamification/achievements` returns 200 and renders.
- 🔴 Hard reload (F5) of `/profile` → renderer **freezes** (`Page.captureScreenshot` CDP timeout 30 s), session lost → redirect to `/auth/login`.
- **Root cause hypothesis:** something inside profile.component throws on initial load when running before SignalR/auth state hydrates.

### P-2. CR-6 Teacher "Перевірка" sidenav
- ✅ No longer logs the teacher out.
- 🔴 But the link's `href="/teacher/dashboard"` — wrong route. Clicking the link does nothing (you stay on /teacher/dashboard). Task Review feature still unreachable from sidenav.

### P-3. M-20 Class detail header subject info
- ⚠️ Header shows badge `Без предмета` (no subject) but no actual subject data. Half-done — UI present, data missing.

---

## 🔴 Bugs from v1 STILL ACTIVE

| Old ID | Bug                                       | Verification                                                              |
|--------|--------------------------------------------|---------------------------------------------------------------------------|
| CR-4   | No login rate limiting                    | 8 sequential bad logins → 8× 401 with same message, no 429, no backoff   |
| CR-5   | PWA Service Worker not registered         | `navigator.serviceWorker.controller === null`, `/ngsw-worker.js` returns `text/html` |
| CR-9   | i18n non-functional                       | **WORSE**: login page now shows `auth.login.title`, `auth.login.submit`, `auth.login.google` etc.; sidenav shows `layout.sidenav.dashboard` / `.learn` / `.profile`; dashboard greeting `dashboard.greetingMorning, Test Student`; teacher dashboard `teacher.dashboard.title`; classes page `teacher.classes.title`. Even the brand header in the layout reads `auth.brand.headline`. |
| H-7    | Missing security headers                  | All null: `strict-transport-security`, `content-security-policy`, `x-frame-options`, `x-content-type-options`, `referrer-policy` |
| H-16   | AI assignment generator broken            | "QA Test Assignment — 0 / 150 завдань згенеровано (150 помилок)"          |
| M-4    | nginx version disclosure                  | `server: nginx/1.22.1` header still returned                              |
| M-17   | Duplicate class names allowed             | Two "QA Auto Class A" in list with different codes (1Z66RD, DVLDKR)       |
| L-1    | NG05604 router error                      | Still logged on every navigation                                          |
| L-2    | Deprecated translate config               | Indirectly visible — entire i18n still misconfigured                      |
| M-18   | No recent-activity feed                   | "Немає нещодавньої активності" empty even after submitting a task         |

(Items not re-tested this round: CR-10 focus indicator, CR-11 lockout UI, H-5/H-6 token storage, others — listed under "Not re-tested" below.)

---

## 🆕 NEW bugs discovered in this run

### 🔴 N-CR-1. Hard page reload of any authenticated route logs the user out
**Repro:**
1. Login as student.
2. Navigate to `/profile` via sidenav — works.
3. Press F5 or call `location.reload()`.
4. **Result:** URL becomes `https://192.168.31.30/auth/login` (no `returnUrl`), login form empty.

**Impact:** Bookmarking, sharing deep links, refreshing after a backend error — all break. The bug report v1 actually listed "Refresh persistence works (refresh token in cookie restores session)" under "What Works Well." This is a **regression**.

**Fix direction:** verify refresh-token cookie is being sent with the silent-refresh request on app bootstrap; check `AuthService.init()` / APP_INITIALIZER chain.

---

### 🔴 N-CR-2. Hard URL navigation to `/profile` freezes the Angular renderer
**Repro:**
1. Logged in, on `/dashboard`.
2. Type `https://192.168.31.30/profile` directly into the address bar (full reload).
3. **Result:** API calls `GET /api/v1/users/me` (200) and `GET /api/v1/gamification/achievements` (200) succeed, but the page never paints. `Page.captureScreenshot` times out after 30 s on the tab.
4. After the freeze, the in-memory auth state is lost; every subsequent navigation goes to `/auth/login`.

**Difference from N-CR-1:** here the freeze happens *before* the redirect — it's a render-time crash, not just a missing refresh.

**Fix direction:** likely a synchronous throw inside profile.component when `auth.userSignal()` returns `null` during bootstrap. Wrap in `if (user())` guard or move into `effect()`.

---

### 🔴 N-CR-3. Login page shows raw i18n keys (CR-9 worsened)
**Repro:** open `/auth/login` while logged out.
**Visible text:** `auth.login.title`, `auth.login.subtitle`, `auth.login.email*`, `auth.login.password*`, `auth.login.forgotPassword`, `auth.login.submit`, `common.or`, `auth.login.google`, `auth.login.noAccount`, `auth.login.register`.

**Severity:** higher than CR-9 was — first-time users land on an unusable login screen. `uk.json` *is* served (200, 8.8 KB) but never wired into the login component.

---

### 🟠 N-H-1. Teacher sidenav "Перевірка" link href = `/teacher/dashboard`
**Was:** logged user out (CR-6).
**Is now:** no-op (stays on current page, since href points back to the page you're on). Task Review feature is still unreachable through the UI. Net effect: blocker is downgraded from logout to broken-link, but the feature is still gone.

---

### 🟠 N-H-2. Auth state lost on every hard navigation, not just refresh
SPA navigation via `<a href>` keeps the session. Typing the URL in the address bar or window.location assignment kills it. Same root cause as N-CR-1 (silent refresh not running on bootstrap), but worth flagging separately because deep-linking entirely doesn't work.

---

### 🟡 N-M-1. Duplicate "Math" + "Математика" subjects in catalog
On `/learn`, the subjects grid shows: **"Math" (English title + "Math" description)** alongside **"Математика" (Ukrainian)**. Looks like a seed/migration left a stub English Math subject in DB.

---

### 🟡 N-M-2. Test data duplication: two "QA Auto Class A" classes
Teacher classes list shows two entries titled "QA Auto Class A" with different join codes (`1Z66RD`, `DVLDKR`). Confirms M-17 (no uniqueness check) is still active and is producing real data clutter.

---

## ⏭ Not re-tested this round (carried over from v1)

CR-8, CR-10, CR-11, H-1, H-3, H-4, H-5, H-6, H-8, H-9, H-10, H-11, H-12, H-14, H-15, H-17, H-18, H-19, M-1 → M-3, M-5 → M-16, M-19, M-21 → M-25, M-27 → M-31, all L-* except L-1/L-2.
Recommended for next cycle: focus indicator (CR-10), lockout UI (CR-11), token storage (H-5/H-6), continue-learning carousel (H-1).

---

## 📋 New top-priority fix queue (overrides v1 queue)

1. **N-CR-1 / N-CR-2 / N-H-2** — fix auth bootstrap so refresh-token cookie restores the session on hard load. Without this, every other feature is one F5 away from logout.
2. **N-CR-3 / CR-9** — wire the `| translate` pipe (or hard-code UA strings) at minimum on `/auth/login` and the entire sidenav/header — these are seen by every user on every screen.
3. **CR-5** — nginx `try_files` order for `/ngsw-worker.js`, `/ngsw.json`, `/service-worker.js` (already specified in v1).
4. **N-H-1** — fix `href` on `/teacher/review` sidenav link; wire `/teacher/topics/:topicId/tasks` route.
5. **CR-4 / H-7 / M-4** — security baseline (rate limit, HSTS+CSP+XFO+XCTO+Referrer-Policy, hide `Server:` header).
6. **H-16** — fix AI assignment generator: requested 30× expected count, all fail.
7. **M-17 / N-M-1 / N-M-2** — enforce uniqueness on class name within a teacher; clean stub "Math" subject.

---

## Files
- [Updated test plan](thesis/test_plan_manual.md) — added section 16 + 17 with new cases.
- [v1 bug report](thesis/bug_report_final.md) — kept for reference.
