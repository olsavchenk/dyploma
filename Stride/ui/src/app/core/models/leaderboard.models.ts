import { League } from './gamification.models';

export interface LeaderboardEntry {
  studentId: string;
  displayName: string;
  avatarUrl: string | null;
  weeklyXp: number;
  rank: number;
  isCurrentUser: boolean;
  /** Optional fields exposed by backend DTO */
  totalXp?: number;
  level?: number;
  league?: League;
  rankChange?: number;
  tier?: string;
}

/**
 * Normalized leaderboard response used by the UI.
 *
 * Backend returns `topPlayers`/`totalPlayers`; older UI code expects
 * `entries`/`totalParticipants`. The `LeaderboardService` normalizes
 * the wire format before returning, so consumers can rely on `entries`
 * and `totalParticipants` being present.
 */
export interface LeaderboardResponse {
  league: League;
  weekNumber: number;
  year: number;
  entries: LeaderboardEntry[];
  currentUserRank: number | null;
  totalParticipants: number;
  promotionZone: number;
  demotionZone: number;
  /** Convenience: included so consumers can render the highlighted row */
  currentUserEntry?: LeaderboardEntry | null;
}

export interface LeaderboardPreview {
  league: League;
  topEntries: LeaderboardEntry[];
  currentUserEntry: LeaderboardEntry | null;
  currentUserRank: number | null;
}

export type LeaderboardPeriod = 'all' | 'week' | 'month';
export type LeaderboardScope = 'global' | 'class';
