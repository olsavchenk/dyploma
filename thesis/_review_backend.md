# Stride Backend Security & QA Audit Report

## Executive Summary
Deep code review of Stride backend (D:/apps/dyploma/Stride/src) covering Auth, Controllers, Services, and DataAccess layers. Review identified 52 findings across security, logic, and testing gaps. Key concerns: JWT validation edge cases, missing input validation in multiple controllers, N+1 query patterns, race conditions in profile creation, and inadequate test coverage for admin operations.

---

## CRITICAL & HIGH SEVERITY FINDINGS

### 1. JWT Secret Key Management - CRITICAL
**File:** `Stride.Services/Implementations/JwtService.cs`
**Severity:** CRITICAL
**Issue:** JWT secret key loaded from `_jwtSettings.SecretKey` via configuration. No evidence of key rotation, environment-specific key management, or key derivation. Secret may be exposed in logs/configs.
**What to test:** 
- Verify secret never logged or exposed in error messages
- Check JWT secret stored separately from source code
- Confirm key rotation capability exists
- Test token validation with invalid/old keys

---

### 2. Refresh Token - No Duplicate Validation
**File:** `Stride.Services/Implementations/AuthService.cs` line ~120 (RefreshTokenAsync)
**Severity:** CRITICAL
**Issue:** When refreshing token, old token marked revoked but new token generated. However, no check if same token used twice simultaneously. Race condition allows reuse if two requests with same refresh token arrive within milliseconds.
**What to test:**
- Send two concurrent refresh requests with identical token
- Verify both fail (one should fail with "already revoked")
- Check logs show security event

---

### 3. Admin Role Check Missing in Multiple Controllers
**File:** `Stride.Api/Controllers/AdminAchievementsController.cs`, `AdminSubjectsController.cs`, `AdminTopicsController.cs`
**Severity:** HIGH
**Issue:** Controllers marked `[Authorize(Policy = "AdminAccess")]` but policy not validated in code. No explicit role check in methods. If policy misconfigured globally, unauthorized users can bypass.
**What to test:**
- Access admin endpoints as Student user
- Verify 403 Forbidden returned, not 200
- Check "AdminAccess" policy correctly configured in Startup

---

### 4. Missing Input Validation - Admin Role Change
**File:** `Stride.Api/Controllers/AdminController.cs` line ~70 (ChangeUserRole)
**Severity:** HIGH
**Issue:** Role parameter in `ChangeUserRoleRequest` not validated. No check if role value is valid (Student/Teacher/Admin). Attacker can set role to arbitrary string or blank.
**What to test:**
- PATCH /api/v1/admin/users/{id}/role with role="InvalidRole"
- PATCH with role="" (empty)
- PATCH with role containing SQL/script
- Verify 400 BadRequest + validation error message

---

### 5. Task Instance ID Validation - String Instead of Guid
**File:** `Stride.Api/Controllers/TasksController.cs` line ~60 (SubmitTask)
**Severity:** HIGH
**Issue:** `taskInstanceId` parameter is `string`, not `Guid`. No validation it's a valid GUID format. Arbitrary strings passed to service without validation.
**What to test:**
- POST /api/v1/tasks/invalid-id/submit with random string
- POST with SQL injection payload: `'; DROP--`
- POST with very long string (1MB+)
- Verify 400 BadRequest, not 500

---

### 6. No Authorization Check - Task Submission
**File:** `Stride.Api/Controllers/TasksController.cs` line ~60
**Severity:** HIGH
**Issue:** SubmitTask checks `GetCurrentStudentId()` but if null, returns Unauthorized. However, no verification task belongs to student's class/topic. Student can submit task for ANY topic they're not enrolled in.
**What to test:**
- Student A enrolled in Class 1 (Subject: Math)
- Student A calls SubmitTask with Topic from Class 2 (Subject: Science)
- Verify task submission rejected (403) not allowed (200)

---

### 7. Password Reset Token - Constant Time Comparison Missing
**File:** `Stride.Services/Implementations/AuthService.cs` (ResetPasswordAsync)
**Severity:** HIGH
**Issue:** Reset token compared using `u.PasswordResetToken != null && u.PasswordResetToken == request.Token`. String comparison is vulnerable to timing attacks. Attacker can brute-force reset tokens character by character.
**What to test:**
- Measure response time for correct token vs wrong token
- Use timing attack to deduce valid reset token
- Verify constant-time comparison used

