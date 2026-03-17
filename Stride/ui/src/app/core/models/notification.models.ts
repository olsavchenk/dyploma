/**
 * Achievement unlocked notification
 */
export interface AchievementUnlockedEvent {
  achievementId: string;
  code: string;
  name: string;
  description: string;
  iconUrl: string;
  xpReward: number;
  unlockedAt: Date;
}

/**
 * Level up notification
 */
export interface LevelUpEvent {
  newLevel: number;
  totalXp: number;
  xpForNextLevel: number;
  rewardsUnlocked: string[];
}

/**
 * Streak reminder notification
 */
export interface StreakReminderEvent {
  currentStreak: number;
  hoursRemaining: number;
  message: string;
}

/**
 * Leaderboard update notification
 */
export interface LeaderboardUpdatedEvent {
  league: string;
  topPlayers: LeaderboardPlayer[];
}

export interface LeaderboardPlayer {
  rank: number;
  studentId: string;
  displayName: string;
  avatarUrl?: string;
  weeklyXp: number;
}

/**
 * Rank changed notification
 */
export interface RankChangedEvent {
  oldRank: number;
  newRank: number;
  league: string;
  weeklyXp: number;
}

/**
 * Generic notification types
 */
export enum NotificationType {
  AchievementUnlocked = 'AchievementUnlocked',
  LevelUp = 'LevelUp',
  StreakReminder = 'StreakReminder',
  LeaderboardUpdated = 'LeaderboardUpdated',
  RankChanged = 'RankChanged',
}

/**
 * SignalR connection state
 */
export enum ConnectionState {
  Disconnected = 'Disconnected',
  Connecting = 'Connecting',
  Connected = 'Connected',
  Reconnecting = 'Reconnecting',
  Failed = 'Failed',
}
