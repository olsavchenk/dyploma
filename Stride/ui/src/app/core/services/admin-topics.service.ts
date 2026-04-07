import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import {
  Topic,
  CreateTopicRequest,
  UpdateTopicRequest,
  PagedResult,
} from '../models/admin-content.models';

@Injectable({ providedIn: 'root' })
export class AdminTopicsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/admin/topics`;

  getAll(page = 1, pageSize = 20, search = '', subjectId?: string): Observable<PagedResult<Topic>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());
    if (search) params = params.set('search', search);
    if (subjectId) params = params.set('subjectId', subjectId);
    return this.http.get<PagedResult<Topic>>(this.baseUrl, { params });
  }

  getById(id: string): Observable<Topic> {
    return this.http.get<Topic>(`${this.baseUrl}/${id}`);
  }

  create(req: CreateTopicRequest): Observable<Topic> {
    return this.http.post<Topic>(this.baseUrl, req);
  }

  update(id: string, req: UpdateTopicRequest): Observable<Topic> {
    return this.http.put<Topic>(`${this.baseUrl}/${id}`, req);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
