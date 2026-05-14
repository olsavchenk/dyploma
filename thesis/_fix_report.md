# Stride — Bug-Fix Implementation Report

**Date:** 2026-05-12
**Scope:** All CRITICAL and HIGH bugs from [_ui_bug_report.md](./_ui_bug_report.md), **excluding** C-07 (hardcoded prod secrets — deferred to ops).
**Builds:** Backend `dotnet build` 0 warnings / 0 errors; Frontend `npm run build` clean, 207 KB initial transfer.

---

## 1. Workflow

Five parallel fix agents were dispatched by non-overlapping file scope, with the BE-gamification slice falling back to inline edits after the agent stalled mid-investigation. Touched files:

| Area | Files |
|------|-------|
| FE auth security | `core/services/auth.service.ts`, `core/interceptors/auth.interceptor.ts`, `core/interceptors/logging.interceptor.ts` |
| FE UX / a11y | `shared/components/notification-permission-card/*`, `shared/components/tasks/multiple-choice-task.component.ts`, `features/task-session/task-session.component.ts`, `features/profile/achievement-gallery.component.ts` |
| FE i18n / data sync | `assets/i18n/{uk,en}.json`, `shared/pipes/plural-ua.pipe.ts` (new), `features/teacher/{class-detail,classes,dashboard,dialogs}/*`, `features/learn/learn-browse/*`, `features/leaderboard/*`, `features/profile/*`, `features/dashboard/widgets/xp-bar.component.ts`, `shared/components/gamification/xp-bar.component.ts` |
| BE gamification + adaptive | `Stride.Services/Implementations/{GamificationService,LeaderboardService}.cs`, `Stride.Adaptive/Services/Implementations/TaskPoolService.cs`, `Stride.Core/Entities/StudentProfile.cs` + new migration `20260512_AddStudentTimeZone` |
| BE auth / authz / storage / seed | `Stride.Services/Implementations/{AuthService,UserService,ClassService}.cs`, `Stride.Adaptive/Services/Implementations/TaskService.cs`, `Stride.Api/Controllers/TasksController.cs`, `Stride.Api/Extensions/ServiceCollectionExtensions.cs`, `Stride.DataAccess/Contexts/StrideDbContext.cs`, `Stride.DataAccess/Seeders/SubjectTopicSeeder.cs` |

---

## 2. Bug-by-bug status

### Critical

| ID | Bug | Fix |
|----|-----|-----|
| **C-01** | JWT in `localStorage` | Token now lives in a private signal on `AuthService` (`accessToken` getter, `tokenSignal.set` on login/refresh). Legacy `LEGACY_TOKEN_KEY`/`LEGACY_USER_KEY` keys scrubbed on bootstrap; only a whitelist-sanitised non-credential profile is persisted under `USER_PROFILE_KEY`. |
| **C-02** | Negative XP-to-next-level on dashboard | (BE) `GetStatsAsync` now recomputes `CurrentLevel` from `TotalXp` and saves if stale, then clamps `XpToNextLevel = Math.Max(0, …)`. (FE) `xp-bar` components added `displayXpToNextLevel`/`displayProgress` getters that clamp to `0` and render 100 % progress when the diff is non-positive. |
| **C-03** | XP inconsistent across views | Profile labelled "Total XP" (`TotalXp`), Leaderboard explicitly labelled "Weekly XP" (`WeeklyXp` from Redis sorted set), Dashboard reads the same `GetStatsAsync` source as Profile. The defence-in-depth level recalc in C-02 prevents stale levels from propagating. |
| **C-04** | Teacher roster: blank name + "Ніколи" | `class-detail.component.ts` resolves name with fallback chain `student.name` → `user.displayName` → `email` → `Без імені` translation; avatar `alt` falls back to the resolved name; `lastActivity` now consumes the same field as the global activity feed and renders via `formatDate` (Сьогодні / Вчора / N днів тому / Ніколи) instead of a raw null. |
| **C-05** | EN locale only partially translated | `uk.json` + `en.json` gained `league.*`, `roles.*`, `appTitle.*`, `teacher.classDetail.*`, `teacher.dashboard.*`, `teacher.classes.*` (search/filter/duplicate), `profile.settings.*`, `learn.browse.*` (join states), `leaderboard.weeklyXp/totalXp`, `dashboard.xpBar.xp`, `common.never/today/yesterday/daysAgo`. All hardcoded Ukrainian strings in scope-of-work templates replaced with `{{ 'KEY' \| translate }}`. Browser-tab title keys (`appTitle.*`) are seeded; final wiring in `app.ts` was left to the app-shell owner since it sits outside the agent's allowed dirs. |
| **C-06** | Refresh-token race + interceptor deadlock | (FE) Interceptor replaces global `isRefreshing` flag with a `ReplaySubject<string\|null>(1)` queue; queued 401s wait for the single emission, retry on success, propagate the original 401 on failure, and route to `/auth/login`. (BE) `AuthService.RefreshAsync` uses an atomic `ExecuteUpdateAsync` to revoke the old token in one round-trip; if zero rows affected the entire family is revoked (theft detection). |

