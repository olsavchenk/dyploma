import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Subject } from '@app/core/models/admin-content.models';

@Component({
  selector: 'app-subject-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data ? 'Редагувати предмет' : 'Новий предмет' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="dialog-form">
        <mat-form-field appearance="outline">
          <mat-label>Назва</mat-label>
          <input matInput formControlName="name" placeholder="Математика" />
          <mat-error *ngIf="form.get('name')?.hasError('required')">Обов'язкове поле</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Slug</mat-label>
          <input matInput formControlName="slug" placeholder="mathematics" />
          <mat-error *ngIf="form.get('slug')?.hasError('required')">Обов'язкове поле</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Опис</mat-label>
          <textarea matInput formControlName="description" rows="3"></textarea>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>URL іконки</mat-label>
          <input matInput formControlName="iconUrl" placeholder="https://..." />
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Порядок сортування</mat-label>
          <input matInput type="number" formControlName="sortOrder" />
        </mat-form-field>
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
      min-width: 400px;
      padding-top: 8px;
    }
    mat-form-field { width: 100%; }
  `],
})
export class SubjectDialogComponent implements OnInit {
  readonly dialogRef = inject(MatDialogRef<SubjectDialogComponent>);
  readonly data: Subject | null = inject(MAT_DIALOG_DATA);
  private readonly fb = inject(FormBuilder);

  form!: FormGroup;

  ngOnInit(): void {
    this.form = this.fb.group({
      name: [this.data?.name ?? '', Validators.required],
      slug: [this.data?.slug ?? '', Validators.required],
      description: [this.data?.description ?? ''],
      iconUrl: [this.data?.iconUrl ?? ''],
      sortOrder: [this.data?.sortOrder ?? 0],
    });
  }

  save(): void {
    if (this.form.valid) {
      this.dialogRef.close(this.form.value);
    }
  }
}
