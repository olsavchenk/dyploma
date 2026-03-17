import { Injectable, inject, signal } from '@angular/core';
import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from '@microsoft/signalr';
import { Subject, Observable, timer, takeUntil } from 'rxjs';
import { environment } from '@environments/environment';
import { AuthService } from './auth.service';
import { LoggingService } from './logging.service';
import {
  AchievementUnlockedEvent,
  LevelUpEvent,
  StreakReminderEvent,
  LeaderboardUpdatedEvent,
  RankChangedEvent,
  ConnectionState,
} from '../models/notification.models';

@Injectable({
  providedIn: 'root',
})
export class SignalRService {
  private readonly authService = inject(AuthService);
  private readonly logger = inject(LoggingService);

  private hubConnection: HubConnection | null = null;
  private reconnectAttempt = 0;
  private maxReconnectAttempts = 10;
  private baseReconnectDelayMs = 1000;
  private destroy$ = new Subject<void>();

  // Connection state signal
  private readonly connectionStateSignal = signal<ConnectionState>(
    ConnectionState.Disconnected
  );
  readonly connectionState = this.connectionStateSignal.asReadonly();

  // Event streams
  private readonly achievementUnlocked$ = new Subject<AchievementUnlockedEvent>();
  private readonly levelUp$ = new Subject<LevelUpEvent>();
  private readonly streakReminder$ = new Subject<StreakReminderEvent>();
  private readonly leaderboardUpdated$ = new Subject<LeaderboardUpdatedEvent>();
  private readonly rankChanged$ = new Subject<RankChangedEvent>();

  // Public observables
  readonly onAchievementUnlocked: Observable<AchievementUnlockedEvent> =
    this.achievementUnlocked$.asObservable();
  readonly onLevelUp: Observable<LevelUpEvent> = this.levelUp$.asObservable();
  readonly onStreakReminder: Observable<StreakReminderEvent> =
    this.streakReminder$.asObservable();
  readonly onLeaderboardUpdated: Observable<LeaderboardUpdatedEvent> =
    this.leaderboardUpdated$.asObservable();
  readonly onRankChanged: Observable<RankChangedEvent> = this.rankChanged$.asObservable();

  /**
   * Initialize and start SignalR connection
   */
  async connect(): Promise<void> {
    if (this.hubConnection?.state === HubConnectionState.Connected) {
      this.logger.info('SignalRService', 'Already connected', {});
      return;
    }

    const token = this.authService.getToken();
    if (!token) {
      this.logger.warn('SignalRService', 'No auth token available, skipping connection', {});
      return;
    }

    try {
      this.connectionStateSignal.set(ConnectionState.Connecting);
      this.hubConnection = this.buildConnection(token);
      this.registerEventHandlers();
      this.registerConnectionHandlers();

      await this.hubConnection.start();
      this.connectionStateSignal.set(ConnectionState.Connected);
      this.reconnectAttempt = 0;
      this.logger.info('SignalRService', 'Connected successfully', {});
    } catch (error) {
      this.logger.error('SignalRService', 'Connection failed', {}, error as Error);
      this.connectionStateSignal.set(ConnectionState.Failed);
      this.scheduleReconnect();
    }
  }

  /**
   * Disconnect from SignalR hub
   */
  async disconnect(): Promise<void> {
    if (!this.hubConnection) {
      return;
    }

    try {
      await this.hubConnection.stop();
      this.connectionStateSignal.set(ConnectionState.Disconnected);
      this.logger.info('SignalRService', 'Disconnected', {});
    } catch (error) {
      this.logger.error('SignalRService', 'Error disconnecting', {}, error as Error);
    } finally {
      this.hubConnection = null;
      this.reconnectAttempt = 0;
    }
  }

  /**
   * Join a leaderboard league group
   */
  async joinLeague(league: string): Promise<void> {
    if (this.hubConnection?.state !== HubConnectionState.Connected) {
      this.logger.warn('SignalRService', 'Cannot join league - not connected', {});
      return;
    }

    try {
      await this.hubConnection.invoke('JoinLeague', league);
      this.logger.info('SignalRService', 'Joined league', { league });
    } catch (error) {
      this.logger.error('SignalRService', 'Error joining league', { league }, error as Error);
    }
  }

