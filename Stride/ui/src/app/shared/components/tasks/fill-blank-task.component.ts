import {
  Component,
  Input,
  Output,
  EventEmitter,
  signal,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FillBlankTask } from '@app/core';
import { SafeHtmlPipe } from '@app/shared/pipes/safe-html.pipe';

interface BlankSegment {
  type: 'text' | 'blank';
  content: string;
  index?: number;
}

@Component({
  selector: 'app-fill-blank-task',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatInputModule, MatFormFieldModule, SafeHtmlPipe],
  template: `
    <div class="fill-blank-task">
      <div class="question-container">
        @for (segment of segments(); track $index) {
          @if (segment.type === 'text') {
            <span class="text-segment" [innerHTML]="segment.content | safeHtml"></span>
          } @else {
            <mat-form-field class="blank-input" appearance="outline">
              <input
                matInput
                [formControl]="getBlankControl(segment.index!)"
                [placeholder]="'Відповідь ' + (segment.index! + 1)"
                (input)="onInputChange()"
                autocomplete="off"
              />
            </mat-form-field>
          }
        }
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
      .fill-blank-task {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
      }

      .question-container {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.5rem;
        font-size: 1.125rem;
        line-height: 1.8;
        color: #1a202c;
      }

      .text-segment {
        display: inline;
      }

      .blank-input {
        display: inline-flex;
        vertical-align: middle;
        margin: 0 0.25rem;
        min-width: 120px;
        max-width: 200px;

        ::ng-deep {
          .mat-mdc-form-field-subscript-wrapper {
            display: none;
          }

          .mat-mdc-text-field-wrapper {
            padding-bottom: 0;
          }

          .mat-mdc-form-field-infix {
            min-height: 40px;
            padding: 8px 0;
          }

          .mdc-notched-outline__notch {
            border-right-style: hidden;
          }
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
        .question-container {
          font-size: 1rem;
        }

        .blank-input {
          min-width: 100px;
          max-width: 150px;
        }
      }
    `,
  ],
})
export class FillBlankTaskComponent implements OnInit {
  @Input({ required: true }) task!: FillBlankTask;
  @Output() answersChanged = new EventEmitter<string[]>();

  protected blanksForm!: FormGroup;
  protected segments = signal<BlankSegment[]>([]);
  protected showHints = signal(false);
  protected blankCount = signal(0);

  ngOnInit(): void {
    this.parseQuestion();
    this.initializeForm();
  }

  private parseQuestion(): void {
    const regex = /\{\{blank\}\}/gi;
    const parts: BlankSegment[] = [];
    let lastIndex = 0;
    let blankIndex = 0;

    let match: RegExpExecArray | null;
    while ((match = regex.exec(this.task.question)) !== null) {
      // Add text before the blank
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: this.task.question.substring(lastIndex, match.index),
        });
      }

      // Add the blank
      parts.push({
        type: 'blank',
        content: '',
        index: blankIndex++,
      });

      lastIndex = regex.lastIndex;
    }

    // Add remaining text
    if (lastIndex < this.task.question.length) {
      parts.push({
        type: 'text',
        content: this.task.question.substring(lastIndex),
      });
    }

    this.segments.set(parts);
    this.blankCount.set(blankIndex);
  }

  private initializeForm(): void {
    const controls: { [key: string]: FormControl } = {};
    for (let i = 0; i < this.blankCount(); i++) {
      controls[`blank${i}`] = new FormControl('', [Validators.required]);
    }
    this.blanksForm = new FormGroup(controls);
  }

  protected getBlankControl(index: number): FormControl {
    return this.blanksForm.get(`blank${index}`) as FormControl;
  }

  protected onInputChange(): void {
    const answers: string[] = [];
    for (let i = 0; i < this.blankCount(); i++) {
      answers.push(this.getBlankControl(i)?.value?.trim() ?? '');
    }
    if (answers.some((a) => a.length > 0)) {
      this.answersChanged.emit(answers);
    }
  }
}
