import { Component, OnInit, inject, signal, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TeacherService } from '@app/core/services/teacher.service';

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
}

@Component({
  selector: 'app-teacher-dashboard',
  standalone: true,
  imports: [CommonModule],
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

  ngOnInit(): void {
    this.loadStats();
    this.loadRecentActivity();
  }

  private loadStats(): void {
    this.loading.set(true);

    this.teacherService
      .getQuickStats()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (qs) => {
          this.stats.set({
            classes: qs.totalClasses,
            students: qs.totalStudents,
            pendingReviews: 0,
            weekXp: 0,
          });
          this.loading.set(false);
        },
        error: () => {
          // Fallback: derive stats from classes list
          this.teacherService
            .getClasses()
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
    // Populated from classes data as a best-effort activity feed
    this.teacherService
      .getClasses()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (classes) => {
          const items: ActivityItem[] = classes.slice(0, 5).map((c) => ({
            icon: 'school',
            text: `Клас "${c.name}" — ${c.studentCount ?? 0} учнів`,
            time: 'Нещодавно',
            color: 'blue',
          }));
          this.recentActivity.set(items);
        },
        error: () => {},
      });
  }

  navigateToClasses(): void {
    this.router.navigate(['/teacher/classes']);
  }
}
