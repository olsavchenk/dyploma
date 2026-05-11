import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, filter, shareReplay, switchMap, take } from 'rxjs';
import { environment } from '@environments/environment';
import {
  Subject,
  Topic,
  ContinueLearningTopic,
  LearningPath,
  LearningPathStep,
  StudentClass,
} from '../models';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class LearningService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);

  // Per-key shareReplay caches (deduplicate parallel calls within a route load).
  // Cleared via clearCaches() on logout.
  private myClasses$: Observable<StudentClass[]> | null = null;
  private subjects$: Observable<Subject[]> | null = null;
  private continueLearning$ = new Map<number, Observable<ContinueLearningTopic[]>>();

  /**
   * Get classes the current student is enrolled in, with subjects derived from assignments
   */
  getMyClasses(): Observable<StudentClass[]> {
    if (!this.myClasses$) {
      this.myClasses$ = this.http
        .get<StudentClass[]>(`${environment.apiUrl}/classes/my`)
        .pipe(shareReplay({ bufferSize: 1, refCount: true }));
    }
    return this.myClasses$;
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
    if (!this.subjects$) {
      this.subjects$ = this.http
        .get<Subject[]>(`${environment.apiUrl}/subjects`)
        .pipe(shareReplay({ bufferSize: 1, refCount: true }));
    }
    return this.subjects$;
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
   * Get topics for "Continue Learning" section.
   *
   * Gated on auth token readiness to avoid 401 races during app boot.
   * Cached per `limit` value via shareReplay so multiple dashboard widgets
   * subscribing in parallel only trigger one HTTP call.
   */
  getContinueLearningTopics(limit: number = 3): Observable<ContinueLearningTopic[]> {
    const cached = this.continueLearning$.get(limit);
    if (cached) return cached;

    const params = new HttpParams().set('limit', limit.toString());
    const req$ = this.authService.tokenReady$.pipe(
      filter((ready) => ready),
      take(1),
      switchMap(() =>
        this.http.get<ContinueLearningTopic[]>(
          `${environment.apiUrl}/learning/continue`,
          { params }
        )
      ),
      shareReplay({ bufferSize: 1, refCount: true })
    );
    this.continueLearning$.set(limit, req$);
    return req$;
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

  /** Clear caches (call on logout / when invalidating shared data). */
  clearCaches(): void {
    this.myClasses$ = null;
    this.subjects$ = null;
    this.continueLearning$.clear();
  }
}
