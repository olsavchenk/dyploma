# Stride Infrastructure Security & Reliability Deep Review

**Review Date:** 2026-05-12  
**Scope:** Docker, Configuration, Database, Caching, File Storage, Background Jobs  
**Result:** 32 findings + 25 test cases identified

---

## CRITICAL & HIGH SEVERITY FINDINGS

### 1. CRIT | docker-compose.yml:28 | Hardcoded Meilisearch Master Key
- **Issue:** `MEILI_MASTER_KEY=masterKey` in plaintext environment variable
- **Risk:** Allows unauthorized index manipulation, data corruption
- **Fix:** Use environment secrets from `.env.local` or Docker secrets
- **Test:** Verify secret rotation policy; attempt index access with hardcoded key

### 2. CRIT | docker-compose.yml:24-25 | MinIO Default Credentials + No SSL
- **Issue:** `MinIO__AccessKey=minioadmin`, `MinIO__SecretKey=minioadmin`, `MinIO__UseSSL=false`
- **Risk:** Default credentials + plaintext HTTP allows object enumeration/exfiltration
- **Fix:** Use strong random credentials; enforce SSL; rotate weekly
- **Test:** TC-01: Brute-force with default credentials; TC-02: Verify buckets reject wrong key

### 3. CRIT | docker-compose.yml:18 | PostgreSQL Default Credentials in Connection String
- **Issue:** `Username=postgres;Password=postgres` hardcoded in compose environment
- **Risk:** Container network exposed; lateral movement = full DB compromise
- **Fix:** Use environment variable interpolation with strong random password
- **Test:** TC-03: Attempt psql from unrelated container using exposed credentials

### 4. HIGH | docker-compose.yml:30 | Default Anthropic API Key Placeholder
- **Issue:** `${ANTHROPIC_API_KEY:-your-anthropic-api-key-here}` fallback placeholder
- **Risk:** If env var unset, placeholder suggests hardcoded key; token leakage in logs
- **Fix:** Require explicit env var; fail fast if missing
- **Test:** TC-04: Start without env var; verify service fails with clear error

### 5. HIGH | src/Stride.Api/appsettings.json | Hardcoded JWT Secret
- **Issue:** `JwtSettings.SecretKey = "your-super-secret-key..."` hardcoded in config
- **Risk:** All JWT tokens can be forged; authentication completely bypassed
- **Fix:** Always load from environment; fail fast if not configured
- **Test:** TC-05: Forge JWT with hardcoded key; verify endpoint accepts it

### 6. HIGH | docker-compose.yml:151 | MinIO Latest Image Tag (Unpinned)
- **Issue:** `image: minio/minio:latest` without specific version
- **Risk:** Uncontrolled upgrades introduce breaking changes, security issues
- **Fix:** Pin to specific version: `minio/minio:2024.12.13`
- **Test:** TC-06: Pull `latest` tag twice; verify hash differs

### 7. HIGH | docker-compose.yml:176 | Meilisearch v1.6 Already Outdated
- **Issue:** `image: getmeili/meilisearch:v1.6` (current v1.10+)
- **Risk:** Known CVEs, missing performance/security fixes
- **Fix:** Update to `v1.10.0` with appropriate testing
- **Test:** TC-07: Scan CVE database for v1.6 vulnerabilities

### 8. HIGH | UserService.cs:UploadAvatarAsync | Missing Magic Byte Validation
- **Issue:** Only checks `ContentType` header (spoofable); no file signature verification
- **Risk:** Upload executable disguised as JPEG; if served, RCE possible
- **Fix:** Read first 8 bytes; verify JPEG (FFD8FF), PNG (89504E47), WebP (RIFF...WEBP)
- **Test:** TC-08: Upload PNG with spoofed Content-Type; TC-09: Rename .exe to .jpg with correct magic bytes; both should reject

### 9. HIGH | docker-compose.yml:22 | Valkey Without Authentication
- **Issue:** `Valkey__ConnectionString=valkey:6379` no password
- **Risk:** Any container can read cached user data, tokens, session state
- **Fix:** Add password configuration; use `valkey:6379?password=<strong-random>`
- **Test:** TC-10: Connect from rogue container with no auth; TC-11: Verify `redis-cli -h valkey ping` fails without password

### 10. HIGH | docker-compose.yml:19-20 | MongoDB No Authentication
- **Issue:** `mongodb://mongodb:27017` no credentials
- **Risk:** Lateral movement = full document DB compromise
- **Fix:** Enable MongoDB auth; use `mongodb://user:pass@mongodb:27017`
- **Test:** TC-12: Connect with `mongosh` from unauth container (should fail)

