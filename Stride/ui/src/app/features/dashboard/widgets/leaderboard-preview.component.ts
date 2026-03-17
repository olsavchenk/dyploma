import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { LeaderboardPreview, LeaderboardEntry } from '@app/core';

@Component({
  selector: 'app-leaderboard-preview',
  imports: [CommonModule, RouterLink, MatCardModule, MatButtonModule, MatIconModule],
  template: `
    <mat-card class="leaderboard-preview">
      <mat-card-header>
        <mat-card-title>
          <mat-icon>emoji_events</mat-icon>
          Таблиця лідерів
        </mat-card-title>
        <mat-card-subtitle>{{ leagueLabel }} • Тиждень {{ currentWeek }}</mat-card-subtitle>
      </mat-card-header>
      
      <mat-card-content>
        @if (preview && preview.topEntries.length > 0) {
          <div class="leaderboard-list">
            @for (entry of preview.topEntries; track entry.studentId) {
              <div 
                class="leaderboard-entry" 
                [class.current-user]="entry.isCurrentUser"
                [class.top-three]="entry.rank <= 3">
                <div class="rank">
                  @if (entry.rank === 1) {
                    <span class="medal gold">🥇</span>
                  } @else if (entry.rank === 2) {
                    <span class="medal silver">🥈</span>
                  } @else if (entry.rank === 3) {
                    <span class="medal bronze">🥉</span>
                  } @else {
                    <span class="rank-number">{{ entry.rank }}</span>
                  }
                </div>
                
                <div class="user-avatar">
                  @if (entry.avatarUrl) {
                    <img [src]="entry.avatarUrl" [alt]="entry.displayName">
                  } @else {
                    <div class="avatar-placeholder">
                      {{ getInitials(entry.displayName) }}
                    </div>
                  }
                </div>
                
                <div class="user-name">{{ entry.displayName }}</div>
                
                <div class="xp-badge">
                  <mat-icon>stars</mat-icon>
                  {{ entry.weeklyXp | number:'1.0-0' }}
                </div>
              </div>
            }
            
            @if (preview.currentUserEntry && !isInTopFive()) {
              <div class="divider">
                <span>...</span>
              </div>
              
              <div class="leaderboard-entry current-user">
                <div class="rank">
                  <span class="rank-number">{{ preview.currentUserRank }}</span>
                </div>
                
                <div class="user-avatar">
                  @if (preview.currentUserEntry.avatarUrl) {
                    <img [src]="preview.currentUserEntry.avatarUrl" [alt]="preview.currentUserEntry.displayName">
                  } @else {
                    <div class="avatar-placeholder">
                      {{ getInitials(preview.currentUserEntry.displayName) }}
                    </div>
                  }
                </div>
                
                <div class="user-name">{{ preview.currentUserEntry.displayName }} (Ви)</div>
                
                <div class="xp-badge">
                  <mat-icon>stars</mat-icon>
                  {{ preview.currentUserEntry.weeklyXp | number:'1.0-0' }}
                </div>
              </div>
            }
          </div>
        } @else {
          <div class="empty-state">
            <mat-icon>emoji_events</mat-icon>
            <p>Завершіть завдання, щоб з'явитися в таблиці лідерів!</p>
          </div>
        }
      </mat-card-content>
      
      <mat-card-actions>
        <button mat-button color="primary" routerLink="/leaderboard">
          Переглянути повну таблицю
          <mat-icon>arrow_forward</mat-icon>
        </button>
      </mat-card-actions>
    </mat-card>
  `,
  styles: [`
    .leaderboard-preview {
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    mat-card-header {
      padding-bottom: 0.5rem;
    }

    mat-card-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 1.25rem;
      font-weight: 600;
    }

    mat-card-title mat-icon {
      color: #FBBF24;
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    mat-card-subtitle {
      color: rgba(0, 0, 0, 0.6);
      font-size: 0.875rem;
      margin-top: 0.25rem;
    }

    mat-card-content {
      flex: 1;
      padding: 1rem 0;
    }

    .leaderboard-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .leaderboard-entry {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      border-radius: 12px;
      background: #F9FAFB;
      transition: all 0.2s ease;
    }

    .leaderboard-entry:hover {
      background: #F3F4F6;
      transform: translateX(4px);
    }

    .leaderboard-entry.current-user {
      background: linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%);
      border: 2px solid #6366F1;
    }

    .leaderboard-entry.top-three {
      background: linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%);
    }

    .rank {
      width: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
    }

    .medal {
      font-size: 1.5rem;
    }

    .rank-number {
      color: rgba(0, 0, 0, 0.6);
      font-size: 1rem;
    }

    .user-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      overflow: hidden;
      flex-shrink: 0;
    }

    .user-avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .avatar-placeholder {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #6366F1 0%, #4F46E5 100%);
      color: white;
      font-weight: 600;
      font-size: 0.875rem;
    }

    .user-name {
      flex: 1;
      font-weight: 500;
      color: rgba(0, 0, 0, 0.87);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .xp-badge {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.25rem 0.75rem;
      background: white;
      border-radius: 12px;
      font-weight: 600;
      color: #6366F1;
      font-size: 0.875rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .xp-badge mat-icon {
      color: #FBBF24;
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .divider {
      text-align: center;
      padding: 0.5rem 0;
      color: rgba(0, 0, 0, 0.4);
      font-size: 1.25rem;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem 1rem;
      text-align: center;
      color: rgba(0, 0, 0, 0.6);
    }

    .empty-state mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: rgba(0, 0, 0, 0.3);
      margin-bottom: 1rem;
    }

    .empty-state p {
      margin: 0;
      font-size: 0.875rem;
    }

    mat-card-actions {
      padding: 1rem;
      margin: 0;
      border-top: 1px solid rgba(0, 0, 0, 0.08);
    }

    mat-card-actions button {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
    }

    @media (max-width: 640px) {
      .user-name {
        font-size: 0.875rem;
      }

      .xp-badge {
        font-size: 0.75rem;
        padding: 0.25rem 0.5rem;
      }
    }
  `],
})
export class LeaderboardPreviewComponent {
  @Input() preview: LeaderboardPreview | null = null;

  get leagueLabel(): string {
    switch (this.preview?.league) {
      case 'Bronze': return 'Бронзова ліга';
      case 'Silver': return 'Срібна ліга';
      case 'Gold': return 'Золота ліга';
      case 'Platinum': return 'Платинова ліга';
      case 'Diamond': return 'Діамантова ліга';
      default: return 'Ліга';
    }
  }

  get currentWeek(): number {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const diff = now.getTime() - start.getTime();
    return Math.ceil(diff / (7 * 24 * 60 * 60 * 1000));
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  isInTopFive(): boolean {
    if (!this.preview?.currentUserRank) return false;
    return this.preview.currentUserRank <= 5;
  }
}
