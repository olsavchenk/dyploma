import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { finalize } from 'rxjs';
import {
  LeaderboardService,
  AuthService,
  LeaderboardResponse,
  LeaderboardEntry,
  League,
} from '@app/core';
import { LoggingService } from '@app/core/services/logging.service';

@Component({
  selector: 'app-leaderboard',
  imports: [
    CommonModule,
    MatTabsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
  templateUrl: './leaderboard.component.html',
  styleUrl: './leaderboard.component.scss',
})
export class LeaderboardComponent implements OnInit {
  private readonly leaderboardService = inject(LeaderboardService);
  private readonly authService = inject(AuthService);
  private readonly logger = inject(LoggingService);

  // TODO (US-039): Inject SignalRService for real-time updates
  // - Subscribe to LeaderboardUpdated events
  // - Subscribe to RankChanged events
  // - Auto-refresh on updates

  // State signals
  protected readonly loading = signal<boolean>(true);
  protected readonly error = signal<string | null>(null);
  protected readonly leaderboardData = signal<LeaderboardResponse | null>(null);
  protected readonly selectedLeague = signal<League>('Bronze');
  protected selectedTabIndex = 0;

  // Computed values
  protected readonly user = this.authService.user;
  protected readonly currentUserId = computed(() => this.user()?.id);
  protected readonly promotionZone = computed(() => {
    const data = this.leaderboardData();
    return data?.promotionZone ?? 10;
  });
  protected readonly demotionZone = computed(() => {
    const data = this.leaderboardData();
    if (!data) return 0;
    return data.totalParticipants - data.demotionZone;
  });

  // Helper to check if current user is not in top entries
  protected readonly showCurrentUserSeparately = computed(() => {
    const data = this.leaderboardData();
    if (!data || !data.currentUserRank) return false;
    return data.currentUserRank > data.entries.length;
  });

  // League configuration
  protected readonly leagues: { value: League; label: string; icon: string; color: string }[] = [
    { value: 'Bronze', label: 'Бронза', icon: '🥉', color: '#CD7F32' },
    { value: 'Silver', label: 'Срібло', icon: '🥈', color: '#C0C0C0' },
    { value: 'Gold', label: 'Золото', icon: '🥇', color: '#FFD700' },
    { value: 'Platinum', label: 'Платина', icon: '💎', color: '#E5E4E2' },
    { value: 'Diamond', label: 'Діамант', icon: '💠', color: '#B9F2FF' },
  ];

  ngOnInit(): void {
    // Set initial league to user's current league
    const userLeague = this.user()?.role === 'Student' ? 'Bronze' : 'Bronze'; // TODO: Get from user profile
    this.selectedLeague.set(userLeague);
    this.loadLeaderboard();
  }

  protected onTabChange(index: number): void {
    const league = this.leagues[index].value;
    this.selectedLeague.set(league);
    this.loadLeaderboard();
  }

  protected loadLeaderboard(): void {
    this.loading.set(true);
    this.error.set(null);

    this.leaderboardService
      .getLeaderboard(this.selectedLeague())
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (data) => {
          this.leaderboardData.set(data);
        },
        error: (err) => {
          this.logger.error('LeaderboardComponent', 'Failed to load leaderboard', { league: this.selectedLeague() }, err);
          this.error.set('Не вдалося завантажити таблицю лідерів. Спробуйте оновити сторінку.');
        },
      });
  }

  protected getInitials(name: string): string {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  protected isPromotionZone(rank: number): boolean {
    return rank <= this.promotionZone();
  }

  protected isDemotionZone(rank: number): boolean {
    const demotionStart = this.demotionZone();
    return demotionStart > 0 && rank >= demotionStart;
  }

  protected isCurrentUser(entry: LeaderboardEntry): boolean {
    return entry.isCurrentUser;
  }

  protected getLeagueColor(league: League): string {
    return this.leagues.find((l) => l.value === league)?.color ?? '#6366F1';
  }

  protected getCurrentWeek(): string {
    const data = this.leaderboardData();
    if (!data) return '';
    return `Тиждень ${data.weekNumber}, ${data.year}`;
  }
}
