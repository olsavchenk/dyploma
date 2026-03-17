import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TeacherService } from '@app/core/services/teacher.service';
import { CreateClassRequest } from '@app/core/models';

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
  ],
  template: `
    <h2 mat-dialog-title>Створити Новий Клас</h2>
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
  private readonly dialogRef = inject(MatDialogRef<CreateClassDialogComponent>);

  readonly loading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  readonly form: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    gradeLevel: ['', Validators.required],
  });

  create(): void {
    if (this.form.invalid) {
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    const request: CreateClassRequest = {
      name: this.form.value.name.trim(),
      gradeLevel: this.form.value.gradeLevel,
    };

    this.teacherService.createClass(request).subscribe({
      next: (result) => {
        this.loading.set(false);
        this.dialogRef.close(result);
      },
      error: (error) => {
        this.loading.set(false);
        this.errorMessage.set(
          error.error?.message || 'Не вдалося створити клас. Спробуйте ще раз.'
        );
      },
    });
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
