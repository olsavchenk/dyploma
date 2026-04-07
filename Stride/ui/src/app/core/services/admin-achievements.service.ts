import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import {
  Achievement,
  CreateAchievementRequest,
  UpdateAchievementRequest,
  PagedResult,
} from '../models/admin-content.models';

@Injectable({ providedIn: 'root' })
export class AdminAchievementsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/admin/achievements`;

  getAll(page = 1, pageSize = 20, search = ''): Observable<PagedResult<Achievement>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());
    if (search) params = params.set('search', search);
    return this.http.get<PagedResult<Achievement>>(this.baseUrl, { params });
  }

  getById(id: string): Observable<Achievement> {
    return this.http.get<Achievement>(`${this.baseUrl}/${id}`);
  }

  create(req: CreateAchievementRequest): Observable<Achievement> {
    return this.http.post<Achievement>(this.baseUrl, req);
  }

  update(id: string, req: UpdateAchievementRequest): Observable<Achievement> {
    return this.http.put<Achievement>(`${this.baseUrl}/${id}`, req);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
