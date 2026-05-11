import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '@app/core';
import { LoggingService } from '@app/core/services/logging.service';
import { TranslationService } from '@app/core/services/translation.service';
import { AuthShellComponent } from '../shared/auth-shell.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    TranslateModule,
    AuthShellComponent,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly logger = inject(LoggingService);
  private readonly translation = inject(TranslationService);

  protected readonly loginForm: FormGroup;
  protected readonly hidePassword = signal(true);
  protected readonly errorMessage = signal<string | null>(null);
  // CR-11: separate signal so the template can render a richer "account locked" banner.
  protected readonly lockoutMessage = signal<string | null>(null);
  protected readonly lockoutRetryAfterSeconds = signal<number | null>(null);

  constructor() {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
    });
  }

  protected get loading(): boolean {
    return this.authService.loading();
  }

  protected onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.errorMessage.set(null);
    this.lockoutMessage.set(null);
    this.lockoutRetryAfterSeconds.set(null);
    const { email, password } = this.loginForm.value;

    this.authService.login({ email, password }).subscribe({
      next: () => {
        // CR-8 / H-19: prefer returnUrl from query string (e.g. authGuard hand-off),
        // but only if it's a same-origin relative path. Reject anything that could
        // be coerced into an external redirect.
        const requested = this.route.snapshot.queryParamMap.get('returnUrl');
        const safeReturnUrl = this.sanitiseReturnUrl(requested);
        if (safeReturnUrl) {
          this.router.navigateByUrl(safeReturnUrl);
          return;
        }

        const userRole = this.authService.userRole();
        if (userRole === 'Student') {
          this.router.navigate(['/dashboard']);
        } else if (userRole === 'Teacher') {
          this.router.navigate(['/teacher']);
        } else if (userRole === 'Admin') {
          this.router.navigate(['/admin']);
        } else {
          this.router.navigate(['/dashboard']);
        }
      },
      error: (error: HttpErrorResponse) => {
        // CR-11: backend returns 423 Locked with retryAfterSeconds + Retry-After header
        // when the account is in lockout/backoff. Render a dedicated banner.
        if (error.status === 423) {
          const retryAfterHeader = error.headers?.get?.('Retry-After');
          const fromBody = (error.error as { retryAfterSeconds?: number } | undefined)
            ?.retryAfterSeconds;
          const retryAfter = Number(retryAfterHeader) || fromBody || null;
          this.lockoutRetryAfterSeconds.set(retryAfter);
          // Backend message is English ("Account is locked..."); show a translated
          // banner instead. Fall back to backend message only if i18n missing.
          this.lockoutMessage.set(this.translation.instant('auth.login.lockoutFallback'));
          return;
        }

        if (error.status === 429) {
          this.errorMessage.set(this.translation.instant('auth.login.rateLimited'));
          return;
        }

        if (error.status === 401) {
          this.errorMessage.set(this.translation.instant('auth.login.error'));
        } else {
          this.errorMessage.set(this.translation.instant('auth.login.errorGeneric'));
        }
      },
    });
  }

  /**
   * CR-8 / H-19: Allow only same-origin paths beginning with a single forward slash.
   * Rejects:
   *   - protocol-relative URLs ("//evil.com/...")
   *   - absolute URLs ("http://evil.com")
   *   - back-references ("/..", "/foo/../bar")
   *   - anything containing a backslash (Windows-style trick)
   */
  private sanitiseReturnUrl(value: string | null): string | null {
    if (!value) return null;
    if (!value.startsWith('/')) return null;
    if (value.startsWith('//')) return null;
    if (value.startsWith('/\\')) return null;
    if (value.includes('\\')) return null;
    if (/^\/(https?:|javascript:|data:)/i.test(value)) return null;
    if (value.includes('..')) return null;
    return value;
  }

  protected onGoogleLogin(): void {
    this.errorMessage.set(null);
    // TODO: Implement Google Sign-In flow (US-028 acceptance criteria mentions Google button)
    // This will be implemented when Google OAuth client is configured
    this.logger.info('LoginComponent', 'Google login flow pending implementation', {});
    this.errorMessage.set(this.translation.instant('auth.login.googlePending'));
  }

  protected togglePasswordVisibility(): void {
    this.hidePassword.update((value) => !value);
  }

  protected getEmailError(): string {
    const emailControl = this.loginForm.get('email');
    if (emailControl?.hasError('required')) {
      return this.translation.instant('auth.login.errors.emailRequired');
    }
    if (emailControl?.hasError('email')) {
      return this.translation.instant('auth.login.errors.emailInvalid');
    }
    return '';
  }

  protected getPasswordError(): string {
    const passwordControl = this.loginForm.get('password');
    if (passwordControl?.hasError('required')) {
      return this.translation.instant('auth.login.errors.passwordRequired');
    }
    if (passwordControl?.hasError('minlength')) {
      return this.translation.instant('auth.login.errors.passwordMinLength');
    }
    return '';
  }

  protected formatLockoutHint(): string {
    const seconds = this.lockoutRetryAfterSeconds();
    if (!seconds || seconds <= 0) {
      return '';
    }
    if (seconds < 60) {
      return this.translation.instant('auth.login.retryInSeconds', { seconds });
    }
    const minutes = Math.ceil(seconds / 60);
    return this.translation.instant('auth.login.retryInMinutes', { minutes });
  }
}
