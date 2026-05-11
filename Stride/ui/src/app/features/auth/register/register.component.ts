import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '@app/core';
import { LoggingService } from '@app/core/services/logging.service';
import { TranslationService } from '@app/core/services/translation.service';
import { AuthShellComponent } from '../shared/auth-shell.component';

@Component({
  selector: 'app-register',
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
    MatCheckboxModule,
    TranslateModule,
    AuthShellComponent,
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly logger = inject(LoggingService);
  private readonly translation = inject(TranslationService);

  protected readonly registerForm: FormGroup;
  protected readonly hidePassword = signal(true);
  protected readonly hideConfirmPassword = signal(true);
  protected readonly errorMessage = signal<string | null>(null);

  constructor() {
    this.registerForm = this.formBuilder.group(
      {
        displayName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
        email: ['', [Validators.required, Validators.email]],
        password: [
          '',
          [
            Validators.required,
            Validators.minLength(8),
            Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/),
          ],
        ],
        confirmPassword: ['', [Validators.required]],
        gdprConsent: [false, [Validators.requiredTrue]],
      },
      { validators: this.passwordMatchValidator() }
    );
  }

  protected get loading(): boolean {
    return this.authService.loading();
  }

  protected onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.errorMessage.set(null);
    const { displayName, email, password, confirmPassword, gdprConsent } = this.registerForm.value;

    this.authService
      .register({
        displayName,
        email,
        password,
        confirmPassword,
        gdprConsent,
      })
      .subscribe({
        next: (response: any) => {
          // Check if user needs to select role (empty or missing role)
          if (!response.user.role || response.user.role === '') {
            this.router.navigate(['/auth/select-role']);
          } else {
            // User already has a role
            const userRole = this.authService.userRole();
            if (userRole === 'Student') {
              this.router.navigate(['/dashboard']);
            } else if (userRole === 'Teacher') {
              this.router.navigate(['/teacher']);
            } else {
              this.router.navigate(['/dashboard']);
            }
          }
        },
        error: (error: any) => {
          // L-3: Backend returns a stable error code for "email already taken"
          // (`EMAIL_ALREADY_EXISTS`) so the UI can render a localized message
          // regardless of which language the API responds in.
          const code = error.error?.code as string | undefined;
          const backendMessage = error.error?.message as string | undefined;
          const isEmailTaken =
            code === 'EMAIL_ALREADY_EXISTS' ||
            (typeof backendMessage === 'string' &&
              backendMessage.toLowerCase().includes('email is already registered'));

          if (isEmailTaken) {
            this.errorMessage.set(this.translation.instant('auth.register.emailTaken'));
          } else if (backendMessage) {
            this.errorMessage.set(backendMessage);
          } else if (error.error?.errors) {
            // Handle validation errors
            const errors = error.error.errors;
            const firstError = Object.values(errors)[0];
            this.errorMessage.set(firstError as string);
          } else {
            this.errorMessage.set(this.translation.instant('auth.register.errorGeneric'));
          }
          // L-5: do NOT call form.reset() here. Keep displayName, email and the GDPR
          // checkbox state so the user can fix the offending field instead of
          // re-typing everything. Only clear password fields for safety.
          this.registerForm.patchValue({ password: '', confirmPassword: '' });
          this.registerForm.get('password')?.markAsUntouched();
          this.registerForm.get('confirmPassword')?.markAsUntouched();
        },
      });
  }

  protected onGoogleRegister(): void {
    this.errorMessage.set(null);
    // TODO: Implement Google Sign-In flow
    this.logger.info('RegisterComponent', 'Google registration flow pending implementation', {});
    this.errorMessage.set(this.translation.instant('auth.register.googlePending'));
  }

  protected togglePasswordVisibility(): void {
    this.hidePassword.update((value) => !value);
  }

  protected toggleConfirmPasswordVisibility(): void {
    this.hideConfirmPassword.update((value) => !value);
  }

  protected getDisplayNameError(): string {
    const control = this.registerForm.get('displayName');
    if (control?.hasError('required')) {
      return this.translation.instant('auth.register.errors.displayNameRequired');
    }
    if (control?.hasError('minlength')) {
      return this.translation.instant('auth.register.errors.displayNameMinLength');
    }
    if (control?.hasError('maxlength')) {
      return this.translation.instant('auth.register.errors.displayNameMaxLength');
    }
    return '';
  }

  protected getEmailError(): string {
    const control = this.registerForm.get('email');
    if (control?.hasError('required')) {
      return this.translation.instant('auth.register.errors.emailRequired');
    }
    if (control?.hasError('email')) {
      return this.translation.instant('auth.register.errors.emailInvalid');
    }
    return '';
  }

  protected getPasswordError(): string {
    const control = this.registerForm.get('password');
    if (control?.hasError('required')) {
      return this.translation.instant('auth.register.errors.passwordRequired');
    }
    if (control?.hasError('minlength')) {
      return this.translation.instant('auth.register.errors.passwordMinLength');
    }
    if (control?.hasError('pattern')) {
      return this.translation.instant('auth.register.errors.passwordPattern');
    }
    return '';
  }

  protected getConfirmPasswordError(): string {
    const control = this.registerForm.get('confirmPassword');
    if (control?.hasError('required')) {
      return this.translation.instant('auth.register.errors.confirmPasswordRequired');
    }
    if (this.registerForm.hasError('passwordMismatch')) {
      return this.translation.instant('auth.register.errors.passwordMismatch');
    }
    return '';
  }

  protected getPasswordStrength(): 'weak' | 'medium' | 'strong' {
    const pwd: string = this.registerForm.get('password')?.value ?? '';
    if (pwd.length > 12) return 'strong';
    if (pwd.length >= 8) return 'medium';
    return 'weak';
  }

  private passwordMatchValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const password = control.get('password');
      const confirmPassword = control.get('confirmPassword');

      if (!password || !confirmPassword) {
        return null;
      }

      if (confirmPassword.value === '') {
        return null;
      }

      return password.value === confirmPassword.value ? null : { passwordMismatch: true };
    };
  }
}
