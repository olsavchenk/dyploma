import { Component, Input, Output, EventEmitter, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatchingTask, MatchingItem, MatchingPair } from '@app/core';
import { SafeHtmlPipe } from '@app/shared/pipes/safe-html.pipe';

@Component({
  selector: 'app-matching-task',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, SafeHtmlPipe],
  template: `
    <div class="matching-task">
      <div class="question" [innerHTML]="task.question | safeHtml"></div>

      <div class="matching-columns">
        <div class="column left-column">
          <div class="column-header">Питання</div>
          @for (item of task.leftItems; track item.id) {
            <button
              mat-raised-button
              class="match-item"
              [class.selected]="selectedLeft() === item.id"
              [class.matched]="isMatched(item.id)"
              (click)="selectLeft(item.id)"
              [disabled]="isMatched(item.id)"
              type="button"
            >
              <span class="item-content" [innerHTML]="item.content | safeHtml"></span>
              @if (isMatched(item.id)) {
                <mat-icon class="matched-icon">check_circle</mat-icon>
              }
            </button>
          }
        </div>

        <div class="column right-column">
          <div class="column-header">Відповіді</div>
          @for (item of task.rightItems; track item.id) {
            <button
              mat-raised-button
              class="match-item"
              [class.selected]="selectedRight() === item.id"
              [class.matched]="isMatched(item.id)"
              (click)="selectRight(item.id)"
              [disabled]="isMatched(item.id)"
              type="button"
            >
              <span class="item-content" [innerHTML]="item.content | safeHtml"></span>
              @if (isMatched(item.id)) {
                <mat-icon class="matched-icon">check_circle</mat-icon>
              }
            </button>
          }
        </div>
      </div>

      @if (matches().length > 0) {
        <div class="matches-summary">
          <div class="summary-header">
            <mat-icon>link</mat-icon>
            Співпадіння: {{ matches().length }} / {{ task.leftItems.length }}
          </div>
          @if (matches().length < task.leftItems.length) {
            <button
              mat-stroked-button
              color="warn"
              (click)="clearMatches()"
              class="clear-button"
              type="button"
            >
              <mat-icon>clear_all</mat-icon>
              Очистити все
            </button>
          }
        </div>
      }

      @if (task.hints && task.hints.length > 0 && showHints()) {
        <div class="hints-section">
          <div class="hint-label">💡 Підказка:</div>
          @for (hint of task.hints; track $index) {
            <div class="hint-text">{{ hint }}</div>
          }
        </div>
      }
    </div>
  `,
  styles: [
    `
      .matching-task {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
      }

      .question {
        font-size: 1.125rem;
        font-weight: 500;
        line-height: 1.6;
        color: #1a202c;
        text-align: center;
      }

      .matching-columns {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1.5rem;
      }

      .column {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }

      .column-header {
        font-weight: 600;
        color: #4a5568;
        padding: 0.5rem;
        text-align: center;
        background: #f7fafc;
        border-radius: 0.5rem;
        font-size: 0.875rem;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .match-item {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 1rem;
        border: 2px solid #e2e8f0;
        border-radius: 0.5rem;
        transition: all 0.2s;
        background: white;
        text-align: left;
        min-height: 60px;

        &:not(:disabled):hover {
          border-color: #667eea;
          background-color: #f7fafc;
          transform: translateY(-2px);
        }

        &.selected {
          border-color: #667eea;
          background-color: #eef2ff;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.2);
        }

        &.matched {
          border-color: #10b981;
          background-color: #d1fae5;
          pointer-events: none;
        }

        &:disabled {
          opacity: 0.7;
        }
      }

      .item-content {
        flex: 1;
        line-height: 1.5;
      }

      .matched-icon {
        color: #10b981;
        font-size: 1.5rem;
        width: 1.5rem;
        height: 1.5rem;
        margin-left: 0.5rem;
      }

      .matches-summary {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 1rem;
        background: #f7fafc;
        border-radius: 0.5rem;
        border: 2px solid #e2e8f0;
      }

      .summary-header {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-weight: 600;
        color: #4a5568;

        mat-icon {
          color: #667eea;
        }
      }

      .clear-button {
        mat-icon {
          font-size: 1.25rem;
          width: 1.25rem;
          height: 1.25rem;
          margin-right: 0.25rem;
        }
      }

      .hints-section {
        padding: 1rem;
        background-color: #fffbeb;
        border-left: 4px solid #fbbf24;
        border-radius: 0.5rem;
        margin-top: 0.5rem;
      }

      .hint-label {
        font-weight: 600;
        color: #92400e;
        margin-bottom: 0.5rem;
      }

      .hint-text {
        color: #78350f;
        line-height: 1.5;
      }

      @media (max-width: 768px) {
        .matching-columns {
          grid-template-columns: 1fr;
        }

        .question {
          font-size: 1rem;
        }

        .match-item {
          padding: 0.75rem;
          min-height: 50px;
        }

        .matches-summary {
          flex-direction: column;
          gap: 0.75rem;
        }
      }
    `,
  ],
})
export class MatchingTaskComponent {
  @Input({ required: true }) task!: MatchingTask;
  @Output() matchesChanged = new EventEmitter<MatchingPair[]>();

  protected selectedLeft = signal<string | null>(null);
  protected selectedRight = signal<string | null>(null);
  protected matches = signal<MatchingPair[]>([]);
  protected showHints = signal(false);

  protected matchedIds = computed(() => {
    const matched = new Set<string>();
    this.matches().forEach((pair) => {
      matched.add(pair.leftId);
      matched.add(pair.rightId);
    });
    return matched;
  });

  protected selectLeft(id: string): void {
    if (this.selectedLeft() === id) {
      this.selectedLeft.set(null);
    } else {
      this.selectedLeft.set(id);
      this.tryMatch();
    }
  }

  protected selectRight(id: string): void {
    if (this.selectedRight() === id) {
      this.selectedRight.set(null);
    } else {
      this.selectedRight.set(id);
      this.tryMatch();
    }
  }

  protected isMatched(id: string): boolean {
    return this.matchedIds().has(id);
  }

  private tryMatch(): void {
    const left = this.selectedLeft();
    const right = this.selectedRight();

    if (left && right) {
      const newMatch: MatchingPair = { leftId: left, rightId: right };
      const updatedMatches = [...this.matches(), newMatch];
      this.matches.set(updatedMatches);
      this.selectedLeft.set(null);
      this.selectedRight.set(null);
      this.matchesChanged.emit(updatedMatches);
    }
  }

  protected clearMatches(): void {
    this.matches.set([]);
    this.selectedLeft.set(null);
    this.selectedRight.set(null);
    this.matchesChanged.emit([]);
  }
}
