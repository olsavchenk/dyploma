import { Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

export interface RecentAchievement {
  name: string;
  iconUrl?: string;
  unlockedAt?: string;
}

@Component({
  selector: 'app-recent-achievements',
  standalone: true,
  imports: [MatIconModule],
  template: `
    <div class="recent-achievements card-editorial">
      <h3 class="widget-title font-display">Недавні досягнення</h3>
      @if (achievements().length === 0) {
        <p class="empty-text font-sans">Починайте навчатися, щоб здобути перші досягнення!</p>
      } @else {
        <div class="chips-row">
          @for (a of achievements(); track a.name) {
            <div class="achievement-chip">
              @if (a.iconUrl) {
                <img [src]="a.iconUrl" [alt]="a.name" class="chip-icon" />
              } @else {
                <mat-icon class="chip-icon-placeholder">emoji_events</mat-icon>
              }
              <span class="chip-name font-sans">{{ a.name }}</span>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .recent-achievements {
      padding: 24px;
    }
    .widget-title {
      margin: 0 0 16px;
      font-size: 1.125rem;
      font-weight: 700;
      color: var(--color-ink);
    }
    .empty-text {
      margin: 0;
      font-size: .875rem;
      color: var(--color-ink-soft);
    }
    .chips-row {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .achievement-chip {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px 6px 8px;
      background: var(--blue-50);
      border: 1px solid var(--blue-100);
      border-radius: var(--radius-pill);
      animation: scale-pop 300ms cubic-bezier(.34,1.56,.64,1) both;
    }
    .chip-icon {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      object-fit: cover;
    }
    .chip-icon-placeholder {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: var(--sun-600);
    }
    .chip-name {
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--blue-700);
    }
  `],
})
export class RecentAchievementsComponent {
  readonly achievements = input<RecentAchievement[]>([]);
}