### 11. HIGH | Dockerfile | Non-Root User But Incomplete Permission Hardening
- **Issue:** Runs as `strideapp` user; but file permissions not fully verified
- **Risk:** Privilege escalation if strideapp can write to shared volumes
- **Fix:** Verify recursive `chown`; test directory permissions read-only
- **Test:** TC-13: As strideapp, try to modify `/app/logs` parent; TC-14: Verify file ownership on avatar uploads

### 12. HIGH | docker-compose.yml | All Services Missing Resource Limits
- **Issue:** No `mem_limit`, `cpus` limits defined
- **Risk:** One runaway service (model training) starves others; cascading failure
- **Fix:** Add resource limits per container (postgres: 2GB, minio: 1GB, etc.)
- **Test:** TC-15: Stress-test one container; verify others remain responsive

---

## MEDIUM SEVERITY FINDINGS

### 13. MED | Migrations/20260218153835 | Altering Nullable Column Without Safe Strategy
- **Issue:** `TopicId` changed from NOT NULL to nullable in `class_assignments`
- **Risk:** Down() reverses with new GUID default; UUID conflicts on re-migrate
- **Fix:** Add explicit default in migration; document change rationale
- **Test:** TC-16: Migrate up; verify TopicId=null; migrate down; check for UUID collisions

### 14. MED | Database Migrations | No Explicit Indexes on Foreign Keys
- **Issue:** FK columns lack explicit index creation; EF auto-indexes may be inefficient
- **Risk:** Slow leaderboard queries, task_attempts filters, performance degradation
- **Fix:** Add `migrationBuilder.CreateIndex()` for hot-path FKs
- **Test:** TC-17: `EXPLAIN ANALYZE` on task_attempts query; verify index scan, not seq scan

### 15. MED | TaskInstanceDocument.cs | MongoDB No Index Annotations
- **Issue:** Documents define fields but no `[BsonIndex]` or index creation
- **Risk:** Task lookups N+1 on pool queries; difficulty model retraining slow
- **Fix:** Create indexes in MongoDB init; add `db.task_instances.createIndex({topic_id: 1})`
- **Test:** TC-18: Time indexed vs unindexed query on 10k documents

### 16. MED | ValkeyCacheService.cs | No TTL Default Enforcement
- **Issue:** `DefaultExpirationMinutes` hardcoded to 60; no per-key override for sensitive data
- **Risk:** Long-lived cache of tokens (should be 15min); stale leaderboards
- **Fix:** Use separate method with explicit TTL for sensitive keys
- **Test:** TC-19: Set cache without expiration; TC-20: Verify auth tokens expire <15min

### 17. MED | TaskGenerationBackgroundService.cs | No Retry Logic
- **Issue:** `catch (Exception ex)` logs error but doesn't retry
- **Risk:** Transient DB/API errors kill task generation; students stuck
- **Fix:** Implement exponential backoff (1s, 2s, 4s, 8s max); fail after 3 retries
- **Test:** TC-21: Simulate DB timeout; verify 3 retry attempts before failure

### 18. MED | appsettings.json | AllowedHosts = "*" (No Validation)
- **Issue:** No Host header validation enabled
- **Risk:** HTTP Host Injection; cache poisoning; password reset to attacker domain
- **Fix:** Set `AllowedHosts: "localhost,stride.example.com"` per environment
- **Test:** TC-22: Send request with `Host: attacker.com`; verify rejection in prod

### 19. MED | appsettings.json | CORS Origins Include localhost:4200
- **Issue:** localhost always allowed; not restricted to prod domain
- **Risk:** Local attacker can test CORS bypass before prod exploit
- **Fix:** Use environment-specific CORS; prod = single origin
- **Test:** TC-23: POST from localhost:3000; verify origin rejected in prod

### 20. MED | MinIOStorageService.cs | DeleteAsync Logs Warning Without Rethrow
- **Issue:** `LogWarning()` swallows exception on avatar deletion failure
- **Risk:** Old avatar deletion fails silently; MinIO quota fills; cost escalates
- **Fix:** Rethrow or return bool; caller should handle
- **Test:** TC-24: Upload avatar, rename file, delete; verify exception not lost

---

## LOW SEVERITY FINDINGS

### 21. LOW | TaskInstanceDocument.cs | No Validation of TaskContent Embedded Size
- **Issue:** `TaskContent` embedded in document; could exceed 16MB MongoDB limit
- **Risk:** Task save fails catastrophically; no graceful degradation
- **Fix:** Add size validator; reject if >1MB
- **Test:** TC-25: Create task with 2MB nested content; verify rejection

