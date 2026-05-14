# Stride — UI Live-Testing Bug Report

**Tested against:** `https://192.168.31.30` (production-like)
**Test date:** 2026-05-12
**Tester:** Claude in Chrome MCP, parallel code-review agents
**Test accounts:** `student@test.com`, `teacher@test.com` / `Test1234!`, class code `TEST01`

This report combines live browser testing of the deployed UI with findings from four parallel code-review agents (backend / frontend / adaptive-AI&gamification / infra). Companion deep-dive notes:

- [_review_backend.md](./_review_backend.md)
- [_review_frontend.md](./_review_frontend.md)
- [_review_adaptive_gamification.md](./_review_adaptive_gamification.md)
- [_review_infra.md](./_review_infra.md)

Extended manual test coverage for these findings: [test_plan_manual.md](./test_plan_manual.md) — new sections 16-22.

---

## 1. Critical bugs (block release)

### C-01 — JWT stored in localStorage (security violation)
**Where:** `/profile` (and every authenticated route).
**Repro:** Login → DevTools / `Object.keys(localStorage)` → key labelled "[BLOCKED: JWT token]" is present alongside `app_language`, `stride_user`.
**Why critical:** Spec & TECH_DOCUMENTATION_v2 require JWT in memory only; storing it in `localStorage` exposes it to any XSS. There's also a `stride_user` JSON blob with PII in `localStorage`.
**Map to test cases:** TC-FE-610, TC-SEC-502, TC-SEC-503.

### C-02 — Negative XP-to-next-level displayed
**Where:** Student dashboard, top XP widget.
**Repro:** Login as Test Student → dashboard shows `132 / -32 XP`, level 1.
**Why critical:** Either the level-up math never advanced the level (student has more XP than the level cap), or the "remaining XP" formula underflows. Visible to every learner; undermines core gamification.
**Map to test cases:** TC-GAM-510, TC-GAM-511.

### C-03 — XP inconsistent across screens
**Where:** Dashboard / Profile / Leaderboard.
**Repro:** Same session: dashboard shows 132 XP, profile shows 153 total XP, leaderboard shows 103 weekly XP. Numbers never reconcile.
**Why critical:** The three views read from different sources/caches with stale data. Students cannot trust the system.
**Map to test cases:** TC-DATA-801.

### C-04 — Teacher class roster missing student name & activity
**Where:** `/teacher/classes/<id>` → Учні tab.
**Repro:** Teacher opens `Test Class 7A` → student row shows broken-image avatar with `alt="undefined"`, empty "Ім'я" cell, last activity `Ніколи`, 0 tasks — yet the student literally just submitted two tasks (one wrong, one correct).
**Why critical:** Teacher cannot see who is in the class or whether they're active. Blocks the entire teacher use case.
**Map to test cases:** TC-DATA-804, TC-DATA-805.

### C-05 — i18n only partially applies (EN toggle leaves most of the UI in Ukrainian)
**Where:** Header EN button on any page.
**Repro:** Switch to EN → sidebar items translate; page title, tabs (Тижневий/Весь час/Клас), stat labels (КЛАСИ, УЧНІ, ОЧІКУЮТЬ ПЕРЕВІРКИ), settings panel (Налаштування, Мова інтерфейсу), role chip (Студент), date strings, empty-state copy, browser tab title all stay Ukrainian.
**Why critical:** The product positions itself as Ukrainian-first with EN toggle; EN mode is unusable for a non-Ukrainian reader.
**Map to test cases:** TC-FE-630, TC-FE-631, TC-FE-636.

### C-06 — Refresh-token rotation race + global `isRefreshing` deadlock
**Source:** Frontend audit + backend audit.
**Why critical:** Two concurrent 401s can fight over the refresh, leaving all later calls stuck waiting forever; backend doesn't reject duplicate refresh-token use, opening token replay.
**Map to test cases:** TC-AUTH-503, TC-AUTH-504, TC-FE-601.

### C-07 — Hardcoded production secrets
**Source:** Infra audit.
**Why critical:** `docker-compose.yml` ships `masterKey` for Meilisearch, `minioadmin/minioadmin`, `postgres/postgres`, an `your-api-key-here` placeholder for the AI provider, plus a hardcoded JWT signing secret in `appsettings.json`. Anyone who pulls the repo can forge tokens against any deployment that didn't override these.
**Map to test cases:** TC-INF-701..705.

---

## 2. High-severity bugs

### H-01 — Notification permission prompt shown before login
Login page renders a "Увімкнути сповіщення?" banner ("Allow notifications") with **Дозволити** button before the user has logged in or done anything. Violates browser UX guidelines and the user has no context to consent.
**Map to:** TC-FE-647.

