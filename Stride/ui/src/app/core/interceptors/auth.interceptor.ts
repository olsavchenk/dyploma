import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

let isRefreshing = false;

/**
 * HTTP interceptor for authentication
 * - Adds Bearer token to requests
 * - Handles 401 errors by refreshing token
 * - Prevents multiple simultaneous refresh attempts
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  // Skip adding token for auth endpoints
  const isAuthEndpoint =
    req.url.includes('/auth/login') ||
    req.url.includes('/auth/register') ||
    req.url.includes('/auth/google') ||
    req.url.includes('/auth/forgot-password') ||
    req.url.includes('/auth/reset-password');

  // Clone request and add Authorization header if token exists and not an auth endpoint
  let authReq = req;
  if (token && !isAuthEndpoint) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  // Handle the request
  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Handle 401 Unauthorized errors
      if (error.status === 401 && !isAuthEndpoint) {
        // Don't try to refresh if already refreshing
        if (isRefreshing) {
          return throwError(() => error);
        }

        // Don't try to refresh if this was the refresh endpoint itself
        if (req.url.includes('/auth/refresh')) {
          authService.logout().subscribe();
          return throwError(() => error);
        }

        isRefreshing = true;

        // Attempt to refresh the token
        return authService.refreshToken().pipe(
          switchMap((response) => {
            isRefreshing = false;
            // Retry the original request with the new token
            const retryReq = req.clone({
              setHeaders: {
                Authorization: `Bearer ${response.token}`,
              },
            });
            return next(retryReq);
          }),
          catchError((refreshError) => {
            isRefreshing = false;
            // If refresh fails, logout the user
            authService.logout().subscribe();
            return throwError(() => refreshError);
          }),
        );
      }

      // For other errors, just pass them through
      return throwError(() => error);
    }),
  );
};
