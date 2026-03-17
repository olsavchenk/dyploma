# Stride UI - Angular 20 Frontend

Modern, responsive frontend for the Stride adaptive learning platform built with Angular 20, Angular Material, and Tailwind CSS.

## Tech Stack

- **Framework:** Angular 20 (Zoneless)
- **UI Libraries:** Angular Material, Tailwind CSS
- **State Management:** Angular Signals
- **HTTP:** Angular HttpClient with Interceptors
- **Routing:** Angular Router with Guards
- **Build:** Angular CLI

## Project Structure

```
src/
├── app/
│   ├── core/               # Core services, guards, interceptors
│   │   ├── guards/         # Route guards (auth, role, publicOnly)
│   │   ├── interceptors/   # HTTP interceptors (auth)
│   │   ├── models/         # Data models and DTOs
│   │   └── services/       # Core services (AuthService)
│   ├── shared/             # Shared components, directives, pipes
│   ├── features/           # Feature modules (lazy-loaded)
│   │   ├── auth/          # Authentication pages
│   │   ├── dashboard/     # Student dashboard
│   │   ├── learn/         # Learning content
│   │   ├── leaderboard/   # Rankings
│   │   ├── profile/       # User profile
│   │   ├── teacher/       # Teacher features
│   │   └── admin/         # Admin panel
│   ├── layout/            # Layout components (header, sidenav)
│   ├── app.config.ts      # Application configuration
│   ├── app.routes.ts      # Route definitions
│   └── app.ts             # Root component
├── environments/          # Environment configurations
├── styles.scss            # Global styles
└── index.html             # Entry HTML

```

## Features (US-026, US-036, US-037)

### ✅ Progressive Web App (PWA) - US-036
- **Service Worker** with smart caching strategies
- **Offline Support** with branded fallback page
- **Installable** - Can be installed on devices
- **Auto-Updates** - Update notifications via snackbar
- **App Manifest** with icons (72px - 512px)
- See [PWA_IMPLEMENTATION.md](PWA_IMPLEMENTATION.md) for details

### ✅ Internationalization (i18n) - US-037
- **ngx-translate** v17 configured
- **Default Language:** Ukrainian (uk)
- **Supported Languages:** Ukrainian, English
- **Translation Files:** `public/assets/i18n/{lang}.json`
- **LocalStorage Persistence** - Language preference saved
- **TranslationService** with Signal-based reactive state
- **LanguageSwitcherComponent** - Ready-to-use UI component

### ✅ Angular 20 with Zoneless Change Detection
- Modern standalone components
- Signal-based reactivity
- Improved performance

### ✅ Authentication System
- **AuthService** with Angular Signals:
  - `login()`, `register()`, `googleLogin()`
  - `logout()`, `refreshToken()`, `selectRole()`
  - Reactive signals: `user`, `token`, `isAuthenticated`, `userRole`
  - Auto-persists to localStorage
  
- **Auth Interceptor**:
  - Automatically adds Bearer token to requests
  - Handles 401 errors with token refresh
  - Prevents multiple simultaneous refresh attempts
  
- **Route Guards**:
  - `authGuard` - Protects authenticated routes
  - `roleGuard` - Role-based access control
  - `publicOnlyGuard` - Redirects authenticated users

### ✅ UI Frameworks
- **Angular Material** - Material Design components
- **Tailwind CSS** - Utility-first styling

### ✅ Environment Configuration
- `environment.ts` - Development (localhost)
- `environment.staging.ts` - Staging environment
- `environment.production.ts` - Production environment

## Getting Started

### Prerequisites
- Node.js 20+
- npm 10+

### Installation

```bash
cd ui
npm install
```

### Development Server

```bash
npm start
# or
ng serve
```

Navigate to `http://localhost:4200`

### Build

```bash
# Development build
npm run build

# Production build (with PWA)
npm run build:prod

# Test PWA locally
.\test-pwa.ps1
# or manually:
# npx http-server -p 8080 -c-1 dist/ui/browser
```

### Running Tests

```bash
# Unit tests
npm test

# E2E tests
npm run e2e
```

## Authentication Usage

### In Components

```typescript
import { Component, inject } from '@angular/core';
import { AuthService } from '@app/core';

@Component({
  selector: 'app-example',
  template: `
    @if (authService.isAuthenticated()) {
      <p>Welcome {{ authService.user()?.displayName }}!</p>
    }
  `
})
export class ExampleComponent {
  authService = inject(AuthService);
}
```

### In Routes

