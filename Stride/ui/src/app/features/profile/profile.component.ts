import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { finalize } from 'rxjs';
import { UserService, AuthService, UserProfile } from '@app/core';
import { LoggingService } from '@app/core/services/logging.service';
import { EditProfileDialogComponent } from './edit-profile-dialog.component';

@Component({
  selector: 'app-profile',
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
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
})
export class ProfileComponent implements OnInit {
  private readonly userService = inject(UserService);
  private readonly authService = inject(AuthService);
  private readonly dialog = inject(MatDialog);
  private readonly logger = inject(LoggingService);

  protected readonly loading = signal<boolean>(true);
  protected readonly error = signal<string | null>(null);
  protected readonly profile = signal<UserProfile | null>(null);
  protected readonly notificationsEnabled = signal<boolean>(true);
  protected readonly uploadingAvatar = signal<boolean>(false);
  protected readonly exporting = signal<boolean>(false);
  protected readonly deleting = signal<boolean>(false);

  ngOnInit(): void {
    this.loadProfile();
  }

  protected loadProfile(): void {
    this.loading.set(true);
    this.error.set(null);

    this.userService
      .getUserProfile()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (profile) => {
          this.profile.set(profile);
        },
        error: (err) => {
          this.logger.error('ProfileComponent', 'Failed to load profile', {}, err);
          this.error.set('Не вдалося завантажити профіль');
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
        // Update auth service user data
        this.authService['userSignal'].set({
          ...this.authService.getUser()!,
          displayName: result.displayName,
          avatarUrl: result.avatarUrl,
        });
      }
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
    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      this.error.set('Розмір файлу не повинен перевищувати 5MB');
      return;
    }

    this.uploadingAvatar.set(true);
    this.error.set(null);

    this.userService
      .uploadAvatar(file)
      .pipe(finalize(() => this.uploadingAvatar.set(false)))
      .subscribe({
        next: (response) => {
          const currentProfile = this.profile();
          if (currentProfile) {
            const updatedProfile = {
              ...currentProfile,
              avatarUrl: response.avatarUrl,
            };
            this.profile.set(updatedProfile);
            // Update auth service user data
            this.authService['userSignal'].set({
              ...this.authService.getUser()!,
              avatarUrl: response.avatarUrl,
            });
          }
        },
        error: (err) => {
          this.logger.error('ProfileComponent', 'Failed to upload avatar', {}, err);
          this.error.set('Не вдалося завантажити аватар');
        },
      });
  }

  protected onNotificationToggle(): void {
    // For MVP, just toggle the local state
    // In future, this would sync with backend preferences
    this.notificationsEnabled.update((value) => !value);
  }

  protected exportData(): void {
    this.exporting.set(true);
    this.error.set(null);

    this.userService
      .exportUserData()
      .pipe(finalize(() => this.exporting.set(false)))
      .subscribe({
        next: (data) => {
          // Create and download JSON file
          const blob = new Blob([JSON.stringify(data, null, 2)], {
            type: 'application/json',
          });
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `stride-data-export-${new Date().toISOString()}.json`;
          link.click();
          window.URL.revokeObjectURL(url);
        },
        error: (err) => {
          this.logger.error('ProfileComponent', 'Failed to export data', {}, err);
          if (err.status === 429) {
            this.error.set('Забагато запитів. Спробуйте пізніше.');
          } else {
            this.error.set('Не вдалося експортувати дані');
          }
        },
      });
  }

  protected deleteAccount(): void {
    const confirmed = confirm(
      'Ви впевнені, що хочете видалити свій обліковий запис? Цю дію не можна скасувати.'
    );

    if (!confirmed) {
      return;
    }

    const doubleConfirmed = confirm(
      'Це остаточне попередження. Всі ваші дані будуть безповоротно видалені. Продовжити?'
    );

    if (!doubleConfirmed) {
      return;
    }

    this.deleting.set(true);
    this.error.set(null);

    this.userService
      .deleteUserAccount()
      .pipe(finalize(() => this.deleting.set(false)))
      .subscribe({
        next: () => {
          // Logout and redirect
          this.authService.logout().subscribe();
        },
        error: (err) => {
          this.logger.error('ProfileComponent', 'Failed to delete account', {}, err);
          this.error.set('Не вдалося видалити обліковий запис');
        },
      });
  }

  protected getRoleLabel(role: string): string {
    const labels: Record<string, string> = {
      Student: 'Студент',
      Teacher: 'Вчитель',
      Admin: 'Адміністратор',
    };
    return labels[role] || role;
  }

  protected formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('uk-UA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
}
