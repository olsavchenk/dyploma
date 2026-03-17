import { UserRole } from './auth-response.models';

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  role: UserRole;
  createdAt: string;
  lastLoginAt: string | null;
  studentStats: StudentStats | null;
  teacherStats: TeacherStats | null;
}

export interface StudentStats {
  totalXp: number;
  currentLevel: number;
  currentStreak: number;
  longestStreak: number;
  streakFreezes: number;
  league: string;
  totalTasksAttempted: number;
  achievementsUnlocked: number;
}

export interface TeacherStats {
  school: string | null;
  gradesTaught: string | null;
  subjectsExpertise: string | null;
  totalClasses: number;
  totalStudents: number;
}

export interface UpdateProfileRequest {
  displayName?: string;
  school?: string;
  gradesTaught?: string;
  subjectsExpertise?: string;
}

export interface UserDataExport {
  user: {
    id: string;
    email: string;
    displayName: string;
    role: string;
    createdAt: string;
  };
  profile: StudentStats | TeacherStats | null;
  tasks: any[];
  achievements: any[];
}
