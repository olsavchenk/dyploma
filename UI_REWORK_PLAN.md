# Stride UI Rework — Ukrainian Editorial Redesign

## Context

Stride is an MVP-stage Ukrainian-first gamified EdTech platform (Angular 20 + .NET 10). The frontend foundation is sound — signals-based auth, zoneless change detection, lazy routes, JWT + refresh interceptor, SignalR service for real-time — but the visual layer is largely scaffolded and unfinished:

- **Generic theme**: `styles.scss` uses default `mat.$azure-palette` with Roboto; no brand voice. `tailwind.config.js` has only a generic blue scale.
- **Layout shell shows mock data**: `LayoutComponent` has `userStats = null` and `notificationCount = 0` — no real wiring to `GamificationService` or SignalR streams.
- **~30 components have incomplete templates**: auth pages, dashboard widgets, task types, learn browse/detail, leaderboard, profile, teacher, admin — all scaffolded but missing visual design.
- **Admin content CRUD missing**: `AdminSubjectsController`/`AdminTopicsController`/`AdminAchievementsController` exist backend-side but have no frontend services or UIs.
- **Class join flow missing**: `LearningService.joinClass()` exists but no UI calls it.
- **Real-time gaps**: `NotificationHub` is connected but events aren't routed to toasts; `LeaderboardHub` is mapped server-side but `SignalRService` only manages one hub.
- **i18n not populated**: `@ngx-translate` wired but `src/assets/i18n/` files are skeletal; Ukrainian is default but strings are hardcoded.
- **PWA disabled**: `provideServiceWorker` is commented out in `app.config.ts`.

This rework delivers a distinctive **Ukrainian editorial** aesthetic (deep blue + sunflower yellow, Fraunces serif display + Manrope sans body, generous negative space, editorial rhythm), wires real data end-to-end, fills missing feature UI, and extends the backend where endpoints are absent.

---

## Design System (Phase 1)

### Palette — CSS variables driving Tailwind + Material M3

```
Brand blue:   50 #EEF3FB · 100 #D6E2F4 · 200 #A7BEE6 · 300 #6D91D2 · 400 #3F68BA
              500 #1F4CA4 · 600 #0B3D91 (brand) · 700 #082E6E · 800 #061F4B · 900 #03112A
Sun yellow:   50 #FFFAE5 · 100 #FFF1B8 · 200 #FFE580 · 300 #FFD94C
              400 #FFD500 (accent) · 500 #E6BE00 · 600 #B79700 · 700 #8A7100
Semantic:     success #1F8F5C · warning #D97706 · danger #C62828 · info #0B7AB8
Neutrals:     paper #FAF7F1 · ink #0A0E1F · ink-soft #2B3046 · rule #E7E1D3
              surface #FFFFFF · surface-alt #F2ECDD
League tiers: Bronze #B87333 · Silver #9DA3AE · Gold #E3B341 · Platinum #7FDBDA · Diamond #5AB1FF
```

### Typography — Cyrillic-capable Google Fonts

- **Display serif**: `Fraunces` (variable, full Cyrillic, editorial opsz + SOFT/WONK) — headlines, level numerals, brand mark.
- **Body sans**: `Manrope` (variable, Cyrillic) — labels, buttons, body.
- **Mono**: `JetBrains Mono` — XP numerals, rank counters, code blocks.
- Load via `<link>` with `cyrillic,cyrillic-ext,latin,latin-ext` subsets; `<html lang="uk">`.

### Rhythm, motion, atmosphere

- 4px grid scale (0,1,2,3,4,5,6,8,10,12,16,20,24,32). Radius: xs 6 · sm 10 · md 14 · lg 20 · xl 28 · pill 999.
- Shadows blue-tinted: `0 16px 40px -16px rgba(11,61,145,.18)` for hero cards; `0 0 0 4px rgba(255,213,0,.25)` for focus rings.
- Easings: `--ease-editorial: cubic-bezier(.2,.7,.2,1)`. Keyframes: `rise-in`, `ink-draw`, `sun-burst`, `scale-pop`.
- Background atmosphere: subtle 4% grain SVG on paper; abstract line-geometry decor behind hero blocks (not literal vyshyvanka); radial gradient meshes for auth split screens.

### Files — Phase 1

