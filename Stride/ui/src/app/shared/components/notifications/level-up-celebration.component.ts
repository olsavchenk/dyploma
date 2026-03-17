import { Component, Input, Output, EventEmitter, OnInit, ElementRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, state, style, transition, animate } from '@angular/animations';
import confetti from 'canvas-confetti';
import { LevelUpEvent } from '../../../core/models/notification.models';

@Component({
  selector: 'app-level-up-celebration',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="celebration-overlay" [@fadeIn]="animationState" (click)="handleBackdropClick($event)">
      <div class="celebration-content" [@scaleIn]="animationState" (click)="$event.stopPropagation()">
        <div class="level-badge-large">
          <div class="badge-glow"></div>
          <div class="badge-circle">
            <div class="level-number">{{ levelData.newLevel }}</div>
            <div class="level-label">РІВЕНЬ</div>
          </div>
        </div>
        
        <h2 class="celebration-title">Вітаємо!</h2>
        <p class="celebration-message">
          Ви досягли <strong>{{ levelData.newLevel }} рівня</strong>!
        </p>
        
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-value">{{ levelData.totalXp | number:'1.0-0' }}</div>
            <div class="stat-label">Всього XP</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ levelData.xpForNextLevel | number:'1.0-0' }}</div>
            <div class="stat-label">До наступного</div>
          </div>
        </div>
        
        @if (levelData.rewardsUnlocked && levelData.rewardsUnlocked.length > 0) {
          <div class="rewards-section">
            <h3 class="rewards-title">Розблоковано:</h3>
            <ul class="rewards-list">
              @for (reward of levelData.rewardsUnlocked; track reward) {
                <li class="reward-item">
                  <span class="reward-icon">✨</span>
                  <span>{{ reward }}</span>
                </li>
              }
            </ul>
          </div>
        }
        
        <button class="continue-btn" (click)="handleContinue()">
          Продовжити
        </button>
      </div>
    </div>
  `,
  styles: [`
    .celebration-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.8);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      padding: 1rem;
    }

    .celebration-content {
      background: linear-gradient(135deg, #1E293B 0%, #0F172A 100%);
      border-radius: 24px;
      padding: 3rem 2rem 2rem;
      max-width: 500px;
      width: 100%;
      text-align: center;
      position: relative;
      box-shadow: 
        0 20px 50px rgba(0, 0, 0, 0.5),
        0 0 0 1px rgba(99, 102, 241, 0.3),
        0 0 40px rgba(99, 102, 241, 0.2);
      overflow: hidden;
    }

    .celebration-content::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, #6366F1, #818CF8, #A5B4FC, #6366F1);
      background-size: 200% 100%;
      animation: shimmer 3s ease-in-out infinite;
    }

    @keyframes shimmer {
      0%, 100% { background-position: 0% 0; }
      50% { background-position: 100% 0; }
    }

    .level-badge-large {
      position: relative;
      width: 160px;
      height: 160px;
      margin: 0 auto 2rem;
    }

    .badge-glow {
      position: absolute;
      inset: -20px;
      background: radial-gradient(circle, rgba(99, 102, 241, 0.4), transparent);
      border-radius: 50%;
      animation: pulse 2s ease-in-out infinite;
    }

    @keyframes pulse {
      0%, 100% {
        transform: scale(1);
        opacity: 0.5;
      }
      50% {
        transform: scale(1.1);
        opacity: 0.8;
      }
    }

    .badge-circle {
      position: relative;
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, #6366F1 0%, #4F46E5 100%);
      border-radius: 50%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      box-shadow: 
        0 8px 24px rgba(99, 102, 241, 0.5),
        inset 0 2px 8px rgba(255, 255, 255, 0.2);
    }

    .badge-circle::before {
      content: '';
      position: absolute;
      inset: -4px;
      background: linear-gradient(135deg, #818CF8, #6366F1, #4F46E5);
      border-radius: 50%;
      z-index: -1;
      animation: rotate 4s linear infinite;
    }

    @keyframes rotate {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    .level-number {
      font-size: 4rem;
      font-weight: 800;
      color: white;
      line-height: 1;
      text-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }

    .level-label {
      font-size: 1rem;
      font-weight: 700;
      color: rgba(255, 255, 255, 0.9);
      text-transform: uppercase;
      letter-spacing: 0.15em;
      margin-top: 0.5rem;
    }

    .celebration-title {
      font-size: 2.5rem;
      font-weight: 800;
      background: linear-gradient(135deg, #FBBF24, #F59E0B);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-bottom: 0.5rem;
      animation: titleShine 2s ease-in-out infinite;
    }

    @keyframes titleShine {
      0%, 100% { filter: brightness(1); }
      50% { filter: brightness(1.3); }
    }

    .celebration-message {
      font-size: 1.25rem;
      color: rgba(255, 255, 255, 0.9);
      margin-bottom: 2rem;
      line-height: 1.6;
    }

    .celebration-message strong {
      color: #FDE047;
      font-weight: 700;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .stat-item {
      background: rgba(99, 102, 241, 0.1);
      border: 1px solid rgba(99, 102, 241, 0.3);
      border-radius: 12px;
      padding: 1.25rem 1rem;
    }

    .stat-value {
      font-size: 2rem;
      font-weight: 700;
      color: #818CF8;
      margin-bottom: 0.25rem;
    }

    .stat-label {
      font-size: 0.875rem;
      color: rgba(255, 255, 255, 0.6);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .rewards-section {
      background: rgba(253, 224, 71, 0.1);
      border: 1px solid rgba(253, 224, 71, 0.3);
      border-radius: 12px;
      padding: 1.5rem;
      margin-bottom: 2rem;
    }

    .rewards-title {
      font-size: 1.125rem;
      font-weight: 700;
      color: #FDE047;
      margin-bottom: 1rem;
    }

    .rewards-list {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .reward-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-size: 1rem;
      color: rgba(255, 255, 255, 0.9);
    }

    .reward-icon {
      font-size: 1.25rem;
    }

    .continue-btn {
      width: 100%;
      padding: 1rem 2rem;
      background: linear-gradient(135deg, #6366F1 0%, #4F46E5 100%);
      color: white;
      font-size: 1.125rem;
      font-weight: 700;
      border: none;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
    }

    .continue-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(99, 102, 241, 0.5);
      background: linear-gradient(135deg, #4F46E5 0%, #4338CA 100%);
    }

    .continue-btn:active {
      transform: translateY(0);
    }

    @media (max-width: 640px) {
      .celebration-content {
        padding: 2rem 1.5rem 1.5rem;
      }

      .level-badge-large {
        width: 120px;
        height: 120px;
        margin-bottom: 1.5rem;
      }

      .level-number {
        font-size: 3rem;
      }

      .celebration-title {
        font-size: 2rem;
      }

      .celebration-message {
        font-size: 1.125rem;
      }

      .stats-grid {
        gap: 1rem;
      }

      .stat-value {
        font-size: 1.5rem;
      }
    }
  `],
  animations: [
    trigger('fadeIn', [
      state('void', style({ opacity: 0 })),
      state('visible', style({ opacity: 1 })),
      transition('void => visible', [
        animate('300ms ease-out')
      ]),
    ]),
    trigger('scaleIn', [
      state('void', style({ 
        transform: 'scale(0.8)', 
        opacity: 0 
      })),
      state('visible', style({ 
        transform: 'scale(1)', 
        opacity: 1 
      })),
      transition('void => visible', [
        animate('400ms cubic-bezier(0.34, 1.56, 0.64, 1)')
      ]),
    ]),
  ],
})
export class LevelUpCelebrationComponent implements OnInit {
  @Input() levelData!: LevelUpEvent;
  @Output() continue = new EventEmitter<void>();

  private readonly elementRef = inject(ElementRef);
  animationState: 'visible' = 'visible';

  ngOnInit(): void {
    this.triggerConfetti();
  }

  handleContinue(): void {
    this.continue.emit();
  }

  handleBackdropClick(event: Event): void {
    if (event.target === event.currentTarget) {
      this.handleContinue();
    }
  }

  private triggerConfetti(): void {
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { 
      startVelocity: 30, 
      spread: 360, 
      ticks: 60, 
      zIndex: 10001 
    };

    const randomInRange = (min: number, max: number) => {
      return Math.random() * (max - min) + min;
    };

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        clearInterval(interval);
        return;
      }

      const particleCount = 50 * (timeLeft / duration);

      // Left side
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        colors: ['#6366F1', '#818CF8', '#A5B4FC', '#FDE047', '#FACC15'],
      });

      // Right side
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors: ['#6366F1', '#818CF8', '#A5B4FC', '#FDE047', '#FACC15'],
      });
    }, 250);

    // Initial burst
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#6366F1', '#818CF8', '#A5B4FC', '#FDE047', '#FACC15'],
      zIndex: 10001,
    });
  }
}
