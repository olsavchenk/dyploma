import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <mat-dialog-content>
      <p class="confirm-message">{{ data.message }}</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="cancel()">{{ data.cancelText || 'Скасувати' }}</button>
      <button
        mat-raised-button
        [color]="data.danger ? 'warn' : 'primary'"
        (click)="confirm()"
      >
        {{ data.confirmText || 'Підтвердити' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .confirm-message { margin: 0; padding: 0.5rem 0; min-width: 320px; }
    mat-dialog-actions { padding: 1rem 0 0; margin: 0; }
    mat-dialog-actions button { min-width: 100px; }
  `],
})
export class ConfirmDialogComponent {
  readonly data = inject<ConfirmDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<ConfirmDialogComponent>);

  confirm(): void {
    this.dialogRef.close(true);
  }

  cancel(): void {
    this.dialogRef.close(false);
  }
}