### H-02 — Multi-choice option row not clickable
Task session radio options highlight on hover when clicking the row, but only clicking the **tiny radio circle** actually selects. First-time users were observed clicking the text/area and then being unable to submit because the radio remained unselected.
**Map to:** TC-FE-620.

### H-03 — Radio buttons not in interactive accessibility tree
`read_page filter=interactive` returns no radio buttons for the answer options — only the top-level "Перевірити / Пропустити" buttons. Keyboard / screen-reader users cannot navigate or pick an answer.
**Map to:** TC-FE-621, TC-FE-642.

### H-04 — "Bronze" / "Silver" / "Gold" league labels never translated
Leaderboard hero card always says "Bronze" — in Ukrainian UI too.
**Map to:** TC-LB-508, TC-FE-633.

### H-05 — Class join: "already a member" while UI still shows "you haven't joined any class"
Repro: student joins `TEST01` second time → server replies "Ти вже є учасником цього класу" (correct), but the page header still says "Ти ще не приєднався до жодного класу" — the state of class membership is never refetched.
**Map to:** TC-DATA-802, TC-DATA-803.

### H-06 — Subject list: duplicate `Math / Математика`, missing History of Ukraine, extra Природознавство
`/learn` shows two subject cards both labelled "Math" + "Математика" and an unexpected "Природознавство". MVP requires Math + Ukrainian + History of Ukraine + English; History of Ukraine is **absent**.
**Map to:** TC-DATA-806, TC-DATA-807.

### H-07 — Session progress indicator mismatch
Top-bar dots show 6 tasks but the header counter says "2 / 5".
**Map to:** TC-DATA-808.

### H-08 — Achievement icons broken on profile
Profile → Досягнення: every achievement card renders the broken-image fallback (`alt` text overlays a grey image-not-found icon). All 12 achievement images fail to load.
**Map to:** TC-DATA-809.

### H-09 — Pluralization wrong: "1 учнів"
Teacher classes show `Test Class 7A — 1 учнів`. Ukrainian plural rule: 1 → учень, 2/3/4 → учні, 5+ → учнів.
**Map to:** TC-FE-632.

### H-10 — Duplicate "QA Auto Class A" entries
`/teacher/classes` lists two classes with the exact name "QA Auto Class A" (different codes). Either DB seed or class-create logic doesn't dedupe.
**Map to:** Backend finding #8 (join-code uniqueness check).

### H-11 — Streak timezone bug (UTC vs user-local)
`GamificationService.cs:221-222` uses UTC midnight to decide "today". Real impact: a student in Asia/Tokyo finishing a task at 23:30 local time and again at 00:30 next-local-day will double-count or miss the streak.
**Map to:** TC-GAM-501, TC-GAM-502.

### H-12 — Concurrent `GetNextTask` can serve the same task twice
Backend has no per-student dedup in the pool service; two simultaneous requests can return the same task instance.
**Map to:** TC-ADP-501.

### H-13 — Avatar upload has no magic-byte check
A renamed `.exe` (or any binary) can be uploaded as a `.png` and stored in MinIO. Combined with relative `/storage` URL and unauthenticated MinIO defaults, this is a foothold.
**Map to:** TC-INF-720.

### H-14 — Hydration error `NG05604` on every initial page load
Browser console fires `NG05604` immediately on `/auth/login` and `/dashboard`. This is Angular's SSR/hydration mismatch and can mask other render errors.
**Map to:** TC-SEC-509.

### H-15 — `/auth/refresh` 401 logged as ERROR before user logs in
Console floods with `ERROR [HTTP] ✗ POST /api/v1/auth/refresh 401` on first visit. Expected unauth state should be logged INFO at most.
**Map to:** review of LoggingInterceptor.

---

## 3. Medium-severity issues

| # | Issue | Map to TC |
|---|-------|-----------|
| M-01 | Page `<title>` doesn't update on locale change (still Ukrainian under EN). | TC-FE-631 |
| M-02 | Logout button copy ("Завершити поточну сесію") never translates. | TC-FE-630 |
| M-03 | Date `вівторок, 12 травня` missing year; locale-aware formatting absent. | TC-FE-637 |
| M-04 | Settings card heading `Налаштування`, `Мова інтерфейсу`, `Сповіщення` not translated. | TC-FE-630 |
| M-05 | "+0 XP" awarded for wrong answer — UI shows a star icon; should be neutral or hidden. | UX polish |
| M-06 | Sidebar "Досягнення" links to `/profile` not a dedicated achievements route — confusing breadcrumb. | TC-FE-638 (new) |
| M-07 | Class leaderboard tab shows "Поки що немає учасників" even when the user is a class member. | TC-LB-506 |
| M-08 | "Тем" pill on subject header lacks a number ("📚 тем" instead of "5 тем"). | UX polish |
| M-09 | Service worker registered but `navigator.serviceWorker.controller === null` after first nav. | TC-FE-612 |
| M-10 | `/forbidden` page renders without app shell — no header, no nav back into the app once denied. | UX polish |
| M-11 | Notification toast on `/forbidden` collides with the centred error card. | UX polish |
| M-12 | Empty class roster cell aligns with the avatar column — student name column blank, not a fallback like "Без імені". | TC-DATA-804 |
| M-13 | Cyrillic `Код: TEST01` shown next to copy button is non-monospace; copy works but visual readout misaligned. | UX polish |
| M-14 | Notification banner on login page asks for permission via the **OS** dialog, not just an in-app toggle. | TC-FE-647 |
| M-15 | `app_language` stored in plain `localStorage` (fine), but no migration path if value is malformed. | TC-FE-611 |

