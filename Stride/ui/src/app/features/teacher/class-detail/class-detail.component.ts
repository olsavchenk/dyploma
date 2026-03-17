import { Component, OnInit, inject, signal, computed } from '@angular/core';
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
import { Clipboard, ClipboardModule } from '@angular/cdk/clipboard';
import { TeacherService } from '@app/core/services/teacher.service';
import { LoggingService } from '@app/core/services/logging.service';
import {
  Class,
  ClassMember,
  ClassAnalytics,
  Assignment,
} from '@app/core/models';
import { CreateAssignmentDialogComponent } from '../dialogs/create-assignment-dialog.component';
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

  readonly classInfo = signal<Class | null>(null);
  readonly students = signal<ClassMember[]>([]);
  readonly analytics = signal<ClassAnalytics | null>(null);
  readonly assignments = signal<Assignment[]>([]);
  readonly loading = signal<boolean>(true);
  readonly selectedTab = signal<number>(0);

  readonly studentColumns = ['avatar', 'name', 'level', 'accuracy', 'tasksCompleted', 'lastActive', 'actions'];

  ngOnInit(): void {
    const classId = this.route.snapshot.paramMap.get('id');
    if (classId) {
      this.loadClassData(classId);
    }
  }

  private loadClassData(classId: string): void {
    this.loading.set(true);

    this.teacherService.getClass(classId).subscribe({
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
    this.teacherService.getClassStudents(classId).subscribe({
      next: (students) => {
        this.students.set(students);
        this.loading.set(false);
      },
      error: (error) => {
        this.logger.error('ClassDetailComponent', 'Failed to load students', { classId }, error);
        this.loading.set(false);
      },
    });
  }

  private loadAnalytics(classId: string): void {
    this.teacherService.getClassAnalytics(classId).subscribe({
      next: (analytics) => this.analytics.set(analytics),
      error: (error) => this.logger.error('ClassDetailComponent', 'Failed to load analytics', { classId }, error),
    });
  }

  private loadAssignments(classId: string): void {
    this.teacherService.getClassAssignments(classId).subscribe({
      next: (assignments) => this.assignments.set(assignments),
      error: (error) => this.logger.error('ClassDetailComponent', 'Failed to load assignments', { classId }, error),
    });
  }

  copyJoinCode(): void {
    const joinCode = this.classInfo()?.joinCode;
    if (joinCode) {
      this.clipboard.copy(joinCode);
      this.snackBar.open('Код скопійовано до буферу обміну!', 'OK', {
        duration: 2000,
      });
    }
  }

  openCreateAssignmentDialog(): void {
    const classId = this.classInfo()?.id;
    if (!classId) return;

    const dialogRef = this.dialog.open(CreateAssignmentDialogComponent, {
      width: '600px',
      data: { classId },
    });

    dialogRef.afterClosed().subscribe((result) => {
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
    if (diffDays < 7) return `${diffDays} днів тому`;
    return dateObj.toLocaleDateString('uk-UA');
  }

  goBack(): void {
    this.router.navigate(['/teacher/classes']);
  }
}
