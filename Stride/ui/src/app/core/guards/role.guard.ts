import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../services/auth.service';

/**
 * Role guard factory to protect routes based on user roles.
 *
 * Behaviour (bug fix H-10):
 *  - If the user is NOT authenticated: redirect to /auth/login with returnUrl.
 *    (Note: in app.routes.ts the order MUST be `[authGuard, roleGuard(...)]`
 *     so authGuard handles unauthenticated access first; this branch is a
 *     defensive fallback in case roleGuard is used standalone on a child route.)
 *  - If the user IS authenticated but the role does NOT match: redirect to
 *    /forbidden (a clearer 403 UX) and show a Ukrainian snackbar.
 *
 * @param allowedRoles Array of roles that can access the route
 */
export const roleGuard = (allowedRoles: string[]): CanActivateFn => {
  return (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);
    const snackBar = inject(MatSnackBar);

    // 1) Unauthenticated -> login (with returnUrl).
    const token = authService.getToken();
    if (!token) {
      return router.createUrlTree(['/auth/login'], {
        queryParams: { returnUrl: state.url },
      });
    }

    // 2) Authenticated and role matches -> allow.
    if (authService.hasAnyRole(allowedRoles)) {
      return true;
    }

    // 3) Authenticated but wrong role -> 403 page + snackbar.
    //    We deliberately do NOT bounce to /dashboard silently because that
    //    masked the real failure (H-10). /forbidden makes the denial explicit.
    snackBar.open('Немає доступу', 'OK', {
      duration: 4000,
      panelClass: ['snackbar-error'],
    });

    return router.createUrlTree(['/forbidden']);
  };
};

/**
 * Convenience guards for specific roles.
 * IMPORTANT: when using these in route definitions, always pair them with
 * authGuard FIRST in the canActivate array, e.g.:
 *   canActivate: [authGuard, adminGuard]
 */
export const studentGuard: CanActivateFn = roleGuard(['Student']);
export const teacherGuard: CanActivateFn = roleGuard(['Teacher']);
export const adminGuard: CanActivateFn = roleGuard(['Admin']);
export const studentOrTeacherGuard: CanActivateFn = roleGuard(['Student', 'Teacher']);
