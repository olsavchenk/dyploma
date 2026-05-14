import { Component, OnInit, DestroyRef, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateModule } from '@ngx-translate/core';
import { TeacherService } from '@app/core/services/teacher.service';
import { LoggingService } from '@app/core/services/logging.service';
import { Class, ClassQuickStats } from '@app/core/models';
import { CreateClassDialogComponent } from '../dialogs/create-class-dialog.component';
import { ShareJoinCodeDialogComponent } from '../dialogs/share-join-code-dialog.component';
import { ConfirmDialogComponent } from '../dialogs/confirm-dialog.component';
import { PluralUaPipe } from '@app/shared/pipes/plural-ua.pipe';

type ClassFilter = 'active' | 'archived';

@Component({
  selector: 'app-classes',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatFormFieldModule,
    MatInputModule,
    MatMenuModule,
    MatButtonToggleModule,
    TranslateModule,
    PluralUaPipe,
  ],
  templateUrl: './classes.component.html',
  styleUrls: ['./classes.component.scss'],
})
export class ClassesComponent implements OnInit {
  private readonly teacherService = inject(TeacherService);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly logger = inject(LoggingService);
  private readonly destroyRef = inject(DestroyRef);

  readonly classes = signal<Class[]>([]);
  readonly quickStats = signal<ClassQuickStats | null>(null);
  readonly loading = signal<boolean>(true);

  // M-19: client-side search + filter
  readonly searchTerm = signal<string>('');
  readonly filterMode = signal<ClassFilter>('active');

  readonly filteredClasses = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const mode = this.filterMode();
    return this.classes().filter((c) => {
      const archived = !!c.isArchived;
      if (mode === 'active' && archived) return false;
      if (mode === 'archived' && !archived) return false;
      if (term && !c.name.toLowerCase().includes(term)) return false;
      return true;
    });
  });

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.loading.set(true);

    this.teacherService.getQuickStats()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (stats) => this.quickStats.set(stats),
        error: (error) => this.logger.error('ClassesComponent', 'Failed to load quick stats', {}, error),
      });

    this.teacherService.getClasses()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (classes) => {
          this.classes.set(classes);
          this.loading.set(false);
        },
        error: (error) => {
          this.logger.error('ClassesComponent', 'Failed to load classes', {}, error);
          this.loading.set(false);
        },
      });
  }

  onSearchChange(value: string): void {
    this.searchTerm.set(value);
  }

  onFilterChange(mode: ClassFilter): void {
    this.filterMode.set(mode);
  }

  openCreateDialog(): void {
    // BUG H-10: pass existing names so the dialog can reject duplicates client-side.
    const existingNames = this.classes()
      .filter((c) => !c.isArchived)
      .map((c) => c.name.trim().toLowerCase());

    const dialogRef = this.dialog.open(CreateClassDialogComponent, {
      width: '500px',
      data: { existingNames },
    });

    // M-29: explicit unsubscribe via DestroyRef so the dialog instance can be GC'd
    dialogRef.afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        if (result) {
          this.loadData();
        }
      });
  }

  /**
   * BUG H-10: surface a client-side duplicate-name error before opening the dialog,
   * but actual prevention happens server-side (agent E) and via the dialog's own
   * 409 handling. The existingNames passed to the dialog supplement that flow.
   */

  openEditDialog(cls: Class, event?: Event): void {
    event?.stopPropagation();
    const dialogRef = this.dialog.open(CreateClassDialogComponent, {
      width: '500px',
      data: { mode: 'edit', cls },
    });

    dialogRef.afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        if (result) {
          this.loadData();
        }
      });
  }

  archiveClass(cls: Class, event?: Event): void {
    event?.stopPropagation();
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Архівувати клас',
        message: `Архівувати клас "${cls.name}"? Учні більше не зможуть приєднатись.`,
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
              this.loadData();
            },
            error: (e) => {
              this.logger.error('ClassesComponent', 'Archive failed', { classId: cls.id }, e);
              this.snackBar.open('Не вдалося архівувати клас', 'Закрити', { duration: 3000 });
            },
          });
      });
  }

  deleteClass(cls: Class, event?: Event): void {
    event?.stopPropagation();
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
              this.loadData();
            },
            error: (e) => {
              this.logger.error('ClassesComponent', 'Delete failed', { classId: cls.id }, e);
              this.snackBar.open('Не вдалося видалити клас', 'Закрити', { duration: 3000 });
            },
          });
      });
  }

  viewClass(classId: string): void {
    this.router.navigate(['/teacher/classes', classId]);
  }

  shareCode(cls: Class, event?: Event): void {
    event?.stopPropagation();
    this.dialog.open(ShareJoinCodeDialogComponent, {
      width: '420px',
      data: { joinCode: cls.joinCode, className: cls.name },
    });
  }
}
