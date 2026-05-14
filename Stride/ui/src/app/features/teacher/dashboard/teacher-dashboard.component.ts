import { Component, OnInit, inject, signal, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateModule } from '@ngx-translate/core';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { TeacherService } from '@app/core/services/teacher.service';
import { Class, RecentActivity } from '@app/core/models';
import { PluralUaPipe } from '@app/shared/pipes/plural-ua.pipe';

interface DashboardStats {
  classes: number;
  students: number;
  pendingReviews: number;
  weekXp: number;
}

interface ActivityItem {
  icon: string;
  text: string;
  time: string;
  color: string;
  classId?: string;
  studentId?: string;
}

@Component({
  selector: 'app-teacher-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule, PluralUaPipe],
  templateUrl: './teacher-dashboard.component.html',
  styleUrls: ['./teacher-dashboard.component.scss'],
})
export class TeacherDashboardComponent implements OnInit {
  private readonly teacherService = inject(TeacherService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly stats = signal<DashboardStats | null>(null);
  readonly loading = signal(false);
  readonly recentActivity = signal<ActivityItem[]>([]);
  readonly recentClasses = signal<Class[]>([]);

  ngOnInit(): void {
    this.loadStats();
    this.loadRecentActivity();
    this.loadRecentClasses();
  }

  private loadStats(): void {
    this.loading.set(true);

    // M-18: parallel-load quick stats + pending review count
    forkJoin({
      qs: this.teacherService.getQuickStats(),
      pending: this.teacherService.getPendingReviewCount().pipe(
        catchError(() => of({ count: 0 }))
      ),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ qs, pending }) => {
          this.stats.set({
            classes: qs.totalClasses,
            students: qs.totalStudents,
            pendingReviews: pending.count,
            weekXp: 0,
          });
          this.loading.set(false);
        },
        error: () => {
          // Fallback: derive stats from classes list
          this.teacherService.getClasses()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
              next: (classes) => {
                const totalStudents = classes.reduce((s, c) => s + (c.studentCount ?? 0), 0);
                this.stats.set({
                  classes: classes.length,
                  students: totalStudents,
                  pendingReviews: 0,
                  weekXp: 0,
                });
                this.loading.set(false);
              },
              error: () => this.loading.set(false),
            });
        },
      });
  }

  private loadRecentActivity(): void {
    // M-18: actual recent submissions feed (last 5)
    this.teacherService.getRecentActivity(5)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (items: RecentActivity[]) => {
          const mapped: ActivityItem[] = items.map((it) => ({
            icon: it.isCorrect ? 'check_circle' : 'cancel',
            color: it.isCorrect ? 'green' : 'orange',
            text: `${it.studentName} — ${it.topicName} (${it.className})`,
            time: this.formatRelative(it.attemptedAt),
            classId: it.classId,
            studentId: it.studentId,
          }));
          this.recentActivity.set(mapped);
        },
        error: () => this.recentActivity.set([]),
      });
  }

  private loadRecentClasses(): void {
    this.teacherService.getClasses()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (classes) => this.recentClasses.set(classes.slice(0, 5)),
        error: () => this.recentClasses.set([]),
      });
  }

  private formatRelative(dateStr: string): string {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / (1000 * 60));
    if (diffMin < 1) return 'щойно';
    if (diffMin < 60) return `${diffMin} хв тому`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `${diffH} год тому`;
    const diffD = Math.floor(diffH / 24);
    if (diffD < 7) return `${diffD} дн тому`;
    return d.toLocaleDateString('uk-UA');
  }

  navigateToClasses(): void {
    this.router.navigate(['/teacher/classes']);
  }
}
