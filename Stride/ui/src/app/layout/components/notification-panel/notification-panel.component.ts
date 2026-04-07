import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';

export interface NotificationItem {
  type: string;
  message: string;
  timestamp: Date;
  data: unknown;
}

@Component({
  selector: 'app-notification-panel',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatDividerModule],
  template: `
    <div class="notification-backdrop" (click)="close.emit()"></div>
    <aside class="notification-panel animate-slide-up">
      <header class="panel-header">
        <h3 class="panel-title font-display">Сповіщення</h3>
        <button mat-icon-button (click)="close.emit()" aria-label="Закрити">
          <mat-icon>close</mat-icon>
        </button>
      </header>
      <mat-divider></mat-divider>

      <div class="panel-body">
        @if (notifications().length === 0) {
          <div class="empty-state">
            <mat-icon class="empty-icon">notifications_none</mat-icon>
            <p class="empty-text">Немає нових сповіщень</p>
          </div>
        } @else {
          @for (n of notifications(); track n.timestamp) {
            <div class="notification-item" [class]="'type-' + n.type">
              <span class="notif-icon">
                <mat-icon>{{ iconFor(n.type) }}</mat-icon>
              </span>
              <div class="notif-content">
                <p class="notif-message">{{ n.message }}</p>
                <time class="notif-time">{{ n.timestamp | date:'HH:mm' }}</time>
              </div>
            </div>
          }
        }
      </div>
    </aside>
  `,
  styles: [`
    .notification-backdrop {
      position: fixed;
      inset: 0;
      z-index: 299;
    }
    .notification-panel {
      position: fixed;
      top: 64px;
      right: 16px;
      width: 340px;
      max-height: calc(100vh - 80px);
      background: var(--color-surface);
      border: 1px solid var(--color-rule);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-float);
      z-index: 300;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px 12px;
    }
    .panel-title {
      margin: 0;
      font-size: 1.125rem;
      font-weight: 700;
      color: var(--color-ink);
    }
    .panel-body {
      flex: 1;
      overflow-y: auto;
      padding: 8px 0;
    }
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 40px 20px;
      gap: 8px;
      color: var(--color-ink-soft);
    }
    .empty-icon { font-size: 40px; width: 40px; height: 40px; opacity: .4; }
    .empty-text { font-family: var(--font-sans); font-size: .875rem; margin: 0; }
    .notification-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 12px 20px;
      cursor: default;
      transition: background var(--transition-fast);
      &:hover { background: var(--blue-50); }
    }
    .notif-icon {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      background: var(--blue-100);
      color: var(--blue-600);
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
    }
    .type-achievement .notif-icon { background: #FFF1B8; color: #B79700; }
    .type-levelUp .notif-icon    { background: var(--blue-100); color: var(--blue-600); }
    .type-streak .notif-icon     { background: #FFE5CC; color: #D97706; }
    .type-rank .notif-icon       { background: #E5F5EC; color: #1F8F5C; }
    .notif-content { flex: 1; min-width: 0; }
    .notif-message {
      margin: 0 0 2px;
      font-family: var(--font-sans);
      font-size: .875rem;
      color: var(--color-ink);
      line-height: 1.4;
    }
    .notif-time {
      font-family: var(--font-mono);
      font-size: .75rem;
      color: var(--color-ink-soft);
    }
  `],
})
export class NotificationPanelComponent {
  readonly notifications = input.required<NotificationItem[]>();
  readonly close = output<void>();

  iconFor(type: string): string {
    const map: Record<string, string> = {
      achievement: 'emoji_events',
      levelUp: 'arrow_upward',
      streak: 'local_fire_department',
      rank: 'leaderboard',
    };
    return map[type] ?? 'notifications';
  }
}
