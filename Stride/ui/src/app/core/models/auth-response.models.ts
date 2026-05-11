export interface AuthResponse {
  accessToken: string;
  expiresAt?: string;
  user: UserInfo;
}

export interface UserInfo {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  role: UserRole;
  isEmailVerified: boolean;
  hasCompletedOnboarding: boolean;
  createdAt: string;
}

export type UserRole = 'Student' | 'Teacher' | 'Admin';

export interface RefreshTokenResponse {
  accessToken: string;
  expiresAt?: string;
  user?: UserInfo;
}
