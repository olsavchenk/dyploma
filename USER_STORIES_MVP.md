# Stride — MVP User Stories

> **Version:** 2.0.0  
> **Date:** February 11, 2026  
> **Scope:** MVP (Phase 1)  
> **AI Implementation:** Each story = 1 Claude Sonnet 4.5 prompt  
> **Total Stories:** 40

---

## Story Format

Each story follows: **US-[Number]**

---

## 1. Infrastructure & Setup - DONE

### US-001: Initialize Backend Solution with Database Contexts - IMPLEMENTED

**As a** developer  
**I want** the complete backend foundation  
**So that** I can build MVP features

**Acceptance Criteria:**
- .NET 10 solution: `Stride.Api`, `Stride.Core`, `Stride.Services`, `Stride.DataAccess`, test projects
- `StrideDbContext` (EF Core/PostgreSQL) with all entities: User, StudentProfile, TeacherProfile, Subject, Topic, LearningPath, StudentPerformance, TaskAttempt, Achievement, LeaderboardEntry, Class, ClassAssignment
- `MongoDbContext` with collections: task_templates, task_instances, ai_generation_logs
- All entity configurations, indexes, and initial migrations
- Health check endpoints for both databases

**Tech Stack:** .NET 10, EF Core, PostgreSQL 17, MongoDB 7

---

### US-002: Configure Caching, Storage, and Search Services - IMPLEMENTED

**As a** developer  
**I want** infrastructure services configured  
**So that** I can cache data, store files, and search content

**Acceptance Criteria:**
- `ICacheService` + `ValkeyCacheService` with Get/Set/Remove/TTL support
- `IStorageService` + `MinIOStorageService` with upload/download, buckets: avatars, assets
- `ISearchService` + `MeilisearchService` with indexes: subjects, topics
- Health checks for all services
- Configuration via IOptions pattern

**Tech Stack:** Valkey 8, MinIO, Meilisearch

---

### US-003: Setup Docker Compose and Core Middleware - IMPLEMENTED

**As a** developer  
**I want** containerized development environment and middleware  
**So that** the app runs consistently with proper error handling

**Acceptance Criteria:**
- `docker-compose.yml` with: api, postgres, mongodb, valkey, minio, meilisearch
- Multi-stage `Dockerfile` for API
- `GlobalExceptionMiddleware` with RFC 7807 error responses
- Serilog logging (console + file, correlation IDs)
- FluentValidation auto-registration with validation filter
- Health check endpoints

**Tech Stack:** Docker, Serilog, FluentValidation

---

## 2. Authentication - DONE

### US-004: Implement Email/Password Authentication - IMPLEMENTED

**As a** user  
**I want** to register and login with email/password  
**So that** I can access my account

**Acceptance Criteria:**
- POST `/api/v1/auth/register` - email, password, displayName, GDPR consent
- POST `/api/v1/auth/login` - email, password with lockout (5 attempts)
- Password hashing with bcrypt, email uniqueness validation
- JWT access token (15min) + refresh token (30 days, HttpOnly cookie)
- `IJwtService` for token generation/validation
- POST `/api/v1/auth/refresh` - token rotation
- POST `/api/v1/auth/logout` - revoke tokens

**Tech Stack:** ASP.NET Identity, JWT, bcrypt

---

### US-005: Implement Google OAuth and Role Selection - IMPLEMENTED

**As a** user  
**I want** to login with Google and select my role  
**So that** I can use my existing account with appropriate features

**Acceptance Criteria:**
- POST `/api/v1/auth/google` - validate Google ID token, create/link user
- Extract email, name, avatar from Google profile
- POST `/api/v1/auth/select-role` - Student or Teacher (creates profile)
- Role-based authorization policies: StudentAccess, TeacherAccess, AdminAccess
- Admin role manually assigned only

**Tech Stack:** Google.Apis.Auth, OAuth 2.0

---

### US-006: Implement Password Reset Flow - IMPLEMENTED

**As a** user  
**I want** to reset my forgotten password  
**So that** I can regain access

**Acceptance Criteria:**
- POST `/api/v1/auth/forgot-password` - generate reset token (1hr TTL)
- POST `/api/v1/auth/reset-password` - token, newPassword validation
- Invalidates all refresh tokens on reset
- Returns success even for non-existent emails (security)

**Tech Stack:** ASP.NET Core

---

