import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, state, style, transition, animate } from '@angular/animations';

@Component({
  selector: 'app-xp-bar',
  imports: [CommonModule],
  template: `
    <div class="xp-bar-container">
      <div class="xp-header">
        <div class="level-badge" [@levelBadge]="levelAnimationState">
          <div class="level-number">{{ currentLevel }}</div>
          <div class="level-label">Рівень</div>
        </div>
        
        <div class="xp-info">
          <div class="xp-label">Досвід</div>
          <div class="xp-count">
            {{ currentXp | number:'1.0-0' }} / {{ xpToNextLevel | number:'1.0-0' }} XP
          </div>
        </div>
      </div>
      
      <div class="progress-bar-container">
        <div class="progress-bar-bg">
          <div 
            class="progress-bar-fill" 
            [style.width.%]="xpProgress"
            [@progressFill]="progressAnimationState">
            <div class="progress-shine"></div>
          </div>
        </div>
        <div class="progress-percentage">{{ xpProgress | number:'1.0-0' }}%</div>
      </div>
      
      @if (xpProgress >= 90) {
        <div class="level-up-hint animate-bounce">
          🎉 Майже новий рівень!
        </div>
      }
    </div>
  `,
  styles: [`
    .xp-bar-container {
      padding: 1.5rem;
      background: linear-gradient(135deg, var(--blue-50) 0%, var(--blue-100) 100%);
      border: 1px solid var(--color-rule);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-card);
      transition: box-shadow var(--transition-base), transform var(--transition-base);
    }

    .xp-bar-container:hover {
      box-shadow: var(--shadow-hero);
      transform: translateY(-2px);
    }

    .xp-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .level-badge {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      width: 70px;
      height: 70px;
      background: linear-gradient(135deg, var(--blue-600) 0%, var(--blue-700) 100%);
      border-radius: 50%;
      box-shadow: 0 4px 12px rgba(11, 61, 145, 0.35);
      position: relative;
    }

    .level-badge::before {
      content: '';
      position: absolute;
      inset: -3px;
      background: linear-gradient(135deg, var(--blue-400), var(--blue-600));
      border-radius: 50%;
      z-index: -1;
      animation: rotate 3s linear infinite;
    }

    @keyframes rotate {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    .level-number {
      font-family: var(--font-display);
      font-size: 1.75rem;
      font-weight: 700;
      color: white;
      line-height: 1;
    }

    .level-label {
      font-family: var(--font-sans);
      font-size: 0.625rem;
      color: rgba(255, 255, 255, 0.9);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-top: 0.125rem;
    }

    .xp-info {
      flex: 1;
    }

    .xp-label {
      font-family: var(--font-sans);
      font-size: 0.875rem;
      color: var(--blue-600);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 0.25rem;
    }

    .xp-count {
      font-family: var(--font-mono);
      font-size: 1.125rem;
      font-weight: 700;
      color: var(--blue-900);
    }

    .progress-bar-container {
      position: relative;
    }

    .progress-bar-bg {
      width: 100%;
      height: 12px;
      background: rgba(255, 255, 255, 0.5);
      border-radius: var(--radius-pill);
      overflow: hidden;
      box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.06);
    }

    .progress-bar-fill {
      height: 100%;
      background: linear-gradient(90deg, var(--sun-400) 0%, var(--sun-300) 50%, var(--sun-400) 100%);
      background-size: 200% 100%;
      border-radius: var(--radius-pill);
      position: relative;
      transition: width 1s var(--ease-editorial);
      animation: shimmer 2s ease-in-out infinite;
    }

    @keyframes shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }

    .progress-shine {
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
      animation: shine 2s ease-in-out infinite;
    }

    @keyframes shine {
      0% { left: -100%; }
      100% { left: 100%; }
    }

    .progress-percentage {
      position: absolute;
      top: 50%;
      right: 0.5rem;
      transform: translateY(-50%);
      font-family: var(--font-mono);
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--blue-900);
      text-shadow: 0 1px 2px rgba(255, 255, 255, 0.8);
    }

    .level-up-hint {
      margin-top: 0.75rem;
      padding: 0.5rem 1rem;
      background: linear-gradient(135deg, var(--sun-400) 0%, var(--sun-500) 100%);
      color: var(--blue-900);
      font-family: var(--font-sans);
      font-size: 0.875rem;
      font-weight: 600;
      border-radius: var(--radius-sm);
      text-align: center;
      box-shadow: 0 2px 4px rgba(255, 213, 0, 0.2);
    }

    .animate-bounce {
      animation: bounce 1s ease-in-out infinite;
    }

    @keyframes bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-4px); }
    }

    @media (max-width: 640px) {
      .xp-bar-container { padding: 1rem; }
      .level-badge { width: 60px; height: 60px; }
      .level-number { font-size: 1.5rem; }
      .xp-count { font-size: 1rem; }
    }
  `],
  animations: [
    trigger('levelBadge', [
      state('idle', style({ transform: 'scale(1)' })),
      state('levelUp', style({ transform: 'scale(1.2)' })),
      transition('idle => levelUp', [
        animate('300ms ease-out'),
      ]),
      transition('levelUp => idle', [
        animate('300ms ease-in'),
      ]),
    ]),
    trigger('progressFill', [
      transition(':increment', [
        style({ transform: 'scaleX(0.98)' }),
        animate('300ms ease-out', style({ transform: 'scaleX(1)' })),
      ]),
    ]),
  ],
})
export class XpBarComponent implements OnInit, OnChanges {
  @Input() currentXp: number = 0;
  @Input() currentLevel: number = 1;
  @Input() xpToNextLevel: number = 100;
  @Input() xpProgress: number = 0;

  levelAnimationState: 'idle' | 'levelUp' = 'idle';
  progressAnimationState = 0;

  private previousLevel: number = 1;

  ngOnInit(): void {
    this.previousLevel = this.currentLevel;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['currentLevel'] && !changes['currentLevel'].firstChange) {
      const newLevel = changes['currentLevel'].currentValue;
      if (newLevel > this.previousLevel) {
        this.triggerLevelUpAnimation();
      }
      this.previousLevel = newLevel;
    }

    if (changes['xpProgress'] && !changes['xpProgress'].firstChange) {
      this.progressAnimationState++;
    }
  }

  private triggerLevelUpAnimation(): void {
    this.levelAnimationState = 'levelUp';
    setTimeout(() => {
      this.levelAnimationState = 'idle';
    }, 600);
  }
}
