import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import {
  Subject,
  Topic,
  ContinueLearningTopic,
  LearningPath,
  LearningPathStep,
  StudentClass,
} from '../models';

@Injectable({
  providedIn: 'root',
})
export class LearningService {
  private readonly http = inject(HttpClient);

  /**
   * Get classes the current student is enrolled in, with subjects derived from assignments
   */
  getMyClasses(): Observable<StudentClass[]> {
    return this.http.get<StudentClass[]>(`${environment.apiUrl}/classes/my`);
  }

  /**
   * Join a class using a 6-character join code
   */
  joinClass(joinCode: string): Observable<{ message: string; className: string }> {
    return this.http.post<{ message: string; className: string }>(
      `${environment.apiUrl}/classes/join`,
      { joinCode }
    );
  }

  /**
   * Get all subjects with progress
   */
  getSubjects(): Observable<Subject[]> {
    return this.http.get<Subject[]>(`${environment.apiUrl}/subjects`);
  }

  /**
   * Get subject by id
   */
  getSubject(id: string): Observable<Subject> {
    return this.http.get<Subject>(`${environment.apiUrl}/subjects/${id}`);
  }

  /**
   * Get topics for a subject
   */
  getSubjectTopics(subjectId: string): Observable<Topic[]> {
    return this.http.get<Topic[]>(
      `${environment.apiUrl}/subjects/${subjectId}/topics`
    );
  }

  /**
   * Get topic by id
   */
  getTopic(id: string): Observable<Topic> {
    return this.http.get<Topic>(`${environment.apiUrl}/topics/${id}`);
  }

  /**
   * Get topics for "Continue Learning" section
   */
  getContinueLearningTopics(limit: number = 3): Observable<ContinueLearningTopic[]> {
    const params = new HttpParams().set('limit', limit.toString());
    return this.http.get<ContinueLearningTopic[]>(
      `${environment.apiUrl}/learning/continue`,
      { params }
    );
  }

  /**
   * Get learning paths with filters
   */
  getLearningPaths(filters?: {
    subjectId?: string;
    gradeLevel?: number;
  }): Observable<LearningPath[]> {
    let params = new HttpParams();
    if (filters?.subjectId) {
      params = params.set('subjectId', filters.subjectId);
    }
    if (filters?.gradeLevel) {
      params = params.set('gradeLevel', filters.gradeLevel.toString());
    }
    return this.http.get<LearningPath[]>(
      `${environment.apiUrl}/learning-paths`,
      { params }
    );
  }

  /**
   * Get learning path with steps
   */
  getLearningPath(id: string): Observable<{
    path: LearningPath;
    steps: LearningPathStep[];
  }> {
    return this.http.get<{
      path: LearningPath;
      steps: LearningPathStep[];
    }>(`${environment.apiUrl}/learning-paths/${id}`);
  }
}
