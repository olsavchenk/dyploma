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

  // Notification hub
  private hubConnection: HubConnection | null = null;
  // Leaderboard hub (separate connection)
  private leaderboardHubConnection: HubConnection | null = null;

  private reconnectAttempt = 0;
  private maxReconnectAttempts = 10;
  private baseReconnectDelayMs = 1000;
  private destroy$ = new Subject<void>();

  // Connection state signal
  private readonly connectionStateSignal = signal<ConnectionState>(ConnectionState.Disconnected);
  readonly connectionState = this.connectionStateSignal.asReadonly();

  // Event subjects
  private readonly achievementUnlocked$ = new Subject<AchievementUnlockedEvent>();
  private readonly levelUp$ = new Subject<LevelUpEvent>();
  private readonly streakReminder$ = new Subject<StreakReminderEvent>();
  private readonly leaderboardUpdated$ = new Subject<LeaderboardUpdatedEvent>();
  private readonly rankChanged$ = new Subject<RankChangedEvent>();

  // Public observables
  readonly onAchievementUnlocked: Observable<AchievementUnlockedEvent> = this.achievementUnlocked$.asObservable();
  readonly onLevelUp: Observable<LevelUpEvent> = this.levelUp$.asObservable();
  readonly onStreakReminder: Observable<StreakReminderEvent> = this.streakReminder$.asObservable();
  readonly onLeaderboardUpdated: Observable<LeaderboardUpdatedEvent> = this.leaderboardUpdated$.asObservable();
  readonly onRankChanged: Observable<RankChangedEvent> = this.rankChanged$.asObservable();

  /** Connect to the notifications hub */
  async connect(): Promise<void> {
    if (this.hubConnection?.state === HubConnectionState.Connected) {
      return;
    }

    const token = this.authService.getToken();
    if (!token) {
      this.logger.warn('SignalRService', 'No auth token, skipping connection', {});
      return;
    }

    try {
      this.connectionStateSignal.set(ConnectionState.Connecting);
      this.hubConnection = this.buildConnection(token, '/hubs/notifications');
      this.registerNotificationHandlers();
      this.registerConnectionHandlers(this.hubConnection);

      await this.hubConnection.start();
      this.connectionStateSignal.set(ConnectionState.Connected);
      this.reconnectAttempt = 0;
      this.logger.info('SignalRService', 'Notifications hub connected', {});
    } catch (error) {
      this.logger.error('SignalRService', 'Notifications hub connection failed', {}, error as Error);
      this.connectionStateSignal.set(ConnectionState.Failed);
      this.scheduleReconnect();
    }
  }

  /** Connect to the leaderboard hub */
  async connectLeaderboard(): Promise<void> {
    if (this.leaderboardHubConnection?.state === HubConnectionState.Connected) {
      return;
    }

    const token = this.authService.getToken();
    if (!token) return;

    try {
      this.leaderboardHubConnection = this.buildConnection(token, '/hubs/leaderboard');
      this.registerLeaderboardHandlers();

      await this.leaderboardHubConnection.start();
      this.logger.info('SignalRService', 'Leaderboard hub connected', {});
    } catch (error) {
      this.logger.error('SignalRService', 'Leaderboard hub connection failed', {}, error as Error);
    }
  }

  /** Disconnect both hubs */
  async disconnect(): Promise<void> {
    try {
      if (this.hubConnection) {
        await this.hubConnection.stop();
        this.hubConnection = null;
      }
      if (this.leaderboardHubConnection) {
        await this.leaderboardHubConnection.stop();
        this.leaderboardHubConnection = null;
      }
      this.connectionStateSignal.set(ConnectionState.Disconnected);
      this.logger.info('SignalRService', 'Disconnected from all hubs', {});
    } catch (error) {
      this.logger.error('SignalRService', 'Error disconnecting', {}, error as Error);
    } finally {
      this.reconnectAttempt = 0;
    }
  }

  /** Join a leaderboard league group */
  async joinLeague(league: string): Promise<void> {
    const hub = this.leaderboardHubConnection ?? this.hubConnection;
    if (hub?.state !== HubConnectionState.Connected) {
      this.logger.warn('SignalRService', 'Cannot join league — not connected', {});
      return;
    }
    try {
      await hub.invoke('JoinLeague', league);
      this.logger.info('SignalRService', 'Joined league', { league });
    } catch (error) {
      this.logger.error('SignalRService', 'Error joining league', { league }, error as Error);
    }
  }

  /** Leave a leaderboard league group */
  async leaveLeague(league: string): Promise<void> {
    const hub = this.leaderboardHubConnection ?? this.hubConnection;
    if (hub?.state !== HubConnectionState.Connected) return;
    try {
      await hub.invoke('LeaveLeague', league);
      this.logger.info('SignalRService', 'Left league', { league });
    } catch (error) {
      this.logger.error('SignalRService', 'Error leaving league', { league }, error as Error);
    }
  }

  /** Cleanup */
  destroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.disconnect();
  }

  private buildConnection(token: string, hubPath: string): HubConnection {
    const hubUrl = environment.apiUrl.replace('/api/v1', hubPath);
    return new HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: () => this.authService.getToken() || '',
      })
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: (ctx) => {
          const delay = Math.min(this.baseReconnectDelayMs * Math.pow(2, ctx.previousRetryCount), 30000);
          return delay + Math.random() * 1000;
        },
      })
      .configureLogging(environment.production ? LogLevel.Warning : LogLevel.Information)
      .build();
  }

  private registerNotificationHandlers(): void {
    if (!this.hubConnection) return;

    this.hubConnection.on('AchievementUnlocked', (data: AchievementUnlockedEvent) => {
      this.logger.info('SignalRService', 'Achievement unlocked', { data });
      this.achievementUnlocked$.next(data);
    });

    this.hubConnection.on('LevelUp', (data: LevelUpEvent) => {
      this.logger.info('SignalRService', 'Level up', { data });
      this.levelUp$.next(data);
    });

    this.hubConnection.on('StreakReminder', (data: StreakReminderEvent) => {
      this.logger.info('SignalRService', 'Streak reminder', { data });
      this.streakReminder$.next(data);
    });
  }

  private registerLeaderboardHandlers(): void {
    if (!this.leaderboardHubConnection) return;

    this.leaderboardHubConnection.on('LeaderboardUpdated', (data: LeaderboardUpdatedEvent) => {
      this.logger.info('SignalRService', 'Leaderboard updated', { data });
      this.leaderboardUpdated$.next(data);
    });

    this.leaderboardHubConnection.on('RankChanged', (data: RankChangedEvent) => {
      this.logger.info('SignalRService', 'Rank changed', { data });
      this.rankChanged$.next(data);
    });
  }

  private registerConnectionHandlers(hub: HubConnection): void {
    hub.onreconnecting((error) => {
      this.logger.warn('SignalRService', 'Reconnecting...', { error });
      this.connectionStateSignal.set(ConnectionState.Reconnecting);
    });

    hub.onreconnected((connectionId) => {
      this.logger.info('SignalRService', 'Reconnected', { connectionId });
      this.connectionStateSignal.set(ConnectionState.Connected);
      this.reconnectAttempt = 0;
    });

    hub.onclose((error) => {
      this.logger.error('SignalRService', 'Connection closed', {}, error as Error);
      this.connectionStateSignal.set(ConnectionState.Disconnected);
      this.scheduleReconnect();
    });
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempt >= this.maxReconnectAttempts) {
      this.connectionStateSignal.set(ConnectionState.Failed);
      return;
    }
    const delay = Math.min(this.baseReconnectDelayMs * Math.pow(2, this.reconnectAttempt), 30000);
    this.reconnectAttempt++;
    timer(delay)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.connect());
  }
}
