# Stride — Project Reference for Claude

## Project Overview

**Stride** is a Ukrainian-first gamified educational platform with AI-powered adaptive learning. It is an MVP-stage EdTech SaaS that dynamically generates educational tasks and calibrates difficulty based on individual student performance.

- **Target audience:** All ages (K-12, university, lifelong learning)
- **MVP subjects:** Mathematics, Ukrainian Language, History of Ukraine, English
- **Stage:** MVP / active development

> **IMPORTANT — Testing scope:** Unit tests are currently OUT OF SCOPE. Focus only on production logic when reviewing, fixing, or implementing user stories. The stub test files under `Stride/tests/Stride.Api.Tests/UnitTest1.cs` and `Stride/tests/Stride.Services.Tests/UnitTest1.cs` have been deleted intentionally. Do not re-create unit tests or expand test coverage during MVP logic review work.

---

## Repository Layout

```
D:/apps/dyploma/
├── Stride/                                  # Main application
│   ├── src/
│   │   ├── Stride.Api/                      # ASP.NET Core Web API (port 5000)
│   │   ├── Stride.Adaptive/                 # AI/ML adaptive learning engine (library)
│   │   ├── Stride.Adaptive.Api/             # Adaptive ML service API (port 5010)
│   │   ├── Stride.Core/                     # Domain entities & MongoDB documents
│   │   ├── Stride.DataAccess/               # EF Core (PostgreSQL) + MongoDB contexts
│   │   └── Stride.Services/                 # Business logic layer
│   ├── ui/                                  # Angular 20 frontend (port 4200)
│   │   └── src/app/
│   │       ├── core/                        # Guards, interceptors, auth service
│   │       ├── shared/                      # Reusable components
│   │       ├── features/                    # Lazy-loaded feature modules
│   │       │   ├── auth/                    # Login / Register
│   │       │   ├── dashboard/               # Student dashboard
│   │       │   ├── learn/                   # Learning content
│   │       │   ├── leaderboard/             # Rankings
│   │       │   ├── profile/                 # User profile
│   │       │   ├── teacher/                 # Teacher analytics & class management
│   │       │   └── admin/                   # Admin panel
│   │       └── layout/                      # Header, sidenav
│   ├── tests/                               # Test suites
│   ├── Stride.slnx                          # .NET solution file
│   ├── docker-compose.yml                   # Full-stack Docker
│   ├── docker-compose.infrastructure.yml    # Infrastructure-only Docker
│   ├── Dockerfile                           # Main API image
│   ├── Dockerfile.adaptive                  # Adaptive API image
│   ├── README.md
│   ├── TESTING_GUIDE.md
│   └── AI_TASK_GENERATION_FLOWS.md
├── TECH_DOCUMENTATION_v2.md                 # 81 KB architecture blueprint (24 sections)
├── UIUX_DESIGN_v1.md                        # Design system reference
├── USER_STORIES_MVP.md                      # Feature requirements
└── CLAUDE.md                                # This file
```

---

## Tech Stack

### Backend
| Layer | Technology |
|-------|-----------|
| Framework | .NET 10 / ASP.NET Core |
| ORM | EF Core 10 (PostgreSQL) |
| Document store driver | MongoDB.Driver 3.6 |
| Real-time | SignalR (hubs: `/hubs/notifications`, `/hubs/leaderboard`) |
| Logging | Serilog |
| Validation | FluentValidation |
| Testing | xUnit |

### Frontend
| Layer | Technology |
|-------|-----------|
| Framework | Angular 20 (zoneless, standalone components) |
| UI components | Angular Material 20 |
| Styling | Tailwind CSS 3.4 |
| Reactive | RxJS ~7.8 |
| Real-time | @microsoft/signalr ^10.0 |
| i18n | @ngx-translate (Ukrainian / English) |
| PWA | @angular/service-worker |
| Unit tests | Jest 29 + jest-preset-angular |
| E2E tests | Playwright 1.58 |

### Infrastructure
| Service | Purpose |
|---------|---------|
| PostgreSQL 17+ | Relational data (users, tasks, performance) |
| MongoDB 7+ | Document store (task templates, AI logs) |
| Valkey / Redis | Caching & gamification state |
| MinIO | Object storage (avatars, assets) |
| Meilisearch | Full-text search (subjects / topics) |
| Docker + Compose | Containerisation |
| NGINX | Reverse proxy |

### AI / ML
| Component | Details |
|-----------|---------|
| Primary LLM | Google Gemini API |
| Provider pattern | `AIProviderFactory` — extensible, swap providers without code changes |
| ML framework | ML.NET (optional difficulty prediction model) |
| Retraining | `ModelTrainer` service — scheduled weekly |

---

## Domain Model

