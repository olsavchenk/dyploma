import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  EMPTY,
  Observable,
  filter,
  map,
  shareReplay,
  switchMap,
  take,
  tap,
} from 'rxjs';
import { environment } from '@environments/environment';
import { Achievement, AchievementsResponse, GamificationStats } from '../models';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class GamificationService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);

  // Signals for reactive state
  private readonly statsSignal = signal<GamificationStats | null>(null);
  readonly stats = this.statsSignal.asReadonly();

  // Shared replay caches to dedupe in-flight requests within the same route load
  private stats$: Observable<GamificationStats> | null = null;
  private achievements$: Observable<AchievementsResponse> | null = null;

  /**
   * Get gamification stats for current user.
   *
   * Only Students have a gamification profile — for Teachers/Admins the API
   * returns 403, so we short-circuit to EMPTY here. We also wait for the
   * access token to be hydrated to avoid the boot-time 401/403 race.
   * Result is shared via `shareReplay` to dedupe parallel subscribers.
   */
  getStats(): Observable<GamificationStats> {
    if (!this.authService.isStudent()) {
      return EMPTY;
    }
    if (!this.stats$) {
      this.stats$ = this.authService.tokenReady$.pipe(
        filter((ready) => ready),
        take(1),
        switchMap(() =>
          this.http
            .get<GamificationStats>(`${environment.apiUrl}/gamification/stats`)
            .pipe(tap((stats) => this.statsSignal.set(stats)))
        ),
        shareReplay({ bufferSize: 1, refCount: true })
      );
    }
    return this.stats$;
  }

  /**
   * Get achievements for current user.
   *
   * Backend currently returns either:
   *   - a flat array `Achievement[]` with an `isUnlocked` flag, OR
   *   - the legacy `{ earned, locked, totalEarned, totalAvailable }` shape.
   * This method normalizes both into `AchievementsResponse` so the
   * component contract stays stable.
   */
  getAchievements(): Observable<AchievementsResponse> {
    if (!this.achievements$) {
      this.achievements$ = this.http
        .get<Achievement[] | AchievementsResponse>(
          `${environment.apiUrl}/gamification/achievements`
        )
        .pipe(
          map((resp) => this.normalizeAchievements(resp)),
          shareReplay({ bufferSize: 1, refCount: true })
        );
    }
    return this.achievements$;
  }

  private normalizeAchievements(
    resp: Achievement[] | AchievementsResponse | null | undefined
  ): AchievementsResponse {
    // Already in normalized shape
    if (resp && !Array.isArray(resp) && 'earned' in resp && 'locked' in resp) {
      const earned = resp.earned ?? [];
      const locked = resp.locked ?? [];
      return {
        earned,
        locked,
        totalEarned: resp.totalEarned ?? earned.length,
        totalAvailable: resp.totalAvailable ?? earned.length + locked.length,
      };
    }

    // Flat array shape (current backend reality)
    const arr: Achievement[] = Array.isArray(resp) ? resp : [];
    const earned = arr.filter((a) => a.isUnlocked === true || !!a.unlockedAt);
    const locked = arr.filter(
      (a) => !(a.isUnlocked === true || !!a.unlockedAt)
    );
    return {
      earned,
      locked,
      totalEarned: earned.length,
      totalAvailable: arr.length,
    };
  }

  /**
   * Purchase streak freeze
   */
  purchaseStreakFreeze(): Observable<void> {
    return this.http.post<void>(
      `${environment.apiUrl}/gamification/streak/freeze`,
      {}
    );
  }

  /**
   * Repair broken streak
   */
  repairStreak(): Observable<void> {
    return this.http.post<void>(
      `${environment.apiUrl}/gamification/streak/repair`,
      {}
    );
  }

  /**
   * Clear cached stats (call on logout / forced refresh)
   */
  clearStats(): void {
    this.statsSignal.set(null);
    this.stats$ = null;
    this.achievements$ = null;
  }
}
