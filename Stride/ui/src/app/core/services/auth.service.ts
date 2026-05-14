import { Injectable, inject, signal, computed, effect, Injector } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap, catchError, throwError, of } from 'rxjs';
import { environment } from '@environments/environment';
import {
  LoginRequest,
  RegisterRequest,
  GoogleLoginRequest,
  SelectRoleRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
} from '../models/auth-request.models';
import {
  AuthResponse,
  UserInfo,
  RefreshTokenResponse,
} from '../models/auth-response.models';
import { LoggingService } from './logging.service';

// C-01 / H-5: The access token lives in MEMORY ONLY (private signal, no localStorage,
// no sessionStorage). The HttpOnly refresh-token cookie + the cold-start /auth/refresh
// round-trip restore the session after a page reload. Only a non-credential UI hint
// payload (id, displayName, role, etc — never tokens) is cached so the layout can
// render before /auth/refresh resolves on cold start. The cache key is explicitly
// suffixed `_profile` so future readers don't mistake it for a credential store.
const USER_PROFILE_KEY = 'stride_user_profile';
// Legacy keys we proactively scrub on every boot — older builds wrote a JWT here.
const LEGACY_TOKEN_KEY = 'stride_access_token';
const LEGACY_USER_KEY = 'stride_user';

/**
 * Subset of UserInfo we are willing to cache to localStorage.
 *
 * Everything stored here MUST be non-credential UI metadata. Never add a token,
 * refresh token, password hash, OAuth secret, or any opaque server-only field.
 * If you find yourself wanting to add a field — ask whether the same value
 * could be supplied by /auth/refresh response instead.
 */
type CachedUserProfile = Pick<
  UserInfo,
  'id' | 'email' | 'displayName' | 'avatarUrl' | 'role' | 'isEmailVerified' | 'hasCompletedOnboarding' | 'createdAt'
