import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import {
  Class,
  ClassMember,
  Assignment,
  StudentAssignment,
  ClassAnalytics,
  StudentPerformanceDetail,
  CreateClassRequest,
  UpdateClassRequest,
  JoinClassRequest,
  CreateAssignmentRequest,
  UpdateAssignmentRequest,
  ClassQuickStats,
} from '../models/teacher.models';

@Injectable({
  providedIn: 'root',
})
export class TeacherService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/classes`;

  /**
   * Get teacher's quick stats
   */
  getQuickStats(): Observable<ClassQuickStats> {
    return this.http.get<ClassQuickStats>(`${this.baseUrl}/stats`);
  }

  /**
   * Get all classes for the teacher
   */
  getClasses(): Observable<Class[]> {
    return this.http.get<Class[]>(this.baseUrl);
  }

  /**
   * Get class by ID
   */
  getClass(classId: string): Observable<Class> {
    return this.http.get<Class>(`${this.baseUrl}/${classId}`);
  }

  /**
   * Create new class
   */
  createClass(request: CreateClassRequest): Observable<Class> {
    return this.http.post<Class>(this.baseUrl, request);
  }

  /**
   * Update class
   */
  updateClass(classId: string, request: UpdateClassRequest): Observable<Class> {
    return this.http.put<Class>(`${this.baseUrl}/${classId}`, request);
  }

  /**
   * Delete class
   */
  deleteClass(classId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${classId}`);
  }

  /**
   * Join class (Student)
   */
  joinClass(request: JoinClassRequest): Observable<{ message: string; classId: string }> {
    return this.http.post<{ message: string; classId: string }>(`${this.baseUrl}/join`, request);
  }

  /**
   * Get students in class
   */
  getClassStudents(classId: string): Observable<ClassMember[]> {
    return this.http.get<ClassMember[]>(`${this.baseUrl}/${classId}/students`);
  }

  /**
   * Remove student from class
   */
  removeStudent(classId: string, studentId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${classId}/students/${studentId}`);
  }

  /**
   * Get class analytics
   */
  getClassAnalytics(classId: string): Observable<ClassAnalytics> {
    return this.http.get<ClassAnalytics>(`${this.baseUrl}/${classId}/analytics`);
  }

  /**
   * Get student performance detail
   */
  getStudentDetail(classId: string, studentId: string): Observable<StudentPerformanceDetail> {
    return this.http.get<StudentPerformanceDetail>(
      `${this.baseUrl}/${classId}/students/${studentId}`
    );
  }

  /**
   * Get assignments for class
   */
  getClassAssignments(classId: string): Observable<Assignment[]> {
    return this.http.get<Assignment[]>(`${this.baseUrl}/${classId}/assignments`);
  }

  /**
   * Create assignment
   */
  createAssignment(classId: string, request: CreateAssignmentRequest): Observable<Assignment> {
    return this.http.post<Assignment>(`${this.baseUrl}/${classId}/assignments`, request);
  }

  /**
   * Update assignment
   */
  updateAssignment(
    classId: string,
    assignmentId: string,
    request: UpdateAssignmentRequest
  ): Observable<Assignment> {
    return this.http.put<Assignment>(
      `${this.baseUrl}/${classId}/assignments/${assignmentId}`,
      request
    );
  }

  /**
   * Delete assignment
   */
  deleteAssignment(classId: string, assignmentId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${classId}/assignments/${assignmentId}`);
  }

  /**
   * Get student's assignments (for student view)
   */
  getMyAssignments(): Observable<StudentAssignment[]> {
    return this.http.get<StudentAssignment[]>(`${environment.apiUrl}/assignments`);
  }
}