### PostgreSQL Entities (`Stride.Core`)
- `User` — authentication & profile
- `StudentProfile`, `TeacherProfile` — role-specific data
- `Class`, `ClassMembership`, `ClassAssignment` — class management
- `Subject`, `Topic` — curriculum structure
- `TaskAttempt`, `StudentPerformance` — learning tracking
- `Achievement`, `StudentAchievement` — gamification
- `LeaderboardEntry` — rankings
- `LearningPath`, `LearningPathStep` — structured learning sequences

### MongoDB Documents (`Stride.Core`)
- `TaskTemplateDocument` — AI-generated reusable task templates
- `TaskInstanceDocument` — rendered task instances with answers
- `AIGenerationLogDocument` — AI provider metrics / audit log

---

## API Endpoints (Stride.Api Controllers)

| Controller | Responsibility |
|-----------|---------------|
| `AuthController` | Login, register, token refresh |
| `LearningController` | Get tasks, submit answers |
| `TaskGenerationController` | Trigger AI task generation |
| `GamificationController` | XP, streaks, badges |
| `LeaderboardController` | Ranking queries |
| `TeacherController` | Class & student analytics |
| `AdminController` | General admin operations |
| `AdminTopicsController` | Topic management |
| `AdminAchievementsController` | Achievement management |
| `HealthController` | Health checks |

### SignalR Hubs
- `NotificationHub` — real-time notifications pushed to clients
- `LeaderboardHub` — live leaderboard updates

---

## Services (Business Logic)

### Stride.Services
- `AuthService` — JWT tokens, role-based access
- `LearningService` — core learning operations
- `GamificationService` — XP, streaks, achievements
- `TaskPoolService` — task inventory management

### Stride.Adaptive / Stride.Adaptive.Api
- `AdaptiveAIService` — AI task generation & adaptation
- `StudentPerformanceService` — analytics & difficulty modelling
- `DifficultyEngine` — real-time difficulty prediction
- `ModelTrainer` — ML model retraining
- `AIProviderFactory` — extensible AI provider abstraction (Gemini)

---

## Frontend Architecture

- **State management:** Angular Signals (signal-based auth state, no NgRx)
- **Routing:** Lazy-loaded feature modules via `app.routes.ts`
- **Auth flow:** JWT stored in memory; refresh token in HttpOnly cookie
- **Guards:** `authGuard`, `roleGuard`, `publicOnlyGuard`
- **Interceptors:** Auth token injection, global error handling
- **i18n:** Ukrainian is default; English toggle via `@ngx-translate`
- **PWA:** `ngsw-config.json` defines caching strategies; installable

---

## Configuration & Environment

### Key environment variables (see `.env.example`)
```
ASPNETCORE_ENVIRONMENT=Development
ConnectionStrings__Postgres=...
ConnectionStrings__MongoDB=...
ConnectionStrings__Valkey=...
Storage__MinIO__...=...
Search__Meilisearch__...=...
AI__Gemini__ApiKey=...
```

### App settings files
- `appsettings.json` — defaults
- `appsettings.Development.json` — dev overrides (git-ignored)
- Angular environments: `dev`, `staging`, `prod` (configured in `angular.json`)

---

## Running the Project

### Full stack via Docker
```bash
cd Stride
docker-compose up -d
```

### Local API + infrastructure via Docker
```bash
cd Stride
docker-compose -f docker-compose.infrastructure.yml up -d
cd src/Stride.Api
dotnet ef database update --project ../Stride.DataAccess
dotnet run
```

### Frontend dev server
```bash
cd Stride/ui
npm install
npm start         # http://localhost:4200
```

### Ports
| Service | Port |
|---------|------|
| Main API | 5000 |
| Adaptive API | 5010 |
| Angular dev | 4200 |

---

## Architectural Patterns

- **Layered monolith:** Controller → Service → Repository
- **Repository pattern:** Abstracts EF Core and MongoDB data access
- **Factory pattern:** `AIProviderFactory` for swappable AI backends
- **Signal-based state:** Angular reactive state without NgRx
- **Middleware pipeline:** Exception handling, logging, CORS
- **Real-time:** SignalR for notifications and live leaderboards
- **PWA:** Service Worker for offline support and caching

---

## Key Documentation Files

| File | Contents |
|------|---------|
| `TECH_DOCUMENTATION_v2.md` | 24-section architecture blueprint: DB schema, API design, security, performance |
| `USER_STORIES_MVP.md` | Full feature requirements by role |
| `UIUX_DESIGN_v1.md` | Design system, color palette, component specs |
| `Stride/README.md` | Setup & Docker instructions |
| `Stride/TESTING_GUIDE.md` | Testing strategy and how to run tests |
| `Stride/AI_TASK_GENERATION_FLOWS.md` | AI task generation pipeline diagrams |

---

## Roles in the System

| Role | Capabilities |
|------|-------------|
| Student | Learn, submit answers, earn XP/badges, view leaderboard |
| Teacher | Manage classes, assign tasks, view student analytics |
| Admin | Manage subjects/topics/achievements, system oversight |
