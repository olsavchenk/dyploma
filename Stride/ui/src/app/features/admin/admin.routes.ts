import { Routes } from '@angular/router';
import { adminGuard } from '@app/core/guards';

export const adminRoutes: Routes = [
  {
    path: '',
    canActivate: [adminGuard],
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
