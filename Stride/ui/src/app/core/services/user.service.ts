import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import { UserProfile, UpdateProfileRequest, UserDataExport } from '../models/user.models';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/users`;

  /**
   * Get current user profile
   */
  getUserProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.baseUrl}/me`);
  }

  /**
   * Update current user profile
   */
  updateUserProfile(request: UpdateProfileRequest): Observable<UserProfile> {
    return this.http.put<UserProfile>(`${this.baseUrl}/me`, request);
  }

  /**
   * Upload user avatar
   */
  uploadAvatar(file: File): Observable<{ avatarUrl: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ avatarUrl: string }>(`${this.baseUrl}/me/avatar`, formData);
  }

  /**
   * Export user data (GDPR)
   */
  exportUserData(): Observable<UserDataExport> {
    return this.http.get<UserDataExport>(`${this.baseUrl}/me/data-export`);
  }

  /**
   * Delete user account
   */
  deleteUserAccount(): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/me`);
  }
}
