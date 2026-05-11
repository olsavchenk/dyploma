import { Component, OnInit, DestroyRef, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { Clipboard, ClipboardModule } from '@angular/cdk/clipboard';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TeacherService } from '@app/core/services/teacher.service';
import { LoggingService } from '@app/core/services/logging.service';
import {
  Class,
  ClassMember,
  ClassAnalytics,
  Assignment,
} from '@app/core/models';
import { CreateAssignmentDialogComponent } from '../dialogs/create-assignment-dialog.component';
import { CreateClassDialogComponent } from '../dialogs/create-class-dialog.component';
import { ConfirmDialogComponent } from '../dialogs/confirm-dialog.component';
import { GenerationStatusComponent } from '../generation-status/generation-status.component';

@Component({
  selector: 'app-class-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatDialogModule,
    MatSnackBarModule,
    MatChipsModule,
    MatMenuModule,
    MatCheckboxModule,
    ClipboardModule,
    GenerationStatusComponent,
  ],
  templateUrl: './class-detail.component.html',
  styleUrls: ['./class-detail.component.scss'],
})
export class ClassDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly teacherService = inject(TeacherService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly clipboard = inject(Clipboard);
  private readonly logger = inject(LoggingService);
  private readonly destroyRef = inject(DestroyRef);

  readonly classInfo = signal<Class | null>(null);
  readonly students = signal<ClassMember[]>([]);
  readonly analytics = signal<ClassAnalytics | null>(null);
  readonly assignments = signal<Assignment[]>([]);
  readonly loading = signal<boolean>(true);
  readonly selectedTab = signal<number>(0);

  // M-22: bulk-select state. Currently used for student rows. The pending join-request
  // feature does not exist yet; bulk approve/reject will be wired when it ships.
  readonly selectedStudentIds = signal<Set<string>>(new Set());
  readonly hasSelection = computed(() => this.selectedStudentIds().size > 0);

  readonly studentColumns = ['select', 'avatar', 'name', 'level', 'accuracy', 'tasksCompleted', 'lastActive', 'actions'];

  ngOnInit(): void {
    const classId = this.route.snapshot.paramMap.get('id');
    if (classId) {
      this.loadClassData(classId);
    }
  }

  private loadClassData(classId: string): void {
    this.loading.set(true);

    this.teacherService.getClass(classId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (classInfo) => {
          this.classInfo.set(classInfo);
          this.loadStudents(classId);
          this.loadAnalytics(classId);
          this.loadAssignments(classId);
        },
        error: (error) => {
          this.logger.error('ClassDetailComponent', 'Failed to load class', { classId }, error);
          this.loading.set(false);
          this.router.navigate(['/teacher/classes']);
        },
      });
  }

  private loadStudents(classId: string): void {
    this.teacherService.getClassStudents(classId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (students) => {
          this.students.set(students);
          this.selectedStudentIds.set(new Set());
          this.loading.set(false);
        },
        error: (error) => {
          this.logger.error('ClassDetailComponent', 'Failed to load students', { classId }, error);
          this.loading.set(false);
        },
      });
  }

  private loadAnalytics(classId: string): void {
    this.teacherService.getClassAnalytics(classId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (analytics) => this.analytics.set(analytics),
        error: (error) => this.logger.error('ClassDetailComponent', 'Failed to load analytics', { classId }, error),
      });
  }

  private loadAssignments(classId: string): void {
    this.teacherService.getClassAssignments(classId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (assignments) => this.assignments.set(assignments),
        error: (error) => this.logger.error('ClassDetailComponent', 'Failed to load assignments', { classId }, error),
      });
  }

  // M-23: copy + toast confirmation
  copyJoinCode(): void {
    const joinCode = this.classInfo()?.joinCode;
    if (joinCode) {
      const ok = this.clipboard.copy(joinCode);
      this.snackBar.open(
        ok ? 'Код скопійовано' : 'Не вдалося скопіювати код',
        'Закрити',
        { duration: 2000 }
      );
    }
  }

  // M-22: regenerate join code
  regenerateCode(): void {
    const cls = this.classInfo();
    if (!cls) return;

    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Оновити код класу',
        message: 'Поточний код перестане працювати. Продовжити?',
        confirmText: 'Оновити',
        cancelText: 'Скасувати',
      },
    });

    ref.afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((ok) => {
        if (!ok) return;
        this.teacherService.regenerateJoinCode(cls.id)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: ({ joinCode }) => {
              this.classInfo.set({ ...cls, joinCode });
              this.snackBar.open('Код оновлено', 'Закрити', { duration: 2000 });
            },
            error: (e) => {
              this.logger.error('ClassDetailComponent', 'Regenerate code failed', { classId: cls.id }, e);
              this.snackBar.open('Не вдалося оновити код', 'Закрити', { duration: 3000 });
            },
          });
      });
  }

  // CR-7: edit class
  editClass(): void {
    const cls = this.classInfo();
    if (!cls) return;
    const ref = this.dialog.open(CreateClassDialogComponent, {
      width: '500px',
      data: { mode: 'edit', cls },
    });
    ref.afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        if (result) {
          this.classInfo.set(result);
        }
      });
  }

  // CR-7: archive class
  archiveClass(): void {
    const cls = this.classInfo();
    if (!cls) return;
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Архівувати клас',
        message: `Архівувати клас "${cls.name}"?`,
        confirmText: 'Архівувати',
        cancelText: 'Скасувати',
      },
    });
    ref.afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((ok) => {
        if (!ok) return;
        this.teacherService.archiveClass(cls.id)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              this.snackBar.open('Клас архівовано', 'Закрити', { duration: 2000 });
              this.router.navigate(['/teacher/classes']);
            },
            error: (e) => {
              this.logger.error('ClassDetailComponent', 'Archive failed', { classId: cls.id }, e);
              this.snackBar.open('Не вдалося архівувати', 'Закрити', { duration: 3000 });
            },
          });
      });
  }

  // CR-7: delete class
  deleteClass(): void {
    const cls = this.classInfo();
    if (!cls) return;
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Видалити клас',
        message: `Видалити клас "${cls.name}"? Цю дію не можна скасувати.`,
        confirmText: 'Видалити',
        cancelText: 'Скасувати',
        danger: true,
      },
    });
    ref.afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((ok) => {
        if (!ok) return;
        this.teacherService.deleteClass(cls.id)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              this.snackBar.open('Клас видалено', 'Закрити', { duration: 2000 });
              this.router.navigate(['/teacher/classes']);
            },
            error: (e) => {
              this.logger.error('ClassDetailComponent', 'Delete failed', { classId: cls.id }, e);
              this.snackBar.open('Не вдалося видалити', 'Закрити', { duration: 3000 });
            },
          });
      });
  }

  // M-22: remove a single student
  removeStudent(student: ClassMember, event?: Event): void {
    event?.stopPropagation();
    const classId = this.classInfo()?.id;
    if (!classId) return;

    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Видалити учня',
        message: `Видалити "${student.studentName}" з класу?`,
        confirmText: 'Видалити',
        cancelText: 'Скасувати',
        danger: true,
      },
    });

    ref.afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((ok) => {
        if (!ok) return;
        this.teacherService.removeStudent(classId, student.studentId)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              this.snackBar.open('Учня видалено', 'Закрити', { duration: 2000 });
              this.loadStudents(classId);
            },
            error: (e) => {
              this.logger.error('ClassDetailComponent', 'Remove student failed', { classId, studentId: student.studentId }, e);
              this.snackBar.open('Не вдалося видалити учня', 'Закрити', { duration: 3000 });
            },
          });
      });
  }

  // M-22: bulk-select helpers
  toggleStudentSelection(studentId: string, checked: boolean, event?: Event): void {
    event?.stopPropagation();
    const next = new Set(this.selectedStudentIds());
    if (checked) next.add(studentId);
    else next.delete(studentId);
    this.selectedStudentIds.set(next);
  }

  isStudentSelected(studentId: string): boolean {
    return this.selectedStudentIds().has(studentId);
  }

  toggleSelectAll(checked: boolean): void {
    this.selectedStudentIds.set(
      checked ? new Set(this.students().map((s) => s.studentId)) : new Set()
    );
  }

  allStudentsSelected(): boolean {
    const total = this.students().length;
    return total > 0 && this.selectedStudentIds().size === total;
  }

  // TODO: bulk approve/reject pending join requests — feature not yet implemented backend-side.
  bulkApprove(): void {
    this.snackBar.open('Функція підтвердження запитів буде доступна пізніше', 'Закрити', { duration: 3000 });
  }

  bulkReject(): void {
    this.snackBar.open('Функція відхилення запитів буде доступна пізніше', 'Закрити', { duration: 3000 });
  }

  openCreateAssignmentDialog(): void {
    const classId = this.classInfo()?.id;
    if (!classId) return;

    const dialogRef = this.dialog.open(CreateAssignmentDialogComponent, {
      width: '600px',
      data: { classId },
    });

    dialogRef.afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        if (result) {
          this.loadAssignments(classId);
        }
      });
  }

  viewStudentDetail(studentId: string): void {
    const classId = this.classInfo()?.id;
    if (classId) {
      this.router.navigate(['/teacher/classes', classId, 'students', studentId]);
    }
  }

  viewTasks(topicId: string | null): void {
    if (topicId) {
      this.router.navigate(['/teacher/topics', topicId, 'tasks']);
    }
  }

  formatDate(date: string | null): string {
    if (!date) return 'Ніколи';
    const dateObj = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - dateObj.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Сьогодні';
    if (diffDays === 1) return 'Вчора';
    if (diffDays > 0 && diffDays < 7) return `${diffDays} днів тому`;
    return dateObj.toLocaleDateString('uk-UA');
  }

  /**
   * Format a future-or-past due date for the UI.
   *
   * Returns one of:
   *   - "Сьогодні"               (due today)
   *   - "Прострочено на N днів"  (past due by N days — fixes "До -7 днів тому")
   *   - "До N днів"              (due in N days, < 14)
   *   - "До <localized date>"    (further in the future)
   */
  formatDueDate(date: string | null): string {
    if (!date) return '—';
    const dateObj = new Date(date);
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfDue   = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate()).getTime();
    const diffDays = Math.round((startOfDue - startOfToday) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Сьогодні';
    if (diffDays < 0)   return `Прострочено на ${Math.abs(diffDays)} ${this.dayWord(Math.abs(diffDays))}`;
    if (diffDays < 14)  return `До ${diffDays} ${this.dayWord(diffDays)}`;
    return `До ${dateObj.toLocaleDateString('uk-UA')}`;
  }

  private dayWord(n: number): string {
    // Ukrainian plural: 1 день, 2-4 дні, 5+ днів (with teen exception)
    const mod10  = n % 10;
    const mod100 = n % 100;
    if (mod100 >= 11 && mod100 <= 14) return 'днів';
    if (mod10 === 1) return 'день';
    if (mod10 >= 2 && mod10 <= 4) return 'дні';
    return 'днів';
  }

  goBack(): void {
    this.router.navigate(['/teacher/classes']);
  }
}
