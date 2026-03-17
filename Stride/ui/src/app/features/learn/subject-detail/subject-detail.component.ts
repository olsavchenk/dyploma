import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatTreeModule, MatTreeNestedDataSource } from '@angular/material/tree';
import { NestedTreeControl } from '@angular/cdk/tree';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { finalize, forkJoin, catchError, of } from 'rxjs';
import { LearningService, Subject, Topic } from '@app/core';
import { LoggingService } from '@app/core/services/logging.service';

interface TopicNode extends Topic {
  level: number;
  children?: TopicNode[];
}

@Component({
  selector: 'app-subject-detail',
  imports: [
    CommonModule,
    RouterLink,
    MatTreeModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatChipsModule,
    MatTooltipModule,
  ],
  templateUrl: './subject-detail.component.html',
  styleUrl: './subject-detail.component.scss',
})
export class SubjectDetailComponent implements OnInit {
  private readonly learningService = inject(LearningService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly logger = inject(LoggingService);

  // State signals
  protected readonly loading = signal<boolean>(true);
  protected readonly error = signal<string | null>(null);
  protected readonly subject = signal<Subject | null>(null);
  protected readonly topics = signal<Topic[]>([]);

  // Tree control
  protected readonly treeControl = new NestedTreeControl<TopicNode>((node) => node.children);
  protected readonly dataSource = new MatTreeNestedDataSource<TopicNode>();

  // Computed values
  protected readonly breadcrumbs = computed(() => {
    const subj = this.subject();
    return [
      { label: 'Навчання', route: '/learn' },
      { label: subj?.name || '', route: null },
    ];
  });

  protected readonly hasChild = (_: number, node: TopicNode) =>
    !!node.children && node.children.length > 0;

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
          this.buildTopicTree(data.topics);
        },
        error: (err) => {
          this.logger.error('SubjectDetailComponent', 'Failed to load subject data', { subjectId }, err);
          this.error.set('Не вдалося завантажити дані. Спробуйте оновити сторінку.');
        },
      });
  }

  private buildTopicTree(topics: Topic[]): void {
    // Build hierarchical structure
    const topicMap = new Map<string, TopicNode>();
    const rootTopics: TopicNode[] = [];

    // First pass: create all nodes
    topics.forEach((topic) => {
      topicMap.set(topic.id, { ...topic, level: 0, children: [] });
    });

    // Second pass: build hierarchy
    topics.forEach((topic) => {
      const node = topicMap.get(topic.id)!;
      
      if (topic.parentTopicId && topicMap.has(topic.parentTopicId)) {
        const parent = topicMap.get(topic.parentTopicId)!;
        if (!parent.children) {
          parent.children = [];
        }
        node.level = parent.level + 1;
        parent.children.push(node);
      } else {
        rootTopics.push(node);
      }
    });

    // Sort by sortOrder at each level
    const sortNodes = (nodes: TopicNode[]) => {
      nodes.sort((a, b) => a.sortOrder - b.sortOrder);
      nodes.forEach((node) => {
        if (node.children && node.children.length > 0) {
          sortNodes(node.children);
        }
      });
    };

    sortNodes(rootTopics);
    this.dataSource.data = rootTopics;

    // Expand root nodes by default
    rootTopics.forEach((node) => this.treeControl.expand(node));
  }

  protected onTopicClick(topic: TopicNode): void {
    // Navigate to task session for this topic
    this.router.navigate(['/learn/session', topic.id]);
  }

  protected onRefresh(): void {
    const subjectId = this.route.snapshot.paramMap.get('id');
    if (subjectId) {
      this.loadSubjectData(subjectId);
    }
  }

  protected getMasteryLabel(masteryLevel: number): string {
    if (masteryLevel >= 90) return 'Майстер';
    if (masteryLevel >= 70) return 'Досвідчений';
    if (masteryLevel >= 50) return 'Вивчаю';
    if (masteryLevel >= 30) return 'Початківець';
    return 'Не розпочато';
  }

  protected getMasteryColor(masteryLevel: number): string {
    if (masteryLevel >= 90) return 'accent';
    if (masteryLevel >= 70) return 'primary';
    if (masteryLevel >= 50) return 'primary';
    if (masteryLevel >= 30) return 'warn';
    return '';
  }

  protected getMasteryIcon(masteryLevel: number): string {
    if (masteryLevel >= 90) return 'emoji_events';
    if (masteryLevel >= 70) return 'star';
    if (masteryLevel >= 50) return 'trending_up';
    if (masteryLevel >= 30) return 'play_circle_outline';
    return 'radio_button_unchecked';
  }

  protected getProgressColor(progress: number): string {
    if (progress >= 80) return 'accent';
    if (progress >= 50) return 'primary';
    return 'warn';
  }

  protected getGradeLevelLabel(gradeLevel: number): string {
    return `${gradeLevel} клас`;
  }
}