```typescript
import { Routes } from '@angular/router';
import { authGuard, roleGuard, publicOnlyGuard } from '@app/core';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./login.component'),
    canActivate: [publicOnlyGuard]
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard.component'),
    canActivate: [authGuard]
  },
  {
    path: 'admin',
    loadComponent: () => import('./admin.component'),
    canActivate: [roleGuard(['Admin'])]
  }
];
```

## Internationalization (i18n) Usage

### In Templates (Recommended)

Use the `translate` pipe for displaying translated text:

```typescript
import { Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-example',
  imports: [TranslateModule],
  template: `
    <!-- Simple translation -->
    <h1>{{ 'common.appName' | translate }}</h1>
    
    <!-- Translation with parameters -->
    <p>{{ 'dashboard.welcome' | translate: {name: userName} }}</p>
    
    <!-- Nested translations -->
    <button>{{ 'auth.signIn' | translate }}</button>
  `
})
export class ExampleComponent {
  userName = 'John';
}
```

### In Component Code

For programmatic translations:

```typescript
import { Component, inject } from '@angular/core';
import { TranslationService } from '@app/core';

@Component({
  selector: 'app-example',
  template: `...`
})
export class ExampleComponent {
  private translationService = inject(TranslationService);
  
  ngOnInit() {
    // Get current language (reactive signal)
    const currentLang = this.translationService.currentLanguage();
    console.log('Current language:', currentLang); // 'uk' or 'en'
    
    // Get instant translation
    const translated = this.translationService.instant('common.loading');
    console.log(translated); // 'Завантаження...' or 'Loading...'
    
    // With parameters
    const welcome = this.translationService.instant('dashboard.welcome', { name: 'Alice' });
    console.log(welcome); // 'Вітаємо, Alice!'
  }
  
  changeLanguage() {
    // Switch language (persists to localStorage)
    this.translationService.setLanguage('en');
  }
}
```

### Language Switcher Component

Use the pre-built language switcher in settings or profile pages:

```typescript
import { Component } from '@angular/core';
import { LanguageSwitcherComponent } from '@app/shared';

@Component({
  selector: 'app-settings',
  imports: [LanguageSwitcherComponent],
  template: `
    <div class="settings">
      <h2>Settings</h2>
      <app-language-switcher />
    </div>
  `
})
export class SettingsComponent {}
```

### Adding New Translations

1. Edit `public/assets/i18n/uk.json` for Ukrainian:
```json
{
  "myFeature": {
    "title": "Назва функції",
    "description": "Опис з {{parameter}}"
  }
}
```

2. Edit `public/assets/i18n/en.json` for English:
```json
{
  "myFeature": {
    "title": "Feature Title",
    "description": "Description with {{parameter}}"
  }
}
```

3. Use in template:
```html
<h1>{{ 'myFeature.title' | translate }}</h1>
<p>{{ 'myFeature.description' | translate: {parameter: 'value'} }}</p>
```

### Translation Key Structure

Translations are organized by domain:
- `common.*` - Common UI elements (buttons, loading, errors)
- `auth.*` - Authentication pages
- `navigation.*` - Navigation menu items
- `dashboard.*` - Dashboard page
- `learning.*` - Learning content
- `tasks.*` - Task system
- `gamification.*` - XP, levels, achievements
- `leaderboard.*` - Rankings
- `profile.*` - User profile
- `classes.*` - Teacher features
- `admin.*` - Admin panel
- `errors.*` - Error messages
- `notifications.*` - Notification messages

## API Integration

The application connects to the Stride API:
- **Dev:** `http://localhost:5000/api/v1`
- **Staging:** `https://api-staging.stride.example.com/api/v1`
- **Prod:** `https://api.stride.example.com/api/v1`

## Code Style

- **Components:** PascalCase, suffix with `Component`
- **Services:** PascalCase, suffix with `Service`
- **Variables:** camelCase
- **Constants:** UPPER_SNAKE_CASE
- **File names:** kebab-case

## Angular Signals Best Practices

```typescript
// Read-only signals
readonly user = this.authService.user;

// Computed signals
readonly isAdmin = computed(() => this.user()?.role === 'Admin');

// Effect for side effects
constructor() {
  effect(() => {
    console.log('User changed:', this.user());
  });
}
```

## Next Steps

1. Implement authentication pages (US-028)
2. Create app shell and navigation (US-027)
3. PWA Implementation](PWA_IMPLEMENTATION.md)
- [User Stories](../USER_STORIES_MVP.md)
- [Tech Documentation](../TECH_DOCUMENTATION_v2.md)
- [API Documentation](../Stride/README.md)

---

**Implementation:** US-026, US-036, US-037  
**Status:** ✅ Complete  
**Sprint:** 4 (Frontend Core), 6 (PWA & Polish)
