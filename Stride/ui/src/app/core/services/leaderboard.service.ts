import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import { LeaderboardResponse, LeaderboardPreview, League } from '../models';

@Injectable({
  providedIn: 'root',
})
export class LeaderboardService {
  private readonly http = inject(HttpClient);

  /**
   * Get full leaderboard for a league
   */
  getLeaderboard(league?: League): Observable<LeaderboardResponse> {
    let params = new HttpParams();
    if (league) {
      params = params.set('league', league);
    }
    return this.http.get<LeaderboardResponse>(
      `${environment.apiUrl}/leaderboard`,
      { params }
    );
  }

  /**
   * Get leaderboard preview (top 5 + current user)
   */
  getLeaderboardPreview(): Observable<LeaderboardPreview> {
    return this.http.get<LeaderboardPreview>(
      `${environment.apiUrl}/leaderboard/preview`
    );
  }
}