- `Stride/ui/src/styles.scss` — full rewrite: Material 3 `mat.theme` with custom palettes generated from `#0B3D91` + `#FFD500`, custom typography config, global `:root` CSS vars, Tailwind layers, Material component overrides.
- `Stride/ui/src/styles/_tokens.scss` — CSS variable root (new).
- `Stride/ui/src/styles/_material-overrides.scss` — button/form-field/tabs/snackbar overrides (new).
- `Stride/ui/src/styles/_motion.scss` — keyframes + easing (new).
- `Stride/ui/src/styles/_decor.scss` — SVG backgrounds (new).
- `Stride/ui/tailwind.config.js` — expand `theme.extend`: full color scales, `fontFamily.display/sans/mono`, fontSize, borderRadius, boxShadow, keyframes, animation, transitionTimingFunction.
- `Stride/ui/src/index.html` — Google Fonts preconnect/stylesheet, `<html lang="uk">`.

---

## Phase 2 — Layout Shell + Real Data

Fix the mock data in `LayoutComponent` and redesign the shell.

**Data wiring**: In `ngOnInit`, if authenticated call `GamificationService.getStats()` and assign to `userStats` signal. Subscribe via `takeUntilDestroyed()` to `SignalRService` streams (`onAchievementUnlocked`, `onLevelUp`, `onStreakReminder`, `onRankChanged`), push to an in-memory `unreadNotifications` queue, increment `notificationCount`. Re-fetch stats on auth state change via `effect()`.

**Header (editorial 3-zone)**: brand mark "СТРАЙД" in Fraunces 24 + sun ink-draw underline on hover; command-palette search with hairline rule; segmented `UK | EN` language toggle; notification bell with badge opening `NotificationPanelComponent`; streak mini-chip; 64px XP mini-bar; avatar menu.

**Sidenav (264px desktop)**: role-aware items via computed signal from `authService.userRole` — student (Dashboard/Learn/Leaderboard/Achievements/Profile), teacher (Dashboard/Classes/Review/Analytics/Profile), admin (Dashboard/Users/Content/AI Review/System). Active indicator: 3px sun-400 vertical bar + blue-100 tint.

**Bottom nav mobile**: 4–5 role-aware items, 56px, scale-pop active animation.

### Files — Phase 2

- `Stride/ui/src/app/layout/components/layout/layout.component.{ts,html,scss}` — data wiring + new shell.
- `Stride/ui/src/app/layout/components/header/header.component.{ts,html,scss}` — editorial redesign.
- `Stride/ui/src/app/layout/components/sidenav/sidenav.component.{ts,html,scss}` — role-aware items.
- `Stride/ui/src/app/layout/components/bottom-nav/bottom-nav.component.{ts,html,scss}`
- `Stride/ui/src/app/layout/components/notification-panel/notification-panel.component.ts` (new)
- `Stride/ui/src/app/layout/models/index.ts` — align `UserStats` with `GamificationStats`.

---

## Phase 3 — Auth Pages

Split-screen editorial: 56% left deep-blue canvas with Fraunces headline + abstract decor tile + testimonial; 44% right form card floating on paper.

- **Login**: email + password, Google OAuth button (outlined, sun-400 hover ring), forgot/register links.
- **Register**: displayName + email + password + GDPR; 3-segment password strength meter; navigates to `/auth/select-role` on success.
- **SelectRole**: two large editorial cards (Student, Teacher) — calls `authService.selectRole()`.
- **ForgotPassword**: single email input, success state card.
- **ResetPassword** (new): token from route params, two password fields.

### Files — Phase 3

- `Stride/ui/src/app/features/auth/shared/auth-shell.component.{ts,html,scss}` (new split-layout wrapper)
- `Stride/ui/src/app/features/auth/login/login.component.{ts,html,scss}`
- `Stride/ui/src/app/features/auth/register/register.component.{ts,html,scss}`
- `Stride/ui/src/app/features/auth/select-role/select-role.component.{ts,html,scss}`
- `Stride/ui/src/app/features/auth/forgot-password/forgot-password.component.{ts,html,scss}`
- `Stride/ui/src/app/features/auth/reset-password/reset-password.component.{ts,html,scss}` (new)
- `Stride/ui/src/app/features/auth/auth.routes.ts` — add `reset-password`.

