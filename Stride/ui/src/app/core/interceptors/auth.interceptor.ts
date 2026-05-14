import { HttpInterceptorFn, HttpErrorResponse, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, ReplaySubject, catchError, switchMap, take, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

/**
 * Module-level refresh coordinator.
 *
 * C-06: replaces the old `let isRefreshing = false` flag, which deadlocked when
 * three or more requests 401'd concurrently — queued callers would either give
 * up (returning the original 401 without ever retrying) or hang forever waiting
 * on a signal that already fired.
 *
 * Contract:
 *  - At most ONE refresh round-trip is in flight at any time across the whole app.
 *  - All callers that 401 while a refresh is in flight subscribe to `refreshQueue$`
 *    and receive the SAME outcome (new token, or null on failure).
 *  - On success, every queued caller retries its original request with the new token.
 *  - On failure, every queued caller propagates its ORIGINAL 401 (NOT the refresh
 *    error), and the user is bounced to /auth/login via AuthService.clearTokens().
 *  - The queue is replayed once for late subscribers (so a request that races
 *    into the interceptor a microtask after a refresh completes still gets the
 *    new token instead of starting a redundant refresh).
 */
let refreshQueue$: ReplaySubject<string | null> | null = null;

/**
 * HTTP interceptor for authentication
 * - Adds Bearer token to requests
 * - Handles 401 errors by refreshing token via a singleton refresh round-trip
 * - Guarantees concurrent 401s never trigger two refresh calls
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  // Skip adding token for auth endpoints (login/register/etc. — but NOT refresh:
  // refresh sends its own credentials via HttpOnly cookie, so omitting the Bearer
  // header is fine there too).
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
      // Only intercept 401s on non-auth endpoints. Auth endpoints (login etc.)
      // surface 401 directly to the caller — they have their own UX.
      if (error.status === 401 && !isAuthEndpoint) {
        // If the failing call WAS /auth/refresh itself, there is nothing more
        // we can do — clear local state and propagate the 401.
        if (req.url.includes('/auth/refresh')) {
          authService.clearTokens();
          return throwError(() => error);
        }

        return handle401WithRefresh(req, next, authService, error);
      }

      // M-9: 403 Forbidden — token may be valid but stale (revoked role, etc.).
      // Drop the in-memory token and bounce to /auth/login so the next request
      // doesn't keep re-sending a token the server has rejected.
      if (error.status === 403 && !isAuthEndpoint) {
        authService.clearTokens();
      }

      // For other errors, just pass them through
      return throwError(() => error);
    }),
  );
};

/**
 * Queue-based 401 handler. Either kicks off a refresh round-trip (if none is in
 * flight) or attaches to the existing one and waits for its result.
 *
 * @param originalError The 401 that triggered the refresh. If the refresh fails,
 *  this is the error propagated to the caller — NOT the refresh's own error —
 *  because callers should react to "your call was unauthorized", not to "the
 *  refresh round-trip 500'd".
 */
function handle401WithRefresh(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
  authService: AuthService,
  originalError: HttpErrorResponse,
): Observable<any> {
  // FAST PATH: a refresh is already in flight (or recently completed). Subscribe
  // to the shared subject, take the single emission, and retry-or-fail off of it.
  if (refreshQueue$) {
    return refreshQueue$.pipe(
      // Wait for the single emission from this refresh cycle. ReplaySubject(1)
      // means late subscribers immediately get the cached value — no deadlock.
      take(1),
      switchMap((newToken) => {
        if (!newToken) {
          // Refresh already failed — propagate the ORIGINAL 401 (per spec).
          return throwError(() => originalError);
        }
        return next(retryWithToken(req, newToken));
      }),
    );
  }

  // SLOW PATH: we are the first caller into this refresh cycle. Allocate the
  // subject, kick off the refresh, and broadcast the result. We intentionally
  // assign `refreshQueue$` BEFORE calling `refreshToken()` so any synchronous
  // re-entrant 401 (e.g. from a parallel switchMap) joins the queue rather than
  // starting a second refresh.
  const queue = new ReplaySubject<string | null>(1);
  refreshQueue$ = queue;

  authService.refreshToken().subscribe({
    next: (response) => {
      queue.next(response.accessToken);
      queue.complete();
      // Clear the slot AFTER emission so any late take(1) still resolves from
      // the replay buffer. Next 401 starts a fresh cycle.
      refreshQueue$ = null;
    },
    error: () => {
      // Tell all queued callers the refresh failed; they will propagate their
      // own original 401. AuthService.refreshToken() already calls clearAuthData
      // on error, which navigates to /auth/login.
      queue.next(null);
      queue.complete();
      refreshQueue$ = null;
    },
  });

  return queue.pipe(
    // Filter out the `null` failure marker BEFORE take(1)? No — we still need
    // to react to null. So take(1) and branch.
    take(1),
    switchMap((newToken) => {
      if (!newToken) {
        return throwError(() => originalError);
      }
      return next(retryWithToken(req, newToken));
    }),
    catchError((err) => throwError(() => err)),
  );
}

function retryWithToken(req: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  return req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
    },
  });
}

// Exported only for tests / dev tools — production code should not touch this.
export const __authInterceptorInternals = {
  /** Reset the module-scoped refresh queue. Test-only. */
  resetQueueForTests(): void {
    refreshQueue$ = null;
  },
  /** Peek whether a refresh is currently in flight. Test-only. */
  isRefreshingForTests(): boolean {
    return refreshQueue$ !== null;
  },
};
