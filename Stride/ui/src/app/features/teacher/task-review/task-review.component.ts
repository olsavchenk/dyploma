import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatExpansionModule } from '@angular/material/expansion';
import { SelectionModel } from '@angular/cdk/collections';
import { TaskGenerationService } from '@app/core/services/task-generation.service';
import {
  TaskTemplateListItem,
  TaskTemplateDetail,
  TaskReviewFilters,
} from '@app/core/models';

@Component({
  selector: 'app-task-review',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatCheckboxModule,
    MatSelectModule,
    MatFormFieldModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatChipsModule,
    MatTooltipModule,
    MatExpansionModule,
  ],
  templateUrl: './task-review.component.html',
  styleUrls: ['./task-review.component.scss'],
})
export class TaskReviewComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly taskGenService = inject(TaskGenerationService);
  private readonly snackBar = inject(MatSnackBar);

  readonly topicId = signal<string>('');
  readonly tasks = signal<TaskTemplateListItem[]>([]);
  readonly totalCount = signal<number>(0);
  readonly loading = signal<boolean>(true);
  readonly actionLoading = signal<boolean>(false);
  readonly expandedTaskId = signal<string | null>(null);
  readonly expandedDetail = signal<TaskTemplateDetail | null>(null);

  readonly selection = new SelectionModel<string>(true, []);

  readonly filters = signal<TaskReviewFilters>({
    page: 1,
    pageSize: 20,
  });

  readonly displayedColumns = ['select', 'question', 'taskType', 'difficultyBand', 'reviewStatus', 'actions'];

  readonly taskTypeLabels: Record<string, string> = {
    multiple_choice: 'Вибір',
    fill_blank: 'Заповнити',
    true_false: 'Так/Ні',
    matching: 'Відповідність',
    ordering: 'Порядок',
  };

  readonly statusLabels: Record<string, string> = {
    Pending: 'Очікує',
    Approved: 'Затверджено',
    Rejected: 'Відхилено',
  };

  readonly isAllSelected = computed(() => {
    const items = this.tasks();
    return items.length > 0 && this.selection.selected.length === items.length;
  });

  readonly hasSelection = computed(() => this.selection.selected.length > 0);

  ngOnInit(): void {
    const topicId = this.route.snapshot.paramMap.get('topicId');
    if (topicId) {
      this.topicId.set(topicId);
      this.loadTasks();
    }
  }

  loadTasks(): void {
    this.loading.set(true);
    this.selection.clear();

    this.taskGenService.getTopicTasks(this.topicId(), this.filters()).subscribe({
      next: (result) => {
        this.tasks.set(result.items);
        this.totalCount.set(result.totalCount);
        this.loading.set(false);
      },
      error: () => {
        this.snackBar.open('Не вдалося завантажити завдання', 'OK', { duration: 3000 });
        this.loading.set(false);
      },
    });
  }

  onPageChange(event: PageEvent): void {
    this.filters.update((f) => ({
      ...f,
      page: event.pageIndex + 1,
      pageSize: event.pageSize,
    }));
    this.loadTasks();
  }

  onFilterChange(key: keyof TaskReviewFilters, value: string | number | undefined): void {
    this.filters.update((f) => ({
      ...f,
      [key]: value || undefined,
      page: 1,
    }));
    this.loadTasks();
  }

  toggleAll(): void {
    if (this.isAllSelected()) {
      this.selection.clear();
    } else {
      this.selection.select(...this.tasks().map((t) => t.id));
    }
  }

  toggleExpand(task: TaskTemplateListItem): void {
    if (this.expandedTaskId() === task.id) {
      this.expandedTaskId.set(null);
      this.expandedDetail.set(null);
      return;
    }
    this.expandedTaskId.set(task.id);
    this.expandedDetail.set(null);
    this.taskGenService.getTaskDetail(this.topicId(), task.id).subscribe({
      next: (detail) => this.expandedDetail.set(detail),
    });
  }

  approve(templateId: string): void {
    this.actionLoading.set(true);
    this.taskGenService.approveTask(this.topicId(), templateId).subscribe({
      next: () => {
        this.snackBar.open('Завдання затверджено', 'OK', { duration: 2000 });
        this.actionLoading.set(false);
        this.loadTasks();
      },
      error: () => {
        this.snackBar.open('Помилка', 'OK', { duration: 3000 });
        this.actionLoading.set(false);
      },
    });
  }

  reject(templateId: string): void {
    this.actionLoading.set(true);
    this.taskGenService.rejectTask(this.topicId(), templateId).subscribe({
      next: () => {
        this.snackBar.open('Завдання відхилено', 'OK', { duration: 2000 });
        this.actionLoading.set(false);
        this.loadTasks();
      },
      error: () => {
        this.snackBar.open('Помилка', 'OK', { duration: 3000 });
        this.actionLoading.set(false);
      },
    });
  }

  deleteTask(templateId: string): void {
    this.actionLoading.set(true);
    this.taskGenService.deleteTask(this.topicId(), templateId).subscribe({
      next: () => {
        this.snackBar.open('Завдання видалено', 'OK', { duration: 2000 });
        this.actionLoading.set(false);
        this.loadTasks();
      },
      error: () => {
        this.snackBar.open('Помилка', 'OK', { duration: 3000 });
        this.actionLoading.set(false);
      },
    });
  }

  bulkApprove(): void {
    this.actionLoading.set(true);
    this.taskGenService
      .bulkAction(this.topicId(), { action: 'approve', templateIds: this.selection.selected })
      .subscribe({
        next: () => {
          this.snackBar.open(`${this.selection.selected.length} завдань затверджено`, 'OK', {
            duration: 2000,
          });
          this.actionLoading.set(false);
          this.loadTasks();
        },
        error: () => {
          this.snackBar.open('Помилка', 'OK', { duration: 3000 });
          this.actionLoading.set(false);
        },
      });
  }

  bulkReject(): void {
    this.actionLoading.set(true);
    this.taskGenService
      .bulkAction(this.topicId(), { action: 'reject', templateIds: this.selection.selected })
      .subscribe({
        next: () => {
          this.snackBar.open(`${this.selection.selected.length} завдань відхилено`, 'OK', {
            duration: 2000,
          });
          this.actionLoading.set(false);
          this.loadTasks();
        },
        error: () => {
          this.snackBar.open('Помилка', 'OK', { duration: 3000 });
          this.actionLoading.set(false);
        },
      });
  }

  bulkDelete(): void {
    this.actionLoading.set(true);
    this.taskGenService
      .bulkAction(this.topicId(), { action: 'delete', templateIds: this.selection.selected })
      .subscribe({
        next: () => {
          this.snackBar.open(`${this.selection.selected.length} завдань видалено`, 'OK', {
            duration: 2000,
          });
          this.actionLoading.set(false);
          this.loadTasks();
        },
        error: () => {
          this.snackBar.open('Помилка', 'OK', { duration: 3000 });
          this.actionLoading.set(false);
        },
      });
  }

  goBack(): void {
    this.router.navigate(['/teacher/classes']);
  }

  getTaskTypeLabel(type: string): string {
    return this.taskTypeLabels[type] || type;
  }

  getStatusLabel(status: string): string {
    return this.statusLabels[status] || status;
  }
}
