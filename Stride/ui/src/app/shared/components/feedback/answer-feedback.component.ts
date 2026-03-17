import { Component, Input, Output, EventEmitter, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { trigger, transition, style, animate } from '@angular/animations';
import { TaskSubmitResponse, MatchingPair } from '@app/core/models';

@Component({
  selector: 'app-answer-feedback',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule],
  animations: [
    trigger('feedbackEnter', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.95)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'scale(1)' })),
      ]),
    ]),
    trigger('xpBounce', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-20px) scale(0.8)' }),
        animate(
          '500ms cubic-bezier(0.68, -0.55, 0.265, 1.55)',
          style({ opacity: 1, transform: 'translateY(0) scale(1)' })
        ),
      ]),
    ]),
  ],
  template: `
    <div class="feedback-container" @feedbackEnter>
      <mat-card
        [class.correct]="feedback.isCorrect"
        [class.incorrect]="!feedback.isCorrect"
        class="feedback-card"
      >
        <mat-card-content>
          <div class="feedback-header">
            @if (feedback.isCorrect) {
              <div class="icon-container correct">
                <mat-icon class="feedback-icon">check_circle</mat-icon>
              </div>
              <div class="feedback-text">
                <h2 class="feedback-title">Правильно!</h2>
                <p class="feedback-subtitle">Чудова робота!</p>
              </div>
            } @else {
              <div class="icon-container incorrect">
                <mat-icon class="feedback-icon">cancel</mat-icon>
              </div>
              <div class="feedback-text">
                <h2 class="feedback-title">Не зовсім правильно</h2>
                <p class="feedback-subtitle">Спробуй ще раз!</p>
              </div>
            }
          </div>

          @if (!feedback.isCorrect && feedback.correctAnswer) {
            <div class="correct-answer-section">
              <div class="section-label">Правильна відповідь:</div>
              <div class="correct-answer">{{ formatCorrectAnswer(feedback.correctAnswer) }}</div>
            </div>
          }

          @if (feedback.explanation) {
            <div class="explanation-section">
              <div class="section-label">Пояснення:</div>
              <div class="explanation-text">{{ feedback.explanation }}</div>
            </div>
          }

          <div class="stats-section">
            <div class="stat-item xp-earned" @xpBounce>
              <div class="stat-icon">⭐</div>
              <div class="stat-content">
                <div class="stat-label">Отримано XP</div>
                <div class="stat-value">+{{ feedback.xpEarned }}</div>
              </div>
            </div>

            @if (feedback.currentStreak > 1) {
              <div class="stat-item streak" @xpBounce>
                <div class="stat-icon">🔥</div>
                <div class="stat-content">
                  <div class="stat-label">Поточна серія</div>
                  <div class="stat-value">{{ feedback.currentStreak }}</div>
                </div>
              </div>
            }
          </div>

          <div class="actions">
            <button
              mat-raised-button
              color="primary"
              class="continue-button"
              (click)="continue.emit()"
            >
              Продовжити навчання
            </button>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [
    `
      .feedback-container {
        padding: 1rem;
      }

      .feedback-card {
        max-width: 600px;
        margin: 0 auto;
        border-radius: 1rem;
        overflow: hidden;

        &.correct {
          border-top: 4px solid #10b981;
          background: linear-gradient(to bottom, #ecfdf5 0%, white 100%);
        }

        &.incorrect {
          border-top: 4px solid #ef4444;
          background: linear-gradient(to bottom, #fef2f2 0%, white 100%);
        }
      }

      .feedback-header {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-bottom: 1.5rem;
      }

      .icon-container {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 4rem;
        height: 4rem;
        border-radius: 50%;
        flex-shrink: 0;

        &.correct {
          background-color: #d1fae5;
        }

        &.incorrect {
          background-color: #fee2e2;
        }
      }

      .feedback-icon {
        font-size: 2.5rem;
        width: 2.5rem;
        height: 2.5rem;

        .correct & {
          color: #10b981;
        }

        .incorrect & {
          color: #ef4444;
        }
      }

      .feedback-text {
        flex: 1;
      }

      .feedback-title {
        font-size: 1.5rem;
        font-weight: 700;
        margin: 0 0 0.25rem 0;

        .correct & {
          color: #065f46;
        }

        .incorrect & {
          color: #991b1b;
        }
      }

      .feedback-subtitle {
        font-size: 1rem;
        margin: 0;
        color: #6b7280;
      }

      .correct-answer-section,
      .explanation-section {
        margin-bottom: 1.5rem;
        padding: 1rem;
        background-color: #f9fafb;
        border-radius: 0.5rem;
        border-left: 3px solid #667eea;
      }

      .section-label {
        font-size: 0.875rem;
        font-weight: 600;
        color: #4b5563;
        margin-bottom: 0.5rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .correct-answer {
        font-size: 1rem;
        font-weight: 600;
        color: #1f2937;
      }

      .explanation-text {
        font-size: 1rem;
        line-height: 1.6;
        color: #374151;
      }

      .stats-section {
        display: flex;
        gap: 1rem;
        margin-bottom: 1.5rem;
      }

      .stat-item {
        flex: 1;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 1rem;
        border-radius: 0.75rem;
        background-color: white;
        border: 2px solid #e5e7eb;

        &.xp-earned {
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
          border-color: #fbbf24;
        }

        &.streak {
          background: linear-gradient(135deg, #fed7aa 0%, #fdba74 100%);
          border-color: #f97316;
        }
      }

      .stat-icon {
        font-size: 2rem;
        line-height: 1;
      }

      .stat-content {
        flex: 1;
      }

      .stat-label {
        font-size: 0.75rem;
        font-weight: 600;
        color: #78350f;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin-bottom: 0.25rem;
      }

      .stat-value {
        font-size: 1.5rem;
        font-weight: 700;
        color: #92400e;
      }

      .actions {
        display: flex;
        justify-content: center;
        padding-top: 1rem;
      }

      .continue-button {
        padding: 0.75rem 2rem;
        font-size: 1rem;
        font-weight: 600;
        border-radius: 0.5rem;
        text-transform: none;
        letter-spacing: 0.025em;
      }

      @media (max-width: 640px) {
        .feedback-header {
          flex-direction: column;
          text-align: center;
        }

        .icon-container {
          width: 3rem;
          height: 3rem;
        }

        .feedback-icon {
          font-size: 2rem;
          width: 2rem;
          height: 2rem;
        }

        .feedback-title {
          font-size: 1.25rem;
        }

        .stats-section {
          flex-direction: column;
        }

        .stat-item {
          justify-content: center;
        }
      }
    `,
  ],
})
export class AnswerFeedbackComponent {
  @Input({ required: true }) feedback!: TaskSubmitResponse;
  @Output() continue = new EventEmitter<void>();

  /**
   * Format correct answer for display
   */
  protected formatCorrectAnswer(answer: string | string[] | MatchingPair[]): string {
    if (typeof answer === 'string') {
      return answer;
    }
    if (Array.isArray(answer)) {
      // Check if it's MatchingPair array
      if (answer.length > 0 && typeof answer[0] === 'object' && answer[0] !== null && 'leftId' in answer[0]) {
        return (answer as MatchingPair[])
          .map((pair) => `${pair.leftId} → ${pair.rightId}`)
          .join(', ');
      }
      // Regular string array
      return answer.join(', ');
    }
    return '';
  }
}
