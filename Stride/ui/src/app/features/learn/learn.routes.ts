import { Routes } from '@angular/router';

export const learnRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./learn-browse/learn-browse.component').then((m) => m.LearnBrowseComponent),
  },
  {
    path: 'subjects/:id',
    loadComponent: () => import('./subject-detail/subject-detail.component').then((m) => m.SubjectDetailComponent),
  },
  {
    path: 'session/:topicId',
    loadComponent: () => import('../task-session/task-session.component').then((m) => m.TaskSessionComponent),
  },
  {
    path: 'session/:topicId/summary',
    loadComponent: () => import('./task-session/session-summary.component').then((m) => m.SessionSummaryComponent),
  },
  // /learn/join was a standalone duplicate of the inline join form in
  // learn-browse and rendered without the standard layout context, which made
  // the sidenav surface the wrong role-based menu (M-7). The join flow now
  // lives exclusively inside learn-browse via openJoinDialog().
  {
    path: 'join',
    redirectTo: '',
    pathMatch: 'full',
  },
];
