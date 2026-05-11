import { Routes } from '@angular/router';
import { authGuard, adminGuard } from '@app/core/guards';

export const adminRoutes: Routes = [
  {
    path: '',
    // Bug fix H-10: authGuard MUST run before adminGuard so an unauthenticated
    // user is sent to /auth/login (not /forbidden) and an authenticated
    // non-admin gets the explicit 403 redirect from adminGuard.
    canActivate: [authGuard, adminGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./dashboard/admin-dashboard.component').then((m) => m.AdminDashboardComponent),
      },
      {
        path: 'ai-review',
        loadComponent: () => import('./ai-review/ai-review.component').then((m) => m.AiReviewComponent),
      },
      {
        path: 'users',
        loadComponent: () => import('./users/users.component').then((m) => m.UsersComponent),
      },
      {
        path: 'subjects',
        loadComponent: () => import('./subjects/admin-subjects.component').then((m) => m.AdminSubjectsComponent),
      },
      {
        path: 'topics',
        loadComponent: () => import('./topics/admin-topics.component').then((m) => m.AdminTopicsComponent),
      },
      {
        path: 'achievements',
        loadComponent: () => import('./achievements/admin-achievements.component').then((m) => m.AdminAchievementsComponent),
      },
    ],
  },
];
