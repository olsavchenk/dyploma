import {
  Component,
  OnInit,
  signal,
  computed,
  inject,
  DestroyRef,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatCardModule } from '@angular/material/card';
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
    MatProgressBarModule,
    MatCardModule,
    MatSnackBarModule,
    MultipleChoiceTaskComponent,
    FillBlankTaskComponent,
    TrueFalseTaskComponent,
    MatchingTaskComponent,
    OrderingTaskComponent,
    AnswerFeedbackComponent,
  ],
  template: `
    <div class="task-session-container">
      <!-- Session Header -->
      <div class="session-header">
        <div class="header-top">
          <button
            mat-icon-button
            class="back-button"
            (click)="goBack()"
            aria-label="Повернутись"
          >
            <mat-icon>arrow_back</mat-icon>
          </button>

          <div class="topic-info">
            @if (topic(); as topicData) {
              <h1 class="topic-name">{{ topicData.name }}</h1>
            }
          </div>

          <div class="session-stats">
            @if (gamificationStats(); as stats) {
              <div class="stat streak-stat">
                <span class="stat-icon">🔥</span>
                <span class="stat-value">{{ stats.currentStreak }}</span>
              </div>
            }
          </div>
        </div>

        <div class="progress-section">
          <div class="progress-info">
            <span class="progress-text">Завдання {{ currentTaskNumber() }} з {{ targetCount() }}</span>
            <span class="progress-percentage">{{ progressPercentage() }}%</span>
          </div>
          <mat-progress-bar
            mode="determinate"
            [value]="progressPercentage()"
            class="session-progress"
          ></mat-progress-bar>
        </div>
      </div>

      <!-- Task Content Area -->
      <div class="task-content">
        @switch (state()) {
          @case ('loading') {
            <div class="loading-state">
              <mat-progress-bar mode="indeterminate"></mat-progress-bar>
              <p class="loading-text">Завантаження завдання...</p>
            </div>
          }

          @case ('task') {
            @if (currentTask(); as task) {
              <mat-card class="task-card">
                <mat-card-content>
                  <div class="task-wrapper">
                    <!-- Multiple Choice Task -->
                    @if (task.type === 'MultipleChoice') {
                      <app-multiple-choice-task
                        [task]="task"
                        (answerSelected)="onMultipleChoiceAnswer($event)"
                      />
                    }

                    <!-- Fill Blank Task -->
                    @if (task.type === 'FillBlank') {
                      <app-fill-blank-task
                        [task]="task"
                        (answersChanged)="onFillBlankAnswers($event)"
                      />
                    }

                    <!-- True/False Task -->
                    @if (task.type === 'TrueFalse') {
                      <app-true-false-task
                        [task]="task"
                        (answerSelected)="onTrueFalseAnswer($event)"
                      />
                    }

                    <!-- Matching Task -->
                    @if (task.type === 'Matching') {
                      <app-matching-task
                        [task]="task"
                        (matchesChanged)="onMatchingAnswers($event)"
                      />
                    }

                    <!-- Ordering Task -->
                    @if (task.type === 'Ordering') {
                      <app-ordering-task
                        [task]="task"
                        (orderChanged)="onOrderingAnswer($event)"
                      />
                    }
                  </div>

                  <div class="task-actions">
                    <button
                      mat-stroked-button
                      class="skip-button"
                      (click)="skipTask()"
                    >
                      Пропустити
                    </button>
                    <button
                      mat-raised-button
                      color="primary"
                      class="submit-button"
                      [disabled]="!hasAnswer()"
                      (click)="submitAnswer()"
                    >
                      Підтвердити відповідь
                    </button>
                  </div>
                </mat-card-content>
              </mat-card>
            }
          }

          @case ('feedback') {
            @if (feedbackData(); as feedback) {
              <app-answer-feedback
                [feedback]="feedback"
                (continue)="loadNextTask()"
              />
            }
          }

          @case ('error') {
            <div class="error-state">
              <mat-icon class="error-icon">error_outline</mat-icon>
              <h2>Щось пішло не так</h2>
              <p>{{ errorMessage() }}</p>
              <button mat-raised-button color="primary" (click)="retryLoadTask()">
                Спробувати ще раз
              </button>
            </div>
          }
        }
      </div>
    </div>
  `,
  styles: [
    `
      .task-session-container {
        min-height: 100vh;
        background: linear-gradient(to bottom, #f8fafc 0%, #e2e8f0 100%);
        padding-bottom: 2rem;
      }

      .session-header {
        background: white;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        padding: 1rem;
        position: sticky;
        top: 0;
        z-index: 10;
      }

      .header-top {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-bottom: 1rem;
        max-width: 1200px;
        margin-left: auto;
        margin-right: auto;
      }

      .back-button {
        flex-shrink: 0;
      }

      .topic-info {
        flex: 1;
        min-width: 0;
      }

      .topic-name {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 600;
        color: #1a202c;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .session-stats {
        display: flex;
        gap: 0.75rem;
        flex-shrink: 0;
      }

      .stat {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 0.75rem;
        background-color: #f7fafc;
        border-radius: 0.5rem;
        border: 1px solid #e2e8f0;
      }

      .stat-icon {
        font-size: 1.25rem;
        line-height: 1;
      }

      .stat-value {
        font-weight: 600;
        color: #1a202c;
        font-size: 1rem;
      }

      .progress-section {
        max-width: 1200px;
        margin: 0 auto;
      }

      .progress-info {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.5rem;
      }

      .progress-text {
        font-weight: 500;
        color: #4a5568;
        font-size: 0.875rem;
      }

      .progress-percentage {
        font-weight: 600;
        color: #667eea;
        font-size: 0.875rem;
      }

      .session-progress {
        height: 8px;
        border-radius: 4px;
      }

      .task-content {
        max-width: 900px;
        margin: 2rem auto;
        padding: 0 1rem;
      }

      .loading-state {
        text-align: center;
        padding: 3rem 1rem;
      }

      .loading-text {
        margin-top: 1rem;
        color: #667eea;
        font-weight: 500;
      }

      .task-card {
        border-radius: 1rem;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
      }

      .task-wrapper {
        margin-bottom: 1.5rem;
      }

      .task-actions {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        padding-top: 1.5rem;
        border-top: 2px solid #e2e8f0;
      }

      .skip-button {
        flex: 0 0 auto;
      }

      .submit-button {
        flex: 1;
        max-width: 300px;
        margin-left: auto;
        padding: 0.75rem 2rem;
        font-size: 1rem;
        font-weight: 600;
      }

      .error-state {
        text-align: center;
        padding: 3rem 1rem;
      }

      .error-icon {
        font-size: 4rem;
        width: 4rem;
        height: 4rem;
        color: #ef4444;
        margin-bottom: 1rem;
      }

      .error-state h2 {
        font-size: 1.5rem;
        font-weight: 600;
        color: #1a202c;
        margin-bottom: 0.5rem;
      }

      .error-state p {
        color: #6b7280;
        margin-bottom: 1.5rem;
      }

      @media (max-width: 768px) {
        .topic-name {
          font-size: 1rem;
        }

        .session-stats {
          gap: 0.5rem;
        }

        .stat {
          padding: 0.375rem 0.5rem;
        }

        .stat-icon {
          font-size: 1rem;
        }

        .stat-value {
          font-size: 0.875rem;
        }

        .task-actions {
          flex-direction: column;
        }

        .submit-button {
          max-width: 100%;
          order: -1;
        }
      }
    `,
  ],
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

  // Component State
  protected readonly state = signal<SessionState>('loading');
  protected readonly currentTask = signal<Task | null>(null);
  protected readonly topic = signal<Topic | null>(null);
  protected readonly feedbackData = signal<TaskSubmitResponse | null>(null);
  protected readonly errorMessage = signal<string>('');
  protected readonly gamificationStats = signal<any>(null);

  // User Answer State
  protected readonly currentAnswer = signal<string | string[] | MatchingPair[] | null>(null);
  protected readonly startTime = signal<number>(Date.now());

  // Session Progress
  protected readonly completedCount = signal<number>(0);
  protected readonly targetCount = signal<number>(10); // Default 10 tasks per session

  // Computed Properties
  protected readonly progressPercentage = computed(() => {
    const completed = this.completedCount();
    const target = this.targetCount();
    return Math.round((completed / target) * 100);
  });

  protected readonly currentTaskNumber = computed(() =>
    Math.min(this.completedCount() + 1, this.targetCount())
  );

  // Route Parameters
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

  /**
   * Load topic information
   */
  private loadTopic(): void {
    if (!this.topicId) return;

    this.learningService
      .getTopic(this.topicId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (topic: Topic) => this.topic.set(topic),
        error: () => {
          // Continue even if topic load fails
        },
      });
  }

  /**
   * Load gamification stats
   */
  private loadGamificationStats(): void {
    this.gamificationService
      .getStats()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (stats: any) => this.gamificationStats.set(stats),
        error: () => {
          // Continue even if stats load fails
        },
      });
  }

  /**
   * Load next task
   */
  protected loadNextTask(): void {
    if (!this.topicId) return;

    if (this.completedCount() >= this.targetCount()) {
      this.router.navigate(['/learn']);
      return;
    }

    this.state.set('loading');
    this.currentAnswer.set(null);
    this.startTime.set(Date.now());

    this.taskService
      .getNextTask(this.topicId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (task: Task) => {
          this.currentTask.set(task);
          this.state.set('task');
        },
        error: (error: any) => {
          this.showError('Не вдалося завантажити завдання. Спробуйте ще раз.');
          this.logger.error('TaskSessionComponent', 'Error loading task', {}, error);
        },
      });
  }

  /**
   * Retry loading task
   */
  protected retryLoadTask(): void {
    this.loadNextTask();
  }

  /**
   * Handle multiple choice answer
   */
  protected onMultipleChoiceAnswer(selectedOption: string): void {
    this.currentAnswer.set(selectedOption);
  }

  /**
   * Handle fill blank answers
   */
  protected onFillBlankAnswers(answers: string[]): void {
    this.currentAnswer.set(answers.join(','));
  }

  /**
   * Handle true/false answer
   */
  protected onTrueFalseAnswer(answer: boolean): void {
    this.currentAnswer.set(answer.toString());
  }

  /**
   * Handle matching answers
   */
  protected onMatchingAnswers(pairs: MatchingPair[]): void {
    this.currentAnswer.set(pairs);
  }

  /**
   * Handle ordering answer
   */
  protected onOrderingAnswer(orderedItems: string[]): void {
    this.currentAnswer.set(orderedItems);
  }

  /**
   * Check if user has provided an answer
   */
  protected hasAnswer(): boolean {
    const answer = this.currentAnswer();
    if (!answer) return false;

    if (Array.isArray(answer)) {
      return answer.length > 0;
    }
    return answer !== '';
  }

  /**
   * Submit answer to backend
   */
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
        next: (response: TaskSubmitResponse) => {
          this.feedbackData.set(response);
          this.state.set('feedback');
          this.completedCount.update((count) => count + 1);

          // Refresh gamification stats
          this.loadGamificationStats();

          // Check if session is complete
          if (this.completedCount() >= this.targetCount()) {
            this.showSessionComplete();
          }
        },
        error: (error: any) => {
          this.showError('Не вдалося відправити відповідь. Спробуйте ще раз.');
          this.state.set('task');
          this.logger.error('TaskSessionComponent', 'Error submitting answer', {}, error);
        },
      });
  }

  /**
   * Skip current task
   */
  protected skipTask(): void {
    this.snackBar.open('Завдання пропущено', 'OK', {
      duration: 2000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
    });
    this.loadNextTask();
  }

  /**
   * Go back to previous page
   */
  protected goBack(): void {
    this.router.navigate(['/learn']);
  }

  /**
   * Show error state
   */
  private showError(message: string): void {
    this.errorMessage.set(message);
    this.state.set('error');
  }

  /**
   * Show session complete notification
   */
  private showSessionComplete(): void {
    setTimeout(() => {
      this.snackBar.open(
        `🎉 Сесію завершено! Виконано ${this.completedCount()} завдань`,
        'Повернутись',
        {
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
        }
      );
    }, 2000);
  }
}
