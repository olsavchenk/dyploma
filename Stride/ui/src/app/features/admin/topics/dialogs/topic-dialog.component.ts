import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSliderModule } from '@angular/material/slider';
import { AdminSubjectsService } from '@app/core/services/admin-subjects.service';
import { Subject, Topic } from '@app/core/models/admin-content.models';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

@Component({
  selector: 'app-topic-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatSliderModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data ? 'Редагувати тему' : 'Нова тема' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="dialog-form">
        <mat-form-field appearance="outline">
          <mat-label>Предмет</mat-label>
          <mat-select formControlName="subjectId">
            @for (s of subjects(); track s.id) {
              <mat-option [value]="s.id">{{ s.name }}</mat-option>
            }
          </mat-select>
          <mat-error *ngIf="form.get('subjectId')?.hasError('required')">Обов'язкове поле</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Назва</mat-label>
          <input matInput formControlName="name" />
          <mat-error *ngIf="form.get('name')?.hasError('required')">Обов'язкове поле</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Опис</mat-label>
          <textarea matInput formControlName="description" rows="3"></textarea>
        </mat-form-field>

        <div class="slider-field">
          <label class="slider-label">Рівень складності: {{ form.get('difficultyLevel')?.value }}</label>
          <mat-slider min="1" max="5" step="1" showTickMarks discrete>
            <input matSliderThumb formControlName="difficultyLevel" />
          </mat-slider>
        </div>

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
      min-width: 420px;
      padding-top: 8px;
    }
    mat-form-field { width: 100%; }
    .slider-field { padding: 8px 0; }
    .slider-label {
      display: block;
      font-size: 0.85rem;
      color: rgba(0,0,0,.6);
      margin-bottom: 4px;
    }
    mat-slider { width: 100%; }
  `],
})
export class TopicDialogComponent implements OnInit {
  readonly dialogRef = inject(MatDialogRef<TopicDialogComponent>);
  readonly data: Topic | null = inject(MAT_DIALOG_DATA);
  private readonly fb = inject(FormBuilder);
  private readonly subjectsSvc = inject(AdminSubjectsService);

  form!: FormGroup;

  subjects = toSignal(
    this.subjectsSvc.getAll(1, 100).pipe(map((r) => r.items)),
    { initialValue: [] as Subject[] }
  );

  ngOnInit(): void {
    this.form = this.fb.group({
      subjectId: [this.data?.subjectId ?? '', Validators.required],
      name: [this.data?.name ?? '', Validators.required],
      description: [this.data?.description ?? ''],
      difficultyLevel: [this.data?.difficultyLevel ?? 1],
      sortOrder: [this.data?.sortOrder ?? 0],
    });
  }

  save(): void {
    if (this.form.valid) {
      this.dialogRef.close(this.form.value);
    }
  }
}