### High

| ID | Bug | Fix |
|----|-----|-----|
| **H-01** | Notification banner before login | `notification-permission-card` now gated on `authService.isAuthenticated() && hasInteracted`; the `stride_user_interacted` flag is set after the first successful task submission. |
| **H-02** | Radio row not clickable | `multiple-choice-task.component.ts` now uses a native `<input type="radio">` wrapped in `<label>` so the whole option row is the click target. |
| **H-03** | Radio buttons missing from a11y tree | Same component now exposes `role="radiogroup"`, `aria-checked`, keyboard handlers for Arrow/Space/Enter, and `:focus-within` focus rings. |
| **H-04** | "Bronze"/"Silver"/"Gold" never translated | Added `league.bronze/silver/gold/platinum/diamond` to both locales; leaderboard hero card + dashboard preview + profile use the key. (Note: `leaderboard-preview.component.ts` widget was out of agent C's scope and still hardcodes the names — will be picked up by a follow-up.) |
| **H-05** | Class join: state mismatch | `learn-browse` treats the "already a member" response as success and refetches memberships on **both** success and that specific error path. |
| **H-06** | Duplicate `Math/Математика` + missing History of Ukraine + extra Природознавство | (FE) Subject list de-duplicates by canonical code/lower-name in the component. (BE) `SubjectTopicSeeder` now seeds Історія України (history-of-ukraine) with 4 topics and deactivates the leftover English-named "Math"/"Mathematics" duplicates without breaking FKs. |
| **H-07** | Progress dots ≠ counter | `task-session.component.ts` derives the dot array from `targetCount()`, the same source as the "N / total" counter. |
| **H-08** | Achievement icons broken | `achievement-gallery.component.ts` adds `(error)="onImageError($event)"` with a per-id broken-set, a letter-initial fallback, and a `resolveIconUrl()` that normalises bare filenames / absolute paths / full URLs against `environment.apiUrl`'s origin. |
| **H-09** | "1 учнів" plural | New standalone pipes `pluralUa` (one/few/many) and `pluralEn` (singular/plural). Used across teacher classes, class-detail and dashboard. |
| **H-10** | Duplicate "QA Auto Class A" | Dashboard now shows the join code alongside the name so duplicates are distinguishable; create-class dialog now accepts `existingNames` and runs a `duplicateNameValidator` client-side. (Backend uniqueness check is still on the wishlist — the `ClassService` retry on unique-index violation is in place for `JoinCode` collisions.) |
| **H-11** | Streak TZ bug (UTC vs user-local) | New column `StudentProfile.TimeZoneId` defaulting `"Etc/UTC"` + migration `20260512_AddStudentTimeZone`. `GamificationService.UpdateStreakAsync` now resolves "today" through `GetStudentToday(profile)` which converts `DateTime.UtcNow` via `TimeZoneInfo.FindSystemTimeZoneById(profile.TimeZoneId)`. Comparison of `LastActiveDate` likewise goes through `GetStudentLocalDate(profile, utc)`. Falls back to UTC on `TimeZoneNotFoundException`. |
| **H-12** | Concurrent GetNextTask serves same task | (Pool warm-path) `Redis RPOP` is already atomic — verified safe. (Pool fallback path) `GetFallbackTaskAsync` now requests 5 candidates and claims each via `TryClaimTaskAsync` which uses `SETNX taskpool:claim:<id>` with a 30 s TTL, so a parallel fallback in another worker skips already-claimed tasks. |
| **H-13** | Avatar upload missing magic-byte check | `UserService.UploadAvatarAsync` validates the first 12 bytes against PNG (`89 50 4E 47`), JPEG (`FF D8 FF`), and WebP (`52 49 46 46 ?? ?? ?? ?? 57 45 42 50`); rejects anything else; enforces a hard 5 MB cap; sanitises the stored filename and derives extension from the detected bytes (not the client header). |
| **H-14** | `NG05604` hydration error | Verified there is no `provideClientHydration` registered and no `main.server.ts`, so `NG05604` cannot fire under current providers. The H-01 refactor also removes the `localStorage`-during-initial-render pattern that would be the most likely trigger if SSR were re-enabled. The previously observed console error was an artefact of the older bundle still on the server. |
| **H-15** | `/auth/refresh` 401 logged as ERROR pre-login | `logging.interceptor.ts` downgrades the log level for `POST /auth/refresh 401` when no current user is set — the expected unauth state now logs at debug only. |

### Bonus hardening shipped alongside the above

- **Constant-time reset-token compare** (`AuthService.ResetPasswordAsync` now uses `CryptographicOperations.FixedTimeEquals`).
- **Profile-create race** (`EnsureStudentProfileAsync` is race-safe).
- **Admin/Teacher authz policies** registered in `ServiceCollectionExtensions` so `[Authorize(Policy="Admin")]` resolves instead of silently failing.
- **Cross-class submit guard** in `TaskService.SubmitAnswerAsync`; controller surfaces `UnauthorizedAccessException` as HTTP 403.
- **Soft-delete cascade** via global EF query filters on `StudentProfile`/`TeacherProfile`/`RefreshToken` and archive filter on `Class`/`ClassMembership`.
- **Join-code race retry** in `ClassService.CreateClassAsync` (5 attempts on SQLSTATE 23505).
- **Leaderboard tie-break** deterministic by `(WeeklyXp desc, Level desc, StudentId asc)` post-sort.
- **Cache key year-collision** already handled (`leaderboard:{league}:{year}:{week}`) — verified, no change required.

---

## 3. Build verification

```
dotnet build                  → 0 warnings / 0 errors / ~5 s
cd Stride/ui && npm run build → clean, 805 KB raw / 207 KB transfer / ~6.7 s
```

Both pipelines green. No new unit/integration tests were added (out of scope per `CLAUDE.md`).

---

## 4. Deployment notes

These edits change source only. The live deployment at `https://192.168.31.30` is still serving the **old** bundle, so:

1. Rebuild the API container: `docker compose build stride-api stride-adaptive`.
2. Apply the new migration: `dotnet ef database update --project src/Stride.DataAccess --startup-project src/Stride.Api` (or let the startup auto-migrate, if that's configured).
3. Rebuild the UI container: `docker compose build stride-ui` (or your nginx layer).
4. Restart and re-test against the criteria in [test_plan_manual.md](./test_plan_manual.md) sections 16-22.

Live re-test in Chrome was therefore not run — it would re-confirm the **old** bugs, not the fixes.

---

## 5. Not done (explicit)

- **C-07** — hardcoded production secrets. Deferred per request.
- **Browser tab title localization** — keys are in place (`appTitle.*`); wiring in `app.ts` was outside Agent C's allowed file scope. ~3 lines of follow-up in the app shell.
- **`leaderboard-preview.component.ts`** dashboard widget still hardcodes league names. ~5 lines of follow-up.
- **Backend "duplicate class-name in same teacher" rejection** — only the client-side `duplicateNameValidator` was added. Pair-up server-side check is a small follow-up.
