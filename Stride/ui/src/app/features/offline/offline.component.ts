import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-offline',
  standalone: true,
  imports: [MatIconModule, MatButtonModule],
  template: `
    <div class="offline-page">
      <div class="offline-card animate-rise-in">
        <div class="offline-icon-wrap">
          <mat-icon class="offline-icon">wifi_off</mat-icon>
        </div>
        <h1 class="offline-title font-display">Ви офлайн</h1>
        <p class="offline-description font-sans">
          Перевірте з'єднання з інтернетом та спробуйте знову.
        </p>
        <button mat-flat-button class="retry-btn" (click)="reload()">
          <mat-icon>refresh</mat-icon>
          Спробувати ще раз
        </button>
      </div>
    </div>
  `,
  styles: [`
    .offline-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--color-paper);
      padding: 24px;
    }
    .offline-card {
      background: var(--color-surface);
      border: 1px solid var(--color-rule);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-hero);
      padding: 48px 40px;
      max-width: 420px;
      width: 100%;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
    }
    .offline-icon-wrap {
      width: 96px;
      height: 96px;
      border-radius: 50%;
      background: var(--blue-50);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .offline-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: var(--blue-400);
    }
    .offline-title {
      margin: 0;
      font-size: 2rem;
      font-weight: 700;
      color: var(--color-ink);
    }
    .offline-description {
      margin: 0;
      font-size: 1rem;
      color: var(--color-ink-soft);
      line-height: 1.6;
    }
    .retry-btn {
      margin-top: 8px;
      background: var(--blue-600) !important;
      color: #fff !important;
      border-radius: var(--radius-sm) !important;
      gap: 8px;

      mat-icon { font-size: 18px; width: 18px; height: 18px; }
    }
  `],
})
export class OfflineComponent {
  reload(): void {
    window.location.reload();
  }
}
