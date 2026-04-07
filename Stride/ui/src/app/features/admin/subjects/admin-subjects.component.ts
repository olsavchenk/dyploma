import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AdminSubjectsService } from '@app/core/services/admin-subjects.service';
import { Subject } from '@app/core/models/admin-content.models';
import { SubjectDialogComponent } from './dialogs/subject-dialog.component';

@Component({
  selector: 'app-admin-subjects',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
  templateUrl: './admin-subjects.component.html',
  styleUrl: './admin-subjects.component.scss',
})
export class AdminSubjectsComponent implements OnInit {
  private readonly svc = inject(AdminSubjectsService);
  private readonly dialog = inject(MatDialog);
  private readonly snack = inject(MatSnackBar);

  subjects = signal<Subject[]>([]);
  loading = signal(false);
  total = signal(0);

  readonly displayedColumns = ['name', 'slug', 'sortOrder', 'isActive', 'actions'];

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.svc.getAll().subscribe({
      next: (res) => {
        this.subjects.set(res.items);
        this.total.set(res.total);
        this.loading.set(false);
      },
      error: () => {
        this.snack.open('Помилка завантаження предметів', 'OK', { duration: 3000 });
        this.loading.set(false);
      },
    });
  }

  openCreate(): void {
    const ref = this.dialog.open(SubjectDialogComponent, { data: null, width: '480px' });
    ref.afterClosed().subscribe((result) => {
      if (result) {
        this.svc.create(result).subscribe({
          next: () => {
            this.snack.open('Предмет створено', 'OK', { duration: 2000 });
            this.load();
          },
          error: () => this.snack.open('Помилка створення', 'OK', { duration: 3000 }),
        });
      }
    });
  }

  openEdit(subject: Subject): void {
    const ref = this.dialog.open(SubjectDialogComponent, { data: subject, width: '480px' });
    ref.afterClosed().subscribe((result) => {
      if (result) {
        this.svc.update(subject.id, result).subscribe({
          next: () => {
            this.snack.open('Предмет оновлено', 'OK', { duration: 2000 });
            this.load();
          },
          error: () => this.snack.open('Помилка оновлення', 'OK', { duration: 3000 }),
        });
      }
    });
  }

  delete(subject: Subject): void {
    if (!confirm(`Видалити предмет "${subject.name}"?`)) return;
    this.svc.delete(subject.id).subscribe({
      next: () => {
        this.snack.open('Предмет видалено', 'OK', { duration: 2000 });
        this.load();
      },
      error: () => this.snack.open('Помилка видалення', 'OK', { duration: 3000 }),
    });
  }
}
