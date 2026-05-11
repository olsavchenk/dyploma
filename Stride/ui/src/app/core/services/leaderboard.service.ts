import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, shareReplay } from 'rxjs';
import { environment } from '@environments/environment';
import {
  LeaderboardEntry,
  LeaderboardPeriod,
  LeaderboardPreview,
  LeaderboardResponse,
  LeaderboardScope,
  League,
} from '../models';

interface LeaderboardWireResponse {
  league?: League;
  weekNumber?: number;
  year?: number;
  // Backend uses TopPlayers/TotalPlayers; older clients used entries/totalParticipants.
  topPlayers?: LeaderboardEntry[];
  entries?: LeaderboardEntry[];
  currentUserEntry?: LeaderboardEntry | null;
  currentUserRank?: number | null;
  totalPlayers?: number;
  totalParticipants?: number;
  promotionZoneCount?: number;
  demotionZoneCount?: number;
  promotionZone?: number;
  demotionZone?: number;
}

export interface LeaderboardQuery {
  league?: League;
  period?: LeaderboardPeriod;
  scope?: LeaderboardScope;
}

@Injectable({
  providedIn: 'root',
})
export class LeaderboardService {
  private readonly http = inject(HttpClient);

  /**
   * Cache keyed by (league|period|scope) — keeps in-flight requests deduped
   * for the same query within a route load.
   */
  private readonly cache = new Map<string, Observable<LeaderboardResponse>>();

  /**
   * Get full leaderboard. Accepts either a bare `League` (legacy) or a query
   * object with `league`, `period`, and `scope`.
   */
  getLeaderboard(
    leagueOrQuery?: League | LeaderboardQuery
  ): Observable<LeaderboardResponse> {
    const query: LeaderboardQuery =
      typeof leagueOrQuery === 'string' || leagueOrQuery == null
        ? { league: leagueOrQuery as League | undefined }
        : leagueOrQuery;

    const cacheKey = `${query.league ?? ''}|${query.period ?? ''}|${query.scope ?? ''}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    let params = new HttpParams();
    if (query.league) params = params.set('league', query.league);
    if (query.period) params = params.set('period', query.period);
    if (query.scope) params = params.set('scope', query.scope);

    const request$ = this.http
      .get<LeaderboardWireResponse>(`${environment.apiUrl}/leaderboard`, { params })
      .pipe(
        map((resp) => this.normalize(resp)),
        shareReplay({ bufferSize: 1, refCount: true })
      );

    this.cache.set(cacheKey, request$);
    return request$;
  }

  /**
   * Force a fresh fetch (e.g. after a SignalR `LeaderboardUpdated` event)
   * by clearing the dedup cache for this query first.
   */
  refreshLeaderboard(
    query?: LeaderboardQuery
  ): Observable<LeaderboardResponse> {
    const q = query ?? {};
    const cacheKey = `${q.league ?? ''}|${q.period ?? ''}|${q.scope ?? ''}`;
    this.cache.delete(cacheKey);
    return this.getLeaderboard(q);
  }

  /**
   * Get leaderboard preview (top 5 + current user)
   */
  getLeaderboardPreview(): Observable<LeaderboardPreview> {
    return this.http.get<LeaderboardPreview>(
      `${environment.apiUrl}/leaderboard/preview`
    );
  }

  private normalize(resp: LeaderboardWireResponse | null): LeaderboardResponse {
    const entries =
      resp?.entries ?? resp?.topPlayers ?? [];
    const safeEntries = Array.isArray(entries) ? entries : [];
    return {
      league: (resp?.league ?? 'Bronze') as League,
      weekNumber: resp?.weekNumber ?? 0,
      year: resp?.year ?? 0,
      entries: safeEntries,
      currentUserEntry: resp?.currentUserEntry ?? null,
      currentUserRank:
        resp?.currentUserRank ?? resp?.currentUserEntry?.rank ?? null,
      totalParticipants: resp?.totalParticipants ?? resp?.totalPlayers ?? safeEntries.length,
      promotionZone: resp?.promotionZone ?? resp?.promotionZoneCount ?? 10,
      demotionZone: resp?.demotionZone ?? resp?.demotionZoneCount ?? 5,
    };
  }
}
