import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AdminService, UserRole } from '@app/core';
import { LoggingService } from '@app/core/services/logging.service';

export interface ChangeRoleDialogData {
  userId: string;
  displayName: string;
  currentRole: string;
}

export interface ChangeRoleDialogResult {
  success: boolean;
}

@Component({
  selector: 'app-change-role-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatSnackBarModule,
  ],
  templateUrl: './change-role-dialog.component.html',
  styleUrl: './change-role-dialog.component.scss',
})
export class ChangeRoleDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<ChangeRoleDialogComponent>);
  private readonly adminService = inject(AdminService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly logger = inject(LoggingService);
  protected readonly data = inject<ChangeRoleDialogData>(MAT_DIALOG_DATA);

  // State
  protected readonly submitting = signal(false);

  // Form
  protected readonly form = new FormGroup({
    role: new FormControl<UserRole>(this.data.currentRole as UserRole, [
      Validators.required,
    ]),
  });

  // Role options
  protected readonly roles: { value: UserRole; label: string; description: string }[] = [
    {
      value: 'Student',
      label: 'Студент',
      description: 'Може навчатися, виконувати завдання та брати участь у рейтингах',
    },
    {
      value: 'Teacher',
      label: 'Вчитель',
      description: 'Може створювати класи, призначати завдання та переглядати аналітику',
    },
    {
      value: 'Admin',
      label: 'Адміністратор',
      description: 'Повний доступ до управління платформою',
    },
  ];

  protected onSubmit(): void {
    if (this.form.invalid || this.submitting()) {
      return;
    }

    const newRole = this.form.value.role!;

    // Check if role actually changed
    if (newRole === this.data.currentRole) {
      this.snackBar.open('Роль не була змінена', 'Закрити', { duration: 3000 });
      this.dialogRef.close({ success: false });
      return;
    }

    this.submitting.set(true);

    this.adminService.changeUserRole(this.data.userId, { role: newRole }).subscribe({
      next: () => {
        this.snackBar.open(
          `Роль користувача ${this.data.displayName} змінено на ${this.getRoleLabel(newRole)}`,
          'Закрити',
          { duration: 3000 }
        );
        this.dialogRef.close({ success: true });
      },
      error: (err) => {
        this.logger.error('ChangeRoleDialogComponent', 'Failed to change role', { userId: this.data.userId, newRole }, err);
        this.snackBar.open(
          'Не вдалося змінити роль користувача',
          'Закрити',
          { duration: 3000 }
        );
        this.submitting.set(false);
      },
    });
  }

  protected onCancel(): void {
    this.dialogRef.close({ success: false });
  }

  protected getRoleLabel(role: UserRole): string {
    const roleObj = this.roles.find((r) => r.value === role);
    return roleObj ? roleObj.label : role;
  }
}
