# Stride Adaptive AI Engine & Gamification Deep Review

**Total Findings:** 29 concrete bugs/risks (6 CRIT, 11 HIGH, 12 MED) + 35 manual test cases.

---

## CRITICAL BUGS (CRIT) — 6 Issues

### 1. Streak Timezone Bug — DateTime.UtcNow vs Local
**File:** GamificationService.cs:221-222  
**Issue:** Uses UTC midnight to determine "today", not user's local TZ. Streak can double-increment same calendar day or fail to increment.  
**Fix:** Use TimeZoneInfo.ConvertTime(DateTime.UtcNow, userTZ).Date

### 2. Negative XP After Purchases
**File:** GamificationService.cs:309-320  
**Issue:** TotalXp -= cost without clamping to 0. Level recalc may fail.  
**Fix:** TotalXp = Math.Max(0, TotalXp - cost)

### 3. Repair Streak on New User Fails
**File:** GamificationService.cs:348-350  
**Issue:** LastActiveDate null → hoursSinceLastActive = double.MaxValue → always "expired".  
**Fix:** Separate check for streak == 0 vs. expired window.

### 4. Level Off-by-One (L1-10 Boundary)
**File:** GamificationService.cs:437  
**Issue:** (totalXp / _settings.Level.Level1To10XpPerLevel) + 1 returns wrong level at boundaries.  
**Fix:** Ensure XP threshold math consistent both directions.

### 5. Concurrent GetTask — Same Task Served Twice
**File:** TaskPoolService.cs:82  
**Issue:** Two concurrent calls pop different tasks, but no per-student dedup. Duplicate attempts possible.  
**Fix:** Add student + topic lock before serving task.

### 6. Leaderboard Tie-Breaking Missing
**File:** LeaderboardService.cs:48-52  
**Issue:** Redis sorted set doesn't handle ties (same XP). Ranks flip on refresh.  
**Fix:** Add secondary sort key (TotalLevel, UserId) for deterministic tie-breaking.

---

## HIGH SEVERITY (HIGH) — 11 Issues

### 7. FirstTaskOfDay Bonus Uses UTC, Not User TZ
**File:** AdaptiveAIService.cs:165-166

### 8. Freeze Logic Off-by-One (1-day vs 2-day)
**File:** GamificationService.cs:262

### 9. ProcessAnswer isFirstTaskOfDay Recalculated Inconsistently
**File:** AdaptiveAIService.cs:166 vs GamificationService.cs:221

### 10. Losing Streak Decrease Capped at 15 But Unbounded
**File:** MLDifficultyEngine.cs:137-139

### 11. TaskPoolService Profanity Filter Missing
**File:** TaskPoolService.cs:225

### 12. Subject-Topic Mismatch Validation Missing
**File:** TaskPoolService.cs:180-183

### 13. Promotion/Demotion Double-Promotion Bug
**File:** LeaderboardService.cs:309-326

### 14. Cache Key Collision — No Year Namespace
**File:** LeaderboardService.cs:252-253

### 15. AI Provider No Timeout or Retry
**File:** AIProviderFactory.cs:46-61

### 16. Leaderboard GetLeaderboardAsync — N+1 Query
**File:** LeaderboardService.cs:70-82

### 17. StreakMultiplier Hardcoded Divisor
**File:** GamificationService.cs:482

---

## MEDIUM SEVERITY (MED) — 12 Issues

### 18. Level Calculation No MAX_INT Cap
**File:** GamificationService.cs:416-422

### 19. Topic Mastery — Log(0) Dangerous
**File:** AdaptiveAIService.cs:371

### 20. Accuracy Adjustment Unbounded
**File:** MLDifficultyEngine.cs:160-166

### 21. On-Demand Refill Infinite Loop Risk
**File:** TaskPoolService.cs:392-432

### 22. Level Calculation Doesn't Handle Corrupted Data
**File:** GamificationService.cs:427-462

### 23. Rolling Accuracy Not Clamped (0-1)
**File:** AdaptiveAIService.cs:320-321

### 24. Difficulty Band Math Off-by-One
**File:** TaskPoolService.cs:449

### 25. GetCurrentWeek Locale-Dependent
**File:** LeaderboardService.cs (GetCurrentWeek impl)