## 3. User Management - DONE

### US-007: Implement User Profile Management

**As a** user  
**I want** to view, edit, and manage my profile  
**So that** I control my account data

**Acceptance Criteria:**
- GET `/api/v1/users/me` - profile with role-specific stats
- PUT `/api/v1/users/me` - update displayName, teacher fields
- POST `/api/v1/users/me/avatar` - upload to MinIO (5MB, images only)
- GET `/api/v1/users/me/data-export` - GDPR data export (rate limited)
- DELETE `/api/v1/users/me` - soft delete with anonymization

**Tech Stack:** ASP.NET Core, MinIO

---

## 4. Learning Content - DONE

### US-008: Implement Subjects and Topics Management

**As a** student  
**I want** to browse subjects and topics  
**So that** I can choose what to learn

**Acceptance Criteria:**
- Subject entity: id, name, slug, description, iconUrl, sortOrder
- Topic entity: id, subjectId, parentTopicId, name, gradeLevel, sortOrder (hierarchical)
- GET `/api/v1/subjects` - list with progress per user (cached 1hr)
- GET `/api/v1/subjects/{id}/topics` - hierarchical tree with mastery
- GET `/api/v1/topics/{id}` - detail with breadcrumb, student performance
- Seed 4 MVP subjects with topics

**Tech Stack:** EF Core, Valkey

---

### US-009: Implement Learning Paths - IMPLEMENTED

**As a** student  
**I want** structured learning paths  
**So that** I can follow a curriculum

**Acceptance Criteria:**
- LearningPath entity: id, subjectId, name, gradeLevel, description
- LearningPathStep entity: id, pathId, topicId, stepOrder
- GET `/api/v1/learning-paths` - list with filters, progress
- GET `/api/v1/learning-paths/{id}` - steps with completion status
- Next recommended step highlighted

**Tech Stack:** EF Core

---

## 5. Adaptive AI Service - DONE

### US-010: Implement Student Performance Model and Difficulty Engine - IMPLEMENTED

**As a** developer  
**I want** per-topic student tracking and difficulty calculation  
**So that** tasks adapt to each learner

**Acceptance Criteria:**
- StudentPerformance entity: studentId, topicId, currentDifficulty (1-100), rollingAccuracy, currentStreak, streakDirection, topicMastery, totalAttempted, lastActiveAt
- `IDifficultyEngine.CalculateNextDifficulty()` implementing:
  - Winning streak (3+): +5 to +10 per answer
  - Losing streak (2+): -10 to -15 per answer
  - Time decay >7 days: regress 10-20%
  - Flow zone correction (70-80% target accuracy)
- Comprehensive unit tests

**Tech Stack:** .NET, xUnit

---

### US-011: Implement AI Provider Factory and Gemini Integration - IMPLEMENTED

**As a** developer  
**I want** extensible AI task generation  
**So that** I can generate educational content via Gemini API

**Acceptance Criteria:**
- `IAIProvider` interface: GenerateTaskTemplate, ValidateResponse
- `IAIProviderFactory`: GetProvider, GetDefaultProvider
- `GeminiProvider` implementation with:
  - Prompt templates for Ukrainian educational tasks
  - Structured JSON output parsing
  - Retry with exponential backoff (3 attempts)
  - Request/response logging to MongoDB
- Factory pattern allows future GPT/Claude providers

**Tech Stack:** HttpClient, Google Gemini API

---

### US-012: Implement Task Templates and Instances (MongoDB) - IMPLEMENTED

**As a** developer  
**I want** task document models  
**So that** I can store and render AI-generated tasks

**Acceptance Criteria:**
- TaskTemplateDocument: topicId, taskType, difficultyBand, templateContent, isApproved, aiProvider, reviewedBy
- TaskInstanceDocument: templateId, topicId, difficulty, renderedContent (question, options, answer, explanation)
- `ITemplateRenderer` for parameterized template filling (expressions like {{a+b}})
- Repositories with indexed queries
- Seed 50+ fallback templates per MVP topic

**Tech Stack:** MongoDB.Driver

---

### US-013: Implement Task Pool Service and AI Orchestrator - IMPLEMENTED

**As a** developer  
**I want** task pool management and AI coordination  
**So that** tasks are served instantly with proper adaptation

