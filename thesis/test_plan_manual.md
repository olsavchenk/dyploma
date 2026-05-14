# Stride — Manual Test Plan

**App URL:** https://192.168.31.30
**Test accounts:**
- Student: `student@test.com` / `Test1234!`
- Teacher: `teacher@test.com` / `Test1234!`
- Class join code: `TEST01`

---

## 1. Authentication & Authorization

### 1.1 Registration (`/auth/register`)
- TC-AUTH-001: Register new user with valid data → success → redirect to /auth/select-role
- TC-AUTH-002: Register with already-used email → error "Email is already registered"
- TC-AUTH-003: Register with invalid email format → client-side validation error
- TC-AUTH-004: Register with weak password (<8 chars) → validation error
- TC-AUTH-005: Register without GDPR consent checkbox → submit blocked
- TC-AUTH-006: Empty displayName → validation error
- TC-AUTH-007: Long displayName (>100 chars) → boundary check
- TC-AUTH-008: SQL injection in email field → sanitized

### 1.2 Login (`/auth/login`)
- TC-AUTH-101: Valid credentials student → redirects to /dashboard
- TC-AUTH-102: Valid credentials teacher → redirects to /teacher/dashboard
- TC-AUTH-103: Invalid password → "Invalid email or password"
- TC-AUTH-104: Non-existent email → same error (no enumeration)
- TC-AUTH-105: 5+ failed attempts → account lockout
- TC-AUTH-106: Empty email/password → submit disabled / error
- TC-AUTH-107: After login: refresh page → still logged in
- TC-AUTH-108: Logout → redirects to /auth/login → /dashboard blocked
- TC-AUTH-109: Browser back after logout → still blocked
- TC-AUTH-110: Direct URL access /dashboard while logged out → redirect to /login
- TC-AUTH-111: Logged-in user visiting /auth/login → redirect to /dashboard (publicOnlyGuard)

### 1.3 Select Role (`/auth/select-role`)
- TC-AUTH-201: New user picks Student → profile created
- TC-AUTH-202: New user picks Teacher → profile created with school field
- TC-AUTH-203: Skip role selection / try direct route → blocked
- TC-AUTH-204: Already-selected role: revisit page → blocked or shows current

### 1.4 Forgot/Reset Password
- TC-AUTH-301: Request reset for valid email → confirmation message
- TC-AUTH-302: Request reset for non-existent email → no enumeration
- TC-AUTH-303: Reset password page with invalid token → error
- TC-AUTH-304: Reset password with valid token → success → can login with new
- TC-AUTH-305: Use reset token twice → second attempt fails

### 1.5 Guards & Roles
- TC-AUTH-401: Student visits /admin → blocked / redirected
- TC-AUTH-402: Student visits /teacher → blocked
- TC-AUTH-403: Teacher visits /admin → blocked
- TC-AUTH-404: Token tampering → 401, redirect to login
- TC-AUTH-405: Expired token → silent refresh OR redirect

---

## 2. Dashboard (Student)

- TC-DASH-001: Greeting matches time of day (good morning/day/evening)
- TC-DASH-002: User displayName shown correctly
- TC-DASH-003: XP bar shows correct currentXp / xpToNextLevel / level
- TC-DASH-004: Streak widget shows current and longest streak
- TC-DASH-005: First Task Bonus banner shown only if not completed today
- TC-DASH-006: Continue Learning carousel shows in-progress topics
- TC-DASH-007: Click topic card → navigates to /learn/session/:topicId
- TC-DASH-008: Leaderboard preview shows top users
- TC-DASH-009: Loading skeleton displays while loading
- TC-DASH-010: Error state when API fails → retry button works
- TC-DASH-011: Refresh button reloads stats
- TC-DASH-012: Mobile responsiveness (resize to <768px)
- TC-DASH-013: Dashboard for fresh user (0 XP, no topics) → empty state

---

## 3. Learn / Browse

### 3.1 Browse (`/learn`)
- TC-LEARN-001: Subjects displayed as cards (Math, Ukrainian, History, English)
- TC-LEARN-002: Click subject → /learn/subjects/:id
- TC-LEARN-003: Join class button visible for student → opens dialog
- TC-LEARN-004: Join class with code TEST01 → success
- TC-LEARN-005: Join class with invalid code → error
- TC-LEARN-006: Joined classes show in UI
- TC-LEARN-007: Filter/search subjects (if exists)