---

## Phase 4 — Dashboard

12-column editorial grid. Single `forkJoin` of `getStats() + getContinueLearningTopics(6) + weekly leaderboard + recent achievements` with per-stream `catchError`. Signals: `loading/stats/topics/leaderboard/achievements`.

1. **Hero row** — time-aware greeting `Доброго ранку, {name}` in Fraunces + date subtitle + rule divider.
2. **XP Progress (span 8)** — level chip + sun-gradient progress track + remaining XP.
3. **Streak widget (span 4)** — flame + big number + freeze count + freeze/repair CTAs.
4. **Continue Learning carousel (span 12)** — horizontal `TopicCardComponent` with mastery donut.
5. **Daily goal (span 6)** — 5-segment ring.
6. **Leaderboard preview (span 6)** — tier chip + top 5 + current user highlight.
7. **Recent achievements (span 12)** — chip row of last 3 unlocked.
8. **First task bonus banner** — conditional sun-gradient CTA.

### Files — Phase 4

- `Stride/ui/src/app/features/dashboard/dashboard.component.{ts,html,scss}`
- `Stride/ui/src/app/features/dashboard/widgets/xp-bar.component.ts` (+ extracted template)
- `Stride/ui/src/app/features/dashboard/widgets/streak-widget.component.ts`
- `Stride/ui/src/app/features/dashboard/widgets/topic-card.component.ts`
- `Stride/ui/src/app/features/dashboard/widgets/leaderboard-preview.component.ts`
- `Stride/ui/src/app/features/dashboard/widgets/first-task-bonus.component.ts`
- `Stride/ui/src/app/features/dashboard/widgets/daily-goal.component.ts` (new)
- `Stride/ui/src/app/features/dashboard/widgets/recent-achievements.component.ts` (new)

---

## Phase 5 — Learn Module & Task Session

- **LearnBrowse** (`/learn`): editorial subject grid with Fraunces name + mastery ring + topic count + "Почати" CTA; grade-level filter chips; empty state.
- **SubjectDetail** (`/learn/subjects/:id`): hero + expandable topic accordion with mastery color badges + 1–5 dot difficulty indicators.
- **Task session shell** (`/learn/session/:topicId`): focus-mode route outside layout. Top bar: topic + 5-segment progress + streak multiplier chip + close. Body: `@switch` on task type across 5 components. Bottom: primary "Check" button.
- **Task type redesigns**: MultipleChoice, FillBlank, TrueFalse, Matching, Ordering — consistent editorial card + sun hover ring + consistent animation.
- **Answer feedback**: bottom drawer, correct (green) / incorrect (red) with expandable explanation.
- **XP breakdown dialog** (new): base + difficulty + streak multipliers.
- **Session summary** (`/learn/session/:topicId/summary`): accuracy donut (inline SVG), XP big number, mastery delta, incorrect review list, "Продовжити"/"Назад" CTAs.

### Files — Phase 5

- `Stride/ui/src/app/features/learn/learn-browse/learn-browse.component.{ts,html,scss}`
- `Stride/ui/src/app/features/learn/subject-detail/subject-detail.component.{ts,html,scss}`
- `Stride/ui/src/app/features/learn/task-session/task-session.component.{ts,html,scss}` (extract inline template)
- `Stride/ui/src/app/features/learn/task-session/session-summary.component.{ts,html,scss}` (new)
- `Stride/ui/src/app/features/learn/learn.routes.ts` — add `session/:topicId` + `session/:topicId/summary`.
- `Stride/ui/src/app/shared/components/tasks/{multiple-choice,fill-blank,true-false,matching,ordering}-task.component.ts`
- `Stride/ui/src/app/shared/components/feedback/answer-feedback.component.ts`
- `Stride/ui/src/app/shared/components/gamification/xp-breakdown-dialog.component.ts` (new)

---

## Phase 6 — Leaderboard

- **Hero**: large circular medallion with tier gradient + tier name in Fraunces + rank big numerals + weekly XP + delta arrow.
- **Filter tabs**: Weekly / All-time / Friends / Class via `mat-tab-group` with editorial underline.
- **List rows**: rank (sun-pill for top 3), avatar, name (Manrope 700), weeklyXp (mono), delta; current user row sticky-pinned.
- **Live updates**: Extend `SignalRService` to manage both `/hubs/notifications` AND `/hubs/leaderboard`. Subscribe to `onLeaderboardUpdated` + `onRankChanged`; invoke `JoinLeague`/`LeaveLeague` on filter change.

