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
import { AuthService } from '@app/core';
import { LoggingService } from '@app/core/services/logging.service';

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
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly logger = inject(LoggingService);

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
          if (error.error?.message) {
            this.errorMessage.set(error.error.message);
          } else if (error.error?.errors) {
            // Handle validation errors
            const errors = error.error.errors;
            const firstError = Object.values(errors)[0];
            this.errorMessage.set(firstError as string);
          } else {
            this.errorMessage.set('Виникла помилка при реєстрації. Спробуйте ще раз');
          }
        },
      });
  }

  protected onGoogleRegister(): void {
    this.errorMessage.set(null);
    // TODO: Implement Google Sign-In flow
    this.logger.info('RegisterComponent', 'Google registration flow pending implementation', {});
    this.errorMessage.set('Google реєстрація буде доступна незабаром');
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
      return "Ім'я обов'язкове";
    }
    if (control?.hasError('minlength')) {
      return "Ім'я має містити мінімум 2 символи";
    }
    if (control?.hasError('maxlength')) {
      return "Ім'я має містити максимум 50 символів";
    }
    return '';
  }

  protected getEmailError(): string {
    const control = this.registerForm.get('email');
    if (control?.hasError('required')) {
      return "Email обов'язковий";
    }
    if (control?.hasError('email')) {
      return 'Введіть коректний email';
    }
    return '';
  }

  protected getPasswordError(): string {
    const control = this.registerForm.get('password');
    if (control?.hasError('required')) {
      return "Пароль обов'язковий";
    }
    if (control?.hasError('minlength')) {
      return 'Пароль має містити мінімум 8 символів';
    }
    if (control?.hasError('pattern')) {
      return 'Пароль має містити великі та малі літери, та цифри';
    }
    return '';
  }

  protected getConfirmPasswordError(): string {
    const control = this.registerForm.get('confirmPassword');
    if (control?.hasError('required')) {
      return "Підтвердження паролю обов'язкове";
    }
    if (this.registerForm.hasError('passwordMismatch')) {
      return 'Паролі не співпадають';
    }
    return '';
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
