import {
  Component,
  inject,
  signal,
  computed,
  effect,
  OnInit,
  DestroyRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../../../core/services/auth.service';
import { GamificationService } from '../../../core/services/gamification.service';
import { SignalRService } from '../../../core/services/signalr.service';
import { NotificationService } from '../../../core/services/notification.service';
import { HeaderComponent } from '../header/header.component';
import { SidenavComponent } from '../sidenav/sidenav.component';
import { BottomNavComponent } from '../bottom-nav/bottom-nav.component';
import { NotificationPanelComponent } from '../notification-panel/notification-panel.component';
import { UserStats } from '../../models';
import type {
  AchievementUnlockedEvent,
  LevelUpEvent,
  StreakReminderEvent,
  RankChangedEvent,
} from '../../../core/models/notification.models';

@Component({
  selector: 'app-layout',
  imports: [
    CommonModule,
    RouterOutlet,
    MatSidenavModule,
    HeaderComponent,
    SidenavComponent,
    BottomNavComponent,
    NotificationPanelComponent,
  ],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss',
})
export class LayoutComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly gamificationService = inject(GamificationService);
  private readonly signalRService = inject(SignalRService);
  private readonly notificationService = inject(NotificationService);
  private readonly breakpointObserver = inject(BreakpointObserver);
  private readonly destroyRef = inject(DestroyRef);

  // Layout state
  protected readonly sidenavOpened = signal<boolean>(false);
  protected readonly isMobile = signal<boolean>(false);
  protected readonly sidenavMode = signal<'over' | 'side'>('side');
  protected readonly isAuthenticated = this.authService.isAuthenticated;
  protected readonly notificationPanelOpen = signal<boolean>(false);

  // User data
  protected readonly userStats = signal<UserStats | null>(null);
  protected readonly notificationCount = signal<number>(0);
  protected readonly unreadNotifications = signal<Array<{
    type: string;
    message: string;
    timestamp: Date;
    data: unknown;
  }>>([]);

  constructor() {
    // Re-fetch stats when auth state changes
    effect(() => {
      if (this.isAuthenticated()) {
        this.loadUserStats();
        this.subscribeToRealTimeEvents();
      } else {
        this.userStats.set(null);
        this.notificationCount.set(0);
        this.unreadNotifications.set([]);
      }
    });
  }

  ngOnInit(): void {
    this.observeBreakpoints();
    if (this.isAuthenticated()) {
      this.loadUserStats();
      this.subscribeToRealTimeEvents();
    }
  }

  private observeBreakpoints(): void {
    this.breakpointObserver
      .observe([Breakpoints.Handset, Breakpoints.TabletPortrait])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        const mobile = result.matches;
        this.isMobile.set(mobile);
        this.sidenavMode.set(mobile ? 'over' : 'side');
        this.sidenavOpened.set(!mobile);
      });
  }

  private loadUserStats(): void {
    this.gamificationService.getStats().subscribe({
      next: (stats) => {
        this.userStats.set({
          totalXp: stats.totalXp,
          currentLevel: stats.currentLevel,
          currentStreak: stats.currentStreak,
          xpToNextLevel: stats.xpToNextLevel,
          xpProgress: stats.xpProgress ?? 0,
        });
      },
      error: () => {
        // Leave null on error — header handles null gracefully
      },
    });
  }

  private subscribeToRealTimeEvents(): void {
    // Achievement unlocked → toast + queue notification
    this.signalRService.onAchievementUnlocked
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event: AchievementUnlockedEvent) => {
        this.notificationService.showAchievementToast(event);
        this.enqueueNotification('achievement', `Досягнення розблоковано: ${event.name}`, event);
      });

    // Level up → celebration overlay + notification
    this.signalRService.onLevelUp
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event: LevelUpEvent) => {
        this.notificationService.showLevelUpCelebration(event);
        this.enqueueNotification('levelUp', `Новий рівень ${event.newLevel}!`, event);
        // Refresh stats after level up
        this.loadUserStats();
      });

    // Streak reminder → toast
    this.signalRService.onStreakReminder
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event: StreakReminderEvent) => {
        this.enqueueNotification('streak', 'Не забудьте підтримати серію!', event);
      });

    // Rank changed → notification
    this.signalRService.onRankChanged
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event: RankChangedEvent) => {
        const dir = event.newRank < event.oldRank ? '↑' : '↓';
        this.enqueueNotification('rank', `${dir} Новий ранг у рейтингу: #${event.newRank}`, event);
      });
  }

  private enqueueNotification(type: string, message: string, data: unknown): void {
    const current = this.unreadNotifications();
    this.unreadNotifications.set([
      { type, message, timestamp: new Date(), data },
      ...current.slice(0, 19), // keep max 20
    ]);
    this.notificationCount.update((n) => n + 1);
  }

  protected onMenuToggle(): void {
    this.sidenavOpened.update((v) => !v);
  }

  protected onSidenavClose(): void {
    if (this.isMobile()) {
      this.sidenavOpened.set(false);
    }
  }

  protected onNotificationPanelToggle(): void {
    this.notificationPanelOpen.update((v) => !v);
    if (this.notificationPanelOpen()) {
      this.notificationCount.set(0);
    }
  }

  protected onNotificationPanelClose(): void {
    this.notificationPanelOpen.set(false);
  }
}
