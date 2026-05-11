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
 * - Side-effect: keeps `document.documentElement.lang` in sync
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
   * Initialize the translation service.
   * Order: ngx-translate v17+ requires both fallback registration and `use(...)`.
   *  1. Register Ukrainian as the fallback so missing keys gracefully fall back.
   *  2. Resolve initial language: localStorage > navigator.language > 'uk'.
   *  3. Activate it (also writes to localStorage and updates <html lang>).
   */
  initialize(): void {
    // ngx-translate v17 renamed setDefaultLang -> setFallbackLang
    this.translateService.setFallbackLang('uk');

    const initial = this.resolveInitialLanguage();
    this.setLanguage(initial);
  }

  /**
   * Change the active language
   * @param language - Language code to switch to
   */
  setLanguage(language: SupportedLanguage): void {
    if (!this.availableLanguages.includes(language)) {
      this.logger.warn(
        'TranslationService',
        'Unsupported language, falling back to uk',
        { requestedLanguage: language },
      );
      language = 'uk';
    }

    this.translateService.use(language);
    this.currentLanguage.set(language);
    this.saveLanguageToStorage(language);
    this.applyDocumentLang(language);
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
   * Resolve initial language from storage, then browser preference, then default.
   */
  private resolveInitialLanguage(): SupportedLanguage {
    const stored = this.loadLanguageFromStorage();
    if (stored) return stored;

    try {
      const nav = (typeof navigator !== 'undefined' ? navigator.language : '') ?? '';
      const short = nav.toLowerCase().split('-')[0];
      if (this.availableLanguages.includes(short as SupportedLanguage)) {
        return short as SupportedLanguage;
      }
    } catch {
      // ignore — fall through to default
    }

    return 'uk';
  }

  /**
   * Load language preference from localStorage
   * @returns Saved language or null if none/invalid
   */
  private loadLanguageFromStorage(): SupportedLanguage | null {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved && this.availableLanguages.includes(saved as SupportedLanguage)) {
        return saved as SupportedLanguage;
      }
    } catch (error) {
      this.logger.error('TranslationService', 'Failed to load language from storage', {}, error);
    }
    return null;
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

  /**
   * Keep <html lang="..."> in sync with the active language so screen readers,
   * spell-checkers and the :lang() CSS selector behave correctly.
   */
  private applyDocumentLang(language: SupportedLanguage): void {
    try {
      if (typeof document !== 'undefined' && document.documentElement) {
        document.documentElement.lang = language;
      }
    } catch (error) {
      this.logger.error('TranslationService', 'Failed to set document.documentElement.lang', { language }, error);
    }
  }
}
