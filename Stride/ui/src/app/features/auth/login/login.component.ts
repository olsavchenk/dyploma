import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '@app/core';
import { LoggingService } from '@app/core/services/logging.service';
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
    AuthShellComponent,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly logger = inject(LoggingService);

  protected readonly loginForm: FormGroup;
  protected readonly hidePassword = signal(true);
  protected readonly errorMessage = signal<string | null>(null);

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
    const { email, password } = this.loginForm.value;

    this.authService.login({ email, password }).subscribe({
      next: () => {
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
      error: (error: any) => {
        if (error.status === 401) {
          this.errorMessage.set('Невірний email або пароль');
        } else if (error.error?.message) {
          this.errorMessage.set(error.error.message);
        } else {
          this.errorMessage.set('Виникла помилка. Спробуйте ще раз');
        }
      },
    });
  }

  protected onGoogleLogin(): void {
    this.errorMessage.set(null);
    // TODO: Implement Google Sign-In flow (US-028 acceptance criteria mentions Google button)
    // This will be implemented when Google OAuth client is configured
    this.logger.info('LoginComponent', 'Google login flow pending implementation', {});
    this.errorMessage.set('Google вхід буде доступний незабаром');
  }

  protected togglePasswordVisibility(): void {
    this.hidePassword.update((value) => !value);
  }

  protected getEmailError(): string {
    const emailControl = this.loginForm.get('email');
    if (emailControl?.hasError('required')) {
      return 'Email обов\'язковий';
    }
    if (emailControl?.hasError('email')) {
      return 'Введіть коректний email';
    }
    return '';
  }

  protected getPasswordError(): string {
    const passwordControl = this.loginForm.get('password');
    if (passwordControl?.hasError('required')) {
      return 'Пароль обов\'язковий';
    }
    if (passwordControl?.hasError('minlength')) {
      return 'Пароль має містити мінімум 8 символів';
    }
    return '';
  }
}