**Acceptance Criteria:**
- `ITaskPoolService`: GetTask, RefillPool, GetPoolStatus
- Valkey cache: `taskpool:{topicId}:{band}` with 50 tasks target
- Background refill when pool drops below threshold
- `IAdaptiveAIService` orchestrator:
  - GetNextTask(studentId, topicId): select task at target difficulty
  - ProcessAnswer(): evaluate → update model → award XP → return next task
- Fallback to pre-authored tasks when AI unavailable

**Tech Stack:** Valkey, MongoDB, .NET

---

## 6. Task System

### US-014: Implement Task Endpoints (Backend)

**As a** student  
**I want** to fetch and submit tasks  
**So that** I can learn at my level

**Acceptance Criteria:**
- TaskAttempt entity: studentId, taskInstanceId, topicId, isCorrect, responseTimeMs, difficultyAtTime
- GET `/api/v1/tasks/next?topicId={id}` - adaptive task (excludes answer)
- POST `/api/v1/tasks/{id}/submit` - evaluate, update performance, award XP, return feedback
- GET `/api/v1/tasks/history` - paginated attempt history
- Integration with GamificationService for XP/achievements

**Tech Stack:** ASP.NET Core, EF Core

---

### US-015: Implement Task Type Components (Frontend) - IMPLEMENTED

**As a** student  
**I want** interactive task components  
**So that** I can answer different question types

**Acceptance Criteria:**
- `MultipleChoiceTaskComponent`: 4 options, single select, keyboard nav (1-4) ✅
- `FillBlankTaskComponent`: inline inputs for {{blank}} placeholders ✅
- `TrueFalseTaskComponent`: two buttons, T/F shortcuts ✅
- `MatchingTaskComponent`: two columns, click-to-match pairs ✅
- `OrderingTaskComponent`: drag-and-drop with CDK, keyboard alternative ✅
- All emit answers to parent, support Ukrainian text ✅

**Tech Stack:** Angular 20, Angular CDK

---

### US-016: Implement Task Session and Feedback (Frontend)

**As a** student  
**I want** a focused learning session  
**So that** I can practice with immediate feedback

**Acceptance Criteria:**
- `TaskSessionComponent`: header (topic, progress, streak), dynamic task loader, submit/skip
- `AnswerFeedbackComponent`: correct (green, checkmark) / incorrect (red, explanation)
- XP earned animation display
- Auto-advance to next task after feedback
- Session progress tracking (X of Y tasks)

**Tech Stack:** Angular 20, Angular Animations

---

## 7. Gamification

### US-017: Implement XP and Level System

**As a** student  
**I want** to earn XP and level up  
**So that** I feel progress

**Acceptance Criteria:**
- StudentProfile: totalXp, currentLevel, currentStreak, longestStreak, streakFreezes, lastActiveDate
- `IGamificationService.AwardXp()`:
  - Base 10 XP × difficulty multiplier (1-3) × streak multiplier (1-2)
  - +50 XP first task of day, +100 XP perfect lesson
- Level thresholds: 1-10 (100ea), 11-25 (250ea), 26-50 (500ea), 51-100 (1000ea)
- Level-up detection with notifications

**Tech Stack:** .NET, EF Core

---

### US-018: Implement Streak System

**As a** student  
**I want** to maintain daily streaks  
**So that** I build learning habits

**Acceptance Criteria:**
- `IGamificationService.UpdateStreak()`: increment if yesterday, reset if >1 day (unless freeze)
- POST `/api/v1/gamification/streak/freeze` - purchase for 200 XP (max 2 held)
- POST `/api/v1/gamification/streak/repair` - restore within 24hrs for 400 XP
- Track longestStreak record

**Tech Stack:** ASP.NET Core

---

### US-019: Implement Achievements System

**As a** student  
**I want** to earn badges  
**So that** I'm rewarded for milestones

**Acceptance Criteria:**
- Achievement entity: code, name, description, iconUrl, xpReward, isHidden
- StudentAchievement entity: studentId, achievementId, unlockedAt
- `IAchievementService.CheckAndUnlock()`: detect milestones (first_task, streak_7/30/100, level_10/25/50)
- GET `/api/v1/gamification/stats` - XP, level, streak, freezes, league
- GET `/api/v1/gamification/achievements` - earned and locked badges
- Seed achievement definitions

**Tech Stack:** EF Core

---

## 8. Leaderboard

### US-020: Implement Leaderboard System

