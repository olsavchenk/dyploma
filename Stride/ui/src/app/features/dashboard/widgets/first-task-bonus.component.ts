import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-first-task-bonus',
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="bonus-banner" [class.completed]="isCompleted" [class.available]="!isCompleted">
      <div class="bonus-content">
        <div class="bonus-icon">
          @if (isCompleted) {
            <mat-icon>check_circle</mat-icon>
          } @else {
            <mat-icon>card_giftcard</mat-icon>
          }
        </div>
        
        <div class="bonus-text">
          @if (isCompleted) {
            <div class="bonus-title">Перше завдання дня виконано! 🎉</div>
            <div class="bonus-subtitle">Ви отримали бонус +50 XP</div>
          } @else {
            <div class="bonus-title">Перше завдання дня +50 XP! 🎁</div>
            <div class="bonus-subtitle">Виконайте будь-яке завдання, щоб отримати бонус</div>
          }
        </div>
      </div>
      
      @if (!isCompleted) {
        <div class="bonus-pulse"></div>
      }
    </div>
  `,
  styles: [`
    .bonus-banner {
      position: relative;
      padding: 1rem 1.5rem;
      border-radius: var(--radius-md);
      overflow: hidden;
      transition: all var(--transition-base);
    }

    .bonus-banner.available {
      background: linear-gradient(135deg, var(--sun-400) 0%, var(--sun-500) 100%);
      box-shadow: 0 4px 12px rgba(255, 213, 0, 0.3);
      animation: gentle-bounce 2s ease-in-out infinite;
    }

    .bonus-banner.completed {
      background: linear-gradient(135deg, var(--color-success) 0%, #15803d 100%);
      box-shadow: 0 4px 12px rgba(31, 143, 92, 0.3);
    }

    @keyframes gentle-bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-4px); }
    }

    .bonus-content {
      display: flex;
      align-items: center;
      gap: 1rem;
      position: relative;
      z-index: 1;
    }

    .bonus-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 48px;
      background: rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      flex-shrink: 0;
    }

    .bonus-icon mat-icon {
      color: white;
      font-size: 28px;
      width: 28px;
      height: 28px;
    }

    .bonus-text {
      flex: 1;
    }

    .bonus-title {
      font-family: var(--font-sans);
      font-size: 1rem;
      font-weight: 700;
      color: var(--blue-900);
      margin-bottom: 0.25rem;
    }

    .bonus-subtitle {
      font-family: var(--font-sans);
      font-size: 0.875rem;
      color: var(--blue-800);
      opacity: 0.85;
    }

    .bonus-pulse {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 100%;
      height: 100%;
      background: radial-gradient(circle, rgba(255, 255, 255, 0.3) 0%, transparent 70%);
      animation: pulse 2s ease-in-out infinite;
      pointer-events: none;
    }

    @keyframes pulse {
      0%, 100% {
        opacity: 0;
        transform: translate(-50%, -50%) scale(0.8);
      }
      50% {
        opacity: 1;
        transform: translate(-50%, -50%) scale(1.2);
      }
    }

    @media (max-width: 640px) {
      .bonus-banner {
        padding: 0.875rem 1rem;
      }

      .bonus-icon {
        width: 40px;
        height: 40px;
      }

      .bonus-icon mat-icon {
        font-size: 24px;
        width: 24px;
        height: 24px;
      }

      .bonus-title {
        font-size: 0.875rem;
      }

      .bonus-subtitle {
        font-size: 0.75rem;
      }
    }
  `],
})
export class FirstTaskBonusComponent {
  @Input() isCompleted: boolean = false;
}
