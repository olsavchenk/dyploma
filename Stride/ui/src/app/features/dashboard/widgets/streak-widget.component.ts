import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, state, style, transition, animate } from '@angular/animations';

@Component({
  selector: 'app-streak-widget',
  imports: [CommonModule],
  template: `
    <div class="streak-widget" [class.pulsing]="isPulsing">
      <div class="flame-container" [@flameState]="streakState">
        <div class="flame">
          <svg width="40" height="48" viewBox="0 0 40 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 0C20 0 8 12 8 24C8 30.6274 13.3726 36 20 36C26.6274 36 32 30.6274 32 24C32 12 20 0 20 0Z" 
                  [attr.fill]="flameColor"/>
            <path d="M20 8C20 8 14 16 14 24C14 27.3137 16.6863 30 20 30C23.3137 30 26 27.3137 26 24C26 16 20 8 20 8Z" 
                  fill="#FDB44B" opacity="0.8"/>
            <path d="M20 14C20 14 17 19 17 24C17 26.2091 18.7909 28 21 28C23.2091 28 25 26.2091 25 24C25 19 20 14 20 14Z" 
                  fill="#FFF4E0" opacity="0.6"/>
          </svg>
        </div>
      </div>
      
      <div class="streak-info">
        <div class="streak-count">{{ currentStreak }}</div>
        <div class="streak-label">Дні поспіль</div>
      </div>
      
      @if (longestStreak > currentStreak) {
        <div class="longest-streak">
          Рекорд: {{ longestStreak }}
        </div>
      }
    </div>
  `,
  styles: [`
    .streak-widget {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.5rem;
      background: linear-gradient(135deg, #FFF7ED 0%, #FED7AA 100%);
      border-radius: 16px;
      box-shadow: 0 4px 6px rgba(251, 146, 60, 0.1);
      position: relative;
      overflow: hidden;
      transition: all 0.3s ease;
    }

    .streak-widget:hover {
      box-shadow: 0 8px 12px rgba(251, 146, 60, 0.15);
      transform: translateY(-2px);
    }

    .streak-widget.pulsing {
      animation: pulse 2s ease-in-out infinite;
    }

    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.05); }
    }

    .flame-container {
      position: relative;
    }

    .flame svg {
      filter: drop-shadow(0 2px 8px rgba(251, 146, 60, 0.4));
    }

    .streak-info {
      flex: 1;
    }

    .streak-count {
      font-size: 2.5rem;
      font-weight: 700;
      background: linear-gradient(135deg, #FB923C 0%, #F97316 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      line-height: 1;
      margin-bottom: 0.25rem;
    }

    .streak-label {
      font-size: 0.875rem;
      color: #92400E;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .longest-streak {
      position: absolute;
      top: 0.5rem;
      right: 0.75rem;
      font-size: 0.75rem;
      color: #92400E;
      background: rgba(255, 255, 255, 0.5);
      padding: 0.25rem 0.5rem;
      border-radius: 6px;
      font-weight: 500;
    }

    @media (max-width: 640px) {
      .streak-widget {
        padding: 1rem;
      }

      .streak-count {
        font-size: 2rem;
      }

      .flame svg {
        width: 32px;
        height: 38px;
      }
    }
  `],
  animations: [
    trigger('flameState', [
      state('cold', style({ transform: 'scale(0.9)', opacity: 0.6 })),
      state('warm', style({ transform: 'scale(1)', opacity: 0.85 })),
      state('hot', style({ transform: 'scale(1.1)', opacity: 1 })),
      transition('* => *', animate('500ms ease-in-out')),
    ]),
  ],
})
export class StreakWidgetComponent {
  @Input() currentStreak: number = 0;
  @Input() longestStreak: number = 0;

  get streakState(): 'cold' | 'warm' | 'hot' {
    if (this.currentStreak === 0) return 'cold';
    if (this.currentStreak < 7) return 'warm';
    return 'hot';
  }

  get flameColor(): string {
    if (this.currentStreak === 0) return '#CBD5E0';
    if (this.currentStreak < 7) return '#FB923C';
    return '#F97316';
  }

  get isPulsing(): boolean {
    return this.currentStreak >= 7;
  }
}
