import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { Achievement } from '@app/core/models';

@Component({
  selector: 'app-achievement-detail-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, MatChipsModule],
  template: `
    <div class="detail-dialog">
      <mat-dialog-content>
        <div class="icon-container">
          @if (achievement.iconUrl) {
            <img
              [src]="achievement.iconUrl"
              [alt]="achievement.name"
              class="achievement-icon"
              [class.grayscale]="achievement.unlockedAt === null" />
          } @else {
            <div class="icon-placeholder" [class.grayscale]="achievement.unlockedAt === null">
              <mat-icon>military_tech</mat-icon>
            </div>
          }
          @if (achievement.unlockedAt === null) {
            <div class="lock-overlay">
              <mat-icon>lock</mat-icon>
            </div>
          }
        </div>

        <h2 class="achievement-name">{{ achievement.name }}</h2>

        <p class="achievement-description">{{ achievement.description }}</p>

        <div class="meta-row">
          <mat-chip-set>
            <mat-chip class="xp-chip">+{{ achievement.xpReward }} XP</mat-chip>
          </mat-chip-set>

          @if (achievement.unlockedAt) {
            <span class="unlocked-date">
              <mat-icon>verified</mat-icon>
              Розблоковано {{ formatDate(achievement.unlockedAt) }}
            </span>
          } @else {
            <span class="locked-label">
              <mat-icon>lock</mat-icon>
              Ще не розблоковано
            </span>
          }
        </div>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button (click)="close()">Закрити</button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .detail-dialog {
      min-width: 300px;
      max-width: 420px;
    }

    mat-dialog-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      padding: 2rem 1.5rem 1rem;
      text-align: center;
    }

    .icon-container {
      position: relative;
      width: 80px;
      height: 80px;
    }

    .achievement-icon {
      width: 80px;
      height: 80px;
      object-fit: contain;
      border-radius: 50%;
    }

    .achievement-icon.grayscale {
      filter: grayscale(100%);
    }

    .icon-placeholder {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--blue-600, #2563eb), var(--sun-400, #facc15));
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .icon-placeholder.grayscale {
      filter: grayscale(100%);
    }

    .icon-placeholder mat-icon {
      color: white;
      font-size: 40px;
      width: 40px;
      height: 40px;
    }

    .lock-overlay {
      position: absolute;
      inset: 0;
      border-radius: 50%;
      background: rgba(0, 0, 0, 0.45);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .lock-overlay mat-icon {
      color: white;
      font-size: 28px;
      width: 28px;
      height: 28px;
    }

    .achievement-name {
      font-family: var(--font-display, 'Fraunces', serif);
      font-size: 1.4rem;
      font-weight: 700;
      color: var(--color-ink, rgba(0,0,0,0.87));
      margin: 0;
    }

    .achievement-description {
      font-family: var(--font-sans, sans-serif);
      font-size: 0.95rem;
      color: var(--color-ink-soft, rgba(0,0,0,0.6));
      margin: 0;
      line-height: 1.5;
    }

    .meta-row {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
    }

    .xp-chip {
      background: rgba(37,99,235,0.12);
      color: var(--blue-600, #2563eb);
      font-weight: 600;
    }

    .unlocked-date {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      font-size: 0.85rem;
      color: #16a34a;
    }

    .unlocked-date mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .locked-label {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      font-size: 0.85rem;
      color: var(--color-ink-soft, rgba(0,0,0,0.5));
    }

    .locked-label mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    mat-dialog-actions {
      padding: 0.75rem 1.5rem;
    }
  `],
})
export class AchievementDetailDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<AchievementDetailDialogComponent>);
  readonly achievement: Achievement = inject<{ achievement: Achievement }>(MAT_DIALOG_DATA).achievement;

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('uk-UA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  close(): void {
    this.dialogRef.close();
  }
}