---

### 8. Class Join Code Generation - Insufficient Uniqueness Check
**File:** `Stride.Services/Implementations/ClassService.cs` (GenerateUniqueJoinCodeAsync)
**Severity:** HIGH
**Issue:** Join code is 6-character alphanumeric (36^6 = 2.1B combinations). Generation loop may loop forever if collision occurs. No exponential backoff, no limit on retries.
**What to test:**
- Create 10K classes in rapid succession
- Monitor for timeouts or hung requests
- Check unique constraint on JoinCode in DB

---

### 9. N+1 Query - Student Profile Lookup
**File:** `Stride.Services/Implementations/UserService.cs` (GetUserProfileAsync)
**Severity:** HIGH
**Issue:** Method loads `User` then accesses `.StudentProfile.TaskAttempts.Count` and `.Achievements.Count` without Include(). Each property access triggers DB query.
**What to test:**
- Profile 10 GetUserProfileAsync calls
- Count database queries (should be 1, not 3+)
- Check query plans for table scans

---

### 10. Soft Delete - Bypassed by Direct DbSet Access
**File:** `Stride.DataAccess/Contexts/StrideDbContext.cs`
**Severity:** HIGH
**Issue:** Global query filter applies to `Users` but NOT to `StudentProfile`, `TeacherProfile`, `RefreshTokens`. A deleted user's related data remains visible if accessed directly.
**What to test:**
- Delete user account
- Query StudentProfile directly (bypass filter)
- Verify profile still accessible (bug), should be hidden

---

### 11. PasswordHash Can Be Null - No Validation
**File:** `Stride.Services/Implementations/AuthService.cs` (LoginAsync)
**Severity:** HIGH
**Issue:** Line checks `if (user.PasswordHash == null || !BCrypt.Net.BCrypt.Verify(...))`. If GoogleId is set (OAuth), PasswordHash is null. But no explicit check prevents password login on OAuth users.
**What to test:**
- Register via Google OAuth (PasswordHash = null)
- Attempt login with email + password
- Should fail (403), verify not (200)

---

### 12. Email Domain - No Validation
**File:** `Stride.Services/Implementations/AuthService.cs` (RegisterAsync)
**Severity:** MEDIUM
**Issue:** Email not validated for format. Accepts any string with @ (e.g., "foo@x", "a@."). No domain reputation check. Disposable emails allowed.
**What to test:**
- Register with email="test@"
- Register with email="a@localhost"
- Verify validation error, not 200 OK

---

### 13. DisplayName - XSS Risk in Frontend
**File:** `Stride.Core/Entities/User.cs`
**Severity:** MEDIUM
**Issue:** DisplayName stored as plain string. No sanitization. If frontend renders in HTML without escaping, XSS vulnerability.
**What to test:**
- Register with DisplayName=`<img src=x onerror=alert(1)>`
- Check if frontend renders sanitized (should be)
- Check API response doesn't include raw HTML

---

### 14. Concurrent Profile Creation - Race Condition
**File:** `Stride.Services/Implementations/AuthService.cs` (LoginAsync lines ~95-110)
**Severity:** MEDIUM
**Issue:** After login, checks `if (user.Role == "Student" && user.StudentProfile == null)` then creates profile. Two concurrent logins can both create profiles, causing duplicate key error.
**What to test:**
- Send 2 simultaneous login requests for same new Student
- Verify only 1 profile created, 2nd request fails gracefully
- Check logs for duplicate key exception

---

### 15. Login Audit - IP Address Not Validated
**File:** `Stride.Services/Implementations/AuthService.cs` (LoginAsync)
**Severity:** MEDIUM
**Issue:** `ipAddress` parameter comes from controller (from `HttpContext.Connection.RemoteIpAddress`). Not validated. Can be spoofed if proxy not configured. Used for lockout tracking.
**What to test:**
- Check X-Forwarded-For header handling
- Verify trusted proxy list configured in Startup
- Test IP spoofing detection

---

