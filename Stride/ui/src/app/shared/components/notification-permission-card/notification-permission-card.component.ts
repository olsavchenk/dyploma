import { Component, signal, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';

/**
 * L-15: One-time prompt for browser Notification permission.
 * Renders a dismissible card when `Notification.permission === 'default'`.
 * The user's choice (or dismissal) is persisted in localStorage so the
 * card never reappears in the same browser.
 */
@Component({
  selector: 'app-notification-permission-card',
  standalone: true,
  imports: [MatIconModule, MatButtonModule, MatCardModule],
  template: `
    @if (visible()) {
      <div class="notif-card-host" role="dialog" aria-label="Дозвіл на сповіщення">
        <mat-card class="notif-card">
          <mat-icon class="notif-icon">notifications_active</mat-icon>
          <div class="notif-text">
            <h3 class="notif-title">Увімкнути сповіщення?</h3>
            <p class="notif-desc">
              Отримуйте повідомлення про нові досягнення, рівні та оновлення в Stride.
            </p>
          </div>
          <div class="notif-actions">
            <button mat-button (click)="dismiss()">Не зараз</button>
            <button mat-flat-button color="primary" (click)="request()">Дозволити</button>
          </div>
        </mat-card>
      </div>
    }
  `,
  styles: [`
    .notif-card-host {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 1100;
      max-width: 380px;
      animation: rise-in 220ms ease-out;
    }
    .notif-card {
      display: grid;
      grid-template-columns: auto 1fr;
      grid-template-rows: auto auto;
      grid-template-areas:
        "icon text"
        ".    actions";
      gap: 12px 14px;
      padding: 16px;
      border-radius: 12px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.14);
    }
    .notif-icon {
      grid-area: icon;
      font-size: 32px;
      width: 32px;
      height: 32px;
      color: var(--blue-500, #2563eb);
    }
    .notif-text { grid-area: text; }
    .notif-actions {
      grid-area: actions;
      display: flex;
      gap: 8px;
      justify-content: flex-end;
    }
    .notif-title {
      margin: 0 0 4px 0;
      font-weight: 600;
      font-size: 15px;
    }
    .notif-desc {
      margin: 0;
      font-size: 13px;
      color: var(--color-ink-soft, #4b5563);
      line-height: 1.45;
    }
    @keyframes rise-in {
      from { opacity: 0; transform: translateY(12px); }
      to   { opacity: 1; transform: translateY(0); }
    }
  `],
})
export class NotificationPermissionCardComponent implements OnInit {
  private static readonly STORAGE_KEY = 'stride.notif.permissionPromptDismissed';

  protected readonly visible = signal(false);

  ngOnInit(): void {
    if (typeof Notification === 'undefined') {
      return;
    }
    const dismissed = (() => {
      try { return localStorage.getItem(NotificationPermissionCardComponent.STORAGE_KEY) === '1'; }
      catch { return false; }
    })();
    if (!dismissed && Notification.permission === 'default') {
      this.visible.set(true);
    }
  }

  protected async request(): Promise<void> {
    try {
      await Notification.requestPermission();
    } catch {
      // ignore — older Safari throws on missing handler
    } finally {
      this.persistDismiss();
      this.visible.set(false);
    }
  }

  protected dismiss(): void {
    this.persistDismiss();
    this.visible.set(false);
  }

  private persistDismiss(): void {
    try { localStorage.setItem(NotificationPermissionCardComponent.STORAGE_KEY, '1'); }
    catch { /* storage may be blocked — best effort */ }
  }
}