**As a** student  
**I want** to see weekly rankings  
**So that** I'm motivated by competition

**Acceptance Criteria:**
- LeaderboardEntry entity: studentId, league (Bronze→Diamond), weekNumber, year, weeklyXp, rank
- Valkey sorted set: `leaderboard:{league}:{year}:{week}` for real-time updates
- GET `/api/v1/leaderboard` - top 30 + current user position
- `LeaderboardHub` (SignalR): JoinLeague, LeaderboardUpdated, RankChanged events
- Background job: weekly promotion (top 10) / demotion (bottom 5)
- Archive to PostgreSQL on week end

**Tech Stack:** Valkey, SignalR, Background Service

---

## 9. Teacher Features

### US-021: Implement Class Management

**As a** teacher  
**I want** to create and manage classes  
**So that** I can organize my students

**Acceptance Criteria:**
- Class entity: teacherId, name, joinCode (unique 6-char), gradeLevel
- ClassMembership entity: classId, studentId, joinedAt
- POST `/api/v1/classes` - create with auto-generated joinCode
- GET `/api/v1/classes` - teacher's class list
- POST `/api/v1/classes/join` - student joins by code
- GET `/api/v1/classes/{id}/students` - roster with stats

**Tech Stack:** EF Core, ASP.NET Core

---

### US-022: Implement Assignments and Class Analytics

**As a** teacher  
**I want** to assign tasks and view analytics  
**So that** I can track student progress

**Acceptance Criteria:**
- ClassAssignment entity: classId, topicId, title, dueDate, taskCount, difficulty range
- POST `/api/v1/classes/{id}/assignments` - create assignment
- GET `/api/v1/assignments` - student's assignments with status
- GET `/api/v1/classes/{id}/analytics` - average accuracy, top performers, struggling students
- GET `/api/v1/classes/{id}/students/{studentId}` - individual performance detail

**Tech Stack:** ASP.NET Core

---

## 10. Admin Features

### US-023: Implement User Management (Admin)

**As an** admin  
**I want** to manage users  
**So that** I can administer the platform

**Acceptance Criteria:**
- AdminAccess policy (role = Admin)
- GET `/api/v1/admin/users` - paginated list with search, filters
- PUT `/api/v1/admin/users/{id}/role` - change role (creates profile if needed)
- GET `/api/v1/admin/analytics/dashboard` - KPIs: users, active, tasks, accuracy, pending reviews

**Tech Stack:** ASP.NET Core

---

### US-024: Implement AI Review Queue (Admin)

**As an** admin  
**I want** to review AI-generated tasks  
**So that** I maintain content quality

**Acceptance Criteria:**
- GET `/api/v1/admin/ai/review-queue` - pending templates with preview
- POST `/api/v1/admin/ai/review-queue/{id}/approve` - set isApproved, trigger pool refill
- POST `/api/v1/admin/ai/review-queue/{id}/reject` - soft delete with reason logging
- Pagination support

**Tech Stack:** ASP.NET Core, MongoDB

---

### US-025: Implement Content CRUD (Admin)

**As an** admin  
**I want** to manage subjects, topics, and achievements  
**So that** I can configure learning content

**Acceptance Criteria:**
- Subject CRUD: POST/PUT/DELETE `/api/v1/admin/subjects`
- Topic CRUD: POST/PUT/DELETE `/api/v1/admin/topics`
- Achievement CRUD: POST/PUT/DELETE `/api/v1/admin/achievements`
- Soft delete support, validation

**Tech Stack:** ASP.NET Core

---

## 11. Frontend Core

### US-026: Initialize Angular Project with Auth Services

**As a** developer  
**I want** Angular foundation with authentication  
**So that** I can build the frontend

**Acceptance Criteria:**
- Angular 20 project: core/, shared/, features/, layout/ structure
- Angular Material + Tailwind CSS configured
- `AuthService`: login, register, googleLogin, logout, refreshToken signals
- Auth HTTP interceptor (Bearer token, 401 handling, token refresh)
- Route guards: authGuard, roleGuard, publicOnlyGuard
- Environment configs for dev/staging/prod

**Tech Stack:** Angular 20, Angular Material, Tailwind

---

### US-027: Implement App Shell and Navigation

**As a** user  
**I want** consistent navigation  
**So that** I can move around the app

