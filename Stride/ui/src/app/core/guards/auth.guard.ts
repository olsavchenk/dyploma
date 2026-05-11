import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { catchError, map, of } from 'rxjs';
import { AuthService } from '../services/auth.service';

/**
 * Auth guard to protect routes that require authentication.
 * Redirects to login page (with returnUrl) if user is not authenticated.
 *
 * H-5: After moving the access token to in-memory only, a hard refresh leaves
 * `getToken()` null until the cold-start refresh resolves. If we have a cached
 * user we attempt /auth/refresh inline so deep links survive page reload.
 */
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const token = authService.getToken();
  if (token && !isTokenExpired(token)) {
    return true;
  }

  // Token missing/expired but we still have a cached user => try silent refresh.
  if (authService.getUser()) {
    return authService.refreshToken().pipe(
      map(() => true),
      catchError(() =>
        of(
          router.createUrlTree(['/auth/login'], {
            queryParams: { returnUrl: state.url },
          }),
        ),
      ),
    );
  }

  return router.createUrlTree(['/auth/login'], {
    queryParams: { returnUrl: state.url },
  });
};

/**
 * Check if JWT token is expired
 */
function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp;
    if (!exp) {
      return false; // No expiry claim, assume valid
    }
    // Add 30 second buffer to account for network latency
    return Date.now() >= (exp * 1000) - 30000;
  } catch {
    return true; // Invalid token format, treat as expired
  }
}
