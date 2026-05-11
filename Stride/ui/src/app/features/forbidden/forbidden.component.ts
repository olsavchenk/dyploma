import { Component } from '@angular/core';
import { Location } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

/**
 * Standalone 403 page shown by the role guard when an authenticated user
 * tries to access a route that requires a different role.
 * Bug fix: H-10 — Role guard redirects to /auth/login instead of /dashboard or 403.
 */
@Component({
  selector: 'app-forbidden',
  standalone: true,
  imports: [MatIconModule, MatButtonModule, RouterLink],
  template: `
    <div class="forbidden-page">
      <div class="forbidden-card animate-rise-in">
        <mat-icon class="forbidden-illustration" aria-hidden="true">lock</mat-icon>
        <div class="forbidden-icon-wrap">
          <mat-icon class="forbidden-icon">block</mat-icon>
        </div>
        <h1 class="forbidden-title font-display">Немає доступу</h1>
        <p class="forbidden-description font-sans">
          У вас немає прав для перегляду цієї сторінки. Зверніться до адміністратора,
          якщо вважаєте, що це помилка.
        </p>
        <div class="actions">
          <button mat-stroked-button (click)="back()">
            <mat-icon>arrow_back</mat-icon>
            Назад
          </button>
          <a mat-flat-button class="home-btn" routerLink="/dashboard">
            <mat-icon>home</mat-icon>
            На головну
          </a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .forbidden-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--color-paper);
      padding: 24px;
    }
    .forbidden-card {
      background: var(--color-surface);
      border: 1px solid var(--color-rule);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-hero);
      padding: 48px 40px;
      max-width: 460px;
      width: 100%;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
    }
    .forbidden-illustration {
      font-size: 128px;
      width: 128px;
      height: 128px;
      color: var(--blue-300);
      opacity: 0.5;
      margin-bottom: 8px;
    }
    .forbidden-icon-wrap {
      width: 96px;
      height: 96px;
      border-radius: 50%;
      background: var(--blue-50);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .forbidden-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: var(--blue-400);
    }
    .forbidden-title {
      margin: 0;
      font-size: 2rem;
      font-weight: 700;
      color: var(--color-ink);
    }
    .forbidden-description {
      margin: 0;
      font-size: 1rem;
      color: var(--color-ink-soft);
      line-height: 1.6;
    }
    .actions {
      display: flex;
      gap: 12px;
      margin-top: 8px;
      flex-wrap: wrap;
      justify-content: center;
    }
    .home-btn {
      background: var(--blue-600) !important;
      color: #fff !important;
      border-radius: var(--radius-sm) !important;
      gap: 8px;

      mat-icon { font-size: 18px; width: 18px; height: 18px; }
    }
    button[mat-stroked-button] {
      gap: 8px;
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
    }
  `],
})
export class ForbiddenComponent {
  constructor(private location: Location, private router: Router) {}

  back(): void {
    if (window.history.length > 1) {
      this.location.back();
    } else {
      this.router.navigateByUrl('/dashboard');
    }
  }
}