### 22. LOW | Dockerfile.adaptive | MLModels Volume Not Encrypted
- **Issue:** `adaptive-models:/app/MLModels` stored unencrypted
- **Risk:** Model theft, reverse engineering of difficulty algorithm
- **Fix:** Document encryption requirement; verify host uses encrypted fs
- **Test:** TC-26: Inspect MLModels on host; verify no plaintext weights readable

### 23. LOW | docker-compose.yml | No Network Policies Defined
- **Issue:** All services on same bridge; no restrictions between services
- **Risk:** If API compromised, attacker can access MongoDB directly
- **Fix:** Create network policies; API can't access MongoDB; Valkey isolated
- **Test:** TC-27: Start rogue container; verify can't query mongodb

### 24. LOW | appsettings.json | Logging Level = Information (PII Risk)
- **Issue:** `"Default": "Information"` logs all requests, user data
- **Risk:** Logs grow unbounded; PII leakage; high storage costs
- **Fix:** Set to `Warning` in production; selective debug via feature flags
- **Test:** TC-28: Enable Information logging; grep logs for user emails/IPs

### 25. LOW | UserService.cs | MaxAvatarSizeBytes Hardcoded
- **Issue:** Hardcoded in service; not in config
- **Risk:** Changing limit requires recompilation; no A/B testing
- **Fix:** Move to appsettings.json; inject via IOptions
- **Test:** TC-29: Attempt upload at 90%, 100%, 110% of max; verify boundary

### 26. LOW | environment.production.ts | storageUrl = '/storage' (Relative)
- **Issue:** Relative path; assumes reverse proxy maps `/storage` → MinIO
- **Risk:** Misconfigured reverse proxy silently breaks avatar loading
- **Fix:** Explicitly verify reverse proxy rules; consider absolute URL
- **Test:** TC-30: Break reverse proxy rule; verify user sees error, not silent failure

### 27. LOW | Migrations | No Seed Data for Achievements/Subjects
- **Issue:** Initial migration creates tables but no default achievements
- **Risk:** Teachers manually create all content; no starter templates
- **Fix:** Add seed migration or admin API
- **Test:** TC-31: Fresh DB after migrations; verify achievements table empty or documented

### 28. LOW | docker-compose.yml | Health Check Retries = 5, Timeout = 5s
- **Issue:** Service healthy after 50s (10s interval * 5 retries)
- **Risk:** Slow recovery; rolling deploys slower than necessary
- **Fix:** Tune to `retries: 3, timeout: 3s` (30s startup) after baseline testing
- **Test:** TC-32: Measure actual startup time; adjust retries to 2x time

### 29. LOW | docker-compose.infrastructure.yml | Meilisearch MEILI_ENV = development
- **Issue:** Not explicit production mode in infrastructure compose
- **Risk:** Dev behavior leakage (verbose errors)
- **Test:** TC-33: Query Meilisearch errors; compare to expected prod response

### 30. LOW | Valkey Connection String | Bare `abortConnect=false`
- **Issue:** Only in Adaptive API; inconsistent with API service
- **Risk:** Inconsistent cache timeout behavior; failures not uniform
- **Fix:** Apply consistently; document trade-offs
- **Test:** TC-34: Kill Valkey; measure adaptive-api response time

### 31. LOW | appsettings.json | Google Client ID Placeholder
- **Issue:** `"your-google-client-id..."` placeholder exposed
- **Risk:** OAuth redirect manipulation if default placeholder used
- **Test:** TC-35: Invalid client ID; verify error doesn't expose placeholder

### 32. LOW | Missing Baseline for Performance Metrics
- **Issue:** No documented startup times, query latencies, memory usage baselines
- **Risk:** Can't detect performance regressions; scaling decisions unmeasured
- **Fix:** Document baseline metrics; add monitoring/alerting
- **Test:** TC-36: Measure all startup times; TC-37: Log query latencies

---

## REMEDIATION ROADMAP

**Immediate (Critical):** Rotate all credentials; move secrets to env vars; fix SSL/auth
**Sprint 1 (High):** Add magic byte validation, DB auth, indexes, pin image versions
**Sprint 2 (Medium):** Implement cache TTL policy, retry logic, resource limits, fix CORS
**Sprint 3 (Low):** Config refactor, encryption, network policies, logging

**Test Coverage:** Add 25+ integration tests to CI/CD before prod deployment
