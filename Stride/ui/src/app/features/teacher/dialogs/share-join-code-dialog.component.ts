import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

export interface ShareJoinCodeDialogData {
  joinCode: string;
  className: string;
}

@Component({
  selector: 'app-share-join-code-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
  ],
  template: `
    <h2 mat-dialog-title class="dialog-title">Код приєднання</h2>

    <mat-dialog-content class="dialog-content">
      <p class="class-name">{{ data.className }}</p>

      <div class="code-display">
        <span class="code-text">{{ data.joinCode }}</span>
      </div>

      <p class="hint">Поділіться цим кодом з учнями, щоб вони могли приєднатися до класу.</p>

      <div class="action-row">
        <button class="btn-copy" (click)="copyCode()">
          <span class="btn-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
          </span>
          {{ copied() ? 'Скопійовано!' : 'Копіювати' }}
        </button>

        <button class="btn-share" (click)="shareCode()" *ngIf="canShare()">
          <span class="btn-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="18" cy="5" r="3"></circle>
              <circle cx="6" cy="12" r="3"></circle>
              <circle cx="18" cy="19" r="3"></circle>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
            </svg>
          </span>
          Поділитися
        </button>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="close()">Закрити</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-title {
      font-family: var(--font-display);
      color: var(--color-ink);
      margin-bottom: 0;
    }

    .dialog-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      padding: 1rem 0;
      min-width: 320px;
    }

    .class-name {
      color: var(--color-ink-soft);
      font-size: 0.9rem;
      margin: 0;
    }

    .code-display {
      background: var(--color-surface);
      border: 2px solid var(--color-rule);
      border-radius: var(--radius-md);
      padding: 1.25rem 2.5rem;
      text-align: center;
    }

    .code-text {
      font-family: var(--font-mono);
      font-size: 2rem;
      font-weight: 700;
      letter-spacing: 0.3em;
      color: var(--blue-600);
    }

    .hint {
      color: var(--color-ink-soft);
      font-size: 0.85rem;
      text-align: center;
      margin: 0;
    }

    .action-row {
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;
      justify-content: center;
    }

    .btn-copy,
    .btn-share {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.6rem 1.25rem;
      border-radius: var(--radius-md);
      border: none;
      cursor: pointer;
      font-family: var(--font-sans);
      font-size: 0.9rem;
      font-weight: 500;
      transition: opacity 0.15s;

      &:hover { opacity: 0.85; }
    }

    .btn-copy {
      background: var(--blue-600);
      color: #fff;
    }

    .btn-share {
      background: var(--color-surface);
      color: var(--color-ink);
      border: 1px solid var(--color-rule);
    }

    .btn-icon {
      display: flex;
      align-items: center;
    }
  `],
})
export class ShareJoinCodeDialogComponent {
  readonly data = inject<ShareJoinCodeDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<ShareJoinCodeDialogComponent>);
  private readonly snackBar = inject(MatSnackBar);

  readonly copied = signal(false);
  readonly canShare = signal(typeof navigator !== 'undefined' && !!navigator.share);

  copyCode(): void {
    navigator.clipboard.writeText(this.data.joinCode).then(() => {
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    }).catch(() => {
      this.snackBar.open('Не вдалося скопіювати', 'OK', { duration: 2000 });
    });
  }

  shareCode(): void {
    if (navigator.share) {
      navigator.share({
        title: `Код класу "${this.data.className}"`,
        text: `Приєднайтесь до класу "${this.data.className}" за кодом: ${this.data.joinCode}`,
      }).catch(() => {});
    }
  }

  close(): void {
    this.dialogRef.close();
  }
}
