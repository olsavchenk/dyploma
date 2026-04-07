import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { Achievement } from '@app/core/models/admin-content.models';

@Component({
  selector: 'app-achievement-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data ? 'Редагувати досягнення' : 'Нове досягнення' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="dialog-form">
        <mat-form-field appearance="outline">
          <mat-label>Код</mat-label>
          <input matInput formControlName="code" placeholder="FIRST_TASK" />
          <mat-error *ngIf="form.get('code')?.hasError('required')">Обов'язкове поле</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Назва</mat-label>
          <input matInput formControlName="name" placeholder="Перший крок" />
          <mat-error *ngIf="form.get('name')?.hasError('required')">Обов'язкове поле</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Опис</mat-label>
          <textarea matInput formControlName="description" rows="2"></textarea>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>URL іконки</mat-label>
          <input matInput formControlName="iconUrl" placeholder="https://..." />
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>XP нагорода</mat-label>
          <input matInput type="number" formControlName="xpReward" min="0" />
          <mat-error *ngIf="form.get('xpReward')?.hasError('required')">Обов'язкове поле</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Критерії розблокування (JSON)</mat-label>
          <textarea matInput formControlName="unlockCriteriaJson" rows="3"
            placeholder='{"tasksCompleted": 1}'></textarea>
          <mat-error *ngIf="form.get('unlockCriteriaJson')?.hasError('invalidJson')">Невалідний JSON</mat-error>
        </mat-form-field>

        <mat-checkbox formControlName="isHidden">Приховане досягнення</mat-checkbox>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="dialogRef.close()">Скасувати</button>
      <button mat-flat-button color="primary" [disabled]="form.invalid" (click)="save()">Зберегти</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-form {
      display: flex;
      flex-direction: column;
      gap: 8px;
      min-width: 440px;
      padding-top: 8px;
    }
    mat-form-field { width: 100%; }
    mat-checkbox { margin: 4px 0 8px; }
  `],
})
export class AchievementDialogComponent implements OnInit {
  readonly dialogRef = inject(MatDialogRef<AchievementDialogComponent>);
  readonly data: Achievement | null = inject(MAT_DIALOG_DATA);
  private readonly fb = inject(FormBuilder);

  form!: FormGroup;

  private jsonValidator(control: { value: string }) {
    try { JSON.parse(control.value); return null; }
    catch { return { invalidJson: true }; }
  }

  ngOnInit(): void {
    this.form = this.fb.group({
      code: [this.data?.code ?? '', Validators.required],
      name: [this.data?.name ?? '', Validators.required],
      description: [this.data?.description ?? ''],
      iconUrl: [this.data?.iconUrl ?? ''],
      xpReward: [this.data?.xpReward ?? 0, Validators.required],
      unlockCriteriaJson: [
        this.data?.unlockCriteria ? JSON.stringify(this.data.unlockCriteria, null, 2) : '{}',
        this.jsonValidator,
      ],
      isHidden: [this.data?.isHidden ?? false],
    });
  }

  save(): void {
    if (this.form.valid) {
      const { unlockCriteriaJson, ...rest } = this.form.value;
      this.dialogRef.close({ ...rest, unlockCriteria: JSON.parse(unlockCriteriaJson) });
    }
  }
}