### 16. Failed Login Attempts - No Rate Limiting on Register
**File:** `Stride.Services/Implementations/AuthService.cs` (RegisterAsync)
**Severity:** MEDIUM
**Issue:** Registration not rate-limited. No limit on email checks or GDPR consent. Attacker can enumerate valid emails by retry behavior.
**What to test:**
- Register 1000 accounts in 1 second
- Verify rate limit triggered (429)
- Check per-IP or per-email limits

---

### 17. GDPR Consent - Not Enforced
**File:** `Stride.Api/Controllers/AuthController.cs` (RegisterAsync)
**Severity:** MEDIUM
**Issue:** GdprConsent accepted in request but stored without verification. No legal requirements enforced (e.g., user must read policy). Could be set to false then changed by middleware.
**What to test:**
- Register with GdprConsent=false
- Check API behavior (should block data processing)
- Verify consent logged and immutable

---

### 18. Avatar Upload - Path Traversal Risk
**File:** `Stride.Api/Controllers/UsersController.cs` (UploadAvatar)
**Severity:** MEDIUM
**Issue:** File extension validated but filename taken from `file.FileName` (user input). If storage uses this directly, path traversal possible: `../../etc/passwd.jpg`
**What to test:**
- Upload file with FileName=`../../malicious.jpg`
- Verify sanitized filename generated (GUID-based)
- Check no path traversal in storage path

---

### 19. DataExport Rate Limit - Per User Not Per IP
**File:** `Stride.Services/Implementations/UserService.cs` (ExportUserDataAsync)
**Severity:** MEDIUM
**Issue:** Rate limit key is `$"data_export_rate_limit:{userId}"`. If session hijacked, attacker limited to once per 24h. But no per-IP limit, multiple users can export simultaneously causing DoS.
**What to test:**
- 100 concurrent exports from 100 users
- Monitor database load
- Verify graceful degradation (429 response)

---

### 20. Logout - No Token Revocation on Frontend
**File:** `Stride.Api/Controllers/AuthController.cs` (LogoutAsync)
**Severity:** MEDIUM
**Issue:** Backend revokes refresh token, but access token in JWT is stateless. If frontend caches access token, can still use it until expiry. No immediate invalidation.
**What to test:**
- Login, capture access token
- Call /auth/logout (revoke refresh token)
- Use access token in next request
- Should work until expiry (bug: should fail immediately)

---

### 21. Admin Policy - Not Defined
**File:** `Stride.Api/Controllers/AdminController.cs`
**Severity:** MEDIUM
**Issue:** Authorize attribute uses `Policy = "AdminAccess"` but policy not found in Program.cs/Startup. If policy undefined, all auth users treated as Admin.
**What to test:**
- Check Program.cs for policy "AdminAccess" definition
- Access admin endpoint as Student
- Should get 403, not 200

---

### 22. Class Membership - No Duplicate Check Performance
**File:** `Stride.Services/Implementations/ClassService.cs` (JoinClassAsync)
**Severity:** LOW
**Issue:** Duplicate check uses `FirstOrDefaultAsync()`. If table huge, causes full scan. Should use `AnyAsync()`.
**What to test:**
- Join class with 1M+ existing members
- Monitor query performance
- Compare to using AnyAsync()

---

### 23. Exception Messages Leak Information
**File:** Multiple controllers (AdminController, ClassController, TasksController)
**Severity:** MEDIUM
**Issue:** Exceptions like `"Teacher profile not found"` or `"Invalid join code"` leak whether resource exists. Attacker enumerates valid IDs/codes.
**What to test:**
- Attempt to access non-existent class: `GET /api/v1/classes/{invalid-uuid}`
- Response should be generic (404 Not Found, not "Class not found for this teacher")
- Test with valid UUID vs invalid format

---

### 24. Refresh Token Expiry - No Validation in Entity
**File:** `Stride.Core/Entities/RefreshToken.cs`
**Severity:** LOW
**Issue:** `IsActive` computed property checks `!IsExpired && !IsRevoked`. But if `ExpiresAt` not set or set to DateTime.MaxValue, never expires. No DB constraint on ExpiresAt.
**What to test:**
- Generate refresh token with ExpiresAt = DateTime.MaxValue
- Attempt refresh after many years
- Verify fails (token should have been revoked)

---

