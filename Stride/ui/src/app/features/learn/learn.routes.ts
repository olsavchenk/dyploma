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
  {
    path: 'join',
    loadComponent: () => import('./join-class/join-class.component').then((m) => m.JoinClassComponent),
  },
];
