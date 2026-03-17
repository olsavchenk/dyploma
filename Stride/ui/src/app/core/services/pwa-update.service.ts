import { Injectable, ApplicationRef, inject } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { MatSnackBar } from '@angular/material/snack-bar';
import { filter, first, interval, concat } from 'rxjs';
import { LoggingService } from './logging.service';

@Injectable({
  providedIn: 'root',
})
export class PwaUpdateService {
  private readonly swUpdate = inject(SwUpdate);
  private readonly appRef = inject(ApplicationRef);
  private readonly snackBar = inject(MatSnackBar);
  private readonly logger = inject(LoggingService);

  /**
   * Initialize PWA update checking
   * Should be called once in the app initialization
   */
  initialize(): void {
    if (!this.swUpdate.isEnabled) {
      this.logger.warn('PwaUpdateService', 'Service Worker is not enabled', {});
      return;
    }

    // Check for updates when app becomes stable, then every 6 hours
    this.checkForUpdatesOnInterval();

    // Listen for version updates
    this.listenForUpdates();

    // Listen for unrecoverable state
    this.handleUnrecoverableState();
  }

  /**
   * Check for updates periodically
   */
  private checkForUpdatesOnInterval(): void {
    // Wait for app to stabilize, then check for updates every 6 hours
    const appIsStable$ = this.appRef.isStable.pipe(
      first((isStable) => isStable === true)
    );
    const everySixHours$ = interval(6 * 60 * 60 * 1000); // 6 hours
    const everySixHoursOnceAppIsStable$ = concat(appIsStable$, everySixHours$);

    everySixHoursOnceAppIsStable$.subscribe(async () => {
      try {
        const updateFound = await this.swUpdate.checkForUpdate();
        if (updateFound) {
          this.logger.info('PwaUpdateService', 'Update available', {});
        } else {
          this.logger.info('PwaUpdateService', 'No updates available', {});
        }
      } catch (err) {
        this.logger.error('PwaUpdateService', 'Failed to check for updates', {}, err as Error);
      }
    });
  }

  /**
   * Listen for available updates and prompt user
   */
  private listenForUpdates(): void {
    this.swUpdate.versionUpdates
      .pipe(
        filter((evt): evt is VersionReadyEvent => evt.type === 'VERSION_READY')
      )
      .subscribe((evt) => {
        this.logger.info('PwaUpdateService', 'New version available', { version: evt.latestVersion });
        this.promptUserToUpdate();
      });
  }

  /**
   * Handle unrecoverable state
   */
  private handleUnrecoverableState(): void {
    this.swUpdate.unrecoverable.subscribe((event) => {
      this.logger.error('PwaUpdateService', 'Unrecoverable state', { reason: event.reason });
      this.snackBar
        .open(
          'Сталася помилка. Будь ласка, перезавантажте сторінку.',
          'Перезавантажити',
          {
            duration: 0,
            horizontalPosition: 'center',
            verticalPosition: 'bottom',
            panelClass: ['error-snackbar'],
          }
        )
        .onAction()
        .subscribe(() => {
          window.location.reload();
        });
    });
  }

  /**
   * Show snackbar prompting user to update
   */
  private promptUserToUpdate(): void {
    const snackBarRef = this.snackBar.open(
      'Доступна нова версія Stride!',
      'Оновити',
      {
        duration: 0, // Don't auto-dismiss
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
        panelClass: ['update-snackbar'],
      }
    );

    snackBarRef.onAction().subscribe(() => {
      this.activateUpdate();
    });
  }

  /**
   * Activate the latest version and reload
   */
  async activateUpdate(): Promise<void> {
    try {
      await this.swUpdate.activateUpdate();
      this.logger.info('PwaUpdateService', 'Update activated, reloading...', {});
      window.location.reload();
    } catch (err) {
      this.logger.error('PwaUpdateService', 'Failed to activate update', {}, err as Error);
      this.snackBar.open(
        'Не вдалося застосувати оновлення. Спробуйте ще раз.',
        'OK',
        {
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
        }
      );
    }
  }

  /**
   * Manually check for updates
   */
  async checkForUpdate(): Promise<boolean> {
    if (!this.swUpdate.isEnabled) {
      return false;
    }

    try {
      return await this.swUpdate.checkForUpdate();
    } catch (err) {
      this.logger.error('PwaUpdateService', 'Failed to check for updates', {}, err as Error);
      return false;
    }
  }
}
