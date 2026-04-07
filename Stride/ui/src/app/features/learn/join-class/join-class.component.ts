import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { LearningService } from '@app/core';

@Component({
  selector: 'app-join-class',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule,
  ],
  template: `
    <div class="join-page">
      <div class="join-card">
        <h1 class="join-title">Приєднатися до класу</h1>
        <p class="join-desc">Введи 6-значний код, наданий учителем</p>

        <mat-form-field appearance="outline" class="join-field">
          <mat-label>Код класу</mat-label>
          <input
            matInput
            [(ngModel)]="code"
            (ngModelChange)="onCodeChange($event)"
            maxlength="6"
            placeholder="ABC123"
            autocomplete="off"
            class="code-input"
          />
        </mat-form-field>

        @if (error()) {
          <p class="join-error">{{ error() }}</p>
        }

        <button
          class="btn-join"
          [disabled]="loading() || code().length !== 6"
          (click)="onJoin()">
          @if (loading()) {
            <span class="btn-spinner"></span>
          }
          Приєднатися
        </button>

        <button class="btn-back" (click)="goBack()">← Назад</button>
      </div>
    </div>
  `,
  styles: [`
    .join-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--color-surface, #f7f6f3);
      padding: 2rem 1rem;
    }

    .join-card {
      width: 100%;
      max-width: 400px;
      background: var(--color-paper, #fff);
      border: 1px solid var(--color-rule, #e5e5e3);
      border-radius: var(--radius-md, 12px);
      box-shadow: var(--shadow-card, 0 1px 4px rgba(0,0,0,.06));
      padding: 2.5rem 2rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1.25rem;
    }

    .join-title {
      font-family: var(--font-display, 'Fraunces', serif);
      font-size: 1.75rem;
      font-weight: 700;
      color: var(--color-ink, #1a1a18);
      margin: 0;
      text-align: center;
      letter-spacing: -0.02em;
    }

    .join-desc {
      font-size: 0.9rem;
      color: var(--color-ink-soft, #6b6b63);
      margin: -0.5rem 0 0;
      text-align: center;
    }

    .join-field {
      width: 100%;

      ::ng-deep input.code-input {
        font-family: var(--font-mono, monospace);
        font-size: 1.5rem;
        font-weight: 700;
        letter-spacing: 0.3em;
        text-transform: uppercase;
        text-align: center;
      }
    }

    .join-error {
      width: 100%;
      padding: 0.6rem 0.9rem;
      background: #fef2f2;
      border: 1px solid #fca5a5;
      border-radius: var(--radius-sm, 8px);
      font-size: 0.875rem;
      color: #b91c1c;
      margin: -0.25rem 0 0;
      text-align: center;
    }

    .btn-join {
      width: 100%;
      padding: 0.75rem 1.5rem;
      background: var(--blue-600, #2563eb);
      color: #fff;
      border: none;
      border-radius: var(--radius-sm, 8px);
      font-family: var(--font-sans, sans-serif);
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      transition: opacity 0.2s;

      &:hover { opacity: 0.88; }
      &:disabled { opacity: 0.35; cursor: not-allowed; }
    }

    .btn-spinner {
      width: 18px;
      height: 18px;
      border: 2px solid rgba(255,255,255,.4);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
      flex-shrink: 0;
    }

    @keyframes spin { to { transform: rotate(360deg); } }

    .btn-back {
      background: transparent;
      border: none;
      font-family: var(--font-sans, sans-serif);
      font-size: 0.875rem;
      color: var(--color-ink-soft, #6b6b63);
      cursor: pointer;
      padding: 0;
      transition: color 0.15s;

      &:hover { color: var(--color-ink, #1a1a18); }
    }
  `],
})
export class JoinClassComponent {
  private readonly learningService = inject(LearningService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly code = signal('');
  protected readonly loading = signal(false);
  protected readonly error = signal('');

  protected onCodeChange(value: string): void {
    const cleaned = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    this.code.set(cleaned);
    this.error.set('');
  }

  protected onJoin(): void {
    const code = this.code();
    if (code.length !== 6) return;

    this.loading.set(true);
    this.error.set('');

    this.learningService
      .joinClass(code)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => {
          this.snackBar.open('Успішно приєднано!', 'OK', {
            duration: 3000,
            horizontalPosition: 'center',
            verticalPosition: 'top',
          });
          this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          const msg: string = err?.error?.message ?? '';
          if (msg.toLowerCase().includes('invalid join code') || msg.toLowerCase().includes('not active')) {
            this.error.set('Невірний код або клас більше не активний.');
          } else if (msg.toLowerCase().includes('already joined')) {
            this.error.set('Ти вже є учасником цього класу.');
          } else {
            this.error.set('Не вдалося приєднатися. Перевір код та спробуй знову.');
          }
        },
      });
  }

  protected goBack(): void {
    this.router.navigate(['/learn']);
  }
}
