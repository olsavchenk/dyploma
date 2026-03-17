import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

/**
 * Role guard factory to protect routes based on user roles
 * @param allowedRoles Array of roles that can access the route
 * @returns CanActivateFn
 */
export const roleGuard = (allowedRoles: string[]): CanActivateFn => {
  return (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    // First check if user is authenticated by checking token directly
    const token = authService.getToken();
    if (!token) {
      return router.createUrlTree(['/auth/login'], {
        queryParams: { returnUrl: state.url },
      });
    }

    // Check if user has one of the allowed roles
    if (authService.hasAnyRole(allowedRoles)) {
      return true;
    }

    // User doesn't have required role, redirect to appropriate dashboard
    const userRole = authService.userRole();
    if (userRole === 'Student') {
      return router.createUrlTree(['/dashboard']);
    } else if (userRole === 'Teacher') {
      return router.createUrlTree(['/teacher']);
    } else if (userRole === 'Admin') {
      return router.createUrlTree(['/admin']);
    }

    // Fallback to login
    return router.createUrlTree(['/auth/login']);
  };
};

/**
 * Convenience guards for specific roles
 */
export const studentGuard: CanActivateFn = roleGuard(['Student']);
export const teacherGuard: CanActivateFn = roleGuard(['Teacher']);
export const adminGuard: CanActivateFn = roleGuard(['Admin']);
export const studentOrTeacherGuard: CanActivateFn = roleGuard(['Student', 'Teacher']);
