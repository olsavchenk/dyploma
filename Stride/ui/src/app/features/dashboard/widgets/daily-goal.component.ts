import { Component, input, computed } from '@angular/core';

@Component({
  selector: 'app-daily-goal',
  standalone: true,
  template: `
    <div class="daily-goal card-editorial">
      <h3 class="widget-title font-display">Щоденна ціль</h3>
      <div class="goal-dots" aria-label="Прогрес щоденної цілі">
        @for (i of segments(); track i) {
          <div
            class="goal-dot"
            [class.filled]="i <= completed()"
            [attr.aria-label]="i <= completed() ? 'Виконано' : 'Не виконано'"
          ></div>
        }
      </div>
      <p class="goal-label font-sans">
        <span class="font-mono">{{ completed() }}</span> / {{ goal() }} завдань
      </p>
    </div>
  `,
  styles: [`
    .daily-goal {
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .widget-title {
      margin: 0;
      font-size: 1.125rem;
      font-weight: 700;
      color: var(--color-ink);
    }
    .goal-dots {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }
    .goal-dot {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: var(--color-rule);
      border: 2px solid var(--color-rule);
      transition: all var(--transition-base);
    }
    .goal-dot.filled {
      background: var(--sun-400);
      border-color: var(--sun-500);
      box-shadow: 0 2px 8px rgba(255,213,0,.3);
    }
    .goal-label {
      margin: 0;
      font-size: 0.875rem;
      color: var(--color-ink-soft);

      .font-mono {
        font-weight: 700;
        color: var(--color-ink);
        font-size: 1rem;
      }
    }
  `],
})
export class DailyGoalComponent {
  readonly completed = input<number>(0);
  readonly goal      = input<number>(5);

  readonly segments = computed(() =>
    Array.from({ length: this.goal() }, (_, i) => i + 1)
  );
}
