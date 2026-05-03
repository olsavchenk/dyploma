import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ContinueLearningTopic } from '@app/core';

@Component({
  selector: 'app-topic-card',
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatProgressBarModule,
    MatButtonModule,
    MatIconModule,
  ],
  template: `
    <mat-card class="topic-card" [routerLink]="['/learn/session', topic.topicId]">
      <mat-card-header>
        <div class="subject-icon" [style.background-image]="'url(' + (topic.subjectIconUrl || '/assets/icons/default-subject.svg') + ')'">
          @if (!topic.subjectIconUrl) {
            <mat-icon>school</mat-icon>
          }
        </div>
        <mat-card-title-group>
          <mat-card-title>{{ topic.topicName }}</mat-card-title>
          <mat-card-subtitle>{{ topic.subjectName }}</mat-card-subtitle>
        </mat-card-title-group>
      </mat-card-header>
      
      <mat-card-content>
        <div class="progress-section">
          <div class="progress-label">
            <span>Прогрес</span>
            <span class="progress-value">{{ topic.progress | number:'1.0-0' }}%</span>
          </div>
          <mat-progress-bar 
            mode="determinate" 
            [value]="topic.progress"
            [color]="progressColor">
          </mat-progress-bar>
        </div>
        
        <div class="stats-grid">
          <div class="stat-item">
            <mat-icon class="stat-icon">psychology</mat-icon>
            <div class="stat-content">
              <div class="stat-label">Рівень майстерності</div>
              <div class="stat-value">{{ getMasteryLabel(topic.masteryLevel) }}</div>
            </div>
          </div>
          
          <div class="stat-item">
            <mat-icon class="stat-icon">trending_up</mat-icon>
            <div class="stat-content">
              <div class="stat-label">Складність</div>
              <div class="stat-value">{{ topic.currentDifficulty }}/100</div>
            </div>
          </div>
        </div>
        
        <div class="last-active">
          <mat-icon>schedule</mat-icon>
          <span>{{ getLastActiveText(topic.lastActiveAt) }}</span>
        </div>
      </mat-card-content>
      
      <mat-card-actions>
        <button mat-raised-button color="primary" class="continue-button">
          <mat-icon>play_arrow</mat-icon>
          Продовжити навчання
        </button>
      </mat-card-actions>
    </mat-card>
  `,
  styles: [`
    .topic-card {
      cursor: pointer;
      transition: box-shadow var(--transition-base), transform var(--transition-base);
      height: 100%;
      display: flex;
      flex-direction: column;
      min-width: 280px;
      max-width: 360px;
      flex-shrink: 0;
    }

    .topic-card:hover {
      transform: translateY(-3px);
      box-shadow: var(--shadow-hero);
    }

    mat-card-header { gap: 1rem; }

    .subject-icon {
      width: 48px;
      height: 48px;
      border-radius: var(--radius-sm);
      background: linear-gradient(135deg, var(--blue-600) 0%, var(--blue-700) 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      background-size: cover;
      background-position: center;
    }

    .subject-icon mat-icon {
      color: white;
      font-size: 28px;
      width: 28px;
      height: 28px;
    }

    mat-card-title {
      font-family: var(--font-display);
      font-size: 1.125rem;
      font-weight: 600;
      margin-bottom: 0.25rem;
      color: var(--color-ink);
    }

    mat-card-subtitle {
      color: var(--color-ink-soft);
      font-family: var(--font-sans);
      font-size: 0.875rem;
    }

    mat-card-content {
      flex: 1;
      padding-top: 1rem;
    }

    .progress-section { margin-bottom: 1rem; }

    .progress-label {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
      font-family: var(--font-sans);
      font-size: 0.875rem;
      color: var(--color-ink-soft);
    }

    .progress-value {
      font-family: var(--font-mono);
      font-weight: 600;
      color: var(--blue-600);
    }

    mat-progress-bar {
      height: 8px;
      border-radius: var(--radius-pill);
    }

    .stats-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
      margin-bottom: 1rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid var(--color-rule);
    }

    .stat-item {
      display: flex;
      gap: 0.5rem;
      align-items: flex-start;
    }

    .stat-icon {
      color: var(--blue-600);
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .stat-content { flex: 1; }

    .stat-label {
      font-family: var(--font-sans);
      font-size: 0.75rem;
      color: var(--color-ink-soft);
      margin-bottom: 0.125rem;
    }

    .stat-value {
      font-family: var(--font-sans);
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--color-ink);
    }

    .last-active {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-family: var(--font-sans);
      font-size: 0.875rem;
      color: var(--color-ink-soft);
    }

    .last-active mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    mat-card-actions {
      padding: 1rem;
      margin: 0;
    }

    .continue-button {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      font-family: var(--font-sans);
      font-weight: 600;
    }

    @media (max-width: 640px) {
      .topic-card { min-width: 260px; }
      .stats-grid { grid-template-columns: 1fr; gap: 0.75rem; }
    }
  `],
})
export class TopicCardComponent {
  @Input({ required: true }) topic!: ContinueLearningTopic;

  get progressColor(): 'primary' | 'accent' | 'warn' {
    if (this.topic.progress < 30) return 'warn';
    if (this.topic.progress < 70) return 'accent';
    return 'primary';
  }

  getMasteryLabel(level: number): string {
    if (level < 20) return 'Початківець';
    if (level < 40) return 'Учень';
    if (level < 60) return 'Практик';
    if (level < 80) return 'Майстер';
    return 'Експерт';
  }

  getLastActiveText(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Щойно';
    if (diffMins < 60) return `${diffMins} хв тому`;
    if (diffHours < 24) return `${diffHours} год тому`;
    if (diffDays === 1) return 'Вчора';
    if (diffDays < 7) return `${diffDays} дні тому`;
    return date.toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' });
  }
}
