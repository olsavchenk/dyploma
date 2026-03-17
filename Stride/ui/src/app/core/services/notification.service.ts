import { 
  Injectable, 
  inject, 
  ApplicationRef, 
  ComponentRef, 
  createComponent, 
  EnvironmentInjector,
  OnDestroy
} from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { SignalRService } from './signalr.service';
import { 
  AchievementUnlockedEvent, 
  LevelUpEvent 
} from '../models/notification.models';
import { AchievementToastComponent } from '../../shared/components/notifications/achievement-toast.component';
import { LevelUpCelebrationComponent } from '../../shared/components/notifications/level-up-celebration.component';

@Injectable({
  providedIn: 'root',
})
export class NotificationService implements OnDestroy {
  private readonly signalRService = inject(SignalRService);
  private readonly applicationRef = inject(ApplicationRef);
  private readonly environmentInjector = inject(EnvironmentInjector);
  private readonly router = inject(Router);

  private activeToasts: ComponentRef<AchievementToastComponent>[] = [];
  private activeCelebration: ComponentRef<LevelUpCelebrationComponent> | null = null;
  private subscriptions: Subscription[] = [];
  private initialized = false;

  /**
   * Initialize notification service and subscribe to events
   */
  initialize(): void {
    // Guard against multiple initialization calls
    if (this.initialized) {
      return;
    }
    this.initialized = true;
    
    this.subscribeToAchievements();
    this.subscribeToLevelUps();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];
    this.clearAll();
  }

  /**
   * Show achievement toast notification
   */
  showAchievementToast(achievement: AchievementUnlockedEvent, duration: number = 5000): void {
    // Remove oldest toast if we have more than 3 active
    if (this.activeToasts.length >= 3) {
      const oldestToast = this.activeToasts.shift();
      if (oldestToast) {
        this.removeComponent(oldestToast);
      }
    }

    const componentRef = this.createComponent(AchievementToastComponent);
    componentRef.instance.achievement = achievement;
    componentRef.instance.duration = duration;

    // Handle close event
    componentRef.instance.close.subscribe(() => {
      this.removeToast(componentRef);
    });

    // Handle navigate event (click on toast)
    componentRef.instance.navigate.subscribe(() => {
      this.router.navigate(['/profile'], { queryParams: { tab: 'achievements' } });
      this.removeToast(componentRef);
    });

    this.activeToasts.push(componentRef);
  }

  /**
   * Show level-up celebration overlay
   */
  showLevelUpCelebration(levelData: LevelUpEvent): void {
    // Only show one celebration at a time
    if (this.activeCelebration) {
      return;
    }

    const componentRef = this.createComponent(LevelUpCelebrationComponent);
    componentRef.instance.levelData = levelData;

    // Handle continue event
    componentRef.instance.continue.subscribe(() => {
      this.removeCelebration();
    });

    this.activeCelebration = componentRef;
  }

  /**
   * Clear all active notifications
   */
  clearAll(): void {
    this.activeToasts.forEach(toast => this.removeComponent(toast));
    this.activeToasts = [];

    if (this.activeCelebration) {
      this.removeCelebration();
    }
  }

  private subscribeToAchievements(): void {
    const sub = this.signalRService.onAchievementUnlocked.subscribe((achievement) => {
      this.showAchievementToast(achievement);
    });
    this.subscriptions.push(sub);
  }

  private subscribeToLevelUps(): void {
    const sub = this.signalRService.onLevelUp.subscribe((levelData) => {
      this.showLevelUpCelebration(levelData);
    });
    this.subscriptions.push(sub);
  }

  private createComponent<T>(component: new (...args: any[]) => T): ComponentRef<T> {
    const componentRef = createComponent(component, {
      environmentInjector: this.environmentInjector,
    });

    // Attach to application
    this.applicationRef.attachView(componentRef.hostView);

    // Append to body
    const domElem = (componentRef.hostView as any).rootNodes[0] as HTMLElement;
    document.body.appendChild(domElem);

    return componentRef;
  }

  private removeComponent<T>(componentRef: ComponentRef<T>): void {
    this.applicationRef.detachView(componentRef.hostView);
    componentRef.destroy();
  }

  private removeToast(componentRef: ComponentRef<AchievementToastComponent>): void {
    const index = this.activeToasts.indexOf(componentRef);
    if (index > -1) {
      this.activeToasts.splice(index, 1);
    }
    this.removeComponent(componentRef);
  }

  private removeCelebration(): void {
    if (this.activeCelebration) {
      this.removeComponent(this.activeCelebration);
      this.activeCelebration = null;
    }
  }
}
