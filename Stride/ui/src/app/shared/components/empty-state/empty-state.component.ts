import { Component, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [MatIconModule, MatButtonModule],
  template: `
    <div class="empty-state">
      <div class="empty-icon-wrap">
        <mat-icon class="empty-icon">{{ icon() }}</mat-icon>
      </div>
      <h3 class="empty-headline font-display">{{ headline() }}</h3>
      @if (description()) {
        <p class="empty-description font-sans">{{ description() }}</p>
      }
      @if (ctaLabel()) {
        <button mat-flat-button class="empty-cta" (click)="ctaClick.emit()">
          {{ ctaLabel() }}
        </button>
      }
    </div>
  `,
  styles: [`
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 48px 24px;
      gap: 12px;
    }
    .empty-icon-wrap {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: var(--blue-50);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 8px;
    }
    .empty-icon {
      font-size: 36px;
      width: 36px;
      height: 36px;
      color: var(--blue-300);
    }
    .empty-headline {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--color-ink);
    }
    .empty-description {
      margin: 0;
      font-size: 0.9375rem;
      color: var(--color-ink-soft);
      max-width: 320px;
    }
    .empty-cta {
      margin-top: 8px;
      background: var(--blue-600) !important;
      color: #fff !important;
      border-radius: var(--radius-sm) !important;
    }
  `],
})
export class EmptyStateComponent {
  readonly icon        = input<string>('inbox');
  readonly headline    = input<string>('Нічого немає');
  readonly description = input<string>('');
  readonly ctaLabel    = input<string>('');
  readonly ctaClick    = output<void>();
}
