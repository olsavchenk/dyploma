import { Component, Input, Output, EventEmitter, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TrueFalseTask } from '@app/core';

@Component({
  selector: 'app-true-false-task',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  template: `
    <div class="true-false-task">
      <div class="question" [innerHTML]="task.question"></div>

      <div class="answer-buttons">
        <button
          mat-raised-button
          class="answer-button true-button"
          [class.selected]="selectedAnswer() === true"
          (click)="selectAnswer(true)"
          type="button"
        >
          <mat-icon>check_circle</mat-icon>
          <span class="button-text">Правда</span>
          <span class="keyboard-hint">T</span>
        </button>

        <button
          mat-raised-button
          class="answer-button false-button"
          [class.selected]="selectedAnswer() === false"
          (click)="selectAnswer(false)"
          type="button"
        >
          <mat-icon>cancel</mat-icon>
          <span class="button-text">Неправда</span>
          <span class="keyboard-hint">F</span>
        </button>
      </div>

      @if (task.hints && task.hints.length > 0 && showHints()) {
        <div class="hints-section">
          <div class="hint-label">💡 Підказка:</div>
          @for (hint of task.hints; track $index) {
            <div class="hint-text">{{ hint }}</div>
          }
        </div>
      }
    </div>
  `,
  styles: [
    `
      .true-false-task {
        display: flex;
        flex-direction: column;
        gap: 2rem;
      }

      .question {
        font-size: 1.125rem;
        font-weight: 500;
        line-height: 1.6;
        color: #1a202c;
        text-align: center;
      }

      .answer-buttons {
        display: flex;
        gap: 1rem;
        justify-content: center;
        flex-wrap: wrap;
      }

      .answer-button {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
        padding: 1.5rem 2rem;
        min-width: 180px;
        border: 3px solid transparent;
        border-radius: 1rem;
        transition: all 0.2s;
        background: white;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

        mat-icon {
          font-size: 3rem;
          width: 3rem;
          height: 3rem;
        }

        .button-text {
          font-size: 1.125rem;
          font-weight: 600;
        }

        .keyboard-hint {
          position: absolute;
          top: 0.5rem;
          right: 0.5rem;
          font-size: 0.75rem;
          color: #718096;
          background: #e2e8f0;
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
          font-weight: 600;
        }

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        &.selected {
          transform: scale(1.05);
        }
      }

      .true-button {
        color: #10b981;

        mat-icon {
          color: #10b981;
        }

        &:hover {
          background-color: #d1fae5;
        }

        &.selected {
          border-color: #10b981;
          background-color: #d1fae5;
        }
      }

      .false-button {
        color: #ef4444;

        mat-icon {
          color: #ef4444;
        }

        &:hover {
          background-color: #fee2e2;
        }

        &.selected {
          border-color: #ef4444;
          background-color: #fee2e2;
        }
      }

      .hints-section {
        padding: 1rem;
        background-color: #fffbeb;
        border-left: 4px solid #fbbf24;
        border-radius: 0.5rem;
        margin-top: 0.5rem;
      }

      .hint-label {
        font-weight: 600;
        color: #92400e;
        margin-bottom: 0.5rem;
      }

      .hint-text {
        color: #78350f;
        line-height: 1.5;
      }

      @media (max-width: 640px) {
        .question {
          font-size: 1rem;
        }

        .answer-button {
          min-width: 140px;
          padding: 1rem 1.5rem;

          mat-icon {
            font-size: 2.5rem;
            width: 2.5rem;
            height: 2.5rem;
          }

          .button-text {
            font-size: 1rem;
          }
        }
      }
    `,
  ],
})
export class TrueFalseTaskComponent {
  @Input({ required: true }) task!: TrueFalseTask;
  @Output() answerSelected = new EventEmitter<boolean>();

  protected selectedAnswer = signal<boolean | null>(null);
  protected showHints = signal(false);

  @HostListener('window:keydown', ['$event'])
  handleKeyboardInput(event: KeyboardEvent): void {
    const key = event.key.toLowerCase();
    if (key === 't' || key === 'е') {
      // 'е' is T on Ukrainian keyboard
      this.selectAnswer(true);
    } else if (key === 'f' || key === 'а') {
      // 'а' is F on Ukrainian keyboard
      this.selectAnswer(false);
    } else if (key === 'h' || key === 'п') {
      this.showHints.set(!this.showHints());
    }
  }

  protected selectAnswer(answer: boolean): void {
    this.selectedAnswer.set(answer);
    this.answerSelected.emit(answer);
  }
}
