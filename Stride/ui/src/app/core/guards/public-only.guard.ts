import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

/**
 * Public only guard to redirect authenticated users away from public pages
 * Useful for login/register pages that shouldn't be accessible when logged in.
 *
 * M-2: With H-5 (token-in-memory) the access token may be null right after a hard
 * refresh while /auth/refresh is still in flight. Fall back to the cached user
 * so an already-logged-in user landing on /auth/login is bounced to their
 * dashboard instead of seeing the empty form.
 */
export const publicOnlyGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const token = authService.getToken();
  const cachedUser = authService.getUser();
  if (!token && !cachedUser) {
    return true;
  }

  // User is authenticated (or session is being restored), redirect appropriately.
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