**Acceptance Criteria:**
- `LayoutComponent` with header + content area
- Mobile: bottom nav (Home, Learn, Leaderboard, Profile)
- Desktop: left sidenav
- Header: logo, streak counter, XP mini-bar, notification bell, avatar menu
- Role-based nav items (Teacher: Classes, Admin: Admin)

**Tech Stack:** Angular Material

---

### US-028: Implement Auth Pages (Frontend)

**As a** user  
**I want** login and registration pages  
**So that** I can access my account

**Acceptance Criteria:**
- `/auth/login`: email, password, forgot link, Google button, validation
- `/auth/register`: email, password, confirm, displayName, GDPR checkbox, Google button
- `/auth/select-role`: Student/Teacher cards (shown after registration)
- Loading states, error handling
- Redirect to dashboard after auth

**Tech Stack:** Angular Reactive Forms

---

### US-029: Implement Student Dashboard - IMPLEMENTED

**As a** student  
**I want** a dashboard showing my progress  
**So that** I know where I stand

**Acceptance Criteria:**
- Route: `/dashboard` ✅
- Streak widget with flame animation ✅
- XP bar with level indicator ✅
- "Continue Learning" topic cards ✅
- First-task-of-day bonus indicator ✅
- Leaderboard preview (top 5 + my rank) ✅
- Empty state with "Start Learning" CTA ✅

**Tech Stack:** Angular

---

### US-030: Implement Learning Browse Pages - IMPLEMENTED

**As a** student  
**I want** to browse subjects and topics  
**So that** I can start learning

**Acceptance Criteria:**
- `/learn`: subject grid with icons, progress bars, search ✅
- `/learn/subjects/{id}`: hierarchical topic tree (mat-tree), mastery indicators ✅
- Loading skeletons ✅
- Click to start learning session ✅
- Breadcrumb navigation ✅

**Tech Stack:** Angular, mat-tree

---

### US-031: Implement Leaderboard Page

**As a** student  
**I want** to view rankings  
**So that** I compete with others

**Acceptance Criteria:**
- Route: `/leaderboard`
- League tabs (Bronze→Diamond)
- Ranked list: position, avatar, name, weekly XP
- Current user highlighted
- Promotion/demotion zone indicators
- Real-time updates via SignalR

**Tech Stack:** Angular, SignalR

---

### US-032: Implement Profile Page - IMPLEMENTED

**As a** user  
**I want** to manage my profile  
**So that** I control my account

**Acceptance Criteria:**
- Route: `/profile` ✅
- Display: avatar, name, email, role, stats ✅
- Edit mode/dialog for updates ✅
- Avatar upload with preview ✅
- Settings: notification toggle, language (disabled MVP) ✅
- "Export Data" and "Delete Account" buttons ✅

**Tech Stack:** Angular

---

### US-033: Implement Gamification UI Components

**As a** student  
**I want** visual gamification elements  
**So that** I'm engaged

**Acceptance Criteria:**
- `XpBarComponent`: progress bar, level badge, animate on XP gain
- `StreakCounterComponent`: flame icon, count, pulse animation
- `BadgeDisplayComponent`: achievement icon grid
- Achievement gallery page with earned/locked sections

**Tech Stack:** Angular, Angular Animations

---

## 12. Teacher & Admin Frontend

### US-034: Implement Teacher Dashboard and Class Pages

**As a** teacher  
**I want** to manage my classes  
**So that** I can monitor students

**Acceptance Criteria:**
- `/teacher`: class cards, "Create Class" FAB, quick stats
- `/teacher/classes/{id}`: join code (copy), student roster, analytics tab
- Create assignment dialog
- Student detail view with performance breakdown

**Tech Stack:** Angular

---

### US-035: Implement Admin Dashboard and Review Pages

**As an** admin  
**I want** admin interface  
**So that** I can manage the platform

**Acceptance Criteria:**
- `/admin`: KPI cards, quick links, activity feed
- `/admin/ai-review`: pending templates list, preview panel, approve/reject buttons
- Bulk selection actions
- User management list (search, role change)

**Tech Stack:** Angular

---

## 13. PWA & Real-Time

### US-036: Configure PWA with Offline Support

**As a** user  
**I want** the app installable and offline-capable  
**So that** I can learn anywhere

