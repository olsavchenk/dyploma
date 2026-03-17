import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import { Task, TaskSubmitResponse, TaskAttempt, MatchingPair } from '../models';

@Injectable({
  providedIn: 'root',
})
export class TaskService {
  private readonly http = inject(HttpClient);

  /**
   * Get next adaptive task for a topic
   */
  getNextTask(topicId: string): Observable<Task> {
    const params = new HttpParams().set('topicId', topicId);
    return this.http.get<Task>(`${environment.apiUrl}/tasks/next`, { params });
  }

  /**
   * Submit task answer
   */
  submitTask(
    taskId: string,
    answer: string | string[] | MatchingPair[],
    responseTimeMs: number
  ): Observable<TaskSubmitResponse> {
    return this.http.post<TaskSubmitResponse>(
      `${environment.apiUrl}/tasks/${taskId}/submit`,
      {
        answer, // Pass answer as-is, let HttpClient handle serialization
        responseTimeMs,
      }
    );
  }

  /**
   * Get task attempt history
   */
  getTaskHistory(page: number = 1, pageSize: number = 20): Observable<{
    items: TaskAttempt[];
    totalCount: number;
    page: number;
    pageSize: number;
  }> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());
    return this.http.get<{
      items: TaskAttempt[];
      totalCount: number;
      page: number;
      pageSize: number;
    }>(`${environment.apiUrl}/tasks/history`, { params });
  }
}
