import {
  Component,
  DestroyRef,
  effect,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs';

import {
  LeaderboardService,
  AuthService,
  LeaderboardEntry,
  League,
} from '@app/core';
import { SignalRService } from '@app/core/services/signalr.service';
import { LoggingService } from '@app/core/services/logging.service';
import { LeaderboardRowComponent } from './leaderboard-row.component';
import { LeagueMedallionComponent } from './league-medallion.component';

type FilterMode = 'weekly' | 'allTime' | 'class';

@Component({
  selector: 'app-leaderboard',
  standalone: true,
  imports: [
    CommonModule,
    LeaderboardRowComponent,
    LeagueMedallionComponent,
  ],
  templateUrl: './leaderboard.component.html',
  styleUrl: './leaderboard.component.scss',
})
export class LeaderboardComponent implements OnInit {
  private readonly leaderboardService = inject(LeaderboardService);
  private readonly authService        = inject(AuthService);
  private readonly signalRService     = inject(SignalRService);
  private readonly logger             = inject(LoggingService);
  private readonly destroyRef         = inject(DestroyRef);

  // State signals
  protected readonly entries          = signal<LeaderboardEntry[]>([]);
  protected readonly loading          = signal<boolean>(false);
  protected readonly activeFilter     = signal<FilterMode>('weekly');
  protected readonly currentUserEntry = signal<LeaderboardEntry | null>(null);
  protected readonly error            = signal<string | null>(null);

  // Auth
  protected readonly user = this.authService.user;

  // Skeleton rows array (10 items)
  protected readonly skeletonRows = Array.from({ length: 10 }, (_, i) => i);

  // Filter tab definitions
  protected readonly filters: { value: FilterMode; label: string }[] = [
    { value: 'weekly',  label: 'Тижневий' },
    { value: 'allTime', label: 'Весь час' },
    { value: 'class',   label: 'Клас'     },
  ];

  // Track previous filter for SignalR league switching
  private previousFilter: FilterMode = 'weekly';

  constructor() {
    // Re-load whenever activeFilter changes (skip initial — ngOnInit handles first load)
    let initialized = false;
    effect(() => {
      const next = this.activeFilter();
      if (!initialized) {
        initialized = true;
        return;
      }
      const prev = this.previousFilter;
      this.previousFilter = next;

      // Switch SignalR league group
      this.signalRService.leaveLeague(prev);
      this.signalRService.joinLeague(next);

      this.loadLeaderboard();
    });
  }

  ngOnInit(): void {
    this.previousFilter = this.activeFilter();
    this.loadLeaderboard();

    // Real-time: leaderboard updated
    this.signalRService.onLeaderboardUpdated
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.loadLeaderboard();
        this.signalRService.joinLeague(this.activeFilter());
      });

    // Real-time: rank changed
    this.signalRService.onRankChanged
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.loadLeaderboard();
        this.signalRService.joinLeague(this.activeFilter());
      });
  }

  protected setFilter(filter: FilterMode): void {
    if (filter === this.activeFilter()) return;
    this.activeFilter.set(filter);
  }

  protected loadLeaderboard(): void {
    this.loading.set(true);
    this.error.set(null);

    // Map filter to league for the existing API (allTime/class fall back to current user league)
    const league = this.resolveLeague();

    this.leaderboardService
      .getLeaderboard(league)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (data) => {
          this.entries.set(data.entries);
          const me = data.entries.find((e) => e.isCurrentUser) ?? null;
          this.currentUserEntry.set(me);
        },
        error: (err) => {
          this.logger.error(
            'LeaderboardComponent',
            'Failed to load leaderboard',
            { filter: this.activeFilter() },
            err
          );
          this.error.set('Не вдалося завантажити таблицю лідерів. Спробуйте оновити сторінку.');
        },
      });
  }

  protected isTopThree(entry: LeaderboardEntry): boolean {
    return entry.rank <= 3;
  }

  protected currentTier(): string {
    const entry = this.currentUserEntry();
    return (entry as any)?.tier ?? 'Bronze';
  }

  protected currentRank(): number {
    return this.currentUserEntry()?.rank ?? 0;
  }

  protected currentWeeklyXp(): number {
    return this.currentUserEntry()?.weeklyXp ?? 0;
  }

  protected currentRankChange(): number {
    return (this.currentUserEntry() as any)?.rankChange ?? 0;
  }

  private resolveLeague(): League {
    // In a fuller implementation this would differ per filter.
    // For MVP we always pass the user's league (or Bronze as default).
    return 'Bronze';
  }
}
