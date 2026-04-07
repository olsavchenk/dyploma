import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import {
  Subject,
  CreateSubjectRequest,
  UpdateSubjectRequest,
  PagedResult,
} from '../models/admin-content.models';

@Injectable({ providedIn: 'root' })
export class AdminSubjectsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/admin/subjects`;

  getAll(page = 1, pageSize = 20, search = ''): Observable<PagedResult<Subject>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());
    if (search) params = params.set('search', search);
    return this.http.get<PagedResult<Subject>>(this.baseUrl, { params });
  }

  getById(id: string): Observable<Subject> {
    return this.http.get<Subject>(`${this.baseUrl}/${id}`);
  }

  create(req: CreateSubjectRequest): Observable<Subject> {
    return this.http.post<Subject>(this.baseUrl, req);
  }

  update(id: string, req: UpdateSubjectRequest): Observable<Subject> {
    return this.http.put<Subject>(`${this.baseUrl}/${id}`, req);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