### Files — Phase 6

- `Stride/ui/src/app/features/leaderboard/leaderboard.component.{ts,html,scss}`
- `Stride/ui/src/app/features/leaderboard/league-medallion.component.ts` (new)
- `Stride/ui/src/app/features/leaderboard/leaderboard-row.component.ts` (new)
- `Stride/ui/src/app/core/services/signalr.service.ts` — add leaderboard hub support (`connectLeaderboard`, `joinLeague`, `leaveLeague`).

---

## Phase 7 — Profile

- Hero: large avatar with blue-600 ring + sun-400 level badge overlay, display name in Fraunces, member-since, role chip, edit.
- Stats strip: 5 tiles (Total XP, Current streak, Longest streak, Tasks completed, Accuracy).
- Achievement gallery grid: 4 cols desktop / 2 mobile; locked grayscale + lock glyph; unlocked colored; click opens detail dialog.
- Recent activity timeline (vertical rail) from task attempt history.
- Edit dialog redesign.
- Settings: language, notification toggles, PWA install button, data export, logout, delete account.

### Files — Phase 7

- `Stride/ui/src/app/features/profile/profile.component.{ts,html,scss}`
- `Stride/ui/src/app/features/profile/edit-profile-dialog.component.ts`
- `Stride/ui/src/app/features/profile/achievement-gallery.component.ts` (new)
- `Stride/ui/src/app/features/profile/achievement-detail-dialog.component.ts` (new)
- `Stride/ui/src/app/features/profile/activity-timeline.component.ts` (new)
- `Stride/ui/src/app/features/profile/profile-settings.component.ts` (new)

---

## Phase 8 — Teacher Module

- **Dashboard** (new `/teacher`): KPI cards (Classes / Students / Pending reviews / Week XP) + recent activity + upcoming assignments. Uses `TeacherService.getQuickStats()`.
- **Classes**: card list (name, grade, student count, avg mastery ring, share code, manage). Create FAB opens `create-class-dialog`.
- **ClassDetail**: tabbed (`Students | Assignments | Analytics`). Students table; assignments list + `create-assignment-dialog` stepper (subject → topics → difficulty → deadline); analytics charts.
- **StudentDetail**: stats tiles + inline-SVG mastery radar + task history table + daily XP line chart.
- **TaskReview**: AI template queue with approve/edit/reject.
- **Generation status**: poll `/task-generation/status` every 5s.

### Files — Phase 8

- `Stride/ui/src/app/features/teacher/dashboard/teacher-dashboard.component.{ts,html,scss}` (new)
- `Stride/ui/src/app/features/teacher/classes/classes.component.{ts,html,scss}`
- `Stride/ui/src/app/features/teacher/class-detail/class-detail.component.{ts,html,scss}`
- `Stride/ui/src/app/features/teacher/student-detail/student-detail.component.{ts,html,scss}`
- `Stride/ui/src/app/features/teacher/task-review/task-review.component.{ts,html,scss}`
- `Stride/ui/src/app/features/teacher/generation-status/generation-status.component.ts`
- `Stride/ui/src/app/features/teacher/dialogs/{create-class,create-assignment,share-join-code}-dialog.component.ts`
- `Stride/ui/src/app/features/teacher/teacher.routes.ts` — add `dashboard` route.

---

## Phase 9 — Admin Module + Missing CRUD

- **Dashboard**: KPI cards + system health pills (DB/Redis/MongoDB) + recent events.
- **Users**: paginated table, search, role/status filters, row drawer with change-role/disable/export.
- **AI Review**: template queue from `/admin/ai-templates/review-queue` with approve/reject reason dialog.
- **Subjects CRUD** (new): table + inline edit + create dialog (name, slug, description, iconUrl, sortOrder) + soft-delete.
- **Topics CRUD** (new): tree view by subject, inline create/edit/reorder.
- **Achievements CRUD** (new): badge card grid + create dialog (code, name, description, icon, xpReward, unlockCriteria JSON, isHidden).

