export interface GamificationStats {
  totalXp: number;
  currentLevel: number;
  xpToNextLevel: number;
  xpProgress: number;
  currentStreak: number;
  longestStreak: number;
  streakFreezes: number;
  league: League;
  firstTaskOfDayCompleted: boolean;
}

export type League = 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond';

export interface Achievement {
  id: string;
  code: string;
  name: string;
  description: string;
  iconUrl: string;
  xpReward: number;
  isHidden: boolean;
  unlockedAt: string | null;
  /** Backend flag (flat array response) — true if the achievement has been earned */
  isUnlocked?: boolean;
}

/**
 * Normalized client-side shape used by the profile UI.
 * The backend currently returns a flat `Achievement[]` array;
 * `GamificationService.getAchievements()` splits it into earned/locked.
 */
export interface AchievementsResponse {
  earned: Achievement[];
  locked: Achievement[];
  totalEarned: number;
  totalAvailable: number;
}