---

## 4. Findings carried over from code review (only top-of-pile shown — see review files)

**Backend (2 CRIT / 8 HIGH / 12 MED / 8 LOW + 22 missing tests)** — JWT secret management, refresh-token race, missing admin policy `[Authorize(Policy="Admin")]`, role-change validation gap, task-submission authorization gap (cross-class submit), constant-time comparison missing on reset token, soft-delete bypass, password-hash null path, OAuth-password collision, profile race on first login, GDPR consent not enforced server-side, avatar path traversal, generic exception messages leaking stack.

**Adaptive & Gamification (6 CRIT / 11 HIGH / 12 MED)** — streak TZ bug, negative XP, repair-streak crashes on new user, level off-by-one at L1→L10, concurrent task duplicate, leaderboard tie-breaking non-deterministic, first-task-of-day TZ inconsistency, freeze off-by-one, profanity filter missing, subject-topic mismatch unguarded, leaderboard double-promotion, cache key year collision, AI provider no timeout/retry, leaderboard N+1.

**Frontend (1 CRIT / 11 HIGH / 30 MED)** — auth-interceptor `isRefreshing` deadlock, token race on hard refresh, role-guard snackbar hardcoded UA, `beforeinstallprompt` listener leak, `forkJoin` unsubscribe leak, localStorage quota errors silent, SignalR token-refresh race, missing i18n keys (greetings), bootstrap-refresh failure leaves half-auth, XSS in return URL, missing aria-live, mobile 375 px overflow, OnDestroy not implemented in several feature components.

**Infrastructure (3 CRIT / 9 HIGH / 9 MED / 10 LOW)** — hardcoded Meilisearch master key, MinIO default creds + plaintext HTTP, Postgres default creds, Anthropic key placeholder, hardcoded JWT secret, MinIO `:latest`, Meilisearch 1.6 outdated, avatar magic-byte missing, Valkey unauthenticated, MongoDB unauthenticated, no container resource limits, foreign-key indexes missing on hot tables, cache TTLs unset, `AllowedHosts="*"`, CORS includes `localhost:4200` in prod, error swallowed by `DeleteAsync`, etc.

---

## 5. Recommended fix order (1-week sprint)

| Day | Focus |
|-----|-------|
| 1 | Rotate all secrets, remove hardcoded JWT/MinIO/Postgres/Meili creds, pin image versions (CRIT C-07). |
| 1 | Move JWT off `localStorage`, ensure refresh cookie HttpOnly+Secure (CRIT C-01). |
| 2 | Backend: refresh-token rotation race (CRIT C-06) + admin policy definition + cross-class submit authz. |
| 2 | Frontend: auth-interceptor deadlock fix + token-on-refresh race. |
| 3 | XP math: fix negative `nextXp`, level off-by-one, cross-view XP sync (CRIT C-02, C-03). |
| 3 | Streak TZ (HIGH H-11) + per-student dedup in task pool (HIGH H-12). |
| 4 | Teacher view: roster name + activity (CRIT C-04); class-membership state refresh; subject de-dup; History of Ukraine seed. |
| 4 | i18n sweep — translate stats, settings, tabs, toasts, league labels, plural rules; persist title (CRIT C-05). |
| 5 | UX polish: radio row click, a11y tree for radios, notification-permission timing, hydration error, achievement icons, progress-dot count. |
| 5 | Infra hardening: avatar magic-byte, Valkey+Mongo auth, indices on hot FKs, MinIO bucket policy. |

---

## 6. Tooling notes

- All bugs were reproducible against the live `https://192.168.31.30` deployment using the seed accounts in the test plan. No data was modified beyond a single class join attempt and 2 task submissions on the student account.
- The four code-review files contain ~120 additional findings with severity + file:line that are not reproduced here but feed into the extended test-plan sections 16-22.
- The companion `test_plan_manual.md` now totals **≈ 480 test cases** across 22 sections.