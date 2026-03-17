import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-reject-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>Reject Template</h2>
    <mat-dialog-content>
      <p>You are about to reject this {{ data.taskType }} task template.</p>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Reason (optional)</mat-label>
        <textarea 
          matInput 
          [(ngModel)]="reason" 
          rows="4" 
          placeholder="e.g., Incorrect answer, unclear question, inappropriate content...">
        </textarea>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancel</button>
      <button mat-raised-button color="warn" (click)="onConfirm()">Reject Template</button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .full-width {
        width: 100%;
      }

      mat-dialog-content {
        padding: 1rem 0;
      }

      p {
        margin-bottom: 1rem;
      }
    `,
  ],
})
export class RejectDialogComponent {
  reason = '';

  constructor(
    public dialogRef: MatDialogRef<RejectDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { taskType: string }
  ) {}

  onCancel(): void {
    this.dialogRef.close();
  }

  onConfirm(): void {
    this.dialogRef.close({ reason: this.reason });
  }
}
