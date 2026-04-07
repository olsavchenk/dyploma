import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TeacherService } from '@app/core/services/teacher.service';
import { LoggingService } from '@app/core/services/logging.service';
import { Class, ClassQuickStats } from '@app/core/models';
import { CreateClassDialogComponent } from '../dialogs/create-class-dialog.component';
import { ShareJoinCodeDialogComponent } from '../dialogs/share-join-code-dialog.component';

@Component({
  selector: 'app-classes',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatSnackBarModule,
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

  readonly classes = signal<Class[]>([]);
  readonly quickStats = signal<ClassQuickStats | null>(null);
  readonly loading = signal<boolean>(true);

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.loading.set(true);
    
    this.teacherService.getQuickStats().subscribe({
      next: (stats) => this.quickStats.set(stats),
      error: (error) => this.logger.error('ClassesComponent', 'Failed to load quick stats', {}, error),
    });

    this.teacherService.getClasses().subscribe({
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

  openCreateDialog(): void {
    const dialogRef = this.dialog.open(CreateClassDialogComponent, {
      width: '500px',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadData();
      }
    });
  }

  viewClass(classId: string): void {
    this.router.navigate(['/teacher/classes', classId]);
  }

  shareCode(cls: Class): void {
    this.dialog.open(ShareJoinCodeDialogComponent, {
      width: '420px',
      data: { joinCode: cls.joinCode, className: cls.name },
    });
  }
}
