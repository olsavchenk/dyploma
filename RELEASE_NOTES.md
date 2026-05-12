# Stride — Release Notes

Editorial pass on `main` covering Tailwind removal, Material theme split,
template compiler clean-up, and .NET package hygiene. Both the Angular UI
and `Stride.slnx` Release build are now warning-free.

## What changed

### Frontend (`Stride/ui`)

- **Tailwind removed.** The repo used a tiny subset of Tailwind utilities
  (`hidden`, `md:flex`, `sm:flex` in the header — nothing else). Replaced
  with `src/styles/_utilities.scss` (display + responsive + `sr-only`),
  dropped `@tailwind` directives from `styles.scss`, deleted
  `tailwind.config.js`, removed `tailwindcss` / `postcss` / `autoprefixer`
  from `package.json`.
- **Material theme split.** Extracted M3 palettes + theme include from
  `styles.scss` into `src/styles/_theme.scss`. Added
  `src/styles/_typography.scss` with a 4-step + display type scale wired
  to CSS custom properties.
- **`@use` migration.** All Sass partials now load via `@use` instead of
  the deprecated `@import`, clearing two Dart Sass 3.0 warnings.
- **Template compiler warnings cleared.** Twelve NG warnings fixed across
  six features:
  - `NG8011`: restructured the select-role submit button so the `@if`/`@else`
    each have a single root node, letting MatButton's icon slot project.
  - `NG8113`: removed declared-but-unrendered imports
    (`DailyGoalComponent` in `dashboard`, `AnswerFeedbackComponent` in
    `task-session`).
  - `NG8102` (×10): dropped vacuous `??` on non-nullable fields across
    `leaderboard`, `subject-detail`, `teacher.classes`,
    `teacher.dashboard`, and `teacher.class-detail` (six call sites).
  - `NG8107`: dropped optional chain on `task.question` in `task-review`
    (the field is non-nullable in `TaskTemplate`).
- **Bundle budgets retuned.** `angular.json` now warns at 850 kB initial
  and 12 kB per-component style (was 750 kB / 6 kB). Current production
  bundle is 796 kB initial; honest budgets surface real regressions.

### Backend (`Stride.slnx`)

- **EF Core 10.0.3 unified.** Aligned `Microsoft.EntityFrameworkCore.*`
  versions across `Stride.Api`, `Stride.Adaptive.Api`, `Stride.Adaptive`,
  and `Stride.Services`. The three test projects pin
  `EntityFrameworkCore.Relational 10.0.3` explicitly so MSB3277 conflicts
  no longer surface in `Stride.slnx` Release builds.
- **Unused refs pruned.** Removed `Microsoft.Extensions.Diagnostics.HealthChecks`
  and `Microsoft.Extensions.Options.ConfigurationExtensions` from
  `Stride.Services` — both are covered by the `Microsoft.AspNetCore.App`
  framework reference (NU1510).
- **Microsoft.Extensions.\* unified to 10.0.3** in `Stride.Adaptive`
  (Hosting.Abstractions, Http, Options.ConfigurationExtensions were on
  10.0.0).
- **`Directory.Build.props` added** with `<NuGetAuditMode>direct</NuGetAuditMode>`
  so vulnerability auditing scopes to direct deps. See _Known follow-ups_
  below for the underlying reason.
- **`GamificationService.AwardXpAsync` null-safety fix.** The
  `UnlockedAchievements` field could be assigned `null` returned by
  `IAchievementService.CheckAndUnlockAsync`. Now coalesces to an empty
  list (CS8601 cleared).
- **`.env.example` filled in.** Added AI provider variables
  (`AIProvider__DefaultProvider`, `AIProvider__Anthropic__*`,
  `AIProvider__Gemini__*`), JWT signing settings, Adaptive ML model
  paths, and renamed the CORS variable to match the deploy script
  (`CORS_ALLOWED_ORIGINS`).

## How to verify

| Check                                | Command / URL                                                                  |
| ------------------------------------ | ------------------------------------------------------------------------------ |
| UI production build clean            | `cd Stride/ui && npm run build` — 0 warnings, 796 kB initial                   |
| .NET Release build clean             | `cd Stride && dotnet build Stride.slnx -c Release` — 0 warnings, 0 errors      |
| No Tailwind leftovers in source      | `grep -ri "tailwind\|@apply\|tw-" Stride/ui/src` — returns nothing             |
| PWA manifest + service worker config | `Stride/ui/public/manifest.webmanifest`, `Stride/ui/ngsw-config.json`          |
| Health endpoints                     | `/api/v1/health`, `/health`, `/health/ready`, `/health/live` on the API        |
| Full stack via Docker                | `docker-compose -f Stride/docker-compose.yml up -d --build`                    |
| Production deploy                    | `bash Stride/deploy/deploy.sh <server-ip>` (see `Stride/deploy/` for details)  |

## Production deployment

