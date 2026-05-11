import {
  Component,
  DestroyRef,
  effect,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { finalize } from 'rxjs';

import {
  AuthService,
  GamificationService,
  LeaderboardEntry,
  LeaderboardPeriod,
  LeaderboardScope,
  LeaderboardService,
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
    TranslateModule,
    LeaderboardRowComponent,
    LeagueMedallionComponent,
  ],
  templateUrl: './leaderboard.component.html',
  styleUrl: './leaderboard.component.scss',
})
export class LeaderboardComponent implements OnInit, OnDestroy {
  private readonly leaderboardService  = inject(LeaderboardService);
  private readonly authService         = inject(AuthService);
  private readonly gamificationService = inject(GamificationService);
  private readonly signalRService      = inject(SignalRService);
  private readonly logger              = inject(LoggingService);
  private readonly destroyRef          = inject(DestroyRef);

  // State signals
  protected readonly entries          = signal<LeaderboardEntry[]>([]);
  protected readonly loading          = signal<boolean>(false);
  protected readonly activeFilter     = signal<FilterMode>('weekly');
  protected readonly currentUserEntry = signal<LeaderboardEntry | null>(null);
  protected readonly error            = signal<string | null>(null);
  private readonly userLeague         = signal<League>('Bronze');

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

    // Connect to leaderboard SignalR hub on init (separate from the
    // notifications hub which is connected at login time).
    this.signalRService.connectLeaderboard().then(() => {
      this.signalRService.joinLeague(this.activeFilter());
    });

    this.gamificationService.getStats().subscribe({
      next: (stats) => {
        this.userLeague.set(stats.league);
        this.loadLeaderboard();
      },
      error: () => this.loadLeaderboard(),
      complete: () => {
        // For non-students gamificationService.getStats() returns EMPTY,
        // which fires `complete` without `next`. Still load the leaderboard.
        if (this.entries().length === 0 && !this.loading()) {
          this.loadLeaderboard();
        }
      },
    });

    // Real-time: leaderboard updated
    this.signalRService.onLeaderboardUpdated
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.loadLeaderboard(/*forceRefresh*/ true);
      });

    // Real-time: rank changed
    this.signalRService.onRankChanged
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.loadLeaderboard(/*forceRefresh*/ true);
      });
  }

  ngOnDestroy(): void {
    // Leave the active league group; do NOT disconnect the shared
    // notification hub — it stays alive for the whole session.
    this.signalRService.leaveLeague(this.activeFilter());
  }

  protected setFilter(filter: FilterMode): void {
    if (filter === this.activeFilter()) return;
    this.activeFilter.set(filter);
  }

  protected loadLeaderboard(forceRefresh = false): void {
    this.loading.set(true);
    this.error.set(null);

    const league = this.resolveLeague();
    const period = this.resolvePeriod();
    const scope  = this.resolveScope();

    const query = { league, period, scope };
    const stream$ = forceRefresh
      ? this.leaderboardService.refreshLeaderboard(query)
      : this.leaderboardService.getLeaderboard(query);

    stream$
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (data) => {
          const list = data?.entries ?? [];
          this.entries.set(list);
          const me =
            data?.currentUserEntry ??
            list.find((e) => e?.isCurrentUser) ??
            null;
          this.currentUserEntry.set(me);
        },
        error: (err) => {
          this.entries.set([]);
          this.currentUserEntry.set(null);
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
    return (entry?.tier ?? entry?.league ?? this.userLeague() ?? 'Bronze') as string;
  }

  protected currentRank(): number {
    return this.currentUserEntry()?.rank ?? 0;
  }

  protected currentWeeklyXp(): number {
    return this.currentUserEntry()?.weeklyXp ?? 0;
  }

  protected currentRankChange(): number {
    return this.currentUserEntry()?.rankChange ?? 0;
  }

  private resolveLeague(): League {
    return this.userLeague();
  }

  private resolvePeriod(): LeaderboardPeriod {
    switch (this.activeFilter()) {
      case 'weekly':  return 'week';
      case 'allTime': return 'all';
      case 'class':   return 'all';
    }
  }

  private resolveScope(): LeaderboardScope {
    return this.activeFilter() === 'class' ? 'class' : 'global';
  }
}
