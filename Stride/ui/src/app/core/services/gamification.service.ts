import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '@environments/environment';
import { GamificationStats, AchievementsResponse } from '../models';

@Injectable({
  providedIn: 'root',
})
export class GamificationService {
  private readonly http = inject(HttpClient);
  
  // Signals for reactive state
  private readonly statsSignal = signal<GamificationStats | null>(null);
  readonly stats = this.statsSignal.asReadonly();

  /**
   * Get gamification stats for current user
   */
  getStats(): Observable<GamificationStats> {
    return this.http
      .get<GamificationStats>(`${environment.apiUrl}/gamification/stats`)
      .pipe(tap((stats) => this.statsSignal.set(stats)));
  }

  /**
   * Get achievements for current user
   */
  getAchievements(): Observable<AchievementsResponse> {
    return this.http.get<AchievementsResponse>(
      `${environment.apiUrl}/gamification/achievements`
    );
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
   * Clear cached stats
   */
  clearStats(): void {
    this.statsSignal.set(null);
  }
}
