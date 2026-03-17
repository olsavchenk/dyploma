import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AdminService } from '@app/core/services';
import { LoggingService } from '@app/core/services/logging.service';
import { ReviewQueueItem } from '@app/core/models';
import { RejectDialogComponent } from './reject-dialog/reject-dialog.component';

@Component({
  selector: 'app-ai-review',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatTooltipModule,
  ],
  templateUrl: './ai-review.component.html',
  styleUrls: ['./ai-review.component.scss'],
})
export class AiReviewComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  private readonly logger = inject(LoggingService);

  // State
  isLoading = signal(false);
  items = signal<ReviewQueueItem[]>([]);
  totalCount = signal(0);
  page = signal(1);
  pageSize = signal(20);
  selectedTaskType = signal<string | undefined>(undefined);
  selectedDifficultyBand = signal<number | undefined>(undefined);
  expandedItemId = signal<string | null>(null);

  // Computed
  hasItems = computed(() => this.items().length > 0);

  // Table columns
  displayedColumns: string[] = ['subject', 'topic', 'taskType', 'difficulty', 'provider', 'createdAt', 'actions'];

  // Options
  taskTypes = [
    { value: 'multiple_choice', label: 'Multiple Choice' },
    { value: 'fill_blank', label: 'Fill in the Blank' },
    { value: 'true_false', label: 'True/False' },
    { value: 'matching', label: 'Matching' },
    { value: 'ordering', label: 'Ordering' },
  ];

  difficultyBands = Array.from({ length: 10 }, (_, i) => i + 1);

  ngOnInit(): void {
    this.loadReviewQueue();
  }

  loadReviewQueue(): void {
    this.isLoading.set(true);

    const request = {
      page: this.page(),
      pageSize: this.pageSize(),
      taskType: this.selectedTaskType(),
      difficultyBand: this.selectedDifficultyBand(),
    };

    this.adminService.getReviewQueue(request).subscribe({
      next: (response) => {
        this.items.set(response.items);
        this.totalCount.set(response.totalCount);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.logger.error('AiReviewComponent', 'Failed to load review queue', {}, error);
        this.snackBar.open('Failed to load review queue', 'Close', { duration: 3000 });
        this.isLoading.set(false);
      },
    });
  }

  onPageChange(event: PageEvent): void {
    this.page.set(event.pageIndex + 1);
    this.pageSize.set(event.pageSize);
    this.loadReviewQueue();
  }

  onFilterChange(): void {
    this.page.set(1);
    this.loadReviewQueue();
  }

  clearFilters(): void {
    this.selectedTaskType.set(undefined);
    this.selectedDifficultyBand.set(undefined);
    this.page.set(1);
    this.loadReviewQueue();
  }

  toggleExpand(itemId: string): void {
    this.expandedItemId.set(this.expandedItemId() === itemId ? null : itemId);
  }

  approveTemplate(item: ReviewQueueItem): void {
    if (confirm(`Are you sure you want to approve this ${item.taskType} task?`)) {
      this.adminService.approveTemplate(item.id).subscribe({
        next: () => {
          this.snackBar.open('Template approved successfully', 'Close', { duration: 3000 });
          this.loadReviewQueue();
        },
        error: (error) => {
          this.logger.error('AiReviewComponent', 'Failed to approve template', {}, error);
          this.snackBar.open('Failed to approve template', 'Close', { duration: 3000 });
        },
      });
    }
  }

  rejectTemplate(item: ReviewQueueItem): void {
    const dialogRef = this.dialog.open(RejectDialogComponent, {
      width: '400px',
      data: { taskType: item.taskType },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.adminService.rejectTemplate(item.id, result.reason).subscribe({
          next: () => {
            this.snackBar.open('Template rejected successfully', 'Close', { duration: 3000 });
            this.loadReviewQueue();
          },
          error: (error) => {
            this.logger.error('AiReviewComponent', 'Failed to reject template', {}, error);
            this.snackBar.open('Failed to reject template', 'Close', { duration: 3000 });
          },
        });
      }
    });
  }

  getTaskTypeLabel(taskType: string): string {
    const type = this.taskTypes.find((t) => t.value === taskType);
    return type ? type.label : taskType;
  }

  getTaskTypeColor(taskType: string): string {
    const colors: Record<string, string> = {
      multiple_choice: 'primary',
      fill_blank: 'accent',
      true_false: 'warn',
      matching: 'primary',
      ordering: 'accent',
    };
    return colors[taskType] || '';
  }

  getDifficultyColor(band: number): string {
    if (band <= 3) return 'success';
    if (band <= 7) return 'primary';
    return 'warn';
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('uk-UA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  formatContent(content: any): string {
    return JSON.stringify(content, null, 2);
  }
}