### 3.2 Subject Detail (`/learn/subjects/:id`)
- TC-LEARN-101: Topics list loads
- TC-LEARN-102: Topic progress shown (% complete or stars)
- TC-LEARN-103: Click topic → /learn/session/:topicId
- TC-LEARN-104: Locked topics indicator (if levels gating)
- TC-LEARN-105: Difficulty/level info per topic

### 3.3 Task Session (`/learn/session/:topicId`)
- TC-SESS-001: Task loads with question + answer options
- TC-SESS-002: Submit correct answer → feedback + XP gain animation
- TC-SESS-003: Submit wrong answer → feedback + correct shown
- TC-SESS-004: Skip task (if available) → next task
- TC-SESS-005: Submit empty answer → blocked
- TC-SESS-006: Multiple choice: all options clickable
- TC-SESS-007: Text input task: input validation
- TC-SESS-008: Timer (if exists) → time-up triggers wrong/skip
- TC-SESS-009: Mid-session abandon → re-entry resumes or restarts
- TC-SESS-010: Complete all tasks → /learn/session/:topicId/summary
- TC-SESS-011: Hint button (if exists) → shows hint, possibly costs XP
- TC-SESS-012: Adaptive difficulty: easy after several wrongs, harder after correct streak

### 3.4 Session Summary
- TC-SESS-101: Shows total correct/wrong, XP earned, time spent
- TC-SESS-102: Streak info updated
- TC-SESS-103: New achievements unlocked
- TC-SESS-104: Continue button → back to subject
- TC-SESS-105: Replay topic → starts new session

---

## 4. Profile (`/profile`)

- TC-PROF-001: User info loads (avatar, name, email, level, XP)
- TC-PROF-002: Avatar click → file picker opens
- TC-PROF-003: Upload valid image → updates immediately
- TC-PROF-004: Upload non-image file → rejected
- TC-PROF-005: Upload >5MB image → rejected
- TC-PROF-006: Edit displayName → saved
- TC-PROF-007: Stats: total XP, current level, longest streak, league
- TC-PROF-008: Achievements list with locked/unlocked
- TC-PROF-009: Click achievement → details modal
- TC-PROF-010: Performance per subject section
- TC-PROF-011: Account deletion (if exists) → confirmation flow
- TC-PROF-012: Change password (if exists)
- TC-PROF-013: Language toggle UA/EN → all UI updates
- TC-PROF-014: GDPR data export (if exists)

---

## 5. Leaderboard (`/leaderboard`)

