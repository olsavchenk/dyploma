import { Component, inject, signal, OnInit, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { forkJoin } from 'rxjs';
import { UserService } from '@app/core/services/user.service';
import { AuthService } from '@app/core/services/auth.service';
import { GamificationService } from '@app/core/services/gamification.service';
import { UserProfile } from '@app/core/models/user.models';
import { GamificationStats, Achievement, AchievementsResponse } from '@app/core/models/gamification.models';
import { LoggingService } from '@app/core/services/logging.service';
import { EditProfileDialogComponent } from './edit-profile-dialog.component';
import { AchievementGalleryComponent } from './achievement-gallery.component';
import { AchievementDetailDialogComponent } from './achievement-detail-dialog.component';
import { ActivityTimelineComponent, ActivityItem } from './activity-timeline.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatSlideToggleModule,
    MatTooltipModule,
    MatDialogModule,
    AchievementGalleryComponent,
    ActivityTimelineComponent,
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
})
export class ProfileComponent implements OnInit {
  private readonly userService = inject(UserService);
  private readonly authService = inject(AuthService);
  private readonly gamificationService = inject(GamificationService);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);
  private readonly logger = inject(LoggingService);
  private readonly platformId = inject(PLATFORM_ID);

  protected readonly loading = signal<boolean>(false);
  protected readonly error = signal<string | null>(null);
  protected readonly profile = signal<UserProfile | null>(null);
  protected readonly stats = signal<GamificationStats | null>(null);
  protected readonly achievements = signal<Achievement[]>([]);
  protected readonly recentActivity = signal<ActivityItem[]>([]);
  protected readonly notificationsEnabled = signal<boolean>(true);
  protected readonly uploadingAvatar = signal<boolean>(false);
  protected readonly currentLang = signal<'uk' | 'en'>('uk');
  protected readonly deferredInstallPrompt = signal<any>(null);

  ngOnInit(): void {
    this.loadData();
    if (isPlatformBrowser(this.platformId)) {
      window.addEventListener('beforeinstallprompt', (e: any) => {
        e.preventDefault();
        this.deferredInstallPrompt.set(e);
      });
    }
  }

  protected loadData(): void {
    this.loading.set(true);
    this.error.set(null);

    forkJoin([
      this.userService.getUserProfile(),
      this.gamificationService.getStats(),
      this.gamificationService.getAchievements(),
    ]).subscribe({
      next: ([profile, stats, achievementsResp]: [UserProfile, GamificationStats, AchievementsResponse]) => {
        this.profile.set(profile);
        this.stats.set(stats);
        const all = [...achievementsResp.earned, ...achievementsResp.locked];
        this.achievements.set(all);
        this.loading.set(false);
      },
      error: (err) => {
        this.logger.error('ProfileComponent', 'Failed to load profile data', {}, err);
        this.error.set('Не вдалося завантажити профіль');
        this.loading.set(false);
      },
    });
  }

  protected openEditDialog(): void {
    const dialogRef = this.dialog.open(EditProfileDialogComponent, {
      width: '500px',
      data: { profile: this.profile() },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.profile.set(result);
      }
    });
  }

  protected openAchievementDetail(achievement: Achievement): void {
    this.dialog.open(AchievementDetailDialogComponent, {
      width: '420px',
      data: { achievement },
    });
  }

  protected onAvatarClick(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/png,image/gif,image/webp';
    input.onchange = (event: any) => {
      const file = event.target?.files?.[0];
      if (file) {
        this.uploadAvatar(file);
      }
    };
    input.click();
  }

  private uploadAvatar(file: File): void {
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      this.error.set('Розмір файлу не повинен перевищувати 5 МБ');
      return;
    }
    this.uploadingAvatar.set(true);
    this.userService.uploadAvatar(file).subscribe({
      next: (response) => {
        const current = this.profile();
        if (current) {
          this.profile.set({ ...current, avatarUrl: response.avatarUrl });
        }
        this.uploadingAvatar.set(false);
      },
      error: (err) => {
        this.logger.error('ProfileComponent', 'Failed to upload avatar', {}, err);
        this.error.set('Не вдалося завантажити аватар');
        this.uploadingAvatar.set(false);
      },
    });
  }

  protected toggleLanguage(): void {
    this.currentLang.update((l) => (l === 'uk' ? 'en' : 'uk'));
  }

  protected onNotificationToggle(): void {
    this.notificationsEnabled.update((v) => !v);
  }

  protected installPwa(): void {
    const prompt = this.deferredInstallPrompt();
    if (prompt) {
      prompt.prompt();
      prompt.userChoice.then(() => {
        this.deferredInstallPrompt.set(null);
      });
    }
  }

  protected logout(): void {
    this.authService.logout().subscribe({
      next: () => this.router.navigate(['/auth/login']),
      error: () => this.router.navigate(['/auth/login']),
    });
  }

  protected getRoleLabel(role: string): string {
    const labels: Record<string, string> = {
      Student: 'Студент',
      Teacher: 'Вчитель',
      Admin: 'Адміністратор',
    };
    return labels[role] ?? role;
  }

  protected getRoleIcon(role: string): string {
    const icons: Record<string, string> = {
      Student: 'school',
      Teacher: 'local_library',
      Admin: 'admin_panel_settings',
    };
    return icons[role] ?? 'person';
  }

  protected formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('uk-UA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  protected formatMemberSince(dateString: string): string {
    return new Date(dateString).toLocaleDateString('uk-UA', {
      year: 'numeric',
      month: 'long',
    });
  }

  protected accuracyPercent(): number {
    const s = this.stats();
    if (!s) return 0;
    const profile = this.profile();
    if (profile?.studentStats?.totalTasksAttempted && profile.studentStats.totalTasksAttempted > 0) {
      return 0; // accuracy is not in StudentStats directly; fallback
    }
    return 0;
  }
}
