import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import {
  TaskGenerationStatus,
  TaskTemplatePagedResult,
  TaskTemplateDetail,
  TaskReviewFilters,
  BulkActionRequest,
} from '../models/task-generation.models';

@Injectable({
  providedIn: 'root',
})
export class TaskGenerationService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  getGenerationStatus(jobId: string): Observable<TaskGenerationStatus> {
    return this.http.get<TaskGenerationStatus>(
      `${this.baseUrl}/task-generation/${jobId}/status`
    );
  }

  getTopicTasks(topicId: string, filters?: TaskReviewFilters): Observable<TaskTemplatePagedResult> {
    let params = new HttpParams();
    if (filters?.reviewStatus) params = params.set('reviewStatus', filters.reviewStatus);
    if (filters?.difficultyBand) params = params.set('difficultyBand', filters.difficultyBand.toString());
    if (filters?.taskType) params = params.set('taskType', filters.taskType);
    if (filters?.page) params = params.set('page', filters.page.toString());
    if (filters?.pageSize) params = params.set('pageSize', filters.pageSize.toString());

    return this.http.get<TaskTemplatePagedResult>(
      `${this.baseUrl}/topics/${topicId}/tasks`,
      { params }
    );
  }

  getTaskDetail(topicId: string, templateId: string): Observable<TaskTemplateDetail> {
    return this.http.get<TaskTemplateDetail>(
      `${this.baseUrl}/topics/${topicId}/tasks/${templateId}`
    );
  }

  approveTask(topicId: string, templateId: string): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}/topics/${topicId}/tasks/${templateId}/approve`,
      {}
    );
  }

  rejectTask(topicId: string, templateId: string): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}/topics/${topicId}/tasks/${templateId}/reject`,
      {}
    );
  }

  bulkAction(topicId: string, request: BulkActionRequest): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}/topics/${topicId}/tasks/bulk-action`,
      request
    );
  }

  deleteTask(topicId: string, templateId: string): Observable<void> {
    return this.http.delete<void>(
      `${this.baseUrl}/topics/${topicId}/tasks/${templateId}`
    );
  }
}
