import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '@app/core';
import { TranslationService } from '@app/core/services/translation.service';
import { AuthShellComponent } from '../shared/auth-shell.component';

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
    TranslateModule,
    AuthShellComponent,
  ],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss',
})
export class ForgotPasswordComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly translation = inject(TranslationService);

  protected readonly forgotPasswordForm: FormGroup;
  protected readonly isSubmitting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly successMessage = signal<string | null>(null);

  // M-1: identical message regardless of backend response — prevents email enumeration.
  private get successMessageText(): string {
    return this.translation.instant('auth.forgotPassword.successNeutral');
  }

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
        const msg = this.successMessageText;
        this.successMessage.set(msg);
        this.snackBar.open(msg, 'OK', {
          duration: 5000,
          panelClass: ['snackbar-success'],
        });
        this.forgotPasswordForm.reset();
      },
      error: (error: HttpErrorResponse) => {
        this.isSubmitting.set(false);
        // M-1: only treat genuine network/transport failures as errors. For any
        // server-returned status (including 4xx/5xx) we display the same neutral
        // success message so we don't leak whether the email is registered.
        const isNetworkFailure = error.status === 0;
        if (isNetworkFailure) {
          this.errorMessage.set(
            this.translation.instant('auth.forgotPassword.networkError')
          );
          this.snackBar.open(
            this.translation.instant('auth.forgotPassword.networkErrorShort'),
            'OK',
            { duration: 5000, panelClass: ['snackbar-error'] }
          );
          return;
        }
        const msg = this.successMessageText;
        this.successMessage.set(msg);
        this.snackBar.open(msg, 'OK', {
          duration: 5000,
          panelClass: ['snackbar-success'],
        });
        this.forgotPasswordForm.reset();
      },
    });
  }

  protected getEmailError(): string {
    const emailControl = this.forgotPasswordForm.get('email');
    if (emailControl?.hasError('required')) {
      return this.translation.instant('auth.forgotPassword.errors.emailRequired');
    }
    if (emailControl?.hasError('email')) {
      return this.translation.instant('auth.forgotPassword.errors.emailInvalid');
    }
    return '';
  }
}