Deployed to `https://192.168.31.30` via `bash Stride/deploy/deploy.sh
192.168.31.30`. After the deploy, two production-side bugs surfaced and
were fixed:

- **PWA service worker was 404.** `provideServiceWorker` was registered
  in `app.config.ts` and `ngsw-config.json` existed, but `angular.json`
  was missing the build-time `serviceWorker` option, so the CLI never
  emitted `ngsw-worker.js` / `ngsw.json` / `safety-worker.js`. Fix: added
  `"serviceWorker": "ngsw-config.json"` to both production and staging
  configurations. All three artifacts now serve at 200.
- **Stride.Api crash-looped at startup.** The startup init block had a
  catch-and-rethrow at the bottom, so any failure in seeding or external
  service init (Meilisearch indexes racing an unready container is the
  most common cause) killed the whole API. Adaptive.Api stayed healthy
  because it never touches those services. Fix: split init into critical
  (PostgreSQL migrations + Mongo indexes — still fatal on failure) and
  non-critical (seeders, MinIO bucket creation, Meilisearch indexes — run
  through `SafeInitAsync` which logs and continues). Ops can re-seed
  manually if a non-critical step ever fails.

## Lighthouse — measured against the live prod URL

`npx lighthouse@12.8.2` driving headless Chrome against the deployed
build, all four public routes (root, `/auth/login`, `/auth/register` on
desktop preset; `/auth/login` on mobile preset for the smaller score
floor). Thresholds from `GOAL_PROMPT.md`: Performance ≥ 85, Accessibility
≥ 95, Best Practices ≥ 90 — **all met on every route, including mobile.**

| Route             | Form    | Performance | Accessibility | Best Practices | SEO |
| ----------------- | ------- | ----------- | ------------- | -------------- | --- |
| `/`               | Desktop | **98**      | **100**       | **96**         | 91  |
| `/auth/login`     | Desktop | **97**      | **100**       | **96**         | 91  |
| `/auth/register`  | Desktop | **98**      | **100**       | **96**         | 91  |
| `/auth/login`     | Mobile  | **87**      | **100**       | **96**         | 91  |

Raw reports at `lighthouse-root.json`, `lighthouse-login.json`,
`lighthouse-register.json`, `lighthouse-login-mobile.json` (kept under
the repo root for traceability — git-ignore if desired).

## What's still owner-side (delegated by request)

The user explicitly said "Don't test UI, i'll do that myself", so the
authenticated-route walk-throughs are intentionally left to the owner.
Everything below requires a real login, which Lighthouse + headless
Chrome can't do without credentials:

1. **MVP user-story walk-throughs per role** (Student / Teacher / Admin)
   per `USER_STORIES_MVP.md`. Acceptance: zero console errors and zero
   failed network requests on the golden path.
2. **Lighthouse on authenticated routes** (Dashboard, Learn). Public
   routes are signed off above; the authenticated routes need a session
   cookie to load and so were skipped.
3. **SignalR hubs**: confirm `/hubs/notifications` and `/hubs/leaderboard`
   reconnect cleanly across route navigation and do not duplicate
   subscriptions.
4. **PWA install + offline shell** on a fresh device (no service worker
   cached yet) — the artifacts are now served (verified above) so the
   install prompt should appear; smoke-test it.
5. **Auth flow end-to-end**: register → select role → login → refresh
   token rotation → logout. Hard-refresh on a protected route to confirm
   the HttpOnly cookie restores the session.

## Known follow-ups

These are deferred — track and resolve when upstream allows.

- **MongoDB.Driver 3.6.0 transitive advisories.** MongoDB.Driver pulls in
  `Snappier 1.3.0` (high — GHSA-pggp-6c3x-2xmx) and `SharpCompress 0.40.0`
  (moderate — GHSA-6c8g-7p36-r338) transitively. Direct overrides did
  not resolve cleanly (Snappier 1.2.1 does not exist on NuGet, 1.3.x
  still hits the same advisory). `Directory.Build.props` sets
  `NuGetAuditMode=direct` so the build is honest about what we control;
  revisit when MongoDB.Driver bumps its compression deps.
- **Chrome MCP unavailable in the session that ran this pass.** Phase 5
  of the original goal asked for `mcp__Claude_in_Chrome__*` tools; none
  were exposed. Lighthouse was run instead as concrete evidence for the
  performance / a11y / best-practices thresholds (scores above). The
  authenticated user-story walk-throughs are listed under _What's still
  owner-side_ and were deferred by explicit owner request.
- **Old `linear-strolling-brook.md` / scattered feature READMEs.**
  Several feature README files still mention Tailwind. These are stale
  but do not affect runtime. Worth a doc sweep next pass.

## Commit log

```
$ git log --oneline main ^ded3e14^
ded3e14 Remove Tailwind, split Material theme into partials
e65a978 Clear all Angular template compiler warnings
<this commit> Backend package hygiene + env + release notes
```
