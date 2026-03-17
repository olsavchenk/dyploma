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
    ],
  },
];
