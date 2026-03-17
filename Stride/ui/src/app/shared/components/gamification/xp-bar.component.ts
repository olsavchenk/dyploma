import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, state, style, transition, animate } from '@angular/animations';

@Component({
  selector: 'app-xp-bar',
  standalone: true,
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
            <span class="current-xp" [@xpGain]="xpGainState">{{ currentXp | number:'1.0-0' }}</span>
            <span class="separator"> / </span>
            <span>{{ xpToNextLevel | number:'1.0-0' }} XP</span>
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
      background: linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%);
      border-radius: 16px;
      box-shadow: 0 4px 6px rgba(99, 102, 241, 0.1);
      transition: all 0.3s ease;
    }

    .xp-bar-container:hover {
      box-shadow: 0 8px 12px rgba(99, 102, 241, 0.15);
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
      background: linear-gradient(135deg, #6366F1 0%, #4F46E5 100%);
      border-radius: 50%;
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
      position: relative;
    }

    .level-badge::before {
      content: '';
      position: absolute;
      inset: -3px;
      background: linear-gradient(135deg, #818CF8, #6366F1);
      border-radius: 50%;
      z-index: -1;
      animation: rotate 3s linear infinite;
    }

    @keyframes rotate {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    .level-number {
      font-size: 1.75rem;
      font-weight: 700;
      color: white;
      line-height: 1;
    }

    .level-label {
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
      font-size: 0.875rem;
      color: #4338CA;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 0.25rem;
    }

    .xp-count {
      font-size: 1.125rem;
      font-weight: 700;
      color: #312E81;
    }

    .current-xp {
      display: inline-block;
    }

    .separator {
      opacity: 0.6;
    }

    .progress-bar-container {
      position: relative;
    }

    .progress-bar-bg {
      width: 100%;
      height: 12px;
      background: rgba(255, 255, 255, 0.5);
      border-radius: 6px;
      overflow: hidden;
      box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.06);
    }

    .progress-bar-fill {
      height: 100%;
      background: linear-gradient(90deg, #6366F1 0%, #818CF8 50%, #6366F1 100%);
      background-size: 200% 100%;
      border-radius: 6px;
      position: relative;
      transition: width 1s ease-out;
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
      background: linear-gradient(
        90deg,
        transparent,
        rgba(255, 255, 255, 0.3),
        transparent
      );
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
      font-size: 0.75rem;
      font-weight: 600;
      color: #312E81;
      text-shadow: 0 1px 2px rgba(255, 255, 255, 0.8);
    }

    .level-up-hint {
      margin-top: 0.75rem;
      padding: 0.5rem 1rem;
      background: linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%);
      color: #78350F;
      font-size: 0.875rem;
      font-weight: 600;
      border-radius: 8px;
      text-align: center;
      box-shadow: 0 2px 4px rgba(245, 158, 11, 0.2);
    }

    .animate-bounce {
      animation: bounce 1s ease-in-out infinite;
    }

    @keyframes bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-4px); }
    }

    @media (max-width: 640px) {
      .xp-bar-container {
        padding: 1rem;
      }

      .level-badge {
        width: 60px;
        height: 60px;
      }

      .level-number {
        font-size: 1.5rem;
      }

      .xp-count {
        font-size: 1rem;
      }
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
    trigger('xpGain', [
      state('idle', style({ transform: 'scale(1)' })),
      state('gained', style({ transform: 'scale(1.15)' })),
      transition('idle => gained', [
        animate('200ms ease-out'),
      ]),
      transition('gained => idle', [
        animate('200ms ease-in'),
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
  xpGainState: 'idle' | 'gained' = 'idle';

  private previousLevel: number = 1;
  private previousXp: number = 0;

  ngOnInit(): void {
    this.previousLevel = this.currentLevel;
    this.previousXp = this.currentXp;
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

    if (changes['currentXp'] && !changes['currentXp'].firstChange) {
      const newXp = changes['currentXp'].currentValue;
      if (newXp > this.previousXp) {
        this.triggerXpGainAnimation();
      }
      this.previousXp = newXp;
    }
  }

  private triggerLevelUpAnimation(): void {
    this.levelAnimationState = 'levelUp';
    setTimeout(() => {
      this.levelAnimationState = 'idle';
    }, 600);
  }

  private triggerXpGainAnimation(): void {
    this.xpGainState = 'gained';
    setTimeout(() => {
      this.xpGainState = 'idle';
    }, 400);
  }
}
