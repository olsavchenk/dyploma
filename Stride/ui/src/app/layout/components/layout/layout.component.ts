import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { HeaderComponent } from '../header/header.component';
import { SidenavComponent } from '../sidenav/sidenav.component';
import { BottomNavComponent } from '../bottom-nav/bottom-nav.component';
import { UserStats } from '../../models';

@Component({
  selector: 'app-layout',
  imports: [
    CommonModule,
    RouterOutlet,
    MatSidenavModule,
    HeaderComponent,
    SidenavComponent,
    BottomNavComponent,
  ],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss',
})
export class LayoutComponent implements OnInit, OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly breakpointObserver = inject(BreakpointObserver);
  private readonly destroy$ = new Subject<void>();

  // State
  protected readonly sidenavOpened = signal<boolean>(false);
  protected readonly isMobile = signal<boolean>(false);
  protected readonly sidenavMode = signal<'over' | 'side'>('side');
  protected readonly isAuthenticated = this.authService.isAuthenticated;

  // User stats (mock data for now, will be fetched from API in later stories)
  protected readonly userStats = signal<UserStats | null>(null);
  protected readonly notificationCount = signal<number>(0);

  ngOnInit(): void {
    this.observeBreakpoints();
    this.loadUserStats();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private observeBreakpoints(): void {
    this.breakpointObserver
      .observe([Breakpoints.Handset, Breakpoints.TabletPortrait])
      .pipe(takeUntil(this.destroy$))
      .subscribe((result) => {
        const mobile = result.matches;
        this.isMobile.set(mobile);
        this.sidenavMode.set(mobile ? 'over' : 'side');
        this.sidenavOpened.set(!mobile);
      });
  }

  private loadUserStats(): void {
    // Mock data - will be replaced with actual API call in US-017
    // For now, just set some placeholder values if user is authenticated
    if (this.isAuthenticated()) {
      setTimeout(() => {
        this.userStats.set({
          totalXp: 1250,
          currentLevel: 5,
          currentStreak: 3,
          xpToNextLevel: 1500,
          xpProgress: 83, // (1250 / 1500) * 100
        });
        this.notificationCount.set(0);
      }, 500);
    }
  }

  protected onMenuToggle(): void {
    this.sidenavOpened.update((value) => !value);
  }

  protected onSidenavClose(): void {
    if (this.isMobile()) {
      this.sidenavOpened.set(false);
    }
  }
}
