import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { TeacherService } from '@app/core/services/teacher.service';
import { LoggingService } from '@app/core/services/logging.service';
import { StudentPerformanceDetail } from '@app/core/models';

@Component({
  selector: 'app-student-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatTableModule,
  ],
  templateUrl: './student-detail.component.html',
  styleUrls: ['./student-detail.component.scss'],
})
export class StudentDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly teacherService = inject(TeacherService);
  private readonly logger = inject(LoggingService);

  readonly studentData = signal<StudentPerformanceDetail | null>(null);
  readonly loading = signal<boolean>(true);

  readonly activityColumns = ['topic', 'result', 'difficulty', 'time', 'date'];

  ngOnInit(): void {
    const classId = this.route.snapshot.paramMap.get('classId');
    const studentId = this.route.snapshot.paramMap.get('studentId');

    if (classId && studentId) {
      this.loadStudentData(classId, studentId);
    }
  }

  private loadStudentData(classId: string, studentId: string): void {
    this.loading.set(true);

    this.teacherService.getStudentDetail(classId, studentId).subscribe({
      next: (data) => {
        this.studentData.set(data);
        this.loading.set(false);
      },
      error: (error) => {
        this.logger.error('StudentDetailComponent', 'Failed to load student data', {}, error);
        this.loading.set(false);
        this.goBack();
      },
    });
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('uk-UA', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  formatTime(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    return `${seconds}с`;
  }

  goBack(): void {
    const classId = this.route.snapshot.paramMap.get('classId');
    this.router.navigate(['/teacher/classes', classId]);
  }
}
