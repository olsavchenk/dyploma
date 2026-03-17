# Testing Infrastructure - US-040

This document describes the testing infrastructure setup for the Stride project.

## Backend Testing

### Unit Tests

#### Stride.Services.Tests
- **Framework**: xUnit
- **Mocking**: Moq
- **Assertions**: FluentAssertions
- **Coverage**: coverlet.collector

**Example**: `MLDifficultyEngineTests.cs`
- Tests the adaptive difficulty engine with comprehensive scenarios
- Covers winning streaks, losing streaks, time decay, flow zone accuracy
- Tests edge cases and combined effects

**Running Tests**:
```powershell
# Run all tests in solution
dotnet test

# Run specific test project
dotnet test tests/Stride.Services.Tests

# Run with coverage
dotnet test /p:CollectCoverage=true
```

#### Stride.Adaptive.Tests
- Similar setup to Services.Tests
- Focuses on adaptive AI components

### Integration Tests

#### Stride.Api.Tests
- **Framework**: xUnit + ASP.NET Core Testing
- **Containers**: Testcontainers (PostgreSQL, MongoDB, Valkey)
- **Client**: WebApplicationFactory

**Features**:
- Automatically starts infrastructure containers
- Database migrations applied automatically
- Full HTTP request/response testing
- Tests run in isolation with clean state

**Example**: `AuthenticationIntegrationTests.cs`
- Full authentication flow testing
- Registration, login, role selection
- Token refresh and logout
- Account lockout scenarios

**Running Integration Tests**:
```powershell
# Docker must be running!
dotnet test tests/Stride.Api.Tests
```

**Note**: Integration tests require Docker Desktop running as they spin up containers.

## Frontend Testing

### Framework: Jest

**Replaced Karma with Jest** for faster test execution and better developer experience.

#### Configuration Files
- `jest.config.ts` - Main Jest configuration
- `setup-jest.ts` - Test setup and global mocks
- `tsconfig.spec.json` - TypeScript configuration for tests

#### Features
- **Preset**: jest-preset-angular
- **Coverage**: HTML, text, and LCOV reports
- **Path mapping**: Supports @ aliases (@app, @core, @shared, etc.)
- **Mocks**: localStorage, sessionStorage, window.matchMedia

#### Running Tests

```powershell
# Run all tests
npm test

# Run in watch mode
npm run test:watch

# Run with coverage report
npm run test:coverage
```

Coverage reports are generated in `coverage/` directory.

### Example Test: AuthService

**File**: `src/app/core/services/auth.service.spec.ts`

Tests cover:
- Service initialization and state restoration
- Login/register/logout flows
- Token refresh mechanism
- Computed signals (isAuthenticated, role checks)
- LocalStorage synchronization
- Error handling

**Test Structure**:
```typescript
describe('AuthService', () => {
  describe('Login', () => {
    it('should call login endpoint and handle success', () => {
      // Test implementation
    });
  });
});
```

## Test Organization

### Backend (.NET)
```
tests/
├── Stride.Api.Tests/              # Integration tests
│   ├── Integration/
│   │   └── AuthenticationIntegrationTests.cs
│   └── IntegrationTestWebApplicationFactory.cs
├── Stride.Services.Tests/         # Service unit tests
│   └── GamificationServiceTests.cs
└── Stride.Adaptive.Tests/         # Adaptive AI tests
    └── Services/
        └── MLDifficultyEngineTests.cs
```

### Frontend (Angular)
```
src/
└── app/
    └── core/
        └── services/
            ├── auth.service.ts
            └── auth.service.spec.ts
```

## Best Practices

### Backend
1. Use `IDisposable` pattern for test cleanup
2. Mock external dependencies (databases, APIs)
3. Use in-memory databases for fast unit tests
4. Use Testcontainers for integration tests
5. Follow Arrange-Act-Assert pattern
6. Use meaningful test names describing behavior

### Frontend
1. Mock HTTP calls with `HttpClientTestingModule`
2. Test user interactions, not implementation details
3. Use `flush()` to complete async operations
4. Test edge cases and error states
5. Verify side effects (localStorage, navigation)
6. Use descriptive test names

## Coverage Goals

- **Unit Tests**: Aim for >80% code coverage
- **Integration Tests**: Cover critical user flows
- **Focus**: Business logic, edge cases, error handling

## Continuous Integration

Tests run automatically on:
- Pull requests
- Commits to main branch
- Pre-deployment checks

Failed tests block deployment to prevent regressions.

## Troubleshooting

### Backend
- **Issue**: Tests fail with database errors
  - **Solution**: Ensure Docker is running for integration tests

- **Issue**: Flaky tests
  - **Solution**: Use `IAsyncLifetime` to control container lifecycle

