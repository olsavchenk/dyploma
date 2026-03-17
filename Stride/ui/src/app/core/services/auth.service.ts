import { Injectable, inject, signal, computed, effect, Injector } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError, of } from 'rxjs';
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

const TOKEN_KEY = 'stride_access_token';
const USER_KEY = 'stride_user';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly injector = inject(Injector);
  private readonly logger = inject(LoggingService);

  // Signals for reactive state management
  private readonly tokenSignal = signal<string | null>(this.getStoredToken());
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

  constructor() {
    // Effect to sync token changes with localStorage
    effect(() => {
      const token = this.tokenSignal();
      if (token) {
        localStorage.setItem(TOKEN_KEY, token);
      } else {
        localStorage.removeItem(TOKEN_KEY);
      }
    });

    // Effect to sync user changes with localStorage
    effect(() => {
      const user = this.userSignal();
      if (user) {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(USER_KEY);
      }
    });

    // Push current user ID into LoggingService to avoid circular dependency
    effect(() => {
      this.logger.setCurrentUser(this.userSignal()?.id ?? null);
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
   * Refresh access token
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
          this.tokenSignal.set(response.token);
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
   * Get current access token
   */
  getToken(): string | null {
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

  private handleAuthSuccess(response: AuthResponse): void {
    this.tokenSignal.set(response.token);
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
    this.router.navigate(['/auth/login']);
  }

  private getStoredToken(): string | null {
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.getItem(TOKEN_KEY);
    }
    return null;
  }

  private getStoredUser(): UserInfo | null {
    if (typeof window !== 'undefined' && window.localStorage) {
      const userJson = localStorage.getItem(USER_KEY);
      if (userJson) {
        try {
          return JSON.parse(userJson);
        } catch {
          return null;
        }
      }
    }
    return null;
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
