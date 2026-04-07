import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LeaderboardEntry } from '@app/core';

@Component({
  selector: 'app-leaderboard-row',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="lb-row"
      [class.lb-row--current]="isCurrentUser()"
      [class.lb-row--highlight]="highlight()">

      <!-- Rank pill -->
      <div class="lb-row__rank">
        @if (entry().rank === 1) {
          <span class="rank-pill rank-pill--gold">1</span>
        } @else if (entry().rank === 2) {
          <span class="rank-pill rank-pill--silver">2</span>
        } @else if (entry().rank === 3) {
          <span class="rank-pill rank-pill--bronze">3</span>
        } @else {
          <span class="rank-num">{{ entry().rank }}</span>
        }
      </div>

      <!-- Avatar -->
      <div class="lb-row__avatar">
        @if (entry().avatarUrl) {
          <img [src]="entry().avatarUrl" [alt]="entry().displayName" class="avatar-img" />
        } @else {
          <div class="avatar-fallback">{{ initials() }}</div>
        }
      </div>

      <!-- Name -->
      <div class="lb-row__name">
        <span class="name-text">{{ entry().displayName }}</span>
        @if (isCurrentUser()) {
          <span class="you-badge">Ви</span>
        }
      </div>

      <!-- Weekly XP -->
      <div class="lb-row__xp">
        <span class="xp-value">{{ entry().weeklyXp | number:'1.0-0' }}</span>
        <span class="xp-label">XP</span>
      </div>

      <!-- Delta arrow -->
      <div class="lb-row__delta">
        @if (rankChange() > 0) {
          <span class="delta delta--up" title="Піднявся на {{ rankChange() }}">↑{{ rankChange() }}</span>
        } @else if (rankChange() < 0) {
          <span class="delta delta--down" title="Опустився на {{ -rankChange() }}">↓{{ -rankChange() }}</span>
        } @else {
          <span class="delta delta--neutral">—</span>
        }
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }

    .lb-row {
      display: grid;
      grid-template-columns: 40px 40px 1fr 80px 40px;
      align-items: center;
      gap: 0.75rem;
      height: 56px;
      padding: 0 1rem;
      background: var(--color-surface);
      border-radius: var(--radius-md);
      border: 1.5px solid var(--color-rule);
      transition: background 0.15s var(--ease-editorial), box-shadow 0.15s var(--ease-editorial);
      cursor: default;

      &:hover {
        background: #EFF6FF; /* blue-50 */
        box-shadow: var(--shadow-card);
      }

      &--current {
        background: #EFF6FF;
        border-color: var(--blue-600);
        box-shadow: 0 0 0 2px rgba(37,99,235,0.12);
      }

      &--highlight {
        background: #FFFBEB;
        border-color: var(--sun-400);
      }

      &--current.lb-row--highlight {
        background: #EFF6FF;
        border-color: var(--blue-600);
      }
    }

    /* Rank pill */
    .rank-pill {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      font-family: var(--font-sans);
      font-weight: 700;
      font-size: 0.8125rem;
      color: #fff;

      &--gold   { background: var(--tier-gold, #E3B341); }
      &--silver { background: var(--tier-silver, #9DA3AE); }
      &--bronze { background: var(--tier-bronze, #B87333); }
    }

    .rank-num {
      font-family: var(--font-mono);
      font-weight: 700;
      font-size: 0.875rem;
      color: var(--color-ink-soft);
      text-align: center;
      display: block;
      width: 40px;
    }

    /* Avatar */
    .avatar-img,
    .avatar-fallback {
      width: 32px;
      height: 32px;
      border-radius: 50%;
    }

    .avatar-img {
      object-fit: cover;
      border: 2px solid var(--color-paper);
    }

    .avatar-fallback {
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--blue-600, #2563EB);
      color: #fff;
      font-family: var(--font-sans);
      font-weight: 700;
      font-size: 0.75rem;
    }

    /* Name */
    .lb-row__name {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      min-width: 0;
    }

    .name-text {
      font-family: var(--font-sans);
      font-weight: 700;
      font-size: 0.9375rem;
      color: var(--color-ink);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .you-badge {
      flex-shrink: 0;
      display: inline-flex;
      align-items: center;
      padding: 0.1rem 0.5rem;
      border-radius: 999px;
      background: var(--blue-600, #2563EB);
      color: #fff;
      font-family: var(--font-sans);
      font-size: 0.7rem;
      font-weight: 700;
      letter-spacing: 0.03em;
    }

    /* XP */
    .lb-row__xp {
      display: flex;
      align-items: baseline;
      gap: 0.2rem;
      justify-content: flex-end;
    }

    .xp-value {
      font-family: var(--font-mono);
      font-weight: 700;
      font-size: 0.9375rem;
      color: var(--color-ink);
    }

    .xp-label {
      font-family: var(--font-sans);
      font-size: 0.6875rem;
      font-weight: 600;
      color: var(--color-ink-soft);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    /* Delta */
    .lb-row__delta {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .delta {
      font-family: var(--font-mono);
      font-size: 0.75rem;
      font-weight: 700;

      &--up    { color: #16A34A; }
      &--down  { color: #DC2626; }
      &--neutral { color: var(--color-ink-soft); font-size: 1rem; }
    }

    /* Mobile: hide delta */
    @media (max-width: 640px) {
      .lb-row {
        grid-template-columns: 40px 40px 1fr 80px;
      }
      .lb-row__delta { display: none; }
    }
  `],
})
export class LeaderboardRowComponent {
  entry        = input.required<LeaderboardEntry>();
  isCurrentUser = input<boolean>(false);
  highlight    = input<boolean>(false);

  protected rankChange(): number {
    return (this.entry() as any).rankChange ?? 0;
  }

  protected initials(): string {
    return (this.entry().displayName ?? '?')
      .split(' ')
      .map((n: string) => n[0] ?? '')
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }
}
