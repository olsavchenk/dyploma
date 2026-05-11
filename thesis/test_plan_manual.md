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
