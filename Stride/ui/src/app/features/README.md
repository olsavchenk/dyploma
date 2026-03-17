# Features Module

This module contains feature-specific modules organized by domain.

## Structure

```
features/
├── auth/           # Authentication pages (login, register, etc.)
├── dashboard/      # Student dashboard
├── learn/          # Learning browse and session pages
├── leaderboard/    # Leaderboard and rankings
├── profile/        # User profile management
├── teacher/        # Teacher-specific features
├── admin/          # Admin panel
└── index.ts        # Feature routing exports
```

## Lazy Loading

Each feature should be lazy-loaded for optimal performance:

```typescript
{
  path: 'dashboard',
  loadChildren: () => import('./features/dashboard/dashboard.routes')
}
```
