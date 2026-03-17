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
      border-radius: 12px;
      overflow: hidden;
      transition: all 0.3s ease;
    }

    .bonus-banner.available {
      background: linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%);
      box-shadow: 0 4px 12px rgba(251, 191, 36, 0.3);
      animation: gentle-bounce 2s ease-in-out infinite;
    }

    .bonus-banner.completed {
      background: linear-gradient(135deg, #34D399 0%, #10B981 100%);
      box-shadow: 0 4px 12px rgba(52, 211, 153, 0.3);
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
      font-size: 1rem;
      font-weight: 700;
      color: white;
      margin-bottom: 0.25rem;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    }

    .bonus-subtitle {
      font-size: 0.875rem;
      color: rgba(255, 255, 255, 0.95);
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
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
