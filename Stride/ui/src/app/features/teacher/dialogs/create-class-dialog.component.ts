import { Component, DestroyRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { MatDialogRef, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateModule } from '@ngx-translate/core';
import { TeacherService } from '@app/core/services/teacher.service';
import { LearningService } from '@app/core/services/learning.service';
import { Class, CreateClassRequest, UpdateClassRequest } from '@app/core/models';

interface CreateClassDialogData {
  mode?: 'create' | 'edit';
  cls?: Class | null;
  existingNames?: string[];
}

function duplicateNameValidator(existing: string[], currentName: string | null): ValidatorFn {
  const lowerSet = new Set((existing ?? []).map((n) => (n ?? '').trim().toLowerCase()));
  const lowerCurrent = (currentName ?? '').trim().toLowerCase();
  return (control: AbstractControl): ValidationErrors | null => {
    const v = (control.value ?? '').toString().trim().toLowerCase();
    if (!v) return null;
    if (v === lowerCurrent) return null;
    return lowerSet.has(v) ? { duplicateName: true } : null;
  };
}

@Component({
  selector: 'app-create-class-dialog',
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
    TranslateModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ isEdit() ? 'Редагувати Клас' : 'Створити Новий Клас' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="create-class-form">
        <mat-form-field appearance="outline">
          <mat-label>Назва класу</mat-label>
          <input
            matInput
            formControlName="name"
            placeholder="Наприклад: 8-А Математика"
            required
          />
          <mat-error *ngIf="form.get('name')?.hasError('required')">
            Назва обов'язкова
          </mat-error>
          <mat-error *ngIf="form.get('name')?.hasError('maxlength')">
            Максимум 100 символів
          </mat-error>
          <mat-error *ngIf="form.get('name')?.hasError('duplicateName')">
            {{ 'teacher.classes.duplicateName' | translate }}
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Клас</mat-label>
          <mat-select formControlName="gradeLevel" required>
            <mat-option [value]="1">1 клас</mat-option>
            <mat-option [value]="2">2 клас</mat-option>
            <mat-option [value]="3">3 клас</mat-option>
            <mat-option [value]="4">4 клас</mat-option>
            <mat-option [value]="5">5 клас</mat-option>
            <mat-option [value]="6">6 клас</mat-option>
            <mat-option [value]="7">7 клас</mat-option>
            <mat-option [value]="8">8 клас</mat-option>
            <mat-option [value]="9">9 клас</mat-option>
            <mat-option [value]="10">10 клас</mat-option>
            <mat-option [value]="11">11 клас</mat-option>
          </mat-select>
          <mat-error *ngIf="form.get('gradeLevel')?.hasError('required')">
            Клас обов'язковий
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Предмет</mat-label>
          <mat-select formControlName="subject">
            <mat-option [value]="null">— Без предмета —</mat-option>
            <mat-option *ngFor="let s of subjects()" [value]="s.name">
              {{ s.name }}
            </mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Опис</mat-label>
          <textarea
            matInput
            formControlName="description"
            rows="3"
            maxlength="1000"
            placeholder="Короткий опис класу (необов'язково)"
          ></textarea>
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
        (click)="submit()"
      >
        <mat-spinner diameter="20" *ngIf="loading()"></mat-spinner>
        <span *ngIf="!loading()">{{ isEdit() ? 'Зберегти' : 'Створити' }}</span>
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      mat-dialog-content {
        overflow: hidden;
        max-height: none;
      }

      .create-class-form {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        min-width: 400px;
        padding: 1rem 0;

        @media (max-width: 500px) {
          min-width: 280px;
        }
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
        padding: 1rem 0 0;
        margin: 0;

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
export class CreateClassDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly teacherService = inject(TeacherService);
  private readonly learningService = inject(LearningService);
  private readonly dialogRef = inject(MatDialogRef<CreateClassDialogComponent>);
  private readonly destroyRef = inject(DestroyRef);
  private readonly data = inject<CreateClassDialogData>(MAT_DIALOG_DATA, { optional: true }) ?? {};

  readonly loading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly subjects = signal<Array<{ id: string; name: string }>>([]);
  readonly isEdit = signal<boolean>(this.data.mode === 'edit' && !!this.data.cls);

  readonly form: FormGroup = this.fb.group({
    name: [
      this.data.cls?.name ?? '',
      [
        Validators.required,
        Validators.maxLength(100),
        duplicateNameValidator(this.data.existingNames ?? [], this.data.cls?.name ?? null),
      ],
    ],
    gradeLevel: [this.data.cls ? Number(this.data.cls.gradeLevel) : '', Validators.required],
    subject: [this.data.cls?.subject ?? null],
    description: [this.data.cls?.description ?? '', [Validators.maxLength(1000)]],
  });

  constructor() {
    this.learningService.getSubjects()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (subjects) => {
          this.subjects.set(
            (subjects ?? []).map((s: { id: string; name: string }) => ({ id: s.id, name: s.name }))
          );
        },
        error: () => this.subjects.set([]),
      });
  }

  submit(): void {
    if (this.form.invalid) {
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    const payloadName = (this.form.value.name ?? '').trim();
    const payloadSubject = this.form.value.subject ?? null;
    const payloadDescription = (this.form.value.description ?? '').trim() || null;

    if (this.isEdit() && this.data.cls) {
      const update: UpdateClassRequest = {
        name: payloadName,
        gradeLevel: this.form.value.gradeLevel,
        subject: payloadSubject,
        description: payloadDescription,
      };
      this.teacherService.updateClass(this.data.cls.id, update)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (result) => {
            this.loading.set(false);
            this.dialogRef.close(result);
          },
          error: (error) => this.handleError(error),
        });
    } else {
      const request: CreateClassRequest = {
        name: payloadName,
        gradeLevel: this.form.value.gradeLevel,
        subject: payloadSubject,
        description: payloadDescription,
      };
      this.teacherService.createClass(request)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (result) => {
            this.loading.set(false);
            this.dialogRef.close(result);
          },
          error: (error) => this.handleError(error),
        });
    }
  }

  private handleError(error: { status?: number; error?: { message?: string } }): void {
    this.loading.set(false);
    if (error.status === 409) {
      this.errorMessage.set(error.error?.message || 'Клас з такою назвою вже існує');
    } else {
      this.errorMessage.set(
        error.error?.message || 'Не вдалося зберегти клас. Спробуйте ще раз.'
      );
    }
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
