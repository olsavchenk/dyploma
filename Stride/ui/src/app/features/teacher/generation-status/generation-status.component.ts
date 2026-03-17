import { Component, Input, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { Subject, switchMap, timer, takeUntil, tap, filter } from 'rxjs';
import { TaskGenerationService } from '@app/core/services/task-generation.service';
import { TaskGenerationStatus } from '@app/core/models';

@Component({
  selector: 'app-generation-status',
  standalone: true,
  imports: [CommonModule, MatProgressBarModule, MatIconModule, MatButtonModule],
  template: `
    <div class="generation-status" *ngIf="status()">
      <div class="status-header">
        <mat-icon [class]="'status-icon ' + statusClass()">{{ statusIcon() }}</mat-icon>
        <span class="status-text">{{ statusText() }}</span>
      </div>

      <mat-progress-bar
        *ngIf="isActive()"
        mode="determinate"
        [value]="progressPercent()"
      ></mat-progress-bar>

      <div class="status-detail">
        <span>{{ status()!.tasksGenerated }} / {{ status()!.totalTasksRequested }} завдань згенеровано</span>
        <span *ngIf="status()!.tasksFailed > 0" class="failed-count">
          ({{ status()!.tasksFailed }} помилок)
        </span>
      </div>

      <button
        mat-stroked-button
        color="primary"
        *ngIf="isDone() && topicId"
        (click)="openReview()"
        class="review-btn"
      >
        <mat-icon>rate_review</mat-icon>
        Переглянути завдання
      </button>
    </div>
  `,
  styles: [`
    .generation-status {
      padding: 1rem;
      background: #f5f5ff;
      border-radius: 8px;
      border: 1px solid #e0e0f0;
      margin-top: 0.75rem;
    }

    .status-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
    }

    .status-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .status-icon.active { color: #667eea; }
    .status-icon.done { color: #4caf50; }
    .status-icon.partial { color: #ff9800; }
    .status-icon.error { color: #f44336; }

    .status-text {
      font-weight: 500;
      font-size: 0.875rem;
    }

    mat-progress-bar {
      margin-bottom: 0.5rem;
    }

    .status-detail {
      font-size: 0.8rem;
      color: #666;
    }

    .failed-count {
      color: #f44336;
    }

    .review-btn {
      margin-top: 0.75rem;
      mat-icon { margin-right: 0.25rem; }
    }
  `],
})
export class GenerationStatusComponent implements OnInit, OnDestroy {
  @Input({ required: true }) jobId!: string;
  @Input() topicId: string | null = null;

  private readonly taskGenService = inject(TaskGenerationService);
  private readonly router = inject(Router);
  private readonly destroy$ = new Subject<void>();

  readonly status = signal<TaskGenerationStatus | null>(null);

  readonly progressPercent = () => {
    const s = this.status();
    if (!s || s.totalTasksRequested === 0) return 0;
    return Math.round((s.tasksGenerated / s.totalTasksRequested) * 100);
  };

  readonly isActive = () => {
    const s = this.status();
    return s?.status === 'Pending' || s?.status === 'InProgress';
  };

  readonly isDone = () => {
    const s = this.status();
    return s?.status === 'Completed' || s?.status === 'PartiallyCompleted';
  };

  readonly statusIcon = () => {
    switch (this.status()?.status) {
      case 'Pending': return 'hourglass_empty';
      case 'InProgress': return 'autorenew';
      case 'Completed': return 'check_circle';
      case 'PartiallyCompleted': return 'warning';
      case 'Failed': return 'error';
      default: return 'pending';
    }
  };

  readonly statusClass = () => {
    switch (this.status()?.status) {
      case 'Pending':
      case 'InProgress': return 'active';
      case 'Completed': return 'done';
      case 'PartiallyCompleted': return 'partial';
      case 'Failed': return 'error';
      default: return '';
    }
  };

  readonly statusText = () => {
    switch (this.status()?.status) {
      case 'Pending': return 'Генерація в черзі...';
      case 'InProgress': return 'Генеруються завдання...';
      case 'Completed': return 'Генерацію завершено!';
      case 'PartiallyCompleted': return 'Генерацію частково завершено';
      case 'Failed': return 'Помилка генерації';
      default: return '';
    }
  };

  ngOnInit(): void {
    // Poll every 3 seconds until generation is done
    timer(0, 3000)
      .pipe(
        takeUntil(this.destroy$),
        switchMap(() => this.taskGenService.getGenerationStatus(this.jobId)),
        tap((status) => this.status.set(status)),
        filter((s) => !this.isActiveStatus(s.status)),
      )
      .subscribe(() => {
        // Stop polling once done
        this.destroy$.next();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  openReview(): void {
    if (this.topicId) {
      this.router.navigate(['/teacher/topics', this.topicId, 'tasks']);
    }
  }

  private isActiveStatus(status: string): boolean {
    return status === 'Pending' || status === 'InProgress';
  }
}
