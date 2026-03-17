import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

/**
 * Public only guard to redirect authenticated users away from public pages
 * Useful for login/register pages that shouldn't be accessible when logged in
 */
export const publicOnlyGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Check token directly
  const token = authService.getToken();
  if (!token) {
    return true;
  }

  // User is authenticated, redirect to appropriate dashboard
  const userRole = authService.userRole();
  if (userRole === 'Student') {
    return router.createUrlTree(['/dashboard']);
  } else if (userRole === 'Teacher') {
    return router.createUrlTree(['/teacher']);
  } else if (userRole === 'Admin') {
    return router.createUrlTree(['/admin']);
  }

  // Fallback to dashboard
  return router.createUrlTree(['/dashboard']);
};
