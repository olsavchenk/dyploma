import { Component, input } from '@angular/core';

@Component({
  selector: 'app-skeleton-block',
  standalone: true,
  template: `
    <div
      class="skeleton-block"
      [style.width]="width()"
      [style.height]="height()"
      [style.border-radius]="radius()"
      [attr.aria-hidden]="true"
    ></div>
  `,
  styles: [`
    .skeleton-block {
      display: block;
      background: linear-gradient(
        90deg,
        var(--color-rule) 25%,
        var(--color-surface-alt) 50%,
        var(--color-rule) 75%
      );
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
    }

    @keyframes shimmer {
      0%   { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    @media (prefers-reduced-motion: reduce) {
      .skeleton-block { animation: none; background: var(--color-rule); }
    }
  `],
})
export class SkeletonBlockComponent {
  readonly width  = input<string>('100%');
  readonly height = input<string>('20px');
  readonly radius = input<string>('var(--radius-sm)');
}
