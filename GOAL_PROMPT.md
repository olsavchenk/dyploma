# /goal — Finish Stride to Production-Ready

Bring the Stride app (D:\apps\dyploma) to a polished, production-ready state by removing Tailwind, modernizing the UI on Angular Material, and verifying every screen end-to-end with Claude in Chrome. Work autonomously: plan, execute, verify, fix, and only stop when all phases pass acceptance criteria.

## Context you must read first
- `CLAUDE.md` — project overview, ports, stack, scope rules (no unit tests during MVP)
- `UIUX_DESIGN_v1.md` — design system, color palette (KEEP as-is), component specs
- `USER_STORIES_MVP.md` — feature scope; every story must work
- `Stride/ui/` — Angular 20 frontend (zoneless, standalone components, Signals)
- `Stride/ui/tailwind.config.js`, `postcss.config.js`, `src/styles.scss` — current Tailwind wiring
- `Stride/ui/src/app/features/**` — all feature modules to audit
- Memory index `MEMORY.md` and `project_ui_rework.md` for prior redesign decisions

## Phase 1 — Remove Tailwind cleanly
1. Inventory every `class="..."` Tailwind utility in `Stride/ui/src/**/*.{html,ts,scss}`. Group by pattern (spacing, flex, grid, typography, color, responsive).
2. Replace each utility with one of, in priority order:
   - Angular Material component + density/typography APIs
   - A small set of SCSS utility classes in `src/styles/_utilities.scss` (only what's actually used)
   - Component-scoped SCSS using design tokens from `UIUX_DESIGN_v1.md`
3. Delete `tailwind.config.js`, `postcss.config.js` (or strip Tailwind plugin), remove `tailwindcss`/`@tailwindcss/*` from `package.json`, purge `@tailwind` directives from `styles.scss`.
4. Run `npm run build` — must succeed with zero Tailwind references remaining (`grep -ri "tailwind\|@apply\|tw-" Stride/ui/src` returns nothing).

## Phase 2 — Establish design tokens & Material theme
1. Create `src/styles/_tokens.scss` with the existing color palette (extract from current Tailwind config / design doc — do NOT change colors).
2. Build a Material M3 theme in `src/styles/_theme.scss` using those tokens (primary, secondary, tertiary, surface, error palettes; light + dark if dark already exists).
3. Define a type scale and spacing scale aligned with Material density.
4. Wire `styles.scss` to import tokens → theme → utilities → component overrides, in that order.

## Phase 3 — Modernize UI per feature (catchy, modern, cohesive)
For each feature folder, audit and rework:
- `auth/` (login, register) — hero treatment, animated transitions, clear error states
- `dashboard/` — informative cards, micro-interactions, empty states, skeleton loaders
- `learn/` — focused task view, progress affordances, clear submit/feedback flow
- `leaderboard/` — visual rank treatment, your-position pinning, smooth live updates
- `profile/` — avatar, stats, achievement showcase
- `teacher/` — analytics charts, class management UX, table density
- `admin/` — CRUD screens with confirmation patterns, bulk actions where sensible
- `layout/` (header, sidenav) — responsive collapse, active-route indicators, polished mobile drawer

Rules:
- Use Material components (`mat-card`, `mat-table`, `mat-form-field`, `mat-chip-set`, `mat-progress-*`, `mat-snackbar`, `mat-dialog`, `mat-stepper`) consistently.
- Add elevation/motion sparingly per Material spec; respect `prefers-reduced-motion`.
- Every list/table has loading, empty, and error states.
- Every async action has optimistic feedback or a spinner + disabled state.
- Mobile-first responsive at 360 / 768 / 1280 / 1920 breakpoints.
- Preserve i18n keys; if you add copy, add both `uk` and `en` translations.

## Phase 4 — Bug sweep
Fix anything broken you encounter, including but not limited to:
- Console errors / warnings (zoneless violations, NG0xxx, ExpressionChanged, missing providers)
- Network errors (404/500 on real endpoints, CORS, auth-token leakage)
- Layout: overflow, scroll traps, unreadable contrast, broken focus rings
- Routing: guards not firing, role-based visibility leaks, unhandled lazy-load failures
- SignalR: dropped connections on navigation, duplicate subscriptions
- Forms: validation timing, accessibility (labels, aria), keyboard nav

## Phase 5 — Manual verification with Claude in Chrome
Use the `mcp__Claude_in_Chrome__*` tools — not Playwright, not unit tests.

For each user role (Student, Teacher, Admin):
1. Start the stack: `docker-compose -f Stride/docker-compose.infrastructure.yml up -d`, then run API (`Stride/src/Stride.Api`), Adaptive API (`Stride/src/Stride.Adaptive.Api`), and UI (`Stride/ui`).
2. Navigate via `mcp__Claude_in_Chrome__navigate` to `http://localhost:4200`.
3. Walk every story from `USER_STORIES_MVP.md` for that role.
4. After each interaction: `read_console_messages`, `read_network_requests`, `get_page_text` to confirm state. Screenshot key screens.
5. File-internal bug list; fix each bug; re-verify.

Acceptance per role: zero console errors, zero failed network requests on the golden path, every story completes.

## Phase 6 — Production readiness
- Production build clean: `npm run build --configuration=production` (no warnings beyond known Angular budgets — tighten budgets in `angular.json` if currently lax).
- `.NET` release build clean: `dotnet build Stride/Stride.slnx -c Release` with no warnings in our code.
- PWA: `ngsw-config.json` caches static assets; install prompt works; offline shell loads.
- Env: `.env.example` covers every variable read at runtime; no secrets committed.
- Logging: Serilog enrichers configured; sensitive fields redacted; correlation IDs flow client → API → Adaptive.
- Health: `/health` endpoint returns 200 with dependency checks.
- Docker: `docker-compose up -d` from a clean machine yields a working stack; document the steps in `Stride/README.md` if anything changed.
- Lighthouse (via Claude in Chrome) on Dashboard and Learn pages: Performance ≥ 85, Accessibility ≥ 95, Best Practices ≥ 90.

## Operating rules
- Scope guard: NO unit tests (per CLAUDE.md). Manual verification only.
- KEEP the existing color scheme. Modernize layout, typography, motion, spacing — not palette.
- Don't introduce new heavy dependencies. Prefer existing Material + small SCSS over new libraries.
- Commit in logical chunks (`tailwind removal`, `theme tokens`, `dashboard rework`, etc.). Don't squash into one commit.
- When you find an out-of-scope issue, flag it with `spawn_task` rather than expanding the goal.
- Use `Agent` subagents for parallel feature reworks where they don't touch shared files (e.g., `profile/` and `admin/` can run in parallel; `layout/` and `styles.scss` cannot).
- Use Plan mode before each phase to outline the diffs you'll make, then execute.

## Done when
- Tailwind is gone, build is clean, no `@apply`/`tw-` leftovers.
- Every feature screen looks intentional and cohesive against `UIUX_DESIGN_v1.md`.
- Every role completes every MVP user story in Chrome with zero console/network errors.
- Production builds (UI + API) succeed warning-free.
- Lighthouse thresholds met on key pages.
- A short `RELEASE_NOTES.md` lists what changed, what to verify in staging, and any follow-ups deferred via `spawn_task`.
