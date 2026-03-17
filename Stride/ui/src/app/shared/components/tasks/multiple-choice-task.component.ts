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
        font-size: 1.125rem;
        font-weight: 500;
        line-height: 1.6;
        color: #1a202c;
      }

      .options-list {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }

      .option-item {
        display: flex;
        align-items: center;
        padding: 1rem;
        border: 2px solid #e2e8f0;
        border-radius: 0.5rem;
        transition: all 0.2s;
        cursor: pointer;
        background: white;

        &:hover {
          border-color: #667eea;
          background-color: #f7fafc;
        }

        &.mat-mdc-radio-checked {
          border-color: #667eea;
          background-color: #eef2ff;
        }
      }

      .option-number {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 1.75rem;
        height: 1.75rem;
        border-radius: 50%;
        background-color: #e2e8f0;
        color: #4a5568;
        font-weight: 600;
        font-size: 0.875rem;
        margin-right: 0.75rem;
        flex-shrink: 0;
      }

      .mat-mdc-radio-checked .option-number {
        background-color: #667eea;
        color: white;
      }

      .option-text {
        flex: 1;
        line-height: 1.5;
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

        .option-item {
          padding: 0.75rem;
        }

        .option-number {
          width: 1.5rem;
          height: 1.5rem;
          font-size: 0.75rem;
        }
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