**New frontend services** — consume existing backend admin controllers that currently have no client code:
- `AdminSubjectsService` → `/api/v1/admin/subjects`
- `AdminTopicsService` → `/api/v1/admin/topics`
- `AdminAchievementsService` → `/api/v1/admin/achievements`

### Files — Phase 9

- `Stride/ui/src/app/core/services/admin-subjects.service.ts` (new)
- `Stride/ui/src/app/core/services/admin-topics.service.ts` (new)
- `Stride/ui/src/app/core/services/admin-achievements.service.ts` (new)
- `Stride/ui/src/app/core/models/admin-content.models.ts` (new)
- `Stride/ui/src/app/core/services/index.ts` — export new services.
- `Stride/ui/src/app/features/admin/dashboard/admin-dashboard.component.{ts,html,scss}`
- `Stride/ui/src/app/features/admin/users/users.component.{ts,html,scss}`
- `Stride/ui/src/app/features/admin/ai-review/ai-review.component.{ts,html,scss}`
- `Stride/ui/src/app/features/admin/subjects/admin-subjects.component.{ts,html,scss}` (new)
- `Stride/ui/src/app/features/admin/subjects/dialogs/subject-dialog.component.ts` (new)
- `Stride/ui/src/app/features/admin/topics/admin-topics.component.{ts,html,scss}` (new)
- `Stride/ui/src/app/features/admin/topics/dialogs/topic-dialog.component.ts` (new)
- `Stride/ui/src/app/features/admin/achievements/admin-achievements.component.{ts,html,scss}` (new)
- `Stride/ui/src/app/features/admin/achievements/dialogs/achievement-dialog.component.ts` (new)
- `Stride/ui/src/app/features/admin/admin.routes.ts` — add subjects/topics/achievements routes.

---

## Phase 10 — Class Join Flow

- **Student** (new `/learn/join`): centered editorial card, 6-character code input (large mono, individual boxes with sun hover), submit → `LearningService.joinClass(code)`, success dialog, redirect.
- **Teacher**: `ShareJoinCodeDialogComponent` — large code, copy button, inline-SVG QR, web share API.

### Files — Phase 10

- `Stride/ui/src/app/features/learn/join-class/join-class.component.{ts,html,scss}` (new)
- `Stride/ui/src/app/features/learn/learn.routes.ts` — add `join` route.
- `Stride/ui/src/app/features/teacher/dialogs/share-join-code-dialog.component.ts` (shared with Phase 8)

---

## Phase 11 — Real-time & Notifications

- `AuthService.handleAuthSuccess` already calls SignalR connect; extend to also connect leaderboard hub for students.
- Extend `NotificationService` with signal-based unread queue; drive from SignalR event streams.
- `LayoutComponent` subscribes and routes:
  - `achievementUnlocked` → `AchievementToastComponent`
  - `levelUp` → `LevelUpCelebrationComponent` full-screen overlay with `sun-burst` keyframe
  - `streakReminder` → non-blocking toast
- Notification bell panel reads from service signal.
- Cleanup via `takeUntilDestroyed()` everywhere.

### Files — Phase 11

- `Stride/ui/src/app/core/services/signalr.service.ts` — leaderboard hub support.
- `Stride/ui/src/app/core/services/notification.service.ts` — unread queue + enqueue helpers.
- `Stride/ui/src/app/layout/components/layout/layout.component.ts` — route hub events.
- `Stride/ui/src/app/shared/components/notifications/achievement-toast.component.ts`
- `Stride/ui/src/app/shared/components/notifications/level-up-celebration.component.ts`
- `Stride/ui/src/app/layout/components/notification-panel/notification-panel.component.ts`

---

## Phase 12 — i18n Completeness

Create `Stride/ui/src/assets/i18n/uk.json` (primary) and `en.json` (mirror). Key convention `feature.component.element` (e.g. `dashboard.hero.greetingMorning`). Target ~265 keys across: auth (20), layout/nav (15), dashboard (30), learn (40), leaderboard (15), profile (25), teacher (40), admin (35), notifications (15), common/errors (30). Wire `| translate` in every template; verify `angular.json` assets glob includes `src/assets`. Ensure `<html lang="uk">`.

### Files — Phase 12

