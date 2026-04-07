import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
  APP_INITIALIZER,
  inject,
  ErrorHandler,
  isDevMode,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideServiceWorker } from '@angular/service-worker';
import { TranslateModule } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { importProvidersFrom } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { loggingInterceptor } from './core/interceptors/logging.interceptor';
import { GlobalErrorHandler } from './core/handlers/global-error.handler';
// import { PwaUpdateService } from './core/services/pwa-update.service';
import { TranslationService } from './core/services/translation.service';
import { NotificationService } from './core/services/notification.service';

/**
 * Register custom SVG icons with MatIconRegistry
 */
function registerIcons() {
  const iconRegistry = inject(MatIconRegistry);
  const sanitizer = inject(DomSanitizer);
  return () => {
    iconRegistry.addSvgIcon(
      'google',
      sanitizer.bypassSecurityTrustResourceUrl('assets/icons/google.svg')
    );
  };
}

/**
 * Initialize translation service
 */
function initializeTranslation() {
  const translationService = inject(TranslationService);
  return () => translationService.initialize();
}

/**
 * Initialize notification service
 */
function initializeNotifications() {
  const notificationService = inject(NotificationService);
  return () => notificationService.initialize();
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([loggingInterceptor, authInterceptor])),
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
    provideAnimations(),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
    importProvidersFrom(
      TranslateModule.forRoot({
        defaultLanguage: 'uk',
      })
    ),
    ...provideTranslateHttpLoader({ prefix: './assets/i18n/', suffix: '.json' }),
    {
      provide: APP_INITIALIZER,
      useFactory: registerIcons,
      multi: true,
    },
    {
      provide: APP_INITIALIZER,
      useFactory: initializeTranslation,
      multi: true,
    },
    {
      provide: APP_INITIALIZER,
      useFactory: initializeNotifications,
      multi: true,
    },
  ],
};

