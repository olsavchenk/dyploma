export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  confirmPassword: string;
  displayName: string;
  gdprConsent: boolean;
}

export interface GoogleLoginRequest {
  idToken: string;
}

export interface SelectRoleRequest {
  role: 'Student' | 'Teacher';
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface RefreshTokenRequest {
  // Refresh token is sent via HttpOnly cookie
}
