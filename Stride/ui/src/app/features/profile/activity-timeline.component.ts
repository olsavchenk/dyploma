import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

export interface ActivityItem {
  date: string;
  taskName: string;
  xpEarned: number;
  correct: boolean;
}

@Component({
  selector: 'app-activity-timeline',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="timeline">
      @if (activities().length === 0) {
        <p class="empty-state">Активностей ще немає</p>
      }
      @for (item of activities(); track item.date + item.taskName) {
        <div class="timeline-item">
          <div class="timeline-left">
            <span class="timeline-date">{{ formatDate(item.date) }}</span>
          </div>
          <div class="timeline-dot-col">
            <div class="dot" [class.dot--correct]="item.correct" [class.dot--wrong]="!item.correct"></div>
            <div class="connector"></div>
          </div>
          <div class="timeline-right">
            <span class="task-name">{{ item.taskName }}</span>
            <span class="xp-badge" [class.xp-badge--correct]="item.correct">+{{ item.xpEarned }} XP</span>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .timeline {
      position: relative;
      display: flex;
      flex-direction: column;
    }

    .empty-state {
      color: var(--color-ink-soft, rgba(0,0,0,0.5));
      font-size: 0.9rem;
      text-align: center;
      padding: 2rem 0;
    }

    .timeline-item {
      display: grid;
      grid-template-columns: 110px 24px 1fr;
      gap: 0 0.75rem;
      align-items: flex-start;
      min-height: 48px;
    }

    .timeline-left {
      text-align: right;
      padding-top: 2px;
    }

    .timeline-date {
      font-family: var(--font-mono, monospace);
      font-size: 0.75rem;
      color: var(--color-ink-soft, rgba(0,0,0,0.5));
      white-space: nowrap;
    }

    .timeline-dot-col {
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .dot {
      width: 14px;
      height: 14px;
      border-radius: 50%;
      flex-shrink: 0;
      margin-top: 4px;
      border: 2px solid white;
      box-shadow: 0 0 0 2px currentColor;
    }

    .dot--correct {
      background: #16a34a;
      color: #16a34a;
    }

    .dot--wrong {
      background: #dc2626;
      color: #dc2626;
    }

    .connector {
      width: 2px;
      flex: 1;
      min-height: 24px;
      background: var(--color-rule, rgba(0,0,0,0.1));
      margin-top: 2px;
    }

    .timeline-item:last-child .connector {
      display: none;
    }

    .timeline-right {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-wrap: wrap;
      padding-top: 2px;
      padding-bottom: 1rem;
    }

    .task-name {
      font-family: var(--font-sans, sans-serif);
      font-size: 0.875rem;
      color: var(--color-ink, rgba(0,0,0,0.87));
      font-weight: 500;
      flex: 1;
    }

    .xp-badge {
      font-family: var(--font-mono, monospace);
      font-size: 0.75rem;
      padding: 2px 8px;
      border-radius: 99px;
      background: rgba(0,0,0,0.06);
      color: var(--color-ink-soft, rgba(0,0,0,0.55));
      white-space: nowrap;
    }

    .xp-badge--correct {
      background: rgba(22, 163, 74, 0.12);
      color: #16a34a;
    }

    @media (max-width: 480px) {
      .timeline-item {
        grid-template-columns: 80px 20px 1fr;
      }

      .timeline-date {
        font-size: 0.68rem;
      }
    }
  `],
})
export class ActivityTimelineComponent {
  activities = input<ActivityItem[]>([]);

  formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString('uk-UA', { day: '2-digit', month: 'short' });
  }
}
