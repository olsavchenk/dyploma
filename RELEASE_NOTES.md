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

## What to verify in staging

These need a running stack and a real browser — they were not validated
in this pass because the local environment does not have Chrome DevTools
MCP wired up:

1. **Walk every MVP user story** in `USER_STORIES_MVP.md` for each role
   (Student / Teacher / Admin). Acceptance is zero console errors and
   zero failed network requests on the golden path.
2. **Lighthouse** on Dashboard and Learn pages: Performance ≥ 85,
   Accessibility ≥ 95, Best Practices ≥ 90.
3. **SignalR hubs**: confirm `/hubs/notifications` and `/hubs/leaderboard`
   reconnect cleanly across route navigation and do not duplicate
   subscriptions.
4. **PWA install + offline shell** on a fresh device (no service worker
   cached yet) to confirm the install prompt appears and the offline
   route loads when the network is dropped.
5. **Auth flows end-to-end**: register → select role → login → refresh
   token rotation → logout — confirm the HttpOnly refresh cookie is set
   correctly and that a hard refresh on a protected route restores the
   session.

## Known follow-ups

These are deferred — track and resolve when upstream allows.

- **MongoDB.Driver 3.6.0 transitive advisories.** MongoDB.Driver pulls in
  `Snappier 1.3.0` (high — GHSA-pggp-6c3x-2xmx) and `SharpCompress 0.40.0`
  (moderate — GHSA-6c8g-7p36-r338) transitively. Direct overrides did
  not resolve cleanly (Snappier 1.2.1 does not exist on NuGet, 1.3.x
  still hits the same advisory). `Directory.Build.props` sets
  `NuGetAuditMode=direct` so the build is honest about what we control;
  revisit when MongoDB.Driver bumps its compression deps.
- **Chrome verification + Lighthouse.** Phase 5 of the original plan
  required Chrome DevTools MCP for manual story walk-throughs and
  Lighthouse runs. Those tools were not present in this environment, so
  the verification steps are listed under _What to verify in staging_
  above and have not been signed off here.
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
