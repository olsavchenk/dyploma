import { Component, inject } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslationService, SupportedLanguage } from '../../core/services/translation.service';

/**
 * Language switcher component
 * Allows users to switch between supported languages
 */
@Component({
  selector: 'app-language-switcher',
  imports: [TranslateModule, MatButtonToggleModule, MatTooltipModule],
  template: `
    <div class="language-switcher">
      <label class="switcher-label">{{ 'profile.settings.language' | translate }}</label>
      <mat-button-toggle-group
        [value]="translationService.currentLanguage()"
        (change)="onLanguageChange($event.value)"
        aria-label="Language Selection">
        <mat-button-toggle
          value="uk"
          [matTooltip]="'Українська'">
          🇺🇦 UA
        </mat-button-toggle>
        <mat-button-toggle
          value="en"
          [matTooltip]="'English'">
          🇬🇧 EN
        </mat-button-toggle>
      </mat-button-toggle-group>
    </div>
  `,
  styles: [`
    .language-switcher {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .switcher-label {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--text-secondary, #666);
    }

    mat-button-toggle-group {
      border-radius: 8px;
      overflow: hidden;
    }

    ::ng-deep .mat-button-toggle {
      border: none !important;
    }

    ::ng-deep .mat-button-toggle-checked {
      background-color: var(--primary-color, #4f46e5) !important;
      color: white !important;
    }
  `],
})
export class LanguageSwitcherComponent {
  protected readonly translationService = inject(TranslationService);

  /**
   * Handle language change event
   * @param language - Selected language
   */
  onLanguageChange(language: SupportedLanguage): void {
    this.translationService.setLanguage(language);
  }
}
