import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { finalize } from 'rxjs';
import { UserService, UserProfile, UpdateProfileRequest } from '@app/core';
import { LoggingService } from '@app/core/services/logging.service';

@Component({
  selector: 'app-edit-profile-dialog',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="dialog-container">
      <h2 mat-dialog-title>
        <mat-icon>edit</mat-icon>
        Редагувати профіль
      </h2>

      <mat-dialog-content>
        @if (error()) {
          <div class="error-message">
            <mat-icon>error_outline</mat-icon>
            <span>{{ error() }}</span>
          </div>
        }

        <form [formGroup]="form" class="edit-form">
          <mat-form-field appearance="outline">
            <mat-label>Ім'я</mat-label>
            <input
              matInput
              formControlName="displayName"
              placeholder="Введіть ваше ім'я"
              maxlength="100" />
            <mat-icon matPrefix>person</mat-icon>
            @if (form.controls['displayName'].hasError('required')) {
              <mat-error>Ім'я обов'язкове</mat-error>
            }
            @if (form.controls['displayName'].hasError('minlength')) {
              <mat-error>Ім'я має містити мінімум 2 символи</mat-error>
            }
          </mat-form-field>

          @if (isTeacher) {
            <mat-form-field appearance="outline">
              <mat-label>Школа</mat-label>
              <input
                matInput
                formControlName="school"
                placeholder="Назва школи"
                maxlength="200" />
              <mat-icon matPrefix>business</mat-icon>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Класи</mat-label>
              <input
                matInput
                formControlName="gradesTaught"
                placeholder="Наприклад: 5-7 класи"
                maxlength="100" />
              <mat-icon matPrefix>groups</mat-icon>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Предмети</mat-label>
              <input
                matInput
                formControlName="subjectsExpertise"
                placeholder="Наприклад: Математика, Фізика"
                maxlength="200" />
              <mat-icon matPrefix>menu_book</mat-icon>
            </mat-form-field>
          }
        </form>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button
          mat-button
          [disabled]="saving()"
          (click)="onCancel()">
          Скасувати
        </button>
        <button
          mat-raised-button
          color="primary"
          [disabled]="!form.valid || saving()"
          (click)="onSave()">
          @if (saving()) {
            <mat-spinner diameter="20"></mat-spinner>
          } @else {
            <mat-icon>save</mat-icon>
          }
          Зберегти
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .dialog-container {
      max-width: 500px;
    }

    h2[mat-dialog-title] {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin: 0;
      padding: 1.5rem 1.5rem 0 1.5rem;
      color: rgba(0, 0, 0, 0.87);
    }

    h2[mat-dialog-title] mat-icon {
      color: #6366F1;
    }

    mat-dialog-content {
      padding: 1.5rem;
      max-height: 70vh;
      overflow-y: auto;
    }

    .error-message {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      background: #FEE2E2;
      border: 1px solid #FECACA;
      border-radius: 8px;
      color: #991B1B;
      margin-bottom: 1.5rem;
      font-size: 0.875rem;
    }

    .error-message mat-icon {
      color: #DC2626;
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .edit-form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    mat-form-field {
      width: 100%;
    }

    mat-dialog-actions {
      padding: 1rem 1.5rem;
      gap: 0.75rem;
    }

    mat-dialog-actions button {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
  `],
})
export class EditProfileDialogComponent implements OnInit {
  private readonly userService = inject(UserService);
  private readonly dialogRef = inject(MatDialogRef<EditProfileDialogComponent>);
  private readonly data = inject<{ profile: UserProfile }>(MAT_DIALOG_DATA);
  private readonly fb = inject(FormBuilder);
  private readonly logger = inject(LoggingService);

  protected readonly form: FormGroup;
  protected readonly saving = signal<boolean>(false);
  protected readonly error = signal<string | null>(null);
  protected readonly isTeacher: boolean;

  constructor() {
    this.isTeacher = this.data.profile.role === 'Teacher';

    this.form = this.fb.group({
      displayName: [
        this.data.profile.displayName,
        [Validators.required, Validators.minLength(2), Validators.maxLength(100)],
      ],
      school: [this.data.profile.teacherStats?.school || ''],
      gradesTaught: [this.data.profile.teacherStats?.gradesTaught || ''],
      subjectsExpertise: [this.data.profile.teacherStats?.subjectsExpertise || ''],
    });
  }

  ngOnInit(): void {}

  protected onCancel(): void {
    this.dialogRef.close();
  }

  protected onSave(): void {
    if (!this.form.valid) {
      return;
    }

    this.saving.set(true);
    this.error.set(null);

    const request: UpdateProfileRequest = {
      displayName: this.form.value.displayName?.trim(),
    };

    if (this.isTeacher) {
      if (this.form.value.school?.trim()) {
        request.school = this.form.value.school.trim();
      }
      if (this.form.value.gradesTaught?.trim()) {
        request.gradesTaught = this.form.value.gradesTaught.trim();
      }
      if (this.form.value.subjectsExpertise?.trim()) {
        request.subjectsExpertise = this.form.value.subjectsExpertise.trim();
      }
    }

    this.userService
      .updateUserProfile(request)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (updatedProfile) => {
          this.dialogRef.close(updatedProfile);
        },
        error: (err) => {
          this.logger.error('EditProfileDialogComponent', 'Failed to update profile', {}, err);
          this.error.set('Не вдалося оновити профіль. Спробуйте ще раз.');
        },
      });
  }
}