### 26. Leaderboard Week Reset No User Notification
**File:** LeaderboardService.cs:361-399

### 27. XP Deduction No Audit Trail
**File:** GamificationService.cs:290-326

### 28. AIGenerationLogDocument No Indexes
**File:** AIGenerationLogDocument.cs

### 29. Consecutive Correct Uses Hardcoded Take(20)
**File:** AdaptiveAIService.cs:173

---

## 35+ MANUAL TEST CASES

### Gamification & Streak Tests (TC-001 to TC-010)
- TC-001: Streak increments correctly across UTC/local midnight boundaries
- TC-002: XP never goes negative; level remains ≥ 1 after purchase deductions
- TC-003: New user (no LastActiveDate) can repair streak with clear error
- TC-004: Level-up happens at exact XP thresholds (e.g., 100 XP = level 2)
- TC-005: Difficulty always ≥ 1, ≤ 100 after losing streak calculation
- TC-006: Concurrent GetTask calls return different tasks (no duplicate serving)
- TC-007: Leaderboard tie-breaking is consistent across multiple fetches
- TC-008: SignalR pushes real-time rank updates when XP awarded
- TC-009: First-task-of-day bonus respects user's local date, not UTC
- TC-010: Streak freeze applied for 1-day absence (or clarified intent)

### Validation & Content Tests (TC-011 to TC-020)
- TC-011: Profanity filter blocks offensive task content pre-serving
- TC-012: Task templates validated for subject-topic match before render
- TC-013: Student promoted exactly once per week, not twice across leagues
- TC-014: Leaderboard week 18/2026 doesn't collide with week 18/2027 in Redis
- TC-015: Extreme level values (int.MaxValue) handled gracefully, capped
- TC-016: Topic mastery calculation safe on zero attempts (no Log(0))
- TC-017: Accuracy > 100% (corrupted data) doesn't break difficulty calc
- TC-018: On-demand pool refill doesn't loop infinitely
- TC-019: AI provider calls timeout within 10s, not hang indefinitely
- TC-020: Leaderboard fetch uses ≤ 5 DB queries (not N+1 per player)

### Edge Cases & Calculations (TC-021 to TC-035)
- TC-021: Streak multiplier progression smooth and respects config threshold
- TC-022: Difficulty bands 1-10 cover 1-100 without gaps or overlaps
- TC-023: XP bonuses stack correctly (base × diff × streak + first)
- TC-024: Level XP thresholds strictly increasing across all levels
- TC-025: Streak resets to 1 (losing) on first incorrect answer after win
- TC-026: Longest streak never decreases, always ≥ current streak
- TC-027: Perfect lesson bonus triggers at exact threshold (e.g., 10 correct)
- TC-028: Week reset sends notifications to users before clearing leaderboard
- TC-029: New student profile auto-created on first task with defaults
- TC-030: Task attempt ordering correct for consecutive correct calculation
- TC-031: Rolling accuracy EMA converges properly (0.2α formula)
- TC-032: Response time tracked in TaskAttempt and used in difficulty calc
- TC-033: All players archived when week ends (no missing rows in DB)
- TC-034: ML model failure triggers rule-based fallback immediately
- TC-035: Gemini API errors logged without PII/keys in AIGenerationLog

---

## KEY RECOMMENDATIONS

**Immediate (Before Prod):**
- TC-001: Fix timezone handling for streaks
- TC-003: Fix repair logic for new users
- TC-005: Ensure difficulty always clamped [1,100]
- TC-006: Add per-student task dedup in pool service

**High Priority (Sprint 1):**
- Implement deterministic tie-breaking for leaderboard (by level, then UserId)
- Add input validation bounds (RollingAccuracy [0,1], TotalAttempts ≥ 0)
- Timeout & retry on AI provider calls (Polly)

**Medium Priority (Sprint 2):**
- Audit trail for XP purchases/deductions
- Real-time SignalR notifications on XP/rank changes
- Centralize timezone handling (use single TimeZoneInfo source)

---

**Review Date:** 2026-05-12
**Reviewer:** Claude Code
**Scope:** Stride.Adaptive, Stride.Services (Gamification, Leaderboard), TaskPoolService