### Frontend
- **Issue**: `Cannot find module` errors
  - **Solution**: Check path mappings in `jest.config.ts`

- **Issue**: Tests timeout
  - **Solution**: Increase timeout in test or check for unresolved observables

## Additional Resources

- [xUnit Documentation](https://xunit.net/)
- [Testcontainers .NET](https://dotnet.testcontainers.org/)
- [Jest Documentation](https://jestjs.io/)
- [jest-preset-angular](https://thymikee.github.io/jest-preset-angular/)
- [Playwright Documentation](https://playwright.dev/)
- [axe-core Accessibility Testing](https://github.com/dequelabs/axe-core)

---

## E2E Testing (Playwright)

### Overview

Full end-to-end tests for the Stride UI using Playwright. Tests cover all features, roles (Student, Teacher, Admin), task types, gamification, responsive viewports, accessibility, and i18n — with deterministic API mocks.

### Architecture

```
ui/e2e/
├── fixtures/
│   ├── test-data.ts          # All deterministic constants (users, tasks, responses)
│   ├── auth.fixture.ts       # Custom fixtures: studentPage, teacherPage, adminPage
│   └── api-mocks.ts          # Mock factory functions for every API endpoint
├── page-objects/
│   ├── auth/                  # LoginPage, RegisterPage, SelectRolePage, ForgotPasswordPage
│   ├── shared/                # LayoutPage, NotificationComponents
│   ├── teacher/               # TeacherClassesPage, ClassDetailPage, StudentDetailPage, etc.
│   ├── admin/                 # AdminDashboardPage, AiReviewPage, UsersPage, etc.
│   ├── dashboard.page.ts
│   ├── learn-browse.page.ts
│   ├── subject-detail.page.ts
│   ├── task-session.page.ts   # All 5 task types + feedback
│   ├── leaderboard.page.ts
│   └── profile.page.ts
└── tests/
    ├── auth/                  # login, register, select-role, forgot-password, guards
    ├── dashboard/             # student dashboard, empty state, responsive
    ├── learning/              # subject browse, subject detail
    ├── tasks/                 # multiple-choice, fill-blank, true-false, matching, ordering, session-flow
    ├── gamification/          # XP, streak, achievements, level-up
    ├── leaderboard/           # leaderboard display, responsive
    ├── profile/               # view, edit, export, delete, teacher view
    ├── teacher/               # classes, class detail, student detail, task review
    ├── admin/                 # dashboard, AI review, user management
    ├── navigation/            # routing, responsive nav, keyboard nav
    └── a11y/                  # WCAG 2.0 AA accessibility, i18n Ukrainian labels
```

### Setup

```powershell
cd ui

# Install dependencies (already included in package.json)
npm install

# Install browsers
npm run e2e:install
```

### Running Tests

```powershell
# Run all E2E tests (headless)
npm run e2e

# Run with browser visible
npm run e2e:headed

# Run with Playwright UI (interactive)
npm run e2e:ui

# Debug mode (step through)
npm run e2e:debug

# Run only Chrome desktop
npm run e2e:chrome

# View HTML report
npm run e2e:report
```

### Key Design Decisions

1. **Fully mocked API** — all tests use `page.route()` to intercept API calls via `api-mocks.ts`. No backend needed.
2. **Pre-authenticated fixtures** — `studentPage`, `teacherPage`, `adminPage` inject JWT into localStorage before navigation.
3. **Deterministic data** — every test references constants from `test-data.ts` ensuring reproducibility.
4. **Page Object Model** — all locator logic is encapsulated in POM classes.
5. **Ukrainian assertions** — all UI text assertions use Ukrainian (`uk`) since it's the app's default language.
6. **axe-core accessibility** — every major page is scanned for WCAG 2.0 AA critical/serious violations.

### Browser Projects

| Project | Browser | Viewport |
|---------|---------|----------|
| desktop-chrome | Chromium | 1280×720 |
| desktop-firefox | Firefox | 1280×720 |
| desktop-webkit | WebKit | 1280×720 |
| tablet-chrome | Chromium | 768×1024 |
| mobile-chrome | Chromium (Mobile) | 375×812 |
| mobile-safari | WebKit (Mobile) | 375×812 |

### Troubleshooting

- **Issue**: Tests fail with `net::ERR_CONNECTION_REFUSED`
  - **Solution**: All API calls should be mocked. Check if a new endpoint was added without a corresponding mock.

- **Issue**: Locator timeout
  - **Solution**: Verify the CSS selector or text in the POM matches the actual component template. Run `npm run e2e:debug` to step through.

- **Issue**: `browserType.launch` error
  - **Solution**: Run `npm run e2e:install` to install browser binaries.