>;

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly injector = inject(Injector);
  private readonly logger = inject(LoggingService);

  // Signals for reactive state management. Token is in-memory only.
  private readonly tokenSignal = signal<string | null>(null);
  private readonly userSignal = signal<UserInfo | null>(this.getStoredUser());
  private readonly loadingSignal = signal<boolean>(false);

  // Public readonly computed signals
  readonly token = this.tokenSignal.asReadonly();
  readonly user = this.userSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly isAuthenticated = computed(() => !!this.tokenSignal());
  readonly userRole = computed(() => this.userSignal()?.role ?? null);
  readonly isStudent = computed(() => this.userRole() === 'Student');
  readonly isTeacher = computed(() => this.userRole() === 'Teacher');
  readonly isAdmin = computed(() => this.userRole() === 'Admin');

  /**
   * Emits true once an access token has been hydrated via cold-start refresh
   * or set via login. Other services should gate authenticated HTTP calls on
   * this to avoid 401/403 races during app boot.
   */
  private readonly tokenReadySubject = new BehaviorSubject<boolean>(false);
  readonly tokenReady$ = this.tokenReadySubject.asObservable();

  constructor() {
    // C-01 / H-5: scrub legacy keys from localStorage left by older builds.
    // Some pre-fix builds wrote a raw JWT at LEGACY_TOKEN_KEY and the full user
    // payload at LEGACY_USER_KEY. We migrate the user payload into the renamed
    // _profile key (sanitized) and unconditionally delete the token key.
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.removeItem(LEGACY_TOKEN_KEY);
        const legacyUser = localStorage.getItem(LEGACY_USER_KEY);
        if (legacyUser && !localStorage.getItem(USER_PROFILE_KEY)) {
          // One-time migration: copy across whatever the old build wrote, but
          // pipe it through the sanitizer so any rogue token-shaped fields are
          // dropped before being re-written under the new key.
          try {
            const parsed = JSON.parse(legacyUser) as Partial<UserInfo>;
            const sanitized = this.sanitizeForCache(parsed);
            if (sanitized) {
              localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(sanitized));
            }
          } catch {
            /* malformed legacy payload — just drop it */
          }
        }
        localStorage.removeItem(LEGACY_USER_KEY);
      } catch {
        /* ignore quota / privacy errors */
      }
    }

    // Effect to keep tokenReady$ in sync with the in-memory token.
    effect(() => {
      const ready = !!this.tokenSignal();
      if (this.tokenReadySubject.value !== ready) {
        this.tokenReadySubject.next(ready);
      }
    });

    // Effect to sync the (non-credential) user profile cache with localStorage.
    // NOTE: we deliberately persist only the whitelisted CachedUserProfile subset
    // so a future UserInfo extension can't accidentally leak sensitive data here.
    effect(() => {
      const user = this.userSignal();
      if (user) {
        const cached = this.sanitizeForCache(user);
        if (cached) {
          try {
            localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(cached));
          } catch {
            /* quota / privacy mode — non-fatal, just lose the cache */
          }
        }
      } else {
        try {
          localStorage.removeItem(USER_PROFILE_KEY);
        } catch {
          /* ignore */
        }
      }
    });

    // Push current user ID into LoggingService to avoid circular dependency
    effect(() => {
      this.logger.setCurrentUser(this.userSignal()?.id ?? null);
    });

    // H-5: cold-start refresh is now driven by `bootstrap()` from APP_INITIALIZER
    // so AuthGuard sees the restored token *before* the first route activates
    // (N-CR-1 / N-CR-2). The constructor no longer fires its own refresh.
  }

  /**
   * Called once from APP_INITIALIZER. Tries the refresh-token cookie to restore
   * the session before the router activates the first route. Always resolves
   * (never rejects) so a missing/expired cookie doesn't block app bootstrap.
   *
   * Fixes N-CR-1 (F5 logs user out) and N-CR-2 (profile hard-reload race).
   */
  bootstrap(): Promise<void> {
    if (typeof window === 'undefined') {
      return Promise.resolve();
    }
    return new Promise<void>((resolve) => {
      this.refreshToken().subscribe({
        next: () => resolve(),
        error: () => {
          // No valid refresh cookie — drop cached user and continue unauthenticated.
          this.userSignal.set(null);
          resolve();
        },
      });
    });
  }

  /**
   * Login with email and password
   */
  login(request: LoginRequest): Observable<AuthResponse> {
    this.loadingSignal.set(true);
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/auth/login`, request, {
        withCredentials: true,
      })
      .pipe(
        tap((response) => this.handleAuthSuccess(response)),
        catchError((error) => this.handleAuthError(error)),
      );
  }

  /**
   * Register new user
   */
  register(request: RegisterRequest): Observable<AuthResponse> {
    this.loadingSignal.set(true);
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/auth/register`, request, {
        withCredentials: true,
      })
      .pipe(
        tap((response) => this.handleAuthSuccess(response)),
        catchError((error) => this.handleAuthError(error)),
      );
  }

  /**
   * Login with Google OAuth
   */
  googleLogin(request: GoogleLoginRequest): Observable<AuthResponse> {
    this.loadingSignal.set(true);
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/auth/google`, request, {
        withCredentials: true,
      })
      .pipe(
        tap((response) => this.handleAuthSuccess(response)),
        catchError((error) => this.handleAuthError(error)),
      );
  }

  /**
   * Select user role (Student or Teacher)
   */
  selectRole(request: SelectRoleRequest): Observable<AuthResponse> {
    this.loadingSignal.set(true);
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/auth/select-role`, request, {
        withCredentials: true,
      })
      .pipe(
        tap((response) => this.handleAuthSuccess(response)),
        catchError((error) => this.handleAuthError(error)),
      );
  }

  /**
   * Request password reset
   */
  forgotPassword(request: ForgotPasswordRequest): Observable<void> {
    this.loadingSignal.set(true);
    return this.http
      .post<void>(`${environment.apiUrl}/auth/forgot-password`, request)
      .pipe(
        tap(() => this.loadingSignal.set(false)),
        catchError((error) => {
          this.loadingSignal.set(false);
          return throwError(() => error);
        }),
      );
  }

  /**
   * Reset password with token
   */
  resetPassword(request: ResetPasswordRequest): Observable<void> {
    this.loadingSignal.set(true);
    return this.http
      .post<void>(`${environment.apiUrl}/auth/reset-password`, request)
      .pipe(
        tap(() => this.loadingSignal.set(false)),
        catchError((error) => {
          this.loadingSignal.set(false);
          return throwError(() => error);
        }),
      );
  }

  /**
   * Refresh access token using the HttpOnly refresh cookie. Used both as the
   * 401 retry path and on app cold-start to restore session without re-login.
   */
  refreshToken(): Observable<RefreshTokenResponse> {
    return this.http
      .post<RefreshTokenResponse>(
        `${environment.apiUrl}/auth/refresh`,
        {},
        { withCredentials: true },
      )
      .pipe(
        tap((response) => {
          this.tokenSignal.set(response.accessToken);
          if (response.user) {
            this.userSignal.set(response.user);
          }
        }),
        catchError((error) => {
          // Clear auth data synchronously - don't rely on logout Observable
          this.clearAuthData();
          return throwError(() => error);
        }),
      );
  }

  /**
   * Logout and clear all auth data
   */
  logout(): Observable<void> {
    this.loadingSignal.set(true);
    return this.http
      .post<void>(
        `${environment.apiUrl}/auth/logout`,
        {},
        { withCredentials: true },
      )
      .pipe(
        tap(() => this.clearAuthData()),
        catchError(() => {
          // Even if the API call fails, clear local data
          this.clearAuthData();
          return of(void 0);
        }),
      );
  }

  /**
   * Get current access token. Lives in memory only — gone on hard reload until
   * the cold-start /auth/refresh round-trip restores it.
   */
  getToken(): string | null {
    return this.tokenSignal();
  }

  /**
   * Alias for {@link getToken} exposed as a property-style getter for callers
   * that prefer `authService.accessToken` over the method form. Never setter —
   * the token is owned by login/refresh paths only.
   */
  get accessToken(): string | null {
    return this.tokenSignal();
  }

  /**
   * Get current user
   */
  getUser(): UserInfo | null {
    return this.userSignal();
  }

  /**
   * Check if user has specific role
   */
  hasRole(role: string): boolean {
    return this.userRole() === role;
  }

  /**
   * Check if user has any of the specified roles
   */
  hasAnyRole(roles: string[]): boolean {
    const currentRole = this.userRole();
    return currentRole !== null && roles.includes(currentRole);
  }

  /**
   * M-9: Drop in-memory token + cached user without round-tripping /auth/logout.
   * Called by interceptors on 401/403 dead-ends and during cold-start refresh failures.
   */
  clearTokens(): void {
    this.clearAuthData();
  }

  private handleAuthSuccess(response: AuthResponse): void {
    this.tokenSignal.set(response.accessToken);
    this.userSignal.set(response.user);
    this.loadingSignal.set(false);

    // Connect to SignalR after successful auth
    this.connectSignalR();
  }

  private handleAuthError(error: any): Observable<never> {
    this.loadingSignal.set(false);
    return throwError(() => error);
  }

  private clearAuthData(): void {
    // Disconnect from SignalR before clearing auth data
    this.disconnectSignalR();

    this.tokenSignal.set(null);
    this.userSignal.set(null);
    this.loadingSignal.set(false);

    // Avoid redirect loops if we're already on an auth page.
    if (!this.router.url.startsWith('/auth')) {
      this.router.navigate(['/auth/login']);
    }
  }

  private getStoredUser(): UserInfo | null {
    if (typeof window !== 'undefined' && window.localStorage) {
      // Prefer the renamed (sanitized) key; fall back to the legacy one so users
      // mid-migration don't see an empty header flash on first reload.
      const userJson =
        localStorage.getItem(USER_PROFILE_KEY) ?? localStorage.getItem(LEGACY_USER_KEY);
      if (userJson) {
        try {
          const parsed = JSON.parse(userJson) as Partial<UserInfo>;
          // Run through the sanitizer so any rogue fields (e.g. a token from a
          // hostile/older build) are dropped before they enter app state.
          return this.sanitizeForCache(parsed);
        } catch {
          return null;
        }
      }
    }
    return null;
  }

  /**
   * Whitelist-based sanitizer for the localStorage user-profile cache.
   *
   * Returns only the explicitly named non-credential fields from UserInfo, so
   * any future addition (e.g. an internal token) is dropped by default. Returns
   * `null` if the input is missing the bare-minimum `id` field.
   */
  private sanitizeForCache(user: Partial<UserInfo> | null | undefined): CachedUserProfile | null {
    if (!user || typeof user !== 'object' || !user.id) {
      return null;
    }
    return {
      id: user.id,
      email: user.email ?? '',
      displayName: user.displayName ?? '',
      avatarUrl: user.avatarUrl ?? null,
      role: (user.role ?? 'Student') as UserInfo['role'],
      isEmailVerified: !!user.isEmailVerified,
      hasCompletedOnboarding: !!user.hasCompletedOnboarding,
      createdAt: user.createdAt ?? '',
    };
  }

  /**
   * Connect to SignalR (lazy-loaded to avoid circular dependencies)
   */
  private async connectSignalR(): Promise<void> {
    try {
      // Dynamically import to avoid circular dependency issues
      const { SignalRService } = await import('./signalr.service');
      const signalRService = this.injector.get(SignalRService);
      await signalRService.connect();
    } catch (error) {
      this.logger.error('AuthService', 'Failed to connect SignalR', {}, error);
    }
  }

  /**
   * Disconnect from SignalR
   */
  private async disconnectSignalR(): Promise<void> {
    try {
      const { SignalRService } = await import('./signalr.service');
      const signalRService = this.injector.get(SignalRService);
      await signalRService.disconnect();
    } catch (error) {
      this.logger.error('AuthService', 'Failed to disconnect SignalR', {}, error);
    }
  }
}