- `Stride/ui/src/assets/i18n/uk.json` (new)
- `Stride/ui/src/assets/i18n/en.json` (new)
- `Stride/ui/angular.json` — verify assets glob.
- All `features/**` + `layout/**` templates — replace hardcoded strings with translate pipe.

---

## Phase 13 — Backend Gaps

**Verify/create controllers** (`Stride/src/Stride.Api/Controllers/`):
- `AdminSubjectsController.cs` — full CRUD behind `[Authorize(Roles="Admin")]`
- `AdminTopicsController.cs` — full CRUD
- `AdminAchievementsController.cs` — full CRUD

If absent, scaffold with GET list (paging/filters), GET by id, POST, PUT, DELETE (soft), using `IAdminContentService` or existing services.

**DTO alignment check** — verify frontend models match backend DTOs:
- `GamificationStats` — especially `firstTaskOfDayCompleted`
- `ContinueLearningTopic` — `currentDifficulty`, `masteryLevel`
- `StudentClass` / `StudentClassSubject`
- Admin CRUD request/response bodies vs new `admin-content.models.ts`.

**LeaderboardHub broadcast**: confirm `LeaderboardWeeklyService` (or the rank compute service) injects `IHubContext<LeaderboardHub>` and sends `LeaderboardUpdated` + `RankChanged` to appropriate groups after recompute.

### Files — Phase 13

- `Stride/src/Stride.Api/Controllers/AdminSubjectsController.cs` (verify/create)
- `Stride/src/Stride.Api/Controllers/AdminTopicsController.cs` (verify/create)
- `Stride/src/Stride.Api/Controllers/AdminAchievementsController.cs` (verify/create)
- `Stride/src/Stride.Services/Interfaces/IAdminContentService.cs` (verify)
- `Stride/src/Stride.Services/Implementations/AdminContentService.cs` (verify)
- `Stride/src/Stride.Api/BackgroundServices/LeaderboardWeeklyService.cs` — broadcast hook.
- `Stride/src/Stride.Core/Dtos/**` — align drift.

**Constraint from CLAUDE.md**: do NOT re-create the deleted unit test stubs (`UnitTest1.cs`). Unit tests are out of scope for this MVP review work.

---

## Phase 14 — PWA & Polish

- Re-enable `provideServiceWorker` in `app.config.ts`.
- Verify `manifest.webmanifest` icons (192/512/maskable) + Ukrainian name/short_name.
- `ngsw-config.json`: caching for `/api/v1/subjects`, `/api/v1/gamification/stats`, fonts, images.
- Offline fallback route + `OfflinePageComponent`.
- `SkeletonBlockComponent` in shared; use in dashboard/learn-browse/leaderboard/profile.
- `EmptyStateComponent` in shared; editorial illustration + headline + CTA.
- `prefers-reduced-motion` media query disables keyframes.
- Accessibility: 2px sun-400 focus rings, ARIA labels on icon buttons, contrast audit paper+ink, axe-devtools clean.

### Files — Phase 14

- `Stride/ui/src/app/app.config.ts` — uncomment PWA provider.
- `Stride/ui/src/manifest.webmanifest`
- `Stride/ui/ngsw-config.json`
- `Stride/ui/src/app/shared/components/skeleton/skeleton-block.component.ts` (new)
- `Stride/ui/src/app/shared/components/empty-state/empty-state.component.ts` (new)
- `Stride/ui/src/app/features/offline/offline.component.ts` (new)
- `Stride/ui/src/app/app.routes.ts` — add `offline` route.

---

## Existing Assets to Reuse (do NOT reinvent)