- TC-LB-001: Global leaderboard loads with top users
- TC-LB-002: User's own rank highlighted
- TC-LB-003: League/division filters (Bronze/Silver/Gold) work
- TC-LB-004: Time period filter (daily/weekly/all-time)
- TC-LB-005: Click user → opens public profile (or doesn't for privacy)
- TC-LB-006: Pagination / infinite scroll
- TC-LB-007: Real-time updates via SignalR (verify with two sessions)
- TC-LB-008: Empty state when no entries
- TC-LB-009: Avatar fallback for users without picture

---

## 6. Teacher Module

### 6.1 Teacher Dashboard (`/teacher/dashboard`)
- TC-TCH-001: Classes summary shown
- TC-TCH-002: Total students count
- TC-TCH-003: Recent activity feed
- TC-TCH-004: Pending assignments count
- TC-TCH-005: Quick links to classes

### 6.2 Classes (`/teacher/classes`)
- TC-TCH-101: Class list loads (Test Class with TEST01 visible)
- TC-TCH-102: Create new class → form with name, subject, grade, etc.
- TC-TCH-103: Generated join code is unique 6-char string
- TC-TCH-104: Class card shows student count, last activity
- TC-TCH-105: Edit class → saves changes
- TC-TCH-106: Archive/delete class → confirmation
- TC-TCH-107: Click class → /teacher/classes/:id

### 6.3 Class Detail (`/teacher/classes/:id`)
- TC-TCH-201: Roster of students
- TC-TCH-202: Class average performance
- TC-TCH-203: Assignments tab → list with due dates
- TC-TCH-204: Create assignment → topic + due date + students
- TC-TCH-205: Click student → /teacher/classes/:cId/students/:sId
- TC-TCH-206: Remove student from class → confirmation
- TC-TCH-207: Regenerate join code
- TC-TCH-208: Copy join code button → clipboard

### 6.4 Student Detail (`/teacher/classes/:classId/students/:studentId`)
- TC-TCH-301: Student profile, level, XP visible
- TC-TCH-302: Performance per topic
- TC-TCH-303: Recent attempts list
- TC-TCH-304: Strengths/weaknesses summary
- TC-TCH-305: Suggest tasks for student

### 6.5 Task Review (`/teacher/topics/:topicId/tasks`)
- TC-TCH-401: AI-generated tasks list
- TC-TCH-402: Approve task → moves to approved pool
- TC-TCH-403: Reject task → removed from pool
- TC-TCH-404: Edit task before approving
- TC-TCH-405: Bulk approve/reject

---

## 7. Admin Module (`/admin`)

### 7.1 Admin Dashboard
- TC-ADM-001: KPIs: total users, students, teachers, sessions today, XP earned
- TC-ADM-002: Charts render correctly (user growth, daily active)
- TC-ADM-003: Recent registrations list

### 7.2 Users Management (`/admin/users`)
- TC-ADM-101: User list with pagination
- TC-ADM-102: Filter by role / search by email
- TC-ADM-103: Click user → details
- TC-ADM-104: Change role student↔teacher↔admin
- TC-ADM-105: Disable/enable user
- TC-ADM-106: Reset password as admin (if exists)
- TC-ADM-107: Delete user → soft delete confirmation

### 7.3 Subjects (`/admin/subjects`)
- TC-ADM-201: List subjects
- TC-ADM-202: Add new subject
- TC-ADM-203: Edit subject name/icon/order
- TC-ADM-204: Toggle active/inactive
- TC-ADM-205: Delete subject (with topic guard)

### 7.4 Topics (`/admin/topics`)
- TC-ADM-301: Filter by subject
- TC-ADM-302: Add new topic
- TC-ADM-303: Edit topic
- TC-ADM-304: Generate AI tasks for topic → triggers task generation
- TC-ADM-305: Delete topic (cascade or block)

### 7.5 Achievements (`/admin/achievements`)
- TC-ADM-401: List all achievements
- TC-ADM-402: Add new achievement (icon, name, criteria, XP reward)
- TC-ADM-403: Edit achievement
- TC-ADM-404: Toggle active
- TC-ADM-405: Delete achievement

### 7.6 AI Review Queue (`/admin/ai-review`)
- TC-ADM-501: Queue list of pending AI-generated tasks
- TC-ADM-502: Approve → moves to active pool
- TC-ADM-503: Reject → removes
- TC-ADM-504: Filter by subject/topic
- TC-ADM-505: Bulk actions

---

## 8. Real-time / SignalR

- TC-RT-001: NotificationHub connects on login
- TC-RT-002: Receive achievement notification
- TC-RT-003: LeaderboardHub: rank change pushes update
- TC-RT-004: Connection lost → auto-reconnect
- TC-RT-005: Disconnect on logout

---

## 9. Gamification

- TC-GAM-001: Earn XP on correct answer
- TC-GAM-002: Level up when crossing threshold → animation/notification
- TC-GAM-003: First-task-of-day bonus applied once
- TC-GAM-004: Streak increment on consecutive day login
- TC-GAM-005: Streak reset after missed day
- TC-GAM-006: Achievement unlock animation
- TC-GAM-007: League promotion/demotion at week end
- TC-GAM-008: Badges visible on profile after unlock

---

## 10. Internationalization (i18n)

- TC-I18N-001: Default language = Ukrainian
- TC-I18N-002: Toggle to English → all visible strings change
- TC-I18N-003: Refresh keeps language preference
- TC-I18N-004: Date/number formatting per locale
- TC-I18N-005: No untranslated keys (e.g., "AUTH.LOGIN.TITLE")

---

## 11. PWA / Offline

- TC-PWA-001: App is installable (manifest valid)
- TC-PWA-002: Service worker registers
- TC-PWA-003: Offline mode → /offline page shown
- TC-PWA-004: Cached pages accessible offline
- TC-PWA-005: Reconnect → returns online

---

## 12. UX / UI

- TC-UI-001: Loading spinners on every async action
- TC-UI-002: Error toasts on API failures
- TC-UI-003: Mobile responsive (320px, 768px, 1024px, 1920px)
- TC-UI-004: Tab navigation (keyboard accessibility)
- TC-UI-005: ARIA labels on icon buttons
- TC-UI-006: Color contrast WCAG AA
- TC-UI-007: Form validation messages clear and Ukrainian
- TC-UI-008: Empty states for every list
- TC-UI-009: Confirmation dialogs for destructive actions
- TC-UI-010: Browser back/forward works correctly
- TC-UI-011: Logo click → home/dashboard
- TC-UI-012: Header sticky on scroll
- TC-UI-013: Page titles update per route

---

## 13. Security

- TC-SEC-001: HTTPS only (mixed content check)
- TC-SEC-002: JWT not in localStorage (memory only)
- TC-SEC-003: Refresh token in HttpOnly cookie
- TC-SEC-004: XSS via task content / displayName → escaped
- TC-SEC-005: CSRF tokens on state-changing requests
- TC-SEC-006: Direct API calls without auth → 401
- TC-SEC-007: Direct API calls with student token to admin endpoint → 403
- TC-SEC-008: Rate limiting on /auth/login
- TC-SEC-009: CORS restrictive in production
- TC-SEC-010: Password not in any response payload

---

## 14. Performance

- TC-PERF-001: Initial bundle <500KB gzipped
- TC-PERF-002: First Contentful Paint <2s
- TC-PERF-003: Lazy-loaded routes load on demand
- TC-PERF-004: Images optimized (WebP/AVIF)
- TC-PERF-005: API responses <500ms p95
- TC-PERF-006: No memory leaks during long session

---

## 15. Edge Cases

- TC-EDGE-001: Network disconnect mid-task submission → retry/resume
- TC-EDGE-002: Server 500 → graceful error, not white screen
- TC-EDGE-003: Browser refresh on /learn/session → resumes or starts fresh
- TC-EDGE-004: Open same account in two tabs → consistency
- TC-EDGE-005: Token expiry mid-session → silent refresh or re-prompt
- TC-EDGE-006: Very long content (1000-char question) → renders without overflow
- TC-EDGE-007: User with empty profile (no displayName, no avatar) → fallbacks
- TC-EDGE-008: User with 0 XP / 0 streak → no NaN / divide-by-zero
- TC-EDGE-009: Future date / clock skew → no crashes
- TC-EDGE-010: Special chars in displayName (emoji, RTL, Cyrillic mixed)

---

## 16. Auth Hardening (extension from backend audit)

### 16.1 JWT & Refresh Tokens
- TC-AUTH-501: JWT signing secret rotates without forcing re-auth of all users (test rotation strategy or fail-fast)
- TC-AUTH-502: Token signed with previous key is rejected after rotation grace window
- TC-AUTH-503: Two simultaneous POST `/auth/refresh` with the same refresh token → only one succeeds, the other 401 (no double-rotation race)
- TC-AUTH-504: Refresh token reuse after rotation → all tokens of the chain are revoked (refresh-token theft detection)
- TC-AUTH-505: `Set-Cookie` on refresh response is `HttpOnly; Secure; SameSite=Strict; Path=/api/v1/auth`
- TC-AUTH-506: Access-token-only request after `/auth/logout` → 401 within the access-token TTL (currently still valid until natural expiry — known gap)
- TC-AUTH-507: Refresh token entity rejects past `ExpiresAt` even if `IsRevoked=false`
- TC-AUTH-508: Refresh token cookie not exposed to `document.cookie` (verify via JS check on logged-in page)

### 16.2 Login & Lockout
- TC-AUTH-510: Brute-force `/auth/login`: 6 wrong passwords from same IP/email → lockout response after threshold
- TC-AUTH-511: Lockout duration is configurable, not hardcoded; confirm via `appsettings`
- TC-AUTH-512: Exponential backoff between failed attempts uses jitter (two parallel attackers don't synchronize)
- TC-AUTH-513: Failed login response time is constant whether email exists or not (no enumeration via timing)
- TC-AUTH-514: After lockout, attacker rotating IP via `X-Forwarded-For` cannot bypass (IP comes from trusted proxy header config)
- TC-AUTH-515: After lockout, legitimate user can reset password to unlock without admin intervention

### 16.3 Registration
- TC-AUTH-520: `/auth/register` rate-limited per IP (e.g., 5 / hour)
- TC-AUTH-521: GDPR consent flag stored on User and required server-side — bypass attempt via direct API call rejected
- TC-AUTH-522: Email domain validation (MX lookup or banned-domain list) rejects obvious throwaway / typo domains
- TC-AUTH-523: DisplayName accepts emoji, RTL, mixed Cyrillic without truncation or DB error
- TC-AUTH-524: DisplayName containing `<img src=x onerror=alert(1)>` is sanitized on render (XSS test)
- TC-AUTH-525: PasswordHash field cannot be null in DB; service rejects user with null hash during login
- TC-AUTH-526: OAuth-only user (Google) → password-based login attempt returns generic error, no enumeration

### 16.4 Password Reset
- TC-AUTH-530: Reset token comparison is constant-time — measure response time delta < 5 ms across valid vs invalid tokens
- TC-AUTH-531: Reset token expiry enforced after 24 h (advance system clock)
- TC-AUTH-532: Reset token single-use — second attempt with same token → 401
- TC-AUTH-533: Reset URL with malformed/tampered token → 401 (no stack trace)
- TC-AUTH-534: Reset email never leaks whether the address exists ("If an account exists…" copy)
- TC-AUTH-535: `/auth/forgot-password` rate-limited per email + per IP

### 16.5 Role Selection & Profiles
- TC-AUTH-540: `SelectRole` may only run once; second call rejected (current bug — orphans the previous profile)
- TC-AUTH-541: Concurrent first logins (race) for a brand-new user create exactly ONE StudentProfile, not two
- TC-AUTH-542: Admin policy `[Authorize(Policy="Admin")]` rejects unauthenticated, student, teacher tokens
- TC-AUTH-543: Soft-deleted user's StudentProfile and RefreshTokens are also filtered from queries (no orphan login)
- TC-AUTH-544: After role change Student→Teacher, old StudentProfile is archived, not orphaned

---

## 17. Authorization Matrix (cross-role API access)

For every endpoint, test all three callers (Student / Teacher / Admin) + Anonymous. Examples:

- TC-AUTHZ-601: `GET /api/v1/admin/users` — Student=403, Teacher=403, Admin=200, Anonymous=401
- TC-AUTHZ-602: `POST /api/v1/admin/topics` — same
- TC-AUTHZ-603: `POST /api/v1/admin/achievements` — same
- TC-AUTHZ-604: `PUT /api/v1/admin/users/:id/role` — same; also reject self-elevation by Admin to non-existent role
- TC-AUTHZ-605: `POST /api/v1/teacher/classes` — Student=403, Teacher=201, Admin=allowed
- TC-AUTHZ-606: `GET /api/v1/teacher/classes/:id/students` — Teacher can only see their own classes (403 for another teacher's class)
- TC-AUTHZ-607: `POST /api/v1/tasks/submit` — Student submitting a `taskInstanceId` belonging to a class they're NOT enrolled in → 403
- TC-AUTHZ-608: `POST /api/v1/classes/join` — student joining own class twice → backend prevents duplicate gracefully
- TC-AUTHZ-609: `GET /api/v1/users/me/profile` exposes only owner data, never other users' PII
- TC-AUTHZ-610: Anonymous direct API call to any non-`/health` endpoint → 401
- TC-AUTHZ-611: Soft-deleted user cannot authenticate
- TC-AUTHZ-612: Student attempting `GET /admin/ai-review` via direct fetch → 403 with no body leakage

---

## 18. Adaptive AI, Task Pool & Gamification (deep)

### 18.1 Streak math
- TC-GAM-501: Streak increments correctly across user-local midnight, not UTC midnight (TZ=Asia/Tokyo, finish task at 23:30 local → next day 00:30 same local day must NOT double-count)
- TC-GAM-502: Two tasks at 23:55 local + 00:05 next-day local → streak increments exactly once
- TC-GAM-503: Missed day → streak resets to 1 on next correct answer (not 0)
- TC-GAM-504: Longest streak monotonic; never decreases even if current resets
- TC-GAM-505: Repair-streak on a brand-new user (no LastActiveDate) does not crash; shows clear empty-state message
- TC-GAM-506: Freeze applied for exactly 1-day absence; on day 2 the streak resets (clarify intent vs current off-by-one)
- TC-GAM-507: Streak losing decrement bounded by floor 0, not negative

### 18.2 XP & levels
- TC-GAM-510: XP never goes negative — current dashboard shows `132 / -32 XP` (regression check)
- TC-GAM-511: Level up triggers exactly at threshold XP; level never decreases
- TC-GAM-512: Level capped at `int.MaxValue / 2` to prevent overflow
- TC-GAM-513: First-task-of-day bonus uses user's local date, not UTC; bonus applied exactly once per local day
- TC-GAM-514: XP deduction (purchases) emits an audit log row with reason
- TC-GAM-515: Bonuses stack: `base × difficultyMultiplier × streakMultiplier + firstTaskBonus`
- TC-GAM-516: Streak multiplier capped per config; doesn't snowball to infinity

### 18.3 Task pool & adaptivity
- TC-ADP-501: Two simultaneous `GET /api/v1/learning/next-task` for same topic → return different task instances (per-student dedup)
- TC-ADP-502: Empty pool → on-demand refill triggers AI generation, doesn't infinite-loop
- TC-ADP-503: Refill respects per-topic concurrency limit; second concurrent caller waits, doesn't duplicate
- TC-ADP-504: Gemini API hard timeout (~10 s) and 1 retry with exponential backoff (Polly)
- TC-ADP-505: Gemini error response NOT logged with the API key in `AIGenerationLog`
- TC-ADP-506: Subject-topic mismatch (e.g., math task assigned to Ukrainian-language topic) rejected during pool insertion
- TC-ADP-507: Profanity / unsafe content filter blocks AI-generated tasks before serving to students
- TC-ADP-508: Difficulty band math: bands cover full 1–100 range with no gaps/overlaps
- TC-ADP-509: Difficulty floor = 1, ceiling = 100 after losing-streak adjustment
- TC-ADP-510: Rolling accuracy clamped to [0, 1]; corrupt data >1 doesn't break difficulty calc
- TC-ADP-511: `consecutive correct` uses `Take(20)` — verify still sufficient for promotion threshold (or raise to ConfigurableN)
- TC-ADP-512: `TaskAttempt.ResponseTimeMs` recorded and used as input feature for difficulty model
- TC-ADP-513: ML model load failure → rule-based fallback engaged immediately, logged at WARN
- TC-ADP-514: AI generation log entries indexed in MongoDB (`createdAt`, `provider`, `topicId`)

### 18.4 Leaderboard
- TC-LB-501: Ties broken deterministically by (XP DESC, Level DESC, UserId ASC) — verify across 3 fetches
- TC-LB-502: Cache key includes year (`leaderboard:weekly:2026:19`) so week-number collision year-over-year doesn't poison cache
- TC-LB-503: Week reset emits SignalR notification to active users before clearing
- TC-LB-504: Promotion runs exactly once per user per week (no double-promotion)
- TC-LB-505: Demotion only after a full week below threshold, not mid-week
- TC-LB-506: Class-tab leaderboard shows class members (current bug: empty even when user is a class member)
- TC-LB-507: Leaderboard fetch is O(1) DB calls, no N+1 per player
- TC-LB-508: Bronze/Silver/Gold league label is i18n'd (current bug: literal English "Bronze" in Ukrainian UI)

---

## 19. Frontend Robustness (extension from Angular audit)

### 19.1 Token & interceptor
- TC-FE-601: 3+ concurrent API calls return 401 → only ONE refresh request fires; others queue and retry once it completes (no isRefreshing deadlock)
- TC-FE-602: Hard refresh restores session if refresh-cookie valid; otherwise lands on `/auth/login`
- TC-FE-603: Bootstrap refresh failure → user lands on `/auth/login`, NOT stuck in a half-auth state
- TC-FE-604: SignalR reconnect after token refresh succeeds without leaving an old socket open
- TC-FE-605: Logout closes ALL SignalR hubs immediately (`NotificationHub`, `LeaderboardHub`)
- TC-FE-606: Two browser tabs share auth state — logout in tab A invalidates tab B on next call
- TC-FE-607: Return URL after login is sanitized (reject `javascript:`, cross-origin, `data:` schemes)

### 19.2 Storage & PWA
- TC-FE-610: JWT is NOT stored in `localStorage` or `sessionStorage` (current regression — `localStorage` contains a JWT-shaped key)
- TC-FE-611: `localStorage.setItem` failure (quota exceeded) handled gracefully — no white screen
- TC-FE-612: Service Worker actually controls the page after first navigation (current: registered but `controller === null`)
- TC-FE-613: Offline mode: app shell loads from cache; offline route renders without crash
- TC-FE-614: SW update prompt shown when new version detected; user can reload to apply
- TC-FE-615: `beforeinstallprompt` listener removed on `ngOnDestroy` (no memory leak)

### 19.3 Forms & UX
- TC-FE-620: Clicking the **row** of a multi-choice option (not just the tiny radio circle) selects it (current bug: only the circle's center is clickable)
- TC-FE-621: Multi-choice options expose proper `role="radio"`, names and labels — keyboard-arrow nav works
- TC-FE-622: Submit button stays disabled until a valid selection is made — verified after switching options
- TC-FE-623: Task feedback (`Правильно! / Не зовсім правильно`) is announced via `aria-live="polite"`
- TC-FE-624: Empty-answer submit blocked client AND server (defense in depth)
- TC-FE-625: Resuming a mid-session topic continues from the previously served task instance, not a new one

### 19.4 i18n coverage
- TC-FE-630: EN toggle translates **every** visible string — heading, sidebar, tabs, stat labels, settings panel
- TC-FE-631: Browser tab title updates per locale
- TC-FE-632: Plural rules correct: `1 учень / 2 учні / 5 учнів`; current bug `1 учнів`
- TC-FE-633: League labels ("Bronze", "Silver", "Gold") translated in both locales
- TC-FE-634: No raw translation keys (`AUTH.LOGIN.TITLE`) visible anywhere
- TC-FE-635: i18n persists across reload (`app_language` survives, applied before first paint)
- TC-FE-636: Role chip ("Студент" / "Student") localized
- TC-FE-637: Date formatting locale-aware (`12 травня 2026` vs `May 12, 2026`)

### 19.5 Accessibility & responsive
- TC-FE-640: Page lighthouse a11y ≥ 90 on /dashboard, /learn, /learn/session
- TC-FE-641: All icon-only buttons have `aria-label`
- TC-FE-642: Focus visible on every interactive element (keyboard nav)
- TC-FE-643: Form errors announced via `aria-live`
- TC-FE-644: 320 px viewport: no horizontal scroll on /dashboard, /learn, /learn/session
- TC-FE-645: 375 px: sidebar collapses; menu button reveals nav
- TC-FE-646: Color contrast ≥ 4.5:1 on all text
- TC-FE-647: Notification-permission prompt appears AFTER first user interaction (not on login screen — current bug shows it pre-auth)

---

## 20. Infrastructure, Secrets, Storage (extension from infra audit)

### 20.1 Secrets & credentials
- TC-INF-701: No service runs with default/dev credentials in production (`postgres/postgres`, `minioadmin/minioadmin`, `masterKey`, JWT placeholder)
- TC-INF-702: Secrets injected via env vars or vault, never committed in `appsettings.json` (grep audit)
- TC-INF-703: JWT secret rotation procedure documented and tested in staging
- TC-INF-704: Anthropic / Gemini key from real env var, not literal `your-api-key-here` fallback
- TC-INF-705: Google OAuth client ID is real, not placeholder

### 20.2 Container hardening
- TC-INF-710: `docker-compose.yml` images are version-pinned (no `latest` tag on MinIO/Meilisearch)
- TC-INF-711: Each service has `mem_limit` / `cpus` configured
- TC-INF-712: API/Adaptive containers run as non-root with read-only FS where possible
- TC-INF-713: Internal services (Postgres, Mongo, Valkey, Mongo) not exposed on host network
- TC-INF-714: Healthchecks return 200 in <2 s on a warm container; restart_policy `unless-stopped`
- TC-INF-715: Meilisearch master key changed from default; index access requires API key
- TC-INF-716: Valkey/Redis requires AUTH password
- TC-INF-717: MongoDB requires authenticated user, not anonymous

### 20.3 File uploads
- TC-INF-720: Avatar upload validates **magic bytes** (PNG/JPEG/WebP), not just MIME header (rename `.exe` → `.png` rejected)
- TC-INF-721: Max upload size enforced server-side (e.g., 5 MB); client cap is informational
- TC-INF-722: Uploaded filename sanitized — no path traversal (`../../etc/passwd`) and no unicode confusable
- TC-INF-723: Upload paths scoped to per-user prefix in MinIO bucket
- TC-INF-724: MinIO bucket policy denies anonymous LIST / GET on private prefixes

### 20.4 Database & migrations
- TC-INF-730: All migrations idempotent — running `database update` twice doesn't error
- TC-INF-731: New `NOT NULL` columns on hot tables (TaskAttempt, StudentPerformance) have safe defaults / backfill scripts
- TC-INF-732: Foreign-key columns have indexes (LeaderboardEntry.UserId, TaskAttempt.StudentProfileId, ClassMembership.ClassId)
- TC-INF-733: `TaskInstanceDocument`, `AIGenerationLogDocument` have MongoDB indexes on common query keys
- TC-INF-734: Soft-delete query filter applied on all entities with `IsDeleted` (verify N+1 / orphan queries)

### 20.5 Caching & observability
- TC-INF-740: Cache TTLs explicit, never `null` / infinite
- TC-INF-741: Cache key includes tenant/role/userId where appropriate (no cross-user data leak)
- TC-INF-742: Serilog filters out PII (passwords, JWTs, refresh tokens) before sink
- TC-INF-743: Log level `Information` in prod doesn't dump request/response bodies
- TC-INF-744: Audit log of admin actions (role change, user disable, content delete) persisted with actor + timestamp + reason

### 20.6 Network & headers
- TC-INF-750: All responses include `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Content-Security-Policy`
- TC-INF-751: CORS Origins in prod restricted (no `localhost:4200`)
- TC-INF-752: `AllowedHosts` in prod restricted (not `*`)
- TC-INF-753: Mixed-content blocked: no http:// asset on https:// page

---

## 21. Data Consistency & Sync

- TC-DATA-801: Student XP shown on Dashboard, Profile, and Leaderboard agrees within 5 s (current regression — 132 / 153 / 103 inconsistency)
- TC-DATA-802: After joining a class, /learn shows membership chip; "join code" form hidden or shows "already joined"
- TC-DATA-803: Joining the same class twice with same code returns idempotent success, not an error
- TC-DATA-804: Teacher class roster shows student `displayName` (current bug: empty cell with `alt="undefined"` avatar)
- TC-DATA-805: Teacher class roster `lastActivity` updates within 30 s of student task submission (current bug: shows "Ніколи" while student just submitted)
- TC-DATA-806: Subjects on /learn are de-duplicated by canonical id (current bug: two `Math/Математика` cards)
- TC-DATA-807: All MVP subjects present (Math, Ukrainian, History of Ukraine, English) — currently missing **History of Ukraine**
- TC-DATA-808: Progress dots in session header match total task count (current bug: shows 6 dots but header says "2 / 5")
- TC-DATA-809: Achievement icons resolve (current bug: broken-image icons + `alt` text rendered)
- TC-DATA-810: Public profile of a deleted user → 404, not stale cached data

---

## 22. Security Smoke (production)

- TC-SEC-501: `Set-Cookie` on `/auth/refresh` carries `HttpOnly; Secure; SameSite=Strict`
- TC-SEC-502: Page HTML never contains a JWT (grep response body)
- TC-SEC-503: Browser `localStorage` contains NO JWT or refresh token (current regression — `[BLOCKED: JWT token]` key present)
- TC-SEC-504: `Authorization: Bearer <token>` not logged server-side
- TC-SEC-505: CSP blocks inline `<script>` (without nonce) and `eval`
- TC-SEC-506: A reset URL with token leaked in browser history is NOT reusable after first use
- TC-SEC-507: `/api/v1/admin/*` returns 401 (anon) or 403 (non-admin) without body leakage
- TC-SEC-508: Page `Страйд` title doesn't leak environment name in prod (e.g., "Dev")
- TC-SEC-509: Hydration error (`NG05604`) does not silently swallow security errors

---

## Appendix — Severity legend

| Tag | Meaning |
|-----|---------|
| CRIT | Blocks release; data loss / account takeover / unauth access |
| HIGH | Functionality broken or insecure under realistic conditions |
| MED  | UX, perf, or hardening gap |
| LOW  | Polish / consistency / minor risk |
