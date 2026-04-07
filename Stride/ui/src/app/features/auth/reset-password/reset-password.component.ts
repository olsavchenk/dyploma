import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '@app/core';
import { AuthShellComponent } from '../shared/auth-shell.component';

function passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
  const pw = group.get('password')?.value;
  const confirm = group.get('confirmPassword')?.value;
  return pw && confirm && pw !== confirm ? { mismatch: true } : null;
}

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    AuthShellComponent,
  ],
  template: `
    <app-auth-shell>
      <div class="form-panel">
        <div class="form-header">
          <h2 class="form-title font-display">Новий пароль</h2>
          <p class="form-subtitle font-sans">Введіть новий пароль для вашого акаунту</p>
        </div>

        @if (success()) {
          <div class="success-banner">
            <mat-icon>check_circle</mat-icon>
            <p>Пароль успішно змінено! <a routerLink="/auth/login" class="auth-link">Увійти</a></p>
          </div>
        } @else {
          @if (errorMessage()) {
            <div class="error-banner" role="alert">
              <mat-icon>error_outline</mat-icon>
              <span>{{ errorMessage() }}</span>
            </div>
          }

          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="auth-form">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Новий пароль</mat-label>
              <input
                matInput
                [type]="hidePassword() ? 'password' : 'text'"
                formControlName="password"
                autocomplete="new-password"
                required
              />
              <mat-icon matPrefix>lock</mat-icon>
              <button mat-icon-button matSuffix type="button" (click)="hidePassword.update(v => !v)">
                <mat-icon>{{ hidePassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
              @if (form.get('password')?.hasError('minlength') && form.get('password')?.touched) {
                <mat-error>Мінімум 8 символів</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Підтвердіть пароль</mat-label>
              <input
                matInput
                [type]="hidePassword() ? 'password' : 'text'"
                formControlName="confirmPassword"
                autocomplete="new-password"
                required
              />
              <mat-icon matPrefix>lock_reset</mat-icon>
              @if (form.hasError('mismatch') && form.get('confirmPassword')?.touched) {
                <mat-error>Паролі не збігаються</mat-error>
              }
            </mat-form-field>

            <button
              mat-flat-button
              type="submit"
              class="full-width submit-btn"
              [disabled]="loading()"
            >
              @if (loading()) {
                <mat-spinner diameter="20"></mat-spinner>
                <span>Зміна...</span>
              } @else {
                <span>Змінити пароль</span>
              }
            </button>
          </form>

          <p class="switch-prompt font-sans">
            <a routerLink="/auth/login" class="auth-link">Повернутися до входу</a>
          </p>
        }
      </div>
    </app-auth-shell>
  `,
  styleUrl: '../login/login.component.scss',
})
export class ResetPasswordComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  protected readonly form: FormGroup;
  protected readonly loading = signal(false);
  protected readonly hidePassword = signal(true);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly success = signal(false);

  private token = '';

  constructor() {
    this.form = this.fb.group(
      {
        password:        ['', [Validators.required, Validators.minLength(8)]],
        confirmPassword: ['', [Validators.required]],
      },
      { validators: passwordMatchValidator }
    );
  }

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token') ?? '';
    if (!this.token) {
      this.errorMessage.set('Недійсний або відсутній токен скидання.');
    }
  }

  protected onSubmit(): void {
    if (this.form.invalid || !this.token) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    const { password, confirmPassword } = this.form.value;
    this.authService.resetPassword({ token: this.token, newPassword: password, confirmPassword }).subscribe({
      next: () => {
        this.loading.set(false);
        this.success.set(true);
        setTimeout(() => this.router.navigate(['/auth/login']), 3000);
      },
      error: (err: { error?: { message?: string } }) => {
        this.loading.set(false);
        this.errorMessage.set(err?.error?.message ?? 'Помилка. Спробуйте ще раз.');
      },
    });
  }
}
