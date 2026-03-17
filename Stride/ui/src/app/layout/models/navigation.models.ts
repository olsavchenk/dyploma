import { UserRole } from '@app/core/models';

export interface NavItem {
  label: string;
  icon: string;
  route: string;
  roles?: UserRole[];
  badge?: number;
}

export interface UserMenuAction {
  label: string;
  icon: string;
  action: () => void;
}

export interface UserStats {
  totalXp: number;
  currentLevel: number;
  currentStreak: number;
  xpToNextLevel: number;
  xpProgress: number;
}
