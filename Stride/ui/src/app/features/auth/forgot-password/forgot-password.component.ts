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
import { AuthService } from '@app/core';

@Component({
  selector: 'app-forgot-password',
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
  ],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss',
})
export class ForgotPasswordComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly forgotPasswordForm: FormGroup;
  protected readonly isSubmitting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly successMessage = signal<string | null>(null);

  constructor() {
    this.forgotPasswordForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  protected onSubmit(): void {
    if (this.forgotPasswordForm.invalid) {
      this.forgotPasswordForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const { email } = this.forgotPasswordForm.value;

    this.authService.forgotPassword({ email }).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.successMessage.set(
          'Якщо обліковий запис з таким email існує, ми надіслали інструкції для відновлення паролю'
        );
        this.forgotPasswordForm.reset();
      },
      error: (error: any) => {
        this.isSubmitting.set(false);
        // For security, we show success even on error to not reveal if email exists
        this.successMessage.set(
          'Якщо обліковий запис з таким email існує, ми надіслали інструкції для відновлення паролю'
        );
        this.forgotPasswordForm.reset();
      },
    });
  }

  protected getEmailError(): string {
    const emailControl = this.forgotPasswordForm.get('email');
    if (emailControl?.hasError('required')) {
      return "Email обов'язковий";
    }
    if (emailControl?.hasError('email')) {
      return 'Введіть коректний email';
    }
    return '';
  }
}
