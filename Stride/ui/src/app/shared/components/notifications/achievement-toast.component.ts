import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { AchievementUnlockedEvent } from '../../../core/models/notification.models';

@Component({
  selector: 'app-achievement-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      class="achievement-toast" 
      [@slideIn]="animationState"
      (click)="handleClick()">
      <div class="toast-content">
        <div class="icon-container">
          @if (achievement.iconUrl) {
            <img [src]="achievement.iconUrl" [alt]="achievement.name" class="achievement-icon" />
          } @else {
            <div class="achievement-icon-placeholder">🏆</div>
          }
          <div class="shine-effect"></div>
        </div>
        
        <div class="text-content">
          <div class="toast-header">
            <span class="badge-label">Досягнення розблоковано!</span>
            <button 
              class="close-btn" 
              (click)="handleClose($event)"
              aria-label="Закрити">
              ✕
            </button>
          </div>
          <div class="achievement-name">{{ achievement.name }}</div>
          <div class="achievement-description">{{ achievement.description }}</div>
          <div class="xp-reward">+{{ achievement.xpReward }} XP</div>
        </div>
      </div>
      
      <div class="progress-bar" [style.width.%]="progressWidth"></div>
    </div>
  `,
  styles: [`
    .achievement-toast {
      position: fixed;
      top: 1rem;
      right: 1rem;
      max-width: 400px;
      width: calc(100% - 2rem);
      background: linear-gradient(135deg, #1E293B 0%, #0F172A 100%);
      border-radius: 12px;
      box-shadow: 
        0 10px 25px rgba(0, 0, 0, 0.3),
        0 0 0 1px rgba(253, 224, 71, 0.3),
        0 0 20px rgba(253, 224, 71, 0.2);
      overflow: hidden;
      cursor: pointer;
      transition: transform 0.2s ease;
      z-index: 9999;
    }

    .achievement-toast:hover {
      transform: translateY(-2px) scale(1.02);
      box-shadow: 
        0 15px 30px rgba(0, 0, 0, 0.4),
        0 0 0 2px rgba(253, 224, 71, 0.5),
        0 0 30px rgba(253, 224, 71, 0.3);
    }

    .toast-content {
      display: flex;
      gap: 1rem;
      padding: 1rem;
      position: relative;
    }

    .icon-container {
      position: relative;
      flex-shrink: 0;
      width: 64px;
      height: 64px;
    }

    .achievement-icon,
    .achievement-icon-placeholder {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      object-fit: cover;
      background: linear-gradient(135deg, #FDE047 0%, #FACC15 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2rem;
      box-shadow: 0 4px 12px rgba(253, 224, 71, 0.4);
    }

    .shine-effect {
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

    .text-content {
      flex: 1;
      min-width: 0;
    }

    .toast-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.25rem;
    }

    .badge-label {
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #FDE047;
    }

    .close-btn {
      background: transparent;
      border: none;
      color: rgba(255, 255, 255, 0.6);
      font-size: 1.25rem;
      line-height: 1;
      padding: 0;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      border-radius: 4px;
      transition: all 0.2s ease;
    }

    .close-btn:hover {
      background: rgba(255, 255, 255, 0.1);
      color: white;
    }

    .achievement-name {
      font-size: 1.125rem;
      font-weight: 700;
      color: white;
      margin-bottom: 0.25rem;
      line-height: 1.3;
    }

    .achievement-description {
      font-size: 0.875rem;
      color: rgba(255, 255, 255, 0.7);
      margin-bottom: 0.5rem;
      line-height: 1.4;
    }

    .xp-reward {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      background: linear-gradient(135deg, #FDE047 0%, #FACC15 100%);
      color: #713F12;
      font-size: 0.875rem;
      font-weight: 700;
      border-radius: 9999px;
      box-shadow: 0 2px 4px rgba(253, 224, 71, 0.3);
    }

    .progress-bar {
      height: 3px;
      background: linear-gradient(90deg, #FDE047 0%, #FACC15 100%);
      transition: width linear;
      transition-duration: var(--duration, 5000ms);
    }

    @media (max-width: 640px) {
      .achievement-toast {
        top: auto;
        bottom: 1rem;
        left: 1rem;
        right: 1rem;
        width: auto;
        max-width: none;
      }

      .toast-content {
        padding: 0.75rem;
        gap: 0.75rem;
      }

      .icon-container {
        width: 56px;
        height: 56px;
      }

      .achievement-name {
        font-size: 1rem;
      }

      .achievement-description {
        font-size: 0.8125rem;
      }
    }
  `],
  animations: [
    trigger('slideIn', [
      state('void', style({ 
        transform: 'translateX(120%)', 
        opacity: 0 
      })),
      state('visible', style({ 
        transform: 'translateX(0)', 
        opacity: 1 
      })),
      state('hidden', style({ 
        transform: 'translateX(120%)', 
        opacity: 0 
      })),
      transition('void => visible', [
        animate('400ms cubic-bezier(0.4, 0, 0.2, 1)')
      ]),
      transition('visible => hidden', [
        animate('300ms cubic-bezier(0.4, 0, 1, 1)')
      ]),
    ]),
  ],
})
export class AchievementToastComponent implements OnInit {
  @Input() achievement!: AchievementUnlockedEvent;
  @Input() duration: number = 5000; // Auto-dismiss after 5 seconds
  @Output() close = new EventEmitter<void>();
  @Output() navigate = new EventEmitter<void>();

  animationState: 'visible' | 'hidden' = 'visible';
  progressWidth: number = 100;

  private closeTimer: any;
  private progressTimer: any;

  ngOnInit(): void {
    this.startAutoDismiss();
  }

  handleClick(): void {
    this.navigate.emit();
    this.handleClose();
  }

  handleClose(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    
    this.clearTimers();
    this.animationState = 'hidden';
    
    // Wait for animation to complete before emitting close
    setTimeout(() => {
      this.close.emit();
    }, 300);
  }

  private startAutoDismiss(): void {
    // Progress bar animation
    const startTime = Date.now();
    const updateProgress = () => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, this.duration - elapsed);
      this.progressWidth = (remaining / this.duration) * 100;

      if (remaining > 0) {
        this.progressTimer = requestAnimationFrame(updateProgress);
      }
    };
    updateProgress();

    // Auto-dismiss timer
    this.closeTimer = setTimeout(() => {
      this.handleClose();
    }, this.duration);
  }

  private clearTimers(): void {
    if (this.closeTimer) {
      clearTimeout(this.closeTimer);
    }
    if (this.progressTimer) {
      cancelAnimationFrame(this.progressTimer);
    }
  }
}