**Acceptance Criteria:**
- `manifest.webmanifest`: name, icons (72-512px), theme colors, standalone
- `ngsw-config.json` caching:
  - App shell: precache
  - Assets: CacheFirst (30 days)
  - /subjects, /topics: StaleWhileRevalidate
  - /tasks: NetworkFirst
  - /leaderboard: NetworkOnly
- Offline fallback page
- Update available snackbar

**Tech Stack:** Angular Service Worker

---

### US-037: Implement i18n Foundation - IMPLEMENTED

**As a** user  
**I want** Ukrainian interface  
**So that** I can learn in my language

**Acceptance Criteria:**
- ngx-translate configured ✅
- `assets/i18n/uk.json` with all UI strings (default) ✅
- `assets/i18n/en.json` placeholder ✅
- translate pipe globally available ✅
- Language persisted in localStorage ✅

**Tech Stack:** ngx-translate

---

### US-038: Implement Real-Time Notifications (Backend)

**As a** developer  
**I want** SignalR hubs  
**So that** users get real-time updates

**Acceptance Criteria:**
- SignalR configured with JWT auth, CORS
- `LeaderboardHub`: JoinLeague, LeaderboardUpdated, RankChanged
- `NotificationHub`: AchievementUnlocked, StreakReminder, LevelUp
- Server-side: SendToUser, SendToLeagueGroup methods

**Tech Stack:** SignalR

---

### US-039: Implement Real-Time Notifications (Frontend) - IMPLEMENTED

**As a** student  
**I want** instant feedback  
**So that** I'm engaged and rewarded

**Acceptance Criteria:**
- `SignalRService`: connection management, reconnect with backoff ✅
- Connect on login, disconnect on logout ✅
- Achievement toast: badge icon, name, XP, auto-dismiss, click to navigate ✅
- Level-up celebration: full-screen overlay, confetti, "Continue" button ✅
- Observable streams for all event types ✅

**Tech Stack:** @microsoft/signalr, canvas-confetti

---

## 14. Testing

### US-040: Setup Testing Infrastructure - IMPLEMENTED

**As a** developer  
**I want** test projects configured  
**So that** I can ensure quality

**Acceptance Criteria:**
- `Stride.Services.Tests`: xUnit, Moq, FluentAssertions, coverage reporting ✅
- `Stride.Api.IntegrationTests`: WebApplicationFactory, Testcontainers (PG, Mongo, Valkey) ✅
- Sample tests: DifficultyEngine unit tests, auth flow integration test ✅
- Angular: Jest configured (replacing Karma), test utilities ✅
- Sample test: AuthService ✅

**Tech Stack:** xUnit, Testcontainers, Jest

---

## Story Summary

| Domain | Stories | IDs |
|--------|---------|-----|
| Infrastructure | 3 | US-001 to US-003 |
| Authentication | 3 | US-004 to US-006 |
| User Management | 1 | US-007 |
| Learning Content | 2 | US-008 to US-009 |
| Adaptive AI | 4 | US-010 to US-013 |
| Task System | 3 | US-014 to US-016 |
| Gamification | 3 | US-017 to US-019 |
| Leaderboard | 1 | US-020 |
| Teacher Features | 2 | US-021 to US-022 |
| Admin Features | 3 | US-023 to US-025 |
| Frontend Core | 8 | US-026 to US-033 |
| Teacher/Admin Frontend | 2 | US-034 to US-035 |
| PWA & Real-Time | 4 | US-036 to US-039 |
| Testing | 1 | US-040 |
| **Total** | **40** | |

---

## Implementation Sprints

### Sprint 1 — Foundation (Week 1-2)
US-001, US-002, US-003, US-004, US-005, US-006, US-007 - DONE

### Sprint 2 — Core Learning & AI (Week 3-4)
US-008, US-009, US-010, US-011, US-012, US-013, US-014 - DONE

### Sprint 3 — Gamification & Leaderboard (Week 5)
US-017, US-018, US-019, US-020 - Done

### Sprint 4 — Frontend Core (Week 6-7)
US-026, US-027, US-028, US-029, US-030, US-015, US-016 - Done

### Sprint 5 — Social Features (Week 8)
US-031, US-032, US-033, US-021, US-022 - Done

### Sprint 6 — Admin & Polish (Week 9-10)
US-023, US-024, US-025, US-034, US-035, US-036, US-037, US-038, US-039, US-040 - Done

---

> **Document Owner:** Product Team  
> **Last Updated:** February 11, 2026
