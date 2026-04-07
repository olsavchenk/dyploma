import {
  Component,
  OnInit,
  signal,
  computed,
  inject,
  DestroyRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import {
  MultipleChoiceTaskComponent,
  FillBlankTaskComponent,
  TrueFalseTaskComponent,
  MatchingTaskComponent,
  OrderingTaskComponent,
  AnswerFeedbackComponent,
} from '@app/shared';

import {
  Task,
  MatchingPair,
  TaskSubmitResponse,
  Topic,
  TaskService,
  LearningService,
  GamificationService,
} from '@app/core';
import { LoggingService } from '@app/core/services/logging.service';

type SessionState = 'loading' | 'task' | 'feedback' | 'error';

@Component({
  selector: 'app-task-session',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MultipleChoiceTaskComponent,
    FillBlankTaskComponent,
    TrueFalseTaskComponent,
    MatchingTaskComponent,
    OrderingTaskComponent,
    AnswerFeedbackComponent,
  ],
  template: `
    <div class="session-focus">

      <!-- Top bar -->
      <header class="session-topbar">
        <div class="topbar-left">
          @if (topic()) {
            <span class="topbar-topic">{{ topic()!.name }}</span>
          }
        </div>

        <!-- 5-segment progress bar -->
        <div class="topbar-segments" aria-label="Прогрес сесії">
          @for (seg of progressSegments(); track $index) {
            <div class="segment" [class.segment--done]="seg === 'done'" [class.segment--active]="seg === 'active'"></div>
          }
        </div>

        <div class="topbar-right">
          @if (gamificationStats()?.currentStreak > 1) {
            <span class="streak-chip">🔥 {{ gamificationStats().currentStreak }}</span>
          }
          <button class="close-btn" (click)="goBack()" aria-label="Закрити сесію">
            <mat-icon>close</mat-icon>
          </button>
        </div>
      </header>

      <!-- Task counter -->
      <div class="session-counter">
        <span class="counter-text">{{ currentTaskNumber() }} / {{ targetCount() }}</span>
      </div>

      <!-- Body -->
      <main class="session-body">
        @switch (state()) {
          @case ('loading') {
            <div class="session-loading">
              <div class="loading-ring"></div>
              <p class="loading-label">Завантаження завдання...</p>
            </div>
          }

          @case ('task') {
            @if (currentTask(); as task) {
              <div class="task-card">
                <div class="task-inner">
                  @switch (task.type) {
                    @case ('MultipleChoice') {
                      <app-multiple-choice-task [task]="task" (answerSelected)="onMultipleChoiceAnswer($event)" />
                    }
                    @case ('FillBlank') {
                      <app-fill-blank-task [task]="task" (answersChanged)="onFillBlankAnswers($event)" />
                    }
                    @case ('TrueFalse') {
                      <app-true-false-task [task]="task" (answerSelected)="onTrueFalseAnswer($event)" />
                    }
                    @case ('Matching') {
                      <app-matching-task [task]="task" (matchesChanged)="onMatchingAnswers($event)" />
                    }
                    @case ('Ordering') {
                      <app-ordering-task [task]="task" (orderChanged)="onOrderingAnswer($event)" />
                    }
                  }
                </div>

                <div class="task-footer">
                  <button class="btn-skip" (click)="skipTask()">Пропустити</button>
                  <button
                    class="btn-check"
                    [disabled]="!hasAnswer()"
                    (click)="submitAnswer()">
                    Перевірити
                  </button>
                </div>
              </div>
            }
          }

          @case ('feedback') {
            @if (feedbackData(); as feedback) {
              <div class="feedback-card" [class.feedback-card--correct]="feedback.isCorrect" [class.feedback-card--wrong]="!feedback.isCorrect">
                <div class="feedback-icon-wrap">
                  @if (feedback.isCorrect) {
                    <mat-icon class="feedback-icon feedback-icon--ok">check_circle</mat-icon>
                    <p class="feedback-label feedback-label--ok">Правильно!</p>
                  } @else {
                    <mat-icon class="feedback-icon feedback-icon--err">cancel</mat-icon>
                    <p class="feedback-label feedback-label--err">Не зовсім правильно</p>
                  }
                </div>
                @if (!feedback.isCorrect && feedback.correctAnswer) {
                  <div class="feedback-answer">
                    <span class="feedback-answer-label">Правильна відповідь:</span>
                    <span class="feedback-answer-val">{{ formatAnswer(feedback.correctAnswer) }}</span>
                  </div>
                }
                @if (feedback.explanation) {
                  <div class="feedback-explanation">{{ feedback.explanation }}</div>
                }
                <div class="feedback-xp">
                  <span class="xp-icon">⭐</span>
                  <span class="xp-val">+{{ feedback.xpEarned }} XP</span>
                </div>
                <button class="btn-check" (click)="loadNextTask()">Продовжити</button>
              </div>
            }
          }

          @case ('error') {
            <div class="session-error">
              <mat-icon class="error-icon">error_outline</mat-icon>
              <h2>Щось пішло не так</h2>
              <p>{{ errorMessage() }}</p>
              <button class="btn-check" (click)="retryLoadTask()">Спробувати ще раз</button>
            </div>
          }
        }
      </main>
    </div>
  `,
  styles: [`
    /* Focus-mode: full screen, no sidenav interference */
    :host {
      display: block;
    }

    .session-focus {
      min-height: 100vh;
      background: var(--color-surface, #f7f6f3);
      display: flex;
      flex-direction: column;
    }

    /* ── Top bar ──────────────────────────────────────────────────── */
    .session-topbar {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.75rem 1.5rem;
      background: var(--color-paper, #fff);
      border-bottom: 1px solid var(--color-rule, #e5e5e3);
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .topbar-left {
      flex: 1;
      min-width: 0;
    }

    .topbar-topic {
      font-family: var(--font-display, 'Fraunces', serif);
      font-size: 1rem;
      font-weight: 700;
      color: var(--color-ink, #1a1a18);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .topbar-segments {
      display: flex;
      gap: 4px;
      flex-shrink: 0;
    }

    .segment {
      width: 36px;
      height: 6px;
      border-radius: 100px;
      background: var(--color-rule, #e5e5e3);
      transition: background 0.3s;

      &--done { background: var(--blue-600, #2563eb); }
      &--active { background: var(--sun-400, #facc15); }
    }

    .topbar-right {
      flex-shrink: 0;
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .streak-chip {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.25rem 0.6rem;
      background: #fff7ed;
      border: 1px solid #fed7aa;
      border-radius: 100px;
      font-family: var(--font-mono, monospace);
      font-size: 0.8rem;
      font-weight: 700;
      color: #c2410c;
    }

    .close-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      border: 1px solid var(--color-rule, #e5e5e3);
      border-radius: 50%;
      background: transparent;
      color: var(--color-ink-soft, #6b6b63);
      cursor: pointer;
      transition: background 0.15s;
      &:hover { background: var(--color-surface, #f7f6f3); }
    }

    /* ── Counter ────────────────────────────────────────────────── */
    .session-counter {
      text-align: center;
      padding: 0.75rem 0 0;
    }

    .counter-text {
      font-family: var(--font-mono, monospace);
      font-size: 0.8rem;
      color: var(--color-ink-soft, #6b6b63);
      letter-spacing: 0.05em;
    }

    /* ── Body ───────────────────────────────────────────────────── */
    .session-body {
      flex: 1;
      display: flex;
      align-items: flex-start;
      justify-content: center;
      padding: 1.5rem 1rem 3rem;
    }

    /* ── Loading ─────────────────────────────────────────────────── */
    .session-loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      padding: 5rem 1rem;
    }

    .loading-ring {
      width: 40px;
      height: 40px;
      border: 3px solid var(--color-rule, #e5e5e3);
      border-top-color: var(--blue-600, #2563eb);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin { to { transform: rotate(360deg); } }

    .loading-label {
      font-size: 0.9rem;
      color: var(--color-ink-soft, #6b6b63);
    }

    /* ── Task card ──────────────────────────────────────────────── */
    .task-card {
      width: 100%;
      max-width: 720px;
      background: var(--color-paper, #fff);
      border: 1px solid var(--color-rule, #e5e5e3);
      border-radius: var(--radius-md, 12px);
      box-shadow: var(--shadow-card, 0 1px 4px rgba(0,0,0,.06));
      overflow: hidden;
    }

    .task-inner {
      padding: 2rem 2rem 1rem;
    }

    .task-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem 2rem;
      border-top: 1px solid var(--color-rule, #e5e5e3);
      background: var(--color-surface, #f7f6f3);
    }

    /* ── Buttons ────────────────────────────────────────────────── */
    .btn-skip {
      padding: 0.55rem 1.25rem;
      background: transparent;
      color: var(--color-ink-soft, #6b6b63);
      border: 1px solid var(--color-rule, #e5e5e3);
      border-radius: var(--radius-sm, 8px);
      font-family: var(--font-sans, sans-serif);
      font-size: 0.875rem;
      cursor: pointer;
      transition: border-color 0.15s;
      &:hover { border-color: var(--color-ink-soft, #6b6b63); }
    }

    .btn-check {
      padding: 0.7rem 2rem;
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
      &:disabled { opacity: 0.35; cursor: not-allowed; }
    }

    /* ── Feedback card ──────────────────────────────────────────── */
    .feedback-card {
      width: 100%;
      max-width: 720px;
      background: var(--color-paper, #fff);
      border: 1px solid var(--color-rule, #e5e5e3);
      border-radius: var(--radius-md, 12px);
      padding: 2rem;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
      align-items: center;
      text-align: center;

      &--correct { border-top: 4px solid #16a34a; }
      &--wrong   { border-top: 4px solid #dc2626; }
    }

    .feedback-icon-wrap {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.4rem;
    }

    .feedback-icon {
      font-size: 3rem;
      width: 3rem;
      height: 3rem;

      &--ok  { color: #16a34a; }
      &--err { color: #dc2626; }
    }

    .feedback-label {
      font-family: var(--font-display, serif);
      font-size: 1.4rem;
      font-weight: 700;
      margin: 0;

      &--ok  { color: #15803d; }
      &--err { color: #b91c1c; }
    }

    .feedback-answer {
      background: var(--color-surface, #f7f6f3);
      border: 1px solid var(--color-rule, #e5e5e3);
      border-radius: var(--radius-sm, 8px);
      padding: 0.75rem 1.25rem;
      font-size: 0.9rem;
      text-align: left;
      width: 100%;

      .feedback-answer-label {
        display: block;
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--color-ink-soft, #6b6b63);
        margin-bottom: 0.3rem;
        font-weight: 600;
      }

      .feedback-answer-val {
        font-family: var(--font-mono, monospace);
        font-weight: 600;
        color: var(--color-ink, #1a1a18);
      }
    }

    .feedback-explanation {
      font-size: 0.9rem;
      color: var(--color-ink-soft, #6b6b63);
      line-height: 1.6;
      text-align: left;
      width: 100%;
      padding: 0 0.25rem;
    }

    .feedback-xp {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      font-family: var(--font-mono, monospace);
      font-size: 1.1rem;
      font-weight: 700;
      color: #92400e;
    }

    .xp-icon { font-size: 1.2rem; }

    /* ── Error ──────────────────────────────────────────────────── */
    .session-error {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
      padding: 5rem 1rem;
      text-align: center;

      .error-icon {
        font-size: 3rem;
        width: 3rem;
        height: 3rem;
        color: #dc2626;
      }

      h2 {
        font-family: var(--font-display, serif);
        font-size: 1.4rem;
        font-weight: 700;
        color: var(--color-ink, #1a1a18);
        margin: 0;
      }

      p {
        font-size: 0.9rem;
        color: var(--color-ink-soft, #6b6b63);
        margin: 0;
        max-width: 360px;
      }
    }

    /* ── Responsive ─────────────────────────────────────────────── */
    @media (max-width: 640px) {
      .session-topbar { padding: 0.6rem 1rem; }
      .segment { width: 24px; }
      .task-inner { padding: 1.25rem 1rem 0.75rem; }
      .task-footer { padding: 0.75rem 1rem; }
      .feedback-card { padding: 1.5rem 1rem; }
    }
  `],
})
export class TaskSessionComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly taskService = inject(TaskService);
  private readonly learningService = inject(LearningService);
  private readonly gamificationService = inject(GamificationService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);
  private readonly logger = inject(LoggingService);

  // State
  protected readonly state = signal<SessionState>('loading');
  protected readonly currentTask = signal<Task | null>(null);
  protected readonly topic = signal<Topic | null>(null);
  protected readonly feedbackData = signal<TaskSubmitResponse | null>(null);
  protected readonly errorMessage = signal<string>('');
  protected readonly gamificationStats = signal<any>(null);

  // Answer state
  protected readonly currentAnswer = signal<string | string[] | MatchingPair[] | null>(null);
  protected readonly startTime = signal<number>(Date.now());

  // Session progress
  protected readonly completedCount = signal<number>(0);
  protected readonly targetCount = signal<number>(5);

  private readonly SEGMENTS = 5;

  protected readonly progressPercentage = computed(() =>
    Math.round((this.completedCount() / this.targetCount()) * 100)
  );

  protected readonly currentTaskNumber = computed(() =>
    Math.min(this.completedCount() + 1, this.targetCount())
  );

  /** Returns array of 5 segment states: 'done' | 'active' | 'empty' */
  protected readonly progressSegments = computed<string[]>(() => {
    const done = this.completedCount();
    return Array.from({ length: this.SEGMENTS }, (_, i) => {
      if (i < done) return 'done';
      if (i === done && this.state() === 'task') return 'active';
      return 'empty';
    });
  });

  private topicId: string | null = null;

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      this.topicId = params.get('topicId');
      if (this.topicId) {
        this.loadTopic();
        this.loadNextTask();
        this.loadGamificationStats();
      } else {
        this.showError('Не вказано тему для навчання');
      }
    });
  }

  private loadTopic(): void {
    if (!this.topicId) return;
    this.learningService
      .getTopic(this.topicId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: (t) => this.topic.set(t), error: () => {} });
  }

  private loadGamificationStats(): void {
    this.gamificationService
      .getStats()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: (s) => this.gamificationStats.set(s), error: () => {} });
  }

  protected loadNextTask(): void {
    if (!this.topicId) return;

    if (this.completedCount() >= this.targetCount()) {
      this.router.navigate(['/learn/session', this.topicId, 'summary'], {
        state: {
          completed: this.completedCount(),
          topicName: this.topic()?.name ?? '',
        },
      });
      return;
    }

    this.state.set('loading');
    this.currentAnswer.set(null);
    this.startTime.set(Date.now());

    this.taskService
      .getNextTask(this.topicId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (task) => { this.currentTask.set(task); this.state.set('task'); },
        error: (err) => {
          this.showError('Не вдалося завантажити завдання. Спробуйте ще раз.');
          this.logger.error('TaskSessionComponent', 'Error loading task', {}, err);
        },
      });
  }

  protected retryLoadTask(): void { this.loadNextTask(); }

  protected onMultipleChoiceAnswer(opt: string): void { this.currentAnswer.set(opt); }
  protected onFillBlankAnswers(ans: string[]): void { this.currentAnswer.set(ans.join(',')); }
  protected onTrueFalseAnswer(ans: boolean): void { this.currentAnswer.set(ans.toString()); }
  protected onMatchingAnswers(pairs: MatchingPair[]): void { this.currentAnswer.set(pairs); }
  protected onOrderingAnswer(items: string[]): void { this.currentAnswer.set(items); }

  protected hasAnswer(): boolean {
    const a = this.currentAnswer();
    if (!a) return false;
    return Array.isArray(a) ? a.length > 0 : a !== '';
  }

  protected submitAnswer(): void {
    const task = this.currentTask();
    const answer = this.currentAnswer();
    if (!task || !answer) return;

    const responseTimeMs = Date.now() - this.startTime();
    this.state.set('loading');

    this.taskService
      .submitTask(task.id, answer, responseTimeMs)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.feedbackData.set(response);
          this.state.set('feedback');
          this.completedCount.update((c) => c + 1);
          this.loadGamificationStats();
        },
        error: (err) => {
          this.showError('Не вдалося відправити відповідь. Спробуйте ще раз.');
          this.state.set('task');
          this.logger.error('TaskSessionComponent', 'Error submitting answer', {}, err);
        },
      });
  }

  protected skipTask(): void {
    this.snackBar.open('Завдання пропущено', 'OK', { duration: 2000, horizontalPosition: 'center', verticalPosition: 'top' });
    this.loadNextTask();
  }

  protected goBack(): void { this.router.navigate(['/learn']); }

  protected formatAnswer(answer: string | string[] | MatchingPair[]): string {
    if (typeof answer === 'string') return answer;
    if (Array.isArray(answer)) {
      if (answer.length > 0 && typeof answer[0] === 'object' && 'leftId' in (answer[0] as object)) {
        return (answer as MatchingPair[]).map((p) => `${p.leftId} → ${p.rightId}`).join(', ');
      }
      return (answer as string[]).join(', ');
    }
    return '';
  }

  private showError(message: string): void {
    this.errorMessage.set(message);
    this.state.set('error');
  }
}
