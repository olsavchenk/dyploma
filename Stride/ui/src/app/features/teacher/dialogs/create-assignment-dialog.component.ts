import { Component, inject, signal, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TeacherService } from '@app/core/services/teacher.service';
import { LoggingService } from '@app/core/services/logging.service';
import { CreateAssignmentRequest } from '@app/core/models';

@Component({
  selector: 'app-create-assignment-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <h2 mat-dialog-title>Створити Завдання</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="assignment-form">
        <mat-form-field appearance="outline">
          <mat-label>Назва завдання</mat-label>
          <input
            matInput
            formControlName="title"
            placeholder="Наприклад: Домашня робота #1"
            required
          />
          <mat-error *ngIf="form.get('title')?.hasError('required')">
            Назва обов'язкова
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Опис (необов'язково)</mat-label>
          <textarea
            matInput
            formControlName="description"
            rows="3"
            placeholder="Додаткова інформація про завдання"
          ></textarea>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Предмет</mat-label>
          <input
            matInput
            formControlName="subjectName"
            placeholder="Наприклад: Математика"
            required
          />
          <mat-error *ngIf="form.get('subjectName')?.hasError('required')">
            Предмет обов'язковий
          </mat-error>
          <mat-error *ngIf="form.get('subjectName')?.hasError('maxlength')">
            Максимум 200 символів
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Тема</mat-label>
          <input
            matInput
            formControlName="topicName"
            placeholder="Наприклад: Дроби"
            required
          />
          <mat-error *ngIf="form.get('topicName')?.hasError('required')">
            Тема обов'язкова
          </mat-error>
          <mat-error *ngIf="form.get('topicName')?.hasError('maxlength')">
            Максимум 200 символів
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Кількість завдань</mat-label>
          <input
            matInput
            type="number"
            formControlName="taskCount"
            min="1"
            max="100"
            required
          />
          <mat-error *ngIf="form.get('taskCount')?.hasError('required')">
            Кількість обов'язкова
          </mat-error>
          <mat-error *ngIf="form.get('taskCount')?.hasError('min')">
            Мінімум 1 завдання
          </mat-error>
          <mat-error *ngIf="form.get('taskCount')?.hasError('max')">
            Максимум 100 завдань
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Термін здачі (необов'язково)</mat-label>
          <input matInput [matDatepicker]="picker" formControlName="dueDate" />
          <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
          <mat-datepicker #picker></mat-datepicker>
        </mat-form-field>

        <div class="error-message" *ngIf="errorMessage()">
          {{ errorMessage() }}
        </div>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button [disabled]="loading()" (click)="cancel()">Скасувати</button>
      <button
        mat-raised-button
        color="primary"
        [disabled]="form.invalid || loading()"
        (click)="create()"
      >
        <mat-spinner diameter="20" *ngIf="loading()"></mat-spinner>
        <span *ngIf="!loading()">Створити</span>
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      :host {
        display: flex;
        flex-direction: column;
        max-height: 90vh;
        overflow: hidden;
      }

      mat-dialog-content {
        flex: 1;
        overflow-x: hidden;
        overflow-y: auto;
        padding: 0 24px;
      }

      .assignment-form {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        width: 100%;
        padding: 1rem 0;
        box-sizing: border-box;
      }

      mat-form-field {
        width: 100%;
      }

      .error-message {
        padding: 0.75rem;
        background: #ffebee;
        color: #c62828;
        border-radius: 4px;
        font-size: 0.875rem;
      }

      mat-dialog-actions {
        padding: 1rem 24px;
        margin: 0;
        flex-shrink: 0;

        button {
          min-width: 100px;

          mat-spinner {
            display: inline-block;
            margin: 0 auto;
          }
        }
      }
    `,
  ],
})
export class CreateAssignmentDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly teacherService = inject(TeacherService);
  private readonly dialogRef = inject(MatDialogRef<CreateAssignmentDialogComponent>);
  private readonly logger = inject(LoggingService);

  readonly loading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  readonly form: FormGroup = this.fb.group({
    title: ['', [Validators.required, Validators.maxLength(200)]],
    description: [''],
    subjectName: ['', [Validators.required, Validators.maxLength(200)]],
    topicName: ['', [Validators.required, Validators.maxLength(200)]],
    taskCount: [10, [Validators.required, Validators.min(1), Validators.max(100)]],
    dueDate: [null],
  });

  constructor(@Inject(MAT_DIALOG_DATA) public data: { classId: string }) {}

  create(): void {
    if (this.form.invalid) {
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    const request: CreateAssignmentRequest = {
      title: this.form.value.title.trim(),
      description: this.form.value.description?.trim() || undefined,
      subjectName: this.form.value.subjectName.trim(),
      topicName: this.form.value.topicName.trim(),
      taskCount: this.form.value.taskCount,
      dueDate: this.form.value.dueDate
        ? new Date(this.form.value.dueDate).toISOString()
        : undefined,
    };

    this.teacherService.createAssignment(this.data.classId, request).subscribe({
      next: (result) => {
        this.loading.set(false);
        this.dialogRef.close(result);
      },
      error: (error) => {
        this.loading.set(false);
        this.errorMessage.set(
          error.error?.message || 'Не вдалося створити завдання. Спробуйте ще раз.'
        );
      },
    });
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