### 25. Model Validation - Not Using FluentValidation
**File:** `Stride.Api/Controllers/AuthController.cs`, `TasksController.cs`
**Severity:** MEDIUM
**Issue:** Controllers don't validate `[FromBody]` models with FluentValidation. Manual checks scattered (e.g., `IsNullOrWhiteSpace`). Inconsistent validation logic.
**What to test:**
- POST /auth/register with Email="" (empty)
- POST with Password="a" (too short, no rule)
- Verify consistent validation errors

---

## LOGIC FLAWS & EDGE CASES

### 26. Role Selection - No Validation Against Existing Role
**File:** `Stride.Services/Implementations/AuthService.cs` (SelectRoleAsync)
**Severity:** MEDIUM
**Issue:** User can call SelectRole multiple times, changing role. Profile not deleted, just new one created. Old profile orphaned.
**What to test:**
- Register as Student
- Call SelectRole("Teacher")
- Check StudentProfile still exists (orphaned)
- Call SelectRole("Admin") - should fail or warn

---

### 27. Account Lockout - Duration Hardcoded
**File:** `Stride.Services/Implementations/AuthService.cs`
**Severity:** LOW
**Issue:** Lockout duration = 30 minutes (constant `LockoutDuration`). No configuration option to adjust. Global setting, not per-system.
**What to test:**
- Fail 5 logins, get locked
- Wait 31 minutes, retry (should work)
- Wait 29 minutes, retry (should fail)

---

### 28. Exponential Backoff - No Jitter
**File:** `Stride.Services/Implementations/AuthService.cs` (LoginAsync)
**Severity:** LOW
**Issue:** Exponential backoff (5s, 15s) deterministic. Multiple attacker instances hit same delays. No jitter/randomization to prevent synchronized attacks.
**What to test:**
- Monitor 10 concurrent failed login attempts
- Check backoff timing is identical (bug: should be randomized)

---

### 29. Student Profile - Default League Assignment
**File:** `Stride.Services/Implementations/AuthService.cs` (LoginAsync)
**Severity:** LOW
**Issue:** New student profile assigned `League = "Bronze"` hardcoded. No configuration. If league system changes, requires code change.
**What to test:**
- Create new student, check League="Bronze"
- Verify configurable or enum-validated

---

### 30. Class Archive - Student Data Not Affected
**File:** `Stride.Services/Implementations/ClassService.cs` (ArchiveClassAsync)
**Severity:** LOW
**Issue:** Archiving class sets `IsArchived=true, IsActive=false`. But student's task attempts, achievements remain visible and accessible even after class archived.
**What to test:**
- Archive a class
- Query archived class's assignments and student attempts
- Should return 404 or restricted, not visible

---

## MISSING TEST SCENARIOS

### 31. Missing Test: Concurrent Refresh Token Rotation
**Scenario:** Two simultaneous refresh requests with same token
**Expected:** One succeeds, one fails with "token already revoked"
**Current:** Not tested (potential race condition)

---

### 32. Missing Test: Admin Access Control Matrix
**Scenario:** Test each admin operation (GetUsers, ChangeRole, etc.) as Student, Teacher, Admin, Guest
**Expected:** 403 for non-admins, 200 for admins
**Current:** No matrix test coverage

---

### 33. Missing Test: Cross-Class Task Access
**Scenario:** Student in Class A attempts task from Class B
**Expected:** 403 Forbidden
**Current:** Not explicitly tested (authorization gap)

---

### 34. Missing Test: Password Reset Token Expiry
**Scenario:** Attempt reset with expired token
**Expected:** 401 Unauthorized
**Current:** Tested but no time-based test (token sits for 24h, then expires)

---

### 35. Missing Test: Avatar File Type Bypass
**Scenario:** Upload file with .exe extension renamed to .jpg, content-type spoofed
**Expected:** Rejected
**Current:** Only content-type and extension checked, not file magic bytes

---

### 36. Missing Test: Join Code Collision Handling
**Scenario:** Force two classes to have same join code (DB constraint test)
**Expected:** 400 BadRequest or retried
**Current:** No manual collision test, only logic check

---

### 37. Missing Test: Soft Delete Query Filter Bypass
**Scenario:** Query StudentProfile directly after user deletion
**Expected:** Returns 0 results
**Current:** Query filter not applied (bug found)

