import { Component, Input, Output, EventEmitter, signal, HostListener, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatRadioModule } from '@angular/material/radio';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { MultipleChoiceTask } from '@app/core';
import { SafeHtmlPipe } from '@app/shared/pipes/safe-html.pipe';

@Component({
  selector: 'app-multiple-choice-task',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatRadioModule, MatButtonModule, FormsModule, SafeHtmlPipe],
  template: `
    <div class="multiple-choice-task">
      <div class="question" [innerHTML]="task.question | safeHtml"></div>

      <mat-radio-group
        class="options-list"
        [(ngModel)]="selectedOptionValue"
        (ngModelChange)="onSelectionChange($event)"
      >
        @for (option of task.options; track $index) {
          <mat-radio-button
            [value]="$index"
            class="option-item"
            [attr.data-keyboard-index]="$index + 1"
          >
            <span class="option-number">{{ $index + 1 }}</span>
            <span class="option-text" [innerHTML]="option | safeHtml"></span>
          </mat-radio-button>
        }
      </mat-radio-group>

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
      .multiple-choice-task {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
      }

      .question {
        font-family: var(--font-sans, sans-serif);
        font-size: 1.1rem;
        font-weight: 500;
        line-height: 1.65;
        color: var(--color-ink, #1a1a18);
      }

      .options-list {
        display: flex;
        flex-direction: column;
        gap: 0.6rem;
      }

      .option-item {
        display: flex;
        align-items: center;
        padding: 0.875rem 1rem;
        border: 2px solid var(--color-rule, #e5e5e3);
        border-radius: var(--radius-sm, 8px);
        transition: border-color 0.15s, background 0.15s;
        cursor: pointer;
        background: var(--color-paper, #fff);

        &:hover {
          border-color: var(--sun-400, #facc15);
          background: #fefce8;
        }

        &.mat-mdc-radio-checked {
          border-color: var(--sun-400, #facc15);
          background: #fefce8;
        }
      }

      .option-number {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 1.75rem;
        height: 1.75rem;
        border-radius: 50%;
        background: var(--color-surface, #f7f6f3);
        color: var(--color-ink-soft, #6b6b63);
        font-family: var(--font-mono, monospace);
        font-weight: 700;
        font-size: 0.8rem;
        margin-right: 0.875rem;
        flex-shrink: 0;
        transition: background 0.15s, color 0.15s;
      }

      .mat-mdc-radio-checked .option-number {
        background: var(--sun-400, #facc15);
        color: #1a1a18;
      }

      .option-text {
        flex: 1;
        font-family: var(--font-sans, sans-serif);
        font-size: 0.95rem;
        line-height: 1.5;
        color: var(--color-ink, #1a1a18);
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
        .option-item { padding: 0.75rem; }
      }
    `,
  ],
})
export class MultipleChoiceTaskComponent {
  @Input({ required: true }) task!: MultipleChoiceTask;
  @Output() answerSelected = new EventEmitter<string>();

  protected selectedOptionValue: number | null = null;
  protected showHints = signal(false);

  @HostListener('window:keydown', ['$event'])
  handleKeyboardInput(event: KeyboardEvent): void {
    if (event.key >= '1' && event.key <= '4') {
      const index = parseInt(event.key, 10) - 1;
      if (index < this.task.options.length) {
        this.selectedOptionValue = index;
        this.onSelectionChange(index);
      }
    } else if (event.key === 'h' || event.key === 'H' || event.key === 'п' || event.key === 'П') {
      this.showHints.set(!this.showHints());
    }
  }

  protected onSelectionChange(selected: number | null): void {
    if (selected !== null) {
      this.answerSelected.emit(this.task.options[selected]);
    }
  }
}
