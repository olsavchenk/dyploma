import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import {
  AdminDashboard,
  GetReviewQueueRequest,
  PaginatedReviewQueueResponse,
  PaginatedUsersResponse,
  GetUsersRequest,
  ChangeUserRoleRequest,
} from '../models/admin.models';

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/admin`;

  /**
   * Get admin dashboard analytics
   */
  getDashboardAnalytics(): Observable<AdminDashboard> {
    return this.http.get<AdminDashboard>(`${this.baseUrl}/analytics/dashboard`);
  }

  /**
   * Get paginated list of users
   */
  getUsers(request: GetUsersRequest): Observable<PaginatedUsersResponse> {
    let params = new HttpParams()
      .set('page', request.page.toString())
      .set('pageSize', request.pageSize.toString());

    if (request.search) {
      params = params.set('search', request.search);
    }
    if (request.role) {
      params = params.set('role', request.role);
    }
    if (request.isDeleted !== undefined) {
      params = params.set('isDeleted', request.isDeleted.toString());
    }
    if (request.sortBy) {
      params = params.set('sortBy', request.sortBy);
    }
    if (request.sortOrder) {
      params = params.set('sortOrder', request.sortOrder);
    }

    return this.http.get<PaginatedUsersResponse>(`${this.baseUrl}/users`, { params });
  }

  /**
   * Change user role
   */
  changeUserRole(userId: string, request: ChangeUserRoleRequest): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.baseUrl}/users/${userId}/role`, request);
  }

  /**
   * Get AI review queue
   */
  getReviewQueue(request: GetReviewQueueRequest): Observable<PaginatedReviewQueueResponse> {
    let params = new HttpParams()
      .set('page', request.page.toString())
      .set('pageSize', request.pageSize.toString());

    if (request.topicId) {
      params = params.set('topicId', request.topicId);
    }
    if (request.taskType) {
      params = params.set('taskType', request.taskType);
    }
    if (request.difficultyBand !== undefined) {
      params = params.set('difficultyBand', request.difficultyBand.toString());
    }

    return this.http.get<PaginatedReviewQueueResponse>(`${this.baseUrl}/ai/review-queue`, { params });
  }

  /**
   * Approve a task template
   */
  approveTemplate(templateId: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.baseUrl}/ai/review-queue/${templateId}/approve`, {});
  }

  /**
   * Reject a task template
   */
  rejectTemplate(templateId: string, reason?: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.baseUrl}/ai/review-queue/${templateId}/reject`, {
      reason,
    });
  }
}
