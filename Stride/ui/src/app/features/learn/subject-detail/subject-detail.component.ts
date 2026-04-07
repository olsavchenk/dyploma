import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { finalize, forkJoin, catchError, of } from 'rxjs';
import { LearningService, Subject, Topic } from '@app/core';
import { LoggingService } from '@app/core/services/logging.service';

@Component({
  selector: 'app-subject-detail',
  imports: [
    CommonModule,
    RouterLink,
    MatExpansionModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './subject-detail.component.html',
  styleUrl: './subject-detail.component.scss',
})
export class SubjectDetailComponent implements OnInit {
  private readonly learningService = inject(LearningService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly logger = inject(LoggingService);

  protected readonly loading = signal<boolean>(true);
  protected readonly error = signal<string | null>(null);
  protected readonly subject = signal<Subject | null>(null);
  protected readonly topics = signal<Topic[]>([]);

  protected readonly breadcrumbs = computed(() => {
    const subj = this.subject();
    return [
      { label: 'Навчання', route: '/learn' },
      { label: subj?.name || '', route: null },
    ];
  });

  ngOnInit(): void {
    const subjectId = this.route.snapshot.paramMap.get('id');
    if (subjectId) {
      this.loadSubjectData(subjectId);
    } else {
      this.error.set('Не вдалося знайти ідентифікатор предмету');
      this.loading.set(false);
    }
  }

  private loadSubjectData(subjectId: string): void {
    this.loading.set(true);
    this.error.set(null);

    forkJoin({
      subject: this.learningService.getSubject(subjectId).pipe(
        catchError((err) => {
          this.logger.error('SubjectDetailComponent', 'Failed to load subject', { subjectId }, err);
          return of(null);
        })
      ),
      topics: this.learningService.getSubjectTopics(subjectId).pipe(
        catchError((err) => {
          this.logger.error('SubjectDetailComponent', 'Failed to load topics', { subjectId }, err);
          return of([]);
        })
      ),
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (data) => {
          if (!data.subject) {
            this.error.set('Предмет не знайдено');
            return;
          }
          this.subject.set(data.subject);
          this.topics.set(data.topics);
        },
        error: (err) => {
          this.logger.error('SubjectDetailComponent', 'Failed to load subject data', { subjectId }, err);
          this.error.set('Не вдалося завантажити дані. Спробуйте оновити сторінку.');
        },
      });
  }

  protected onTopicClick(topic: Topic): void {
    this.router.navigate(['/learn/session', topic.id]);
  }

  protected onRefresh(): void {
    const subjectId = this.route.snapshot.paramMap.get('id');
    if (subjectId) {
      this.loadSubjectData(subjectId);
    }
  }

  protected getMasteryClass(masteryLevel: number): string {
    if (masteryLevel >= 70) return 'mastery--green';
    if (masteryLevel >= 40) return 'mastery--yellow';
    if (masteryLevel > 0) return 'mastery--red';
    return 'mastery--gray';
  }

  protected getMasteryLabel(masteryLevel: number): string {
    if (masteryLevel >= 90) return 'Майстер';
    if (masteryLevel >= 70) return 'Досвідчений';
    if (masteryLevel >= 50) return 'Вивчаю';
    if (masteryLevel >= 30) return 'Початківець';
    return 'Не розпочато';
  }
}
