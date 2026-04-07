import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

interface SessionResult {
  accuracy: number;   // 0–100
  xpEarned: number;
  masteryDelta: number; // positive = up, negative = down
  topicName: string;
  incorrectTasks: { question: string; correctAnswer: string }[];
}

@Component({
  selector: 'app-session-summary',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="summary-page">
      <div class="summary-card">

        <!-- Accuracy donut -->
        <div class="donut-wrap">
          <svg width="120" height="120" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="40" fill="none" stroke="var(--color-rule, #e5e5e3)" stroke-width="12"/>
            <circle
              cx="60" cy="60" r="40"
              fill="none"
              stroke="var(--blue-600, #2563eb)"
              stroke-width="12"
              stroke-linecap="round"
              [attr.stroke-dasharray]="accuracyDash() + ' 251.33'"
              transform="rotate(-90 60 60)"
            />
          </svg>
          <div class="donut-label">
            <span class="donut-pct">{{ result().accuracy }}%</span>
            <span class="donut-sub">точність</span>
          </div>
        </div>

        <h1 class="summary-title">Сесію завершено!</h1>
        @if (result().topicName) {
          <p class="summary-topic">{{ result().topicName }}</p>
        }

        <!-- Stats row -->
        <div class="stats-row">
          <div class="stat-block">
            <span class="stat-num stat-num--xp">+{{ result().xpEarned }}</span>
            <span class="stat-sub">XP отримано</span>
          </div>
          <div class="stat-block">
            <span class="stat-num" [class.stat-num--up]="result().masteryDelta >= 0" [class.stat-num--down]="result().masteryDelta < 0">
              {{ result().masteryDelta >= 0 ? '↑' : '↓' }} {{ abs(result().masteryDelta) }}%
            </span>
            <span class="stat-sub">Майстерність</span>
          </div>
        </div>

        <!-- Incorrect review (collapsible) -->
        @if (result().incorrectTasks.length > 0) {
          <div class="review-section">
            <button class="review-toggle" (click)="showReview.set(!showReview())">
              {{ showReview() ? '▲' : '▼' }}
              Переглянути помилки ({{ result().incorrectTasks.length }})
            </button>
            @if (showReview()) {
              <div class="review-list">
                @for (item of result().incorrectTasks; track $index) {
                  <div class="review-item">
                    <p class="review-q">{{ item.question }}</p>
                    <p class="review-a">
                      <span class="review-a-label">Відповідь:</span> {{ item.correctAnswer }}
                    </p>
                  </div>
                }
              </div>
            }
          </div>
        }

        <!-- CTAs -->
        <div class="summary-actions">
          <button class="btn-secondary" (click)="goToLearn()">Назад до теми</button>
          <button class="btn-primary" (click)="continueLearning()">Продовжити</button>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .summary-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--color-surface, #f7f6f3);
      padding: 2rem 1rem;
    }

    .summary-card {
      width: 100%;
      max-width: 480px;
      background: var(--color-paper, #fff);
      border: 1px solid var(--color-rule, #e5e5e3);
      border-radius: var(--radius-md, 12px);
      box-shadow: var(--shadow-hero, 0 8px 32px rgba(0,0,0,.1));
      padding: 2.5rem 2rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1.5rem;
    }

    /* Donut */
    .donut-wrap {
      position: relative;
      width: 120px;
      height: 120px;
    }

    .donut-label {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }

    .donut-pct {
      font-family: var(--font-mono, monospace);
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--color-ink, #1a1a18);
      line-height: 1;
    }

    .donut-sub {
      font-size: 0.7rem;
      color: var(--color-ink-soft, #6b6b63);
      margin-top: 2px;
    }

    /* Title */
    .summary-title {
      font-family: var(--font-display, 'Fraunces', serif);
      font-size: 1.75rem;
      font-weight: 700;
      color: var(--color-ink, #1a1a18);
      margin: 0;
      text-align: center;
      letter-spacing: -0.02em;
    }

    .summary-topic {
      font-size: 0.9rem;
      color: var(--color-ink-soft, #6b6b63);
      margin: -0.75rem 0 0;
      text-align: center;
    }

    /* Stats */
    .stats-row {
      display: flex;
      gap: 1.5rem;
      width: 100%;
    }

    .stat-block {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.2rem;
      padding: 1rem;
      background: var(--color-surface, #f7f6f3);
      border: 1px solid var(--color-rule, #e5e5e3);
      border-radius: var(--radius-sm, 8px);
    }

    .stat-num {
      font-family: var(--font-mono, monospace);
      font-size: 2rem;
      font-weight: 700;
      line-height: 1;
      color: var(--color-ink, #1a1a18);

      &--xp    { color: #b45309; }
      &--up    { color: #15803d; }
      &--down  { color: #b91c1c; }
    }

    .stat-sub {
      font-size: 0.75rem;
      color: var(--color-ink-soft, #6b6b63);
      text-align: center;
    }

    /* Review */
    .review-section {
      width: 100%;
    }

    .review-toggle {
      width: 100%;
      padding: 0.6rem 1rem;
      background: transparent;
      border: 1px solid var(--color-rule, #e5e5e3);
      border-radius: var(--radius-sm, 8px);
      font-family: var(--font-sans, sans-serif);
      font-size: 0.875rem;
      color: var(--color-ink-soft, #6b6b63);
      cursor: pointer;
      text-align: left;
      transition: border-color 0.15s;
      &:hover { border-color: var(--color-ink-soft, #6b6b63); }
    }

    .review-list {
      margin-top: 0.5rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .review-item {
      padding: 0.75rem 1rem;
      background: #fef2f2;
      border: 1px solid #fca5a5;
      border-radius: var(--radius-sm, 8px);
    }

    .review-q {
      font-size: 0.875rem;
      color: var(--color-ink, #1a1a18);
      margin: 0 0 0.3rem;
      line-height: 1.5;
    }

    .review-a {
      font-size: 0.8rem;
      color: #15803d;
      margin: 0;
    }

    .review-a-label {
      font-weight: 600;
      color: var(--color-ink-soft, #6b6b63);
    }

    /* CTAs */
    .summary-actions {
      display: flex;
      gap: 0.75rem;
      width: 100%;
    }

    .btn-primary {
      flex: 1;
      padding: 0.7rem 1.5rem;
      background: var(--blue-600, #2563eb);
      color: #fff;
      border: none;
      border-radius: var(--radius-sm, 8px);
      font-family: var(--font-sans, sans-serif);
      font-size: 0.95rem;
      font-weight: 600;
      cursor: pointer;
      transition: opacity 0.2s;
      &:hover { opacity: 0.88; }
    }

    .btn-secondary {
      padding: 0.7rem 1.25rem;
      background: transparent;
      color: var(--color-ink, #1a1a18);
      border: 1px solid var(--color-rule, #e5e5e3);
      border-radius: var(--radius-sm, 8px);
      font-family: var(--font-sans, sans-serif);
      font-size: 0.95rem;
      font-weight: 500;
      cursor: pointer;
      transition: border-color 0.15s;
      &:hover { border-color: var(--color-ink-soft, #6b6b63); }
    }

    @media (max-width: 480px) {
      .summary-card { padding: 1.75rem 1.25rem; }
      .summary-actions { flex-direction: column; }
      .btn-secondary { order: 1; }
    }
  `],
})
export class SessionSummaryComponent implements OnInit {
  private readonly router = inject(Router);

  protected readonly showReview = signal(false);

  protected readonly result = signal<SessionResult>({
    accuracy: 0,
    xpEarned: 0,
    masteryDelta: 0,
    topicName: '',
    incorrectTasks: [],
  });

  protected readonly accuracyDash = () => {
    // circumference of r=40 circle = 2π*40 ≈ 251.33
    return ((this.result().accuracy / 100) * 251.33).toFixed(2);
  };

  protected abs(n: number): number {
    return Math.abs(n);
  }

  ngOnInit(): void {
    const nav = this.router.getCurrentNavigation();
    const state = nav?.extras?.state as Partial<SessionResult> | undefined;
    if (state) {
      this.result.set({
        accuracy: state.accuracy ?? 0,
        xpEarned: state.xpEarned ?? 0,
        masteryDelta: state.masteryDelta ?? 0,
        topicName: state.topicName ?? '',
        incorrectTasks: state.incorrectTasks ?? [],
      });
    }
  }

  protected continueLearning(): void {
    this.router.navigate(['/learn']);
  }

  protected goToLearn(): void {
    this.router.navigate(['/learn']);
  }
}
