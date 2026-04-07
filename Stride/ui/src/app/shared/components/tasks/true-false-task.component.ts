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
        font-family: var(--font-sans, sans-serif);
        font-size: 1.1rem;
        font-weight: 500;
        line-height: 1.65;
        color: var(--color-ink, #1a1a18);
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
        min-width: 160px;
        border: 2px solid var(--color-rule, #e5e5e3);
        border-radius: var(--radius-md, 12px);
        transition: border-color 0.15s, background 0.15s, transform 0.15s;
        background: var(--color-paper, #fff);
        cursor: pointer;
        box-shadow: var(--shadow-card, 0 1px 4px rgba(0,0,0,.06));

        mat-icon {
          font-size: 2.5rem;
          width: 2.5rem;
          height: 2.5rem;
        }

        .button-text {
          font-family: var(--font-sans, sans-serif);
          font-size: 1rem;
          font-weight: 600;
          color: var(--color-ink, #1a1a18);
        }

        .keyboard-hint {
          position: absolute;
          top: 0.5rem;
          right: 0.5rem;
          font-family: var(--font-mono, monospace);
          font-size: 0.7rem;
          color: var(--color-ink-soft, #6b6b63);
          background: var(--color-surface, #f7f6f3);
          border: 1px solid var(--color-rule, #e5e5e3);
          padding: 0.15rem 0.4rem;
          border-radius: 4px;
          font-weight: 700;
        }

        &:hover {
          border-color: var(--sun-400, #facc15);
          transform: translateY(-2px);
        }

        &.selected {
          border-color: var(--sun-400, #facc15);
          transform: scale(1.04);
        }
      }

      .true-button {
        mat-icon { color: #16a34a; }

        &:hover, &.selected {
          background: #f0fdf4;
          border-color: #16a34a;
        }
      }

      .false-button {
        mat-icon { color: #dc2626; }

        &:hover, &.selected {
          background: #fef2f2;
          border-color: #dc2626;
        }
      }

      .hints-section {
        padding: 0.875rem 1rem;
        background: #fffbeb;
        border-left: 3px solid var(--sun-400, #facc15);
        border-radius: var(--radius-sm, 8px);
      }

      .hint-label {
        font-weight: 600;
        font-size: 0.8rem;
        color: #92400e;
        margin-bottom: 0.4rem;
      }

      .hint-text {
        font-size: 0.875rem;
        color: #78350f;
        line-height: 1.5;
      }

      @media (max-width: 640px) {
        .question { font-size: 1rem; }
        .answer-button { min-width: 130px; padding: 1.25rem 1.5rem; }
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
