import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatExpansionModule } from '@angular/material/expansion';
import { TranslateModule } from '@ngx-translate/core';
import { forkJoin, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { environment } from '@environments/environment';

interface SubjectDto {
  id: string;
  name: string;
}

interface TopicDto {
  id: string;
  name: string;
  gradeLevel?: number;
}

interface SubjectGroup {
  subject: SubjectDto;
  topics: TopicDto[];
}

@Component({
  selector: 'app-task-review-index',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatExpansionModule,
    TranslateModule,
  ],
  template: `
    <section class="review-index">
      <header class="page-header">
        <h1 class="font-display">Перевірка завдань</h1>
        <p class="subtitle">Оберіть тему, щоб переглянути та схвалити AI-згенеровані завдання.</p>
      </header>

      @if (loading()) {
        <div class="loading"><mat-spinner diameter="32"></mat-spinner></div>
      } @else if (error()) {
        <mat-card class="error-card">
          <mat-icon>error_outline</mat-icon>
          <span>{{ error() }}</span>
          <button mat-stroked-button (click)="load()">Спробувати ще раз</button>
        </mat-card>
      } @else if (groups().length === 0) {
        <mat-card class="empty-card">
          <mat-icon>inventory_2</mat-icon>
          <div>
            <div class="empty-title">Немає тем для перевірки</div>
            <div class="empty-subtitle">Поверніться пізніше — нові завдання з'являться, коли AI завершить генерацію.</div>
          </div>
        </mat-card>
      } @else {
        <mat-accordion multi>
          @for (group of groups(); track group.subject.id) {
            <mat-expansion-panel>
              <mat-expansion-panel-header>
                <mat-panel-title>{{ group.subject.name }}</mat-panel-title>
                <mat-panel-description>{{ group.topics.length }} тем</mat-panel-description>
              </mat-expansion-panel-header>

              <ul class="topic-list">
                @for (topic of group.topics; track topic.id) {
                  <li>
                    <a [routerLink]="['/teacher/topics', topic.id, 'tasks']" class="topic-link">
                      <span class="topic-name">{{ topic.name }}</span>
                      @if (topic.gradeLevel) {
                        <span class="topic-grade">{{ topic.gradeLevel }} кл.</span>
                      }
                      <mat-icon class="arrow">chevron_right</mat-icon>
                    </a>
                  </li>
                }
              </ul>
            </mat-expansion-panel>
          }
        </mat-accordion>
      }
    </section>
  `,
  styles: [`
    :host { display: block; padding: 2rem; max-width: 960px; margin: 0 auto; }
    .page-header { margin-bottom: 1.5rem; }
    .page-header h1 { margin: 0 0 0.5rem; font-size: 2rem; }
    .subtitle { color: var(--mat-sys-on-surface-variant, #5a5a5a); margin: 0; }
    .loading { display: flex; justify-content: center; padding: 4rem; }
    .error-card, .empty-card {
      display: flex; align-items: center; gap: 1rem; padding: 1.5rem;
    }
    .empty-title { font-weight: 600; }
    .empty-subtitle { color: var(--mat-sys-on-surface-variant, #6a6a6a); font-size: 0.9rem; margin-top: 0.25rem; }
    .topic-list { list-style: none; margin: 0; padding: 0; }
    .topic-list li { border-bottom: 1px solid rgba(0,0,0,0.06); }
    .topic-list li:last-child { border-bottom: none; }
    .topic-link {
      display: flex; align-items: center; gap: 1rem; padding: 0.85rem 0.25rem;
      text-decoration: none; color: inherit;
    }
    .topic-link:hover { background: rgba(0,0,0,0.03); }
    .topic-name { flex: 1; }
    .topic-grade {
      font-size: 0.8rem; color: var(--mat-sys-on-surface-variant, #6a6a6a);
      padding: 0.15rem 0.5rem; border-radius: 999px; background: rgba(0,0,0,0.05);
    }
    .arrow { color: var(--mat-sys-on-surface-variant, #6a6a6a); }
  `],
})
export class TaskReviewIndexComponent implements OnInit {
  private readonly http = inject(HttpClient);

  protected readonly groups = signal<SubjectGroup[]>([]);
  protected readonly loading = signal<boolean>(true);
  protected readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.error.set(null);

    this.http
      .get<SubjectDto[]>(`${environment.apiUrl}/subjects`)
      .pipe(
        switchMap((subjects) => {
          if (!subjects?.length) {
            return of([] as SubjectGroup[]);
          }
          return forkJoin(
            subjects.map((subject) =>
              this.http
                .get<TopicDto[]>(`${environment.apiUrl}/subjects/${subject.id}/topics`)
                .pipe(
                  catchError(() => of([] as TopicDto[])),
                ),
            ),
          ).pipe(
            switchMap((topicLists) =>
              of(
                subjects
                  .map((subject, idx) => ({ subject, topics: topicLists[idx] ?? [] }))
                  .filter((g) => g.topics.length > 0),
              ),
            ),
          );
        }),
        catchError((err) => {
          this.error.set('Не вдалося завантажити список тем.');
          return of([] as SubjectGroup[]);
        }),
      )
      .subscribe((result) => {
        this.groups.set(result);
        this.loading.set(false);
      });
  }
}
