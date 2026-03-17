import { Injectable, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { LoggingService } from './logging.service';

/**
 * Supported languages in the application
 */
export type SupportedLanguage = 'uk' | 'en';

/**
 * Translation service for managing application localization
 * 
 * Features:
 * - Language switching with localStorage persistence
 * - Default Ukrainian language
 * - Signal-based reactive language state
 */
@Injectable({
  providedIn: 'root',
})
export class TranslationService {
  private readonly translateService = inject(TranslateService);
  private readonly logger = inject(LoggingService);
  private readonly storageKey = 'app_language';

  /**
   * Current active language as a signal
   */
  readonly currentLanguage = signal<SupportedLanguage>('uk');

  /**
   * Available languages in the application
   */
  readonly availableLanguages: SupportedLanguage[] = ['uk', 'en'];

  /**
   * Initialize the translation service
   * Sets up default language and loads saved preference
   */
  initialize(): void {
    // Set default language
    this.translateService.setDefaultLang('uk');

    // Load saved language or use default
    const savedLanguage = this.loadLanguageFromStorage();
    this.setLanguage(savedLanguage);
  }

  /**
   * Change the active language
   * @param language - Language code to switch to
   */
  setLanguage(language: SupportedLanguage): void {
    if (!this.availableLanguages.includes(language)) {
      this.logger.warn('TranslationService', 'Unsupported language, falling back to uk', { requestedLanguage: language });
      language = 'uk';
    }

    this.translateService.use(language);
    this.currentLanguage.set(language);
    this.saveLanguageToStorage(language);
  }

  /**
   * Get instant translation for a key
   * @param key - Translation key
   * @param params - Optional interpolation parameters
   * @returns Translated string
   */
  instant(key: string, params?: object): string {
    return this.translateService.instant(key, params);
  }

  /**
   * Load language preference from localStorage
   * @returns Saved language or default 'uk'
   */
  private loadLanguageFromStorage(): SupportedLanguage {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved && this.availableLanguages.includes(saved as SupportedLanguage)) {
        return saved as SupportedLanguage;
      }
    } catch (error) {
      this.logger.error('TranslationService', 'Failed to load language from storage', {}, error);
    }
    return 'uk';
  }

  /**
   * Save language preference to localStorage
   * @param language - Language to save
   */
  private saveLanguageToStorage(language: SupportedLanguage): void {
    try {
      localStorage.setItem(this.storageKey, language);
    } catch (error) {
      this.logger.error('TranslationService', 'Failed to save language to storage', { language }, error);
    }
  }
}