  /**
   * Leave a leaderboard league group
   */
  async leaveLeague(league: string): Promise<void> {
    if (this.hubConnection?.state !== HubConnectionState.Connected) {
      this.logger.warn('SignalRService', 'Cannot leave league - not connected', {});
      return;
    }

    try {
      await this.hubConnection.invoke('LeaveLeague', league);
      this.logger.info('SignalRService', 'Left league', { league });
    } catch (error) {
      this.logger.error('SignalRService', 'Error leaving league', { league }, error as Error);
    }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.disconnect();
  }

  private buildConnection(token: string): HubConnection {
    const hubUrl = environment.apiUrl.replace('/api/v1', '/hubs/notifications');

    return new HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: () => this.authService.getToken() || '',
      })
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: (retryContext) => {
          // Exponential backoff with jitter
          const delay = Math.min(
            this.baseReconnectDelayMs * Math.pow(2, retryContext.previousRetryCount),
            30000 // Max 30 seconds
          );
          const jitter = Math.random() * 1000;
          return delay + jitter;
        },
      })
      .configureLogging(environment.production ? LogLevel.Warning : LogLevel.Information)
      .build();
  }

  private registerEventHandlers(): void {
    if (!this.hubConnection) return;

    // Achievement unlocked event
    this.hubConnection.on('AchievementUnlocked', (data: AchievementUnlockedEvent) => {
      this.logger.info('SignalRService', 'Achievement unlocked', { data });
      this.achievementUnlocked$.next(data);
    });

    // Level up event
    this.hubConnection.on('LevelUp', (data: LevelUpEvent) => {
      this.logger.info('SignalRService', 'Level up', { data });
      this.levelUp$.next(data);
    });

    // Streak reminder event
    this.hubConnection.on('StreakReminder', (data: StreakReminderEvent) => {
      this.logger.info('SignalRService', 'Streak reminder', { data });
      this.streakReminder$.next(data);
    });

    // Leaderboard updated event
    this.hubConnection.on('LeaderboardUpdated', (data: LeaderboardUpdatedEvent) => {
      this.logger.info('SignalRService', 'Leaderboard updated', { data });
      this.leaderboardUpdated$.next(data);
    });

    // Rank changed event
    this.hubConnection.on('RankChanged', (data: RankChangedEvent) => {
      this.logger.info('SignalRService', 'Rank changed', { data });
      this.rankChanged$.next(data);
    });
  }

  private registerConnectionHandlers(): void {
    if (!this.hubConnection) return;

    this.hubConnection.onreconnecting((error) => {
      this.logger.warn('SignalRService', 'Reconnecting...', { error });
      this.connectionStateSignal.set(ConnectionState.Reconnecting);
    });

    this.hubConnection.onreconnected((connectionId) => {
      this.logger.info('SignalRService', 'Reconnected', { connectionId });
      this.connectionStateSignal.set(ConnectionState.Connected);
      this.reconnectAttempt = 0;
    });

    this.hubConnection.onclose((error) => {
      this.logger.error('SignalRService', 'Connection closed', {}, error as Error);
      this.connectionStateSignal.set(ConnectionState.Disconnected);
      this.scheduleReconnect();
    });
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempt >= this.maxReconnectAttempts) {
      this.logger.error('SignalRService', 'Max reconnect attempts reached', {});
      this.connectionStateSignal.set(ConnectionState.Failed);
      return;
    }

    const delay = Math.min(
      this.baseReconnectDelayMs * Math.pow(2, this.reconnectAttempt),
      30000
    );
    this.reconnectAttempt++;

    this.logger.info('SignalRService', 'Scheduling reconnect attempt', { attempt: this.reconnectAttempt, delayMs: delay });

    timer(delay)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.connect();
      });
  }
}
