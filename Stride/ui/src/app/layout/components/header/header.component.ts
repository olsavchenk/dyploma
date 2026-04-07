import { Component, inject, input, output, computed, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '../../../core/services/auth.service';
import { LoggingService } from '../../../core/services/logging.service';
import { TranslationService } from '../../../core/services/translation.service';
import { UserStats } from '../../models';

@Component({
  selector: 'app-header',
  imports: [
    CommonModule,
    RouterLink,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatBadgeModule,
    MatMenuModule,
    MatTooltipModule,
    MatDividerModule,
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly logger = inject(LoggingService);
  private readonly translationService = inject(TranslationService);

  // Inputs
  readonly userStats = input<UserStats | null>(null);
  readonly notificationCount = input<number>(0);

  // Outputs
  readonly menuToggle = output<void>();
  readonly notificationPanelToggle = output<void>();

  // State
  protected readonly user = this.authService.user;
  protected readonly isAuthenticated = this.authService.isAuthenticated;
  protected readonly showStats = signal<boolean>(false);
  protected readonly currentLang = this.translationService.currentLanguage;

  // Computed values
  protected readonly xpPercentage = computed(() => {
    const stats = this.userStats();
    return stats ? stats.xpProgress : 0;
  });

  ngOnInit(): void {
    // Show stats after a brief delay for better UX
    setTimeout(() => this.showStats.set(true), 300);
  }

  protected onMenuToggle(): void {
    this.menuToggle.emit();
  }

  protected navigateToProfile(): void {
    this.router.navigate(['/profile']);
  }

  protected navigateToSettings(): void {
    this.router.navigate(['/settings']);
  }

  protected onLogout(): void {
    this.logger.info('HeaderComponent', 'User initiating logout');
    this.authService.logout().subscribe({
      next: () => {
        this.logger.info('HeaderComponent', 'Logout successful');
        this.router.navigate(['/auth/login']);
      },
      error: (error: unknown) => {
        this.logger.error('HeaderComponent', 'Logout failed', {}, error);
        // Navigate anyway since local state is cleared
        this.router.navigate(['/auth/login']);
      },
    });
  }

  protected setLang(lang: 'uk' | 'en'): void {
    this.translationService.setLanguage(lang);
  }

  protected getAvatarUrl(): string {
    const user = this.user();
    return user?.avatarUrl || 'assets/images/default-avatar.png';
  }

  protected getUserDisplayName(): string {
    const user = this.user();
    return user?.displayName || 'User';
  }

  protected getUserEmail(): string {
    const user = this.user();
    return user?.email || '';
  }
}
