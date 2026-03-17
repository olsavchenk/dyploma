import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

/**
 * Auth guard to protect routes that require authentication
 * Redirects to login page if user is not authenticated or token is expired
 */
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Check directly from the service method to ensure we get the current token
  const token = authService.getToken();
  if (token && !isTokenExpired(token)) {
    return true;
  }

  // Redirect to login with return URL
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
