import { League } from './gamification.models';

export interface LeaderboardEntry {
  studentId: string;
  displayName: string;
  avatarUrl: string | null;
  weeklyXp: number;
  rank: number;
  isCurrentUser: boolean;
}

export interface LeaderboardResponse {
  league: League;
  weekNumber: number;
  year: number;
  entries: LeaderboardEntry[];
  currentUserRank: number | null;
  totalParticipants: number;
  promotionZone: number;
  demotionZone: number;
}

export interface LeaderboardPreview {
  league: League;
  topEntries: LeaderboardEntry[];
  currentUserEntry: LeaderboardEntry | null;
  currentUserRank: number | null;
}
