import { Component, inject, signal, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TaskGenerationService } from '@app/core/services/task-generation.service';
import { TaskTemplateDetail, UpdateTaskTemplateRequest } from '@app/core/models';

export interface EditTaskDialogData {
  topicId: string;
  task: TaskTemplateDetail;
}

@Component({
  selector: 'app-edit-task-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <h2 mat-dialog-title>Редагувати завдання</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="edit-form">
        <mat-form-field appearance="outline">
          <mat-label>Шаблон питання</mat-label>
          <textarea
            matInput
            formControlName="question"
            rows="4"
            placeholder="Текст або шаблон з {{ '{{var=range:a-b}}' }}"
            required
          ></textarea>
          <mat-error *ngIf="form.get('question')?.hasError('required')">
            Текст обов'язковий
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Правильна відповідь</mat-label>
          <input matInput formControlName="answer" required />
          <mat-error *ngIf="form.get('answer')?.hasError('required')">
            Відповідь обов'язкова
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Пояснення</mat-label>
          <textarea matInput formControlName="explanation" rows="2"></textarea>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Тип</mat-label>
          <mat-select formControlName="taskType">
            <mat-option value="multiple_choice">Множинний вибір</mat-option>
            <mat-option value="fill_blank">Заповнити пропуск</mat-option>
            <mat-option value="true_false">Правда/Хибність</mat-option>
            <mat-option value="matching">Відповідність</mat-option>
            <mat-option value="ordering">Впорядкування</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Складність (1–10)</mat-label>
          <mat-select formControlName="difficultyBand">
            <mat-option *ngFor="let b of bands" [value]="b">Рівень {{ b }}</mat-option>
          </mat-select>
        </mat-form-field>

        <div class="error-message" *ngIf="errorMessage()">{{ errorMessage() }}</div>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button [disabled]="loading()" (click)="cancel()">Скасувати</button>
      <button
        mat-raised-button
        color="primary"
        [disabled]="form.invalid || loading()"
        (click)="save()"
      >
        <mat-spinner diameter="20" *ngIf="loading()"></mat-spinner>
        <span *ngIf="!loading()">Зберегти</span>
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      :host { display: flex; flex-direction: column; max-height: 90vh; overflow: hidden; }
      mat-dialog-content { flex: 1; overflow-y: auto; padding: 0 24px; }
      .edit-form {
        display: flex; flex-direction: column; gap: 1rem;
        width: 100%; padding: 1rem 0; box-sizing: border-box;
        min-width: 420px;
      }
      mat-form-field { width: 100%; }
      .error-message {
        padding: 0.75rem; background: #ffebee; color: #c62828;
        border-radius: 4px; font-size: 0.875rem;
      }
      mat-dialog-actions { padding: 1rem 24px; flex-shrink: 0;
        button { min-width: 100px; }
      }
    `,
  ],
})
export class EditTaskDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<EditTaskDialogComponent>);
  private readonly taskGenService = inject(TaskGenerationService);

  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly bands = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  readonly form: FormGroup;

  constructor(@Inject(MAT_DIALOG_DATA) public data: EditTaskDialogData) {
    const t = data.task;
    this.form = this.fb.group({
      question: [t.question, [Validators.required]],
      answer: [this.stringifyAnswer(t.answer), [Validators.required]],
      explanation: [t.explanation ?? ''],
      taskType: [t.taskType, [Validators.required]],
      difficultyBand: [t.difficultyBand, [Validators.required]],
    });
  }

  save(): void {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.errorMessage.set(null);

    const v = this.form.value;
    const request: UpdateTaskTemplateRequest = {
      question: v.question.trim(),
      answer: v.answer.trim(),
      explanation: v.explanation?.trim() || null,
      taskType: v.taskType,
      difficultyBand: v.difficultyBand,
    };

    this.taskGenService
      .updateTask(this.data.topicId, this.data.task.id, request)
      .subscribe({
        next: (updated) => {
          this.loading.set(false);
          this.dialogRef.close(updated);
        },
        error: (err) => {
          this.loading.set(false);
          this.errorMessage.set(err.error?.message || 'Не вдалося зберегти.');
        },
      });
  }

  cancel(): void { this.dialogRef.close(); }

  private stringifyAnswer(answer: unknown): string {
    if (answer == null) return '';
    if (typeof answer === 'string') return answer;
    return JSON.stringify(answer);
  }
}
