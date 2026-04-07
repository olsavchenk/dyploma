import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-auth-shell',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="auth-shell">
      <div class="auth-brand-panel auth-left">
        <div class="decor-geo">
          <div class="decor-circle decor-circle--1"></div>
          <div class="decor-circle decor-circle--2"></div>
          <div class="decor-line decor-line--1"></div>
          <div class="decor-line decor-line--2"></div>
          <div class="decor-dot-grid"></div>
        </div>
        <div class="auth-brand-content">
          <div class="brand-logo-mark">
            <span class="brand-logo-letter">С</span>
          </div>
          <h1 class="brand-headline font-display">СТРАЙД</h1>
          <p class="brand-tagline font-sans">Адаптивне навчання для кожного учня</p>
          <div class="brand-stats">
            <div class="stat-item">
              <span class="stat-value">4</span>
              <span class="stat-label">предмети</span>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <span class="stat-value">ШІ</span>
              <span class="stat-label">адаптація</span>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <span class="stat-value">∞</span>
              <span class="stat-label">завдань</span>
            </div>
          </div>
        </div>
      </div>
      <div class="auth-right auth-mesh-bg">
        <ng-content></ng-content>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
    }

    .auth-shell {
      display: flex;
      min-height: 100vh;
      height: 100%;
    }

    /* ── Left brand panel ── */
    .auth-left {
      position: relative;
      width: 56%;
      background-color: var(--blue-600);
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      flex-shrink: 0;
    }

    /* Decorative geometry */
    .decor-geo {
      position: absolute;
      inset: 0;
      pointer-events: none;
    }

    .decor-circle {
      position: absolute;
      border-radius: 50%;
      border: 1px solid rgba(255, 213, 0, 0.15);
    }

    .decor-circle--1 {
      width: 520px;
      height: 520px;
      top: -120px;
      right: -160px;
    }

    .decor-circle--2 {
      width: 320px;
      height: 320px;
      bottom: -80px;
      left: -80px;
      border-color: rgba(255, 255, 255, 0.08);
    }

    .decor-line {
      position: absolute;
      background: rgba(255, 213, 0, 0.18);
    }

    .decor-line--1 {
      width: 1px;
      height: 60%;
      top: 20%;
      right: 15%;
    }

    .decor-line--2 {
      width: 40%;
      height: 1px;
      bottom: 28%;
      left: 10%;
    }

    .decor-dot-grid {
      position: absolute;
      inset: 0;
      background-image: radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px);
      background-size: 32px 32px;
    }

    /* Brand content */
    .auth-brand-content {
      position: relative;
      z-index: 1;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      padding: 3rem;
      max-width: 420px;
    }

    .brand-logo-mark {
      width: 56px;
      height: 56px;
      border-radius: var(--radius-sm);
      background: var(--sun-400);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 2rem;
    }

    .brand-logo-letter {
      font-family: var(--font-display);
      font-size: 2rem;
      font-weight: 700;
      color: var(--blue-800);
      line-height: 1;
    }

    .brand-headline {
      font-family: var(--font-display);
      font-size: clamp(3rem, 5vw, 4.5rem);
      font-weight: 900;
      color: #ffffff;
      letter-spacing: -0.02em;
      line-height: 0.95;
      margin: 0 0 1rem 0;
    }

    .brand-tagline {
      font-family: var(--font-sans);
      font-size: 1.0625rem;
      color: rgba(255, 255, 255, 0.72);
      line-height: 1.5;
      margin: 0 0 3rem 0;
      max-width: 280px;
    }

    .brand-stats {
      display: flex;
      align-items: center;
      gap: 1.5rem;
    }

    .stat-item {
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
    }

    .stat-value {
      font-family: var(--font-display);
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--sun-400);
      line-height: 1;
    }

    .stat-label {
      font-family: var(--font-sans);
      font-size: 0.6875rem;
      color: rgba(255, 255, 255, 0.5);
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }

    .stat-divider {
      width: 1px;
      height: 32px;
      background: rgba(255, 255, 255, 0.15);
    }

    /* ── Right form panel ── */
    .auth-right {
      flex: 1;
      background-color: var(--color-paper);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 3rem 2rem;
      position: relative;
      overflow-y: auto;
    }

    .auth-mesh-bg::before {
      content: '';
      position: absolute;
      inset: 0;
      background-image:
        radial-gradient(circle at 80% 20%, rgba(11,61,145,0.04) 0%, transparent 50%),
        radial-gradient(circle at 20% 80%, rgba(255,213,0,0.05) 0%, transparent 50%);
      pointer-events: none;
    }

    /* ── Mobile ── */
    @media (max-width: 768px) {
      .auth-shell {
        flex-direction: column;
      }

      .auth-left {
        width: 100%;
        height: 120px;
        flex-shrink: 0;
      }

      .auth-brand-content {
        flex-direction: row;
        align-items: center;
        padding: 0 1.5rem;
        gap: 1rem;
        max-width: 100%;
      }

      .brand-logo-mark {
        width: 40px;
        height: 40px;
        margin-bottom: 0;
        flex-shrink: 0;
      }

      .brand-logo-letter {
        font-size: 1.5rem;
      }

      .brand-headline {
        font-size: 1.75rem;
        margin: 0;
      }

      .brand-tagline,
      .brand-stats,
      .decor-circle--1,
      .decor-line--1,
      .decor-line--2 {
        display: none;
      }

      .decor-circle--2 {
        width: 200px;
        height: 200px;
        bottom: -60px;
        right: 0;
        left: auto;
      }

      .auth-right {
        flex: 1;
        padding: 2rem 1rem;
        align-items: flex-start;
      }
    }
  `],
})
export class AuthShellComponent {}
