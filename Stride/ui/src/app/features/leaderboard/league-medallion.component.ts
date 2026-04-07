import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

const TIER_COLORS: Record<string, { fill: string; stop1: string; stop2: string }> = {
  Bronze:   { fill: '#B87333', stop1: '#CD8B47', stop2: '#8B5A1F' },
  Silver:   { fill: '#9DA3AE', stop1: '#C4C9D0', stop2: '#717680' },
  Gold:     { fill: '#E3B341', stop1: '#F5CC60', stop2: '#B8882A' },
  Platinum: { fill: '#7FDBDA', stop1: '#A8EEEE', stop2: '#4BAFAE' },
  Diamond:  { fill: '#5AB1FF', stop1: '#85CAFF', stop2: '#2E8FDE' },
};

@Component({
  selector: 'app-league-medallion',
  standalone: true,
  imports: [CommonModule],
  template: `
    <svg
      [attr.width]="120"
      [attr.height]="120"
      viewBox="0 0 120 120"
      xmlns="http://www.w3.org/2000/svg"
      class="medallion-svg"
      aria-hidden="true">
      <defs>
        <radialGradient [id]="gradientId()" cx="40%" cy="35%" r="65%">
          <stop offset="0%" [attr.stop-color]="colors().stop1" />
          <stop offset="100%" [attr.stop-color]="colors().stop2" />
        </radialGradient>
        <filter [id]="shadowId()" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="6" [attr.flood-color]="colors().stop2" flood-opacity="0.4" />
        </filter>
      </defs>

      <!-- Outer ring -->
      <circle
        cx="60" cy="60" r="56"
        [attr.fill]="'url(#' + gradientId() + ')'"
        [attr.filter]="'url(#' + shadowId() + ')'" />

      <!-- Inner highlight ring -->
      <circle cx="60" cy="60" r="48" fill="none" stroke="rgba(255,255,255,0.25)" stroke-width="2" />

      <!-- Inner dark circle -->
      <circle cx="60" cy="60" r="44" fill="rgba(0,0,0,0.18)" />

      <!-- Rank number -->
      <text
        x="60" y="54"
        text-anchor="middle"
        dominant-baseline="middle"
        font-family="var(--font-display, 'Fraunces', serif)"
        font-size="28"
        font-weight="700"
        fill="white"
        opacity="0.95">{{ rank() }}</text>

      <!-- Tier label -->
      <text
        x="60" y="78"
        text-anchor="middle"
        dominant-baseline="middle"
        font-family="var(--font-sans, sans-serif)"
        font-size="10"
        font-weight="600"
        fill="rgba(255,255,255,0.80)"
        letter-spacing="1">{{ tier().toUpperCase() }}</text>
    </svg>
  `,
  styles: [`
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    .medallion-svg {
      display: block;
    }
  `],
})
export class LeagueMedallionComponent {
  tier = input<string>('Bronze');
  rank = input<number>(0);

  protected gradientId() {
    return `med-grad-${this.tier().toLowerCase()}`;
  }

  protected shadowId() {
    return `med-shadow-${this.tier().toLowerCase()}`;
  }

  protected colors() {
    return TIER_COLORS[this.tier()] ?? TIER_COLORS['Bronze'];
  }
}
