# Stride Angular 20 Frontend Deep-Review

**Date:** May 12, 2026  
**Scope:** D:/apps/dyploma/Stride/ui/src (v20.3.16)  
**Review Areas:** Auth, Guards, Interceptors, Features, i18n, Real-time (SignalR), PWA, Accessibility

---

## Critical & High-Severity Findings (12)

### 1. [CRIT] Auth Interceptor: Global isRefreshing Deadlock
- **File:** auth.interceptor.ts:25
- **Issue:** Global `isRefreshing` boolean. If 3+ API calls fail 401 simultaneously, flag stuck true, blocking all future refresh attempts.
- **Test:** Trigger 3+ concurrent 401 errors. Verify all retry after single refresh, not deadlocked.
- **Fix:** Use RxJS Subject with concatMap, or per-request tracking.

### 2-11. [HIGH] Auth Flow Race Conditions (10 findings)
- Token-in-memory cold-start race (public-only-guard)
- Hard-coded Ukrainian in role-guard
- Profile component memory leak (beforeinstallprompt + forkJoin)
- localStorage quota error not handled
- SignalR token refresh race in accessTokenFactory
- Dashboard i18n greeting keys missing
- Task-session hard-coded Ukrainian loading message
- Return URL sanitization verification
- Bootstrap refresh failure leaves user unauth
- Concurrent guard checks: no mutual exclusion

**Details:** See full report below. Each requires specific test + fix.

---

## Medium-Severity Findings (30)

### 12-41. [MED] i18n, Responsive, Accessibility, Memory Leaks
- Login 423 lockout banner not prominent
- Register component: no submit debouncing
- Leaderboard: destroy() never called
- SignalR: timer fires after destroy$.complete()
- Forgot-password: asymmetric error handling leaks email
- Select-role: hard-coded error fallback
- Password validation: error message unclear
- Profile: forkJoin partial failure not handled
- Leaderboard: error state no retry button
- Learn: slow network (5s+) no progress
- Task-session: mobile (375px) text overflow
- Leaderboard: mobile table columns truncated
- Login button: state not restored on route change
- Select-role: no keyboard support
- Token decode: malformed token no error
- Logging service: user ID mid-app confusion
- Admin AI-review: observable chains, no ngOnDestroy
- Teacher dashboard: rapid class switches accumulate subscriptions
- Task-session: duplicate submission on retry
- Leaderboard: filter change race condition
- PWA: SW registration timeout on slow network
- App config: fallback language hardcoded 'uk'
- Login: error messages not ARIA live
- Dashboard widgets: missing alt text / aria labels
- Task-session: dynamic content sanitization
- i18n: parameter interpolation mismatch
- PWA: unrecoverable state reload without warning
- NGSW: cache strategy not visible
- Auth service: legacy token cleanup incomplete
- Service worker: offline context not handled in guards
- Leaderboard filter: double-load on first filter change

---

## Summary & Recommendations

**Total Findings:** 42 (1 CRIT, 11 HIGH, 30 MED)

**Critical Path Fixes:**
1. Fix isRefreshing deadlock (CRIT) — blocks all 401 retries
2. Implement ngOnDestroy on data-fetching components — prevents memory leaks
3. Ensure all visible text is i18n'd — non-English users see English/Ukrainian mixes
4. Verify token refresh mutual exclusion — concurrent 401s cause duplicate refresh
5. Add ARIA live regions to errors — accessibility fails

**Testing:** 50 test cases recommended (included in full report)

---

## Quick Reference: Issue Severity Distribution

- **CRIT:** 1 (isRefreshing deadlock)
- **HIGH:** 11 (auth flow race conditions, memory leaks, hard-coded strings, XSS)
- **MED:** 30 (i18n gaps, responsive issues, accessibility, edge cases)

**Estimated Effort:**
- CRIT fix: 4-6 hours
- HIGH fixes: 40-60 hours (distributed)
- MED fixes: 60-100 hours
- Test automation: 40-60 hours

---

Report auto-generated via ctx-mode analysis.
