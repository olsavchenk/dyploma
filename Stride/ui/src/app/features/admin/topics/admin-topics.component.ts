import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { AdminTopicsService } from '@app/core/services/admin-topics.service';
import { AdminSubjectsService } from '@app/core/services/admin-subjects.service';
import { Topic, Subject } from '@app/core/models/admin-content.models';
import { TopicDialogComponent } from './dialogs/topic-dialog.component';

@Component({
  selector: 'app-admin-topics',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatSelectModule,
    MatFormFieldModule,
  ],
  templateUrl: './admin-topics.component.html',
  styleUrl: './admin-topics.component.scss',
})
export class AdminTopicsComponent implements OnInit {
  private readonly svc = inject(AdminTopicsService);
  private readonly subjectsSvc = inject(AdminSubjectsService);
  private readonly dialog = inject(MatDialog);
  private readonly snack = inject(MatSnackBar);

  topics = signal<Topic[]>([]);
  subjects = signal<Subject[]>([]);
  loading = signal(false);
  total = signal(0);
  selectedSubjectId = signal<string>('');

  readonly displayedColumns = ['name', 'subject', 'difficultyLevel', 'sortOrder', 'isActive', 'actions'];

  ngOnInit(): void {
    this.subjectsSvc.getAll(1, 100).subscribe((res) => this.subjects.set(res.items));
    this.load();
  }

  load(): void {
    this.loading.set(true);
    const subjectId = this.selectedSubjectId() || undefined;
    this.svc.getAll(1, 50, '', subjectId).subscribe({
      next: (res) => {
        this.topics.set(res.items);
        this.total.set(res.total);
        this.loading.set(false);
      },
      error: () => {
        this.snack.open('Помилка завантаження тем', 'OK', { duration: 3000 });
        this.loading.set(false);
      },
    });
  }

  onSubjectFilter(subjectId: string): void {
    this.selectedSubjectId.set(subjectId);
    this.load();
  }

  subjectName(id: string): string {
    return this.subjects().find((s) => s.id === id)?.name ?? id;
  }

  openCreate(): void {
    const ref = this.dialog.open(TopicDialogComponent, { data: null, width: '500px' });
    ref.afterClosed().subscribe((result) => {
      if (result) {
        this.svc.create(result).subscribe({
          next: () => { this.snack.open('Тему створено', 'OK', { duration: 2000 }); this.load(); },
          error: () => this.snack.open('Помилка створення', 'OK', { duration: 3000 }),
        });
      }
    });
  }

  openEdit(topic: Topic): void {
    const ref = this.dialog.open(TopicDialogComponent, { data: topic, width: '500px' });
    ref.afterClosed().subscribe((result) => {
      if (result) {
        this.svc.update(topic.id, result).subscribe({
          next: () => { this.snack.open('Тему оновлено', 'OK', { duration: 2000 }); this.load(); },
          error: () => this.snack.open('Помилка оновлення', 'OK', { duration: 3000 }),
        });
      }
    });
  }

  delete(topic: Topic): void {
    if (!confirm(`Видалити тему "${topic.name}"?`)) return;
    this.svc.delete(topic.id).subscribe({
      next: () => { this.snack.open('Тему видалено', 'OK', { duration: 2000 }); this.load(); },
      error: () => this.snack.open('Помилка видалення', 'OK', { duration: 3000 }),
    });
  }
}