- `AuthService` (signals JWT + refresh) — `core/services/auth.service.ts`
- `authInterceptor` (Bearer + 401 refresh) — `core/interceptors/auth.interceptor.ts`
- `loggingInterceptor` (correlation IDs) — `core/interceptors/logging.interceptor.ts`
- `SignalRService` (hub connection + auto-reconnect + event streams) — `core/services/signalr.service.ts` (extend, don't replace)
- `GamificationService`, `LearningService`, `TaskService`, `LeaderboardService`, `TeacherService`, `AdminService`, `UserService`, `TaskGenerationService`, `NotificationService`, `TranslationService`, `LoggingService` — all under `core/services/`
- `authGuard`, `roleGuard`, `publicOnlyGuard`, `adminGuard` — `core/guards/`
- `GlobalErrorHandler` — `core/handlers/`
- Task type components (`multiple-choice`, `fill-blank`, `true-false`, `matching`, `ordering`) — restyle only, keep logic
- `AchievementToastComponent`, `LevelUpCelebrationComponent`, `XpBarComponent`, `LanguageSwitcherComponent`, `SafeHtmlPipe` — `shared/`
- Core model files under `core/models/` — extend, don't replace

---

## Critical Files (keystones for each phase)

| File | Phase | Role |
|---|---|---|
| `Stride/ui/src/styles.scss` | 1 | Material 3 theme + Tailwind bridge + overrides |
| `Stride/ui/tailwind.config.js` | 1 | Token bridge |
| `Stride/ui/src/index.html` | 1 | Google Fonts + `lang="uk"` |
| `Stride/ui/src/app/layout/components/layout/layout.component.ts` | 2 | Shell data wiring (mock → real) |
| `Stride/ui/src/app/features/dashboard/dashboard.component.ts` | 4 | Feature pattern reference |
| `Stride/ui/src/app/features/learn/task-session/task-session.component.ts` | 5 | Core learning loop |
| `Stride/ui/src/app/core/services/signalr.service.ts` | 6 + 11 | Real-time backbone |
| `Stride/ui/src/app/core/services/admin-*.service.ts` | 9 | Missing admin integrations |
| `Stride/ui/src/assets/i18n/uk.json` | 12 | Ukrainian default strings |
| `Stride/src/Stride.Api/Controllers/Admin*Controller.cs` | 13 | Backend CRUD endpoints |
| `Stride/ui/src/app/app.config.ts` | 14 | PWA re-enable |

---

## Verification

**Stack up:**
```
cd D:/apps/dyploma/Stride
docker-compose -f docker-compose.infrastructure.yml up -d
dotnet run --project src/Stride.Api            # port 5000
cd ui && npm install && npm start               # port 4200
```

**End-to-end smoke test after all phases:**

1. Visit `/auth/register` — create student, select role, land on dashboard.
2. Dashboard shows real stats (level 1, 0 XP, 0 streak). No mock `null`/`0` placeholders.
3. Click subject → topic → start session → complete 3 tasks of mixed types (MC, FB, matching) → summary shows accuracy donut + XP earned.
4. Back to dashboard: XP updated, streak +1, achievement toast fires if earned (via SignalR), header bell badge increments.
5. Open leaderboard — see own entry; in a second browser complete tasks on another account; observe live rerank via `onRankChanged`.
6. Open profile — edit display name, view achievement gallery, toggle language to EN; verify all strings swap.
7. Logout, register teacher, create class, copy join code, open student incognito, navigate `/learn/join`, enter code, verify roster updates for teacher.
8. Login admin → create subject + child topic + achievement → student sees new content on refresh.
9. `ng build --configuration production` → Lighthouse PWA ≥90, axe-devtools zero serious, `prefers-reduced-motion` disables keyframes.
10. Navigate offline (DevTools Network: offline) — offline fallback page renders.

**Per-phase spot checks:**
- Phase 1: `body` computed style shows paper bg + Manrope font; no missing-font console warnings.
- Phase 2: Header XP badge updates without full reload after earning XP.
- Phase 3: `/auth/login` split-screen renders; Google OAuth button visible; form submits.
- Phase 4: `forkJoin` loads all widgets; network tab shows one parallel burst of 4 requests.
- Phase 5: All 5 task types render; answer feedback drawer correct/incorrect states; XP breakdown dialog opens.
- Phase 6: SignalR console shows `JoinLeague` invocation; live update received on other user action.
- Phase 9: Admin CRUD flows roundtrip to backend (check Network); student-facing content reflects new rows.
- Phase 13: Swagger `/openapi` lists all 3 admin controllers' full CRUD; DTOs line up with `admin-content.models.ts`.

**Dependency chain**: Phase 1 → 2 (everything depends on tokens + shell). Phases 3, 4 after 2. Phases 5–10 parallelizable after 4. Phase 11 after 2 + 6. Phase 12 continuous throughout. Phase 13 in parallel with 9. Phase 14 last.