---

### 38. Missing Test: GDPR Consent Enforcement
**Scenario:** Register with GdprConsent=false, attempt data processing
**Expected:** Blocked
**Current:** No enforcement tested

---

### 39. Missing Test: Email Domain Validation
**Scenario:** Register with invalid email formats
**Expected:** 400 BadRequest with validation error
**Current:** Not validated (accepts any string with @)

---

### 40. Missing Test: Rate Limiting on Password Reset
**Scenario:** Request password reset 100 times in 1 second
**Expected:** 429 TooManyRequests
**Current:** No per-IP rate limit on ForgotPassword

---

### 41. Missing Test: XSS in DisplayName
**Scenario:** Register with DisplayName=`<script>alert(1)</script>`
**Expected:** Sanitized in API response
**Current:** Stored as-is, depends on frontend escaping

---

### 42. Missing Test: Timing Attack on Reset Token
**Scenario:** Measure response time for correct vs incorrect reset token
**Expected:** Constant time, no difference
**Current:** String comparison vulnerable to timing

---

### 43. Missing Test: Concurrent Student Profile Creation
**Scenario:** Two simultaneous logins for new student
**Expected:** One succeeds, one fails gracefully
**Current:** Potential race condition, not tested

---

### 44. Missing Test: Lockout Recovery IP Spoofing
**Scenario:** Fail login from IP A, locked. Spoof IP A header, retry from IP B
**Expected:** Still locked (uses validated IP)
**Current:** IP source not validated

---

### 45. Missing Test: Logout - Token Invalidation
**Scenario:** Login, logout, use old access token
**Expected:** 401 Unauthorized
**Current:** Token still valid until expiry (design flaw)

---

### 46. Missing Test: Admin Role Change - Orphaned Profiles
**Scenario:** Change user role from Student to Teacher
**Expected:** Old StudentProfile archived or deleted
**Current:** Orphaned, no cleanup tested

---

### 47. Missing Test: Admin Dashboard Analytics - Performance
**Scenario:** Call GetDashboardAnalyticsAsync with 1M+ users
**Expected:** <500ms response
**Current:** No performance baseline, potential N+1 queries

---

### 48. Missing Test: Task Template Review - Authorization
**Scenario:** Student attempts to approve AI task in /api/v1/admin/ai/review-queue/{id}/approve
**Expected:** 403 Forbidden
**Current:** Relies on AdminAccess policy (not tested)

---

### 49. Missing Test: Class Join - Active Class Verification
**Scenario:** Join class that's archived
**Expected:** 400 BadRequest
**Current:** Checks IsActive but no test case

---

### 50. Missing Test: Export Data - Large Payload
**Scenario:** Export user with 100K task attempts and 1K achievements
**Expected:** Completes in <10s, no memory exhaustion
**Current:** No performance test, potential OOM

---

### 51. Missing Test: Refresh Token Cookie - HttpOnly and Secure Flags
**Scenario:** Check HTTP response Set-Cookie header
**Expected:** refreshToken; HttpOnly; Secure; SameSite=Strict
**Current:** Not verified in code or tests

---

### 52. Missing Test: CORS and CSRF Protection
**Scenario:** POST from different origin without CSRF token
**Expected:** 403 Forbidden
**Current:** No explicit CSRF tokens seen, depends on SameSite

---

## SUMMARY STATISTICS

- **CRITICAL Findings:** 2 (JWT secret mgmt, refresh token duplicate)
- **HIGH Findings:** 8 (missing auth checks, input validation gaps, race conditions)
- **MEDIUM Findings:** 12 (info leaks, timing attacks, inconsistent validation)
- **LOW Findings:** 8 (performance, hardcoded values, edge cases)
- **Missing Test Scenarios:** 22 (authorization, timing, concurrency, edge cases)

---

## REMEDIATION PRIORITY

1. **Immediate (Critical):** Refresh token duplicate check, JWT secret management
2. **Week 1 (High):** Input validation framework (FluentValidation), admin policy definition, task authorization
3. **Week 2 (Medium):** Soft delete filter application, generic error messages, constant-time comparisons
4. **Ongoing:** Test coverage for auth matrix, concurrency, edge cases

