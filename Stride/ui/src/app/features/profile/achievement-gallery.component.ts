import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Achievement } from '@app/core/models';

@Component({
  selector: 'app-achievement-gallery',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatChipsModule, MatTooltipModule],
  template: `
    <div class="gallery-grid">
      @for (achievement of achievements(); track achievement.id) {
        <div
          class="achievement-card"
          [class.unlocked]="achievement.unlockedAt !== null"
          [class.locked]="achievement.unlockedAt === null"
          (click)="achievementClick.emit(achievement)"
          [matTooltip]="achievement.unlockedAt === null ? 'Ще не розблоковано' : 'Розблоковано'"
          role="button"
          tabindex="0"
          (keydown.enter)="achievementClick.emit(achievement)">

          <div class="icon-wrapper">
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
                <mat-icon class="lock-icon">lock</mat-icon>
              </div>
            }
          </div>

          <div class="achievement-name">{{ achievement.name }}</div>

          <mat-chip-set>
            <mat-chip class="xp-chip" [class.xp-chip--unlocked]="achievement.unlockedAt !== null">
              +{{ achievement.xpReward }} XP
            </mat-chip>
          </mat-chip-set>
        </div>
      }
    </div>
  `,
  styles: [`
    .gallery-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
    }

    @media (max-width: 900px) {
      .gallery-grid {
        grid-template-columns: repeat(3, 1fr);
      }
    }

    @media (max-width: 600px) {
      .gallery-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    .achievement-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      padding: 1rem 0.75rem;
      border-radius: var(--radius-md, 12px);
      border: 1px solid var(--color-rule, rgba(0,0,0,0.1));
      background: var(--color-surface, #fff);
      cursor: pointer;
      transition: transform 0.18s var(--ease-editorial, ease), box-shadow 0.18s ease;
      text-align: center;
    }

    .achievement-card.unlocked:hover {
      transform: scale(1.04);
      box-shadow: var(--shadow-card, 0 4px 12px rgba(0,0,0,0.12));
    }

    .achievement-card.locked {
      opacity: 0.7;
    }

    .icon-wrapper {
      position: relative;
      width: 64px;
      height: 64px;
    }

    .achievement-icon {
      width: 64px;
      height: 64px;
      object-fit: contain;
      border-radius: 50%;
    }

    .achievement-icon.grayscale {
      filter: grayscale(100%);
    }

    .icon-placeholder {
      width: 64px;
      height: 64px;
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
      font-size: 32px;
      width: 32px;
      height: 32px;
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

    .lock-icon {
      color: white;
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    .achievement-name {
      font-family: var(--font-sans, sans-serif);
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--color-ink, rgba(0,0,0,0.87));
      line-height: 1.2;
    }

    .xp-chip {
      font-size: 0.7rem;
      height: 22px;
      background: rgba(0,0,0,0.08);
      color: var(--color-ink-soft, rgba(0,0,0,0.6));
    }

    .xp-chip--unlocked {
      background: rgba(37,99,235,0.12);
      color: var(--blue-600, #2563eb);
    }
  `],
})
export class AchievementGalleryComponent {
  achievements = input<Achievement[]>([]);
  achievementClick = output<Achievement>();
}
