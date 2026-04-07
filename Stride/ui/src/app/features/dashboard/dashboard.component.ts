import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { finalize, forkJoin, catchError, of } from 'rxjs';
import {
  GamificationService,
  LearningService,
  LeaderboardService,
  AuthService,
  GamificationStats,
  ContinueLearningTopic,
  LeaderboardPreview,
  League,
  LoggingService,
} from '@app/core';
import { StreakWidgetComponent } from './widgets/streak-widget.component';
import { XpBarComponent } from './widgets/xp-bar.component';
import { TopicCardComponent } from './widgets/topic-card.component';
import { LeaderboardPreviewComponent } from './widgets/leaderboard-preview.component';
import { FirstTaskBonusComponent } from './widgets/first-task-bonus.component';
import { DailyGoalComponent } from './widgets/daily-goal.component';
import { RecentAchievementsComponent } from './widgets/recent-achievements.component';

@Component({
  selector: 'app-dashboard',
  imports: [
    CommonModule,
    RouterLink,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    StreakWidgetComponent,
    XpBarComponent,
    TopicCardComponent,
    LeaderboardPreviewComponent,
    FirstTaskBonusComponent,
    DailyGoalComponent,
    RecentAchievementsComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  private readonly gamificationService = inject(GamificationService);
  private readonly learningService = inject(LearningService);
  private readonly leaderboardService = inject(LeaderboardService);
  private readonly authService = inject(AuthService);
  private readonly logger = inject(LoggingService);

  // State signals
  protected readonly loading = signal<boolean>(true);
  protected readonly error = signal<string | null>(null);
  protected readonly stats = signal<GamificationStats | null>(null);
  protected readonly continueLearning = signal<ContinueLearningTopic[]>([]);
  protected readonly leaderboard = signal<LeaderboardPreview | null>(null);

  // Computed values
  protected readonly user = this.authService.user;
  protected readonly hasActivities = signal<boolean>(false);
  protected readonly today = new Date();

  protected get greeting(): string {
    const h = new Date().getHours();
    if (h >= 5 && h < 12) return 'Доброго ранку';
    if (h < 18) return 'Добрий день';
    return 'Доброго вечора';
  }

  protected get todayLabel(): string {
    return new Date().toLocaleDateString('uk-UA', {
      weekday: 'long', day: 'numeric', month: 'long',
    });
  }

  ngOnInit(): void {
    this.loadDashboardData();
  }

  private loadDashboardData(): void {
    this.loading.set(true);
    this.error.set(null);

    forkJoin({
      stats: this.gamificationService.getStats().pipe(
        catchError((err) => {
          this.logger.error('DashboardComponent', 'Failed to load gamification stats', {}, err);
          return of(null);
        })
      ),
      continueLearning: this.learningService.getContinueLearningTopics(3).pipe(
        catchError((err) => {
          this.logger.error('DashboardComponent', 'Failed to load continue learning topics', {}, err);
          return of([]);
        })
      ),
      leaderboard: this.leaderboardService.getLeaderboardPreview().pipe(
        catchError((err) => {
          this.logger.error('DashboardComponent', 'Failed to load leaderboard preview', {}, err);
          return of(null);
        })
      ),
    })
      .pipe(
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: (data) => {
          this.stats.set(data.stats);
          this.continueLearning.set(data.continueLearning);
          this.leaderboard.set(data.leaderboard);
          this.hasActivities.set(
            data.continueLearning.length > 0 || 
            (data.stats?.totalXp ?? 0) > 0
          );
        },
        error: (err) => {
          this.logger.error('DashboardComponent', 'Failed to load dashboard data', {}, err);
          this.error.set('Не вдалося завантажити дані. Спробуйте оновити сторінку.');
        },
      });
  }

  protected onRefresh(): void {
    this.loadDashboardData();
  }

  protected getLeagueLabel(league: League): string {
    const labels: Record<League, string> = {
      Bronze: 'Бронза',
      Silver: 'Срібло',
      Gold: 'Золото',
      Platinum: 'Платина',
      Diamond: 'Діамант',
    };
    return labels[league];
  }
}
