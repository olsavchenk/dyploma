import { Routes } from '@angular/router';
import { roleGuard } from '@app/core/guards';

export const teacherRoutes: Routes = [
  {
    path: '',
    canActivate: [roleGuard(['Teacher', 'Admin'])],
    children: [
      {
        path: 'classes',
        loadComponent: () => import('./classes/classes.component').then((m) => m.ClassesComponent),
      },
      {
        path: 'classes/:id',
        loadComponent: () => import('./class-detail/class-detail.component').then((m) => m.ClassDetailComponent),
      },
      {
        path: 'classes/:classId/students/:studentId',
        loadComponent: () => import('./student-detail/student-detail.component').then((m) => m.StudentDetailComponent),
      },
      {
        path: 'topics/:topicId/tasks',
        loadComponent: () => import('./task-review/task-review.component').then((m) => m.TaskReviewComponent),
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./dashboard/teacher-dashboard.component').then((m) => m.TeacherDashboardComponent),
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
    ],
  },
];
