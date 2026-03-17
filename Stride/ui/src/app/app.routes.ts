import { Routes } from '@angular/router';
import { LayoutComponent } from '@app/layout';
import { authGuard, publicOnlyGuard } from '@app/core/guards';

export const routes: Routes = [
  // Public routes (redirect to dashboard if already authenticated)
  {
    path: 'auth',
    canActivate: [publicOnlyGuard],
    loadChildren: () => import('./features/auth/auth.routes').then((m) => m.authRoutes),
  },

  // Protected routes (require authentication)
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: 'learn',
        loadChildren: () => import('./features/learn/learn.routes').then((m) => m.learnRoutes),
      },
      {
        path: 'leaderboard',
        loadComponent: () =>
          import('./features/leaderboard/leaderboard.component').then(
            (m) => m.LeaderboardComponent
          ),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./features/profile/profile.component').then((m) => m.ProfileComponent),
      },
      {
        path: 'teacher',
        loadChildren: () =>
          import('./features/teacher/teacher.routes').then((m) => m.teacherRoutes),
      },
      {
        path: 'admin',
        loadChildren: () => import('./features/admin/admin.routes').then((m) => m.adminRoutes),
      },
    ],
  },

  // Fallback route
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];
