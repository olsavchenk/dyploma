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
}

export interface AchievementsResponse {
  earned: Achievement[];
  locked: Achievement[];
  totalEarned: number;
  totalAvailable: number;
}
