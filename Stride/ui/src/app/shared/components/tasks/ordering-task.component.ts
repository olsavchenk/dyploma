import {
  Component,
  Input,
  Output,
  EventEmitter,
  signal,
  OnInit,
  HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { OrderingTask } from '@app/core';
import { SafeHtmlPipe } from '@app/shared/pipes/safe-html.pipe';

@Component({
  selector: 'app-ordering-task',
  standalone: true,
  imports: [CommonModule, DragDropModule, MatButtonModule, MatIconModule, SafeHtmlPipe],
  template: `
    <div class="ordering-task">
      <div class="question" [innerHTML]="task.question | safeHtml"></div>

      <div class="instruction">
        <mat-icon>info</mat-icon>
        <span>Перетягніть елементи, щоб розташувати їх у правильному порядку</span>
      </div>

      <div
        cdkDropList
        class="items-list"
        (cdkDropListDropped)="onDrop($event)"
        [cdkDropListDisabled]="isDragDisabled()"
      >
        @for (item of orderedItems(); track $index) {
          <div
            class="order-item"
            cdkDrag
            [class.selected]="selectedIndex() === $index"
            (click)="selectItem($index)"
          >
            <div class="drag-handle" cdkDragHandle>
              <mat-icon>drag_indicator</mat-icon>
            </div>

            <div class="item-number">{{ $index + 1 }}</div>

            <div class="item-content" [innerHTML]="item | safeHtml"></div>

            <div class="keyboard-controls">
              @if (selectedIndex() === $index) {
                <button
                  mat-icon-button
                  class="move-button"
                  (click)="moveUp($index); $event.stopPropagation()"
                  [disabled]="$index === 0"
                  type="button"
                  aria-label="Перемістити вгору"
                >
                  <mat-icon>arrow_upward</mat-icon>
                </button>
                <button
                  mat-icon-button
                  class="move-button"
                  (click)="moveDown($index); $event.stopPropagation()"
                  [disabled]="$index === orderedItems().length - 1"
                  type="button"
                  aria-label="Перемістити вниз"
                >
                  <mat-icon>arrow_downward</mat-icon>
                </button>
              }
            </div>

            <div class="drag-placeholder" *cdkDragPlaceholder></div>
          </div>
        }
      </div>

      @if (hasChanges()) {
        <div class="actions">
          <button mat-stroked-button (click)="resetOrder()" type="button">
            <mat-icon>refresh</mat-icon>
            Скинути порядок
          </button>
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
      .ordering-task {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
      }

      .question {
        font-size: 1.125rem;
        font-weight: 500;
        line-height: 1.6;
        color: #1a202c;
      }

      .instruction {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem 1rem;
        background: #eef2ff;
        border-radius: 0.5rem;
        color: #4338ca;
        font-size: 0.875rem;

        mat-icon {
          font-size: 1.25rem;
          width: 1.25rem;
          height: 1.25rem;
        }
      }

      .items-list {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }

      .order-item {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 1rem;
        background: white;
        border: 2px solid #e2e8f0;
        border-radius: 0.5rem;
        transition: all 0.2s;
        cursor: pointer;

        &:hover {
          border-color: #cbd5e0;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        &.selected {
          border-color: #667eea;
          background-color: #eef2ff;
        }

        &.cdk-drag-preview {
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
          opacity: 0.9;
        }

        &.cdk-drag-animating {
          transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
        }
      }

      .drag-handle {
        display: flex;
        align-items: center;
        color: #94a3b8;
        cursor: grab;

        &:active {
          cursor: grabbing;
        }

        mat-icon {
          font-size: 1.5rem;
          width: 1.5rem;
          height: 1.5rem;
        }
      }

      .item-number {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 2rem;
        height: 2rem;
        border-radius: 50%;
        background-color: #667eea;
        color: white;
        font-weight: 600;
        font-size: 0.875rem;
        flex-shrink: 0;
      }

      .item-content {
        flex: 1;
        line-height: 1.5;
      }

      .keyboard-controls {
        display: flex;
        gap: 0.25rem;
      }

      .move-button {
        width: 2rem;
        height: 2rem;

        mat-icon {
          font-size: 1.25rem;
          width: 1.25rem;
          height: 1.25rem;
        }
      }

      .drag-placeholder {
        background: #eef2ff;
        border: 2px dashed #667eea;
        border-radius: 0.5rem;
        min-height: 60px;
      }

      .cdk-drop-list-dragging .order-item:not(.cdk-drag-placeholder) {
        transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
      }

      .actions {
        display: flex;
        justify-content: center;
        padding-top: 0.5rem;

        button {
          mat-icon {
            margin-right: 0.25rem;
          }
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

      @media (max-width: 640px) {
        .question {
          font-size: 1rem;
        }

        .order-item {
          padding: 0.75rem;
        }

        .drag-handle mat-icon {
          font-size: 1.25rem;
          width: 1.25rem;
          height: 1.25rem;
        }

        .item-number {
          width: 1.75rem;
          height: 1.75rem;
          font-size: 0.75rem;
        }
      }
    `,
  ],
})
export class OrderingTaskComponent implements OnInit {
  @Input({ required: true }) task!: OrderingTask;
  @Output() orderChanged = new EventEmitter<string[]>();

  protected orderedItems = signal<string[]>([]);
  protected originalOrder = signal<string[]>([]);
  protected selectedIndex = signal<number | null>(null);
  protected showHints = signal(false);
  protected hasChanges = signal(false);

  ngOnInit(): void {
    // Shuffle items initially for randomization
    const shuffled = this.shuffleArray([...this.task.items]);
    this.orderedItems.set(shuffled);
    this.originalOrder.set([...shuffled]);
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardInput(event: KeyboardEvent): void {
    const selected = this.selectedIndex();
    if (selected === null) return;

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.moveUp(selected);
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.moveDown(selected);
    } else if (event.key === 'Escape') {
      this.selectedIndex.set(null);
    } else if (event.key === 'h' || event.key === 'H' || event.key === 'п' || event.key === 'П') {
      this.showHints.set(!this.showHints());
    }
  }

  protected onDrop(event: CdkDragDrop<string[]>): void {
    const items = [...this.orderedItems()];
    moveItemInArray(items, event.previousIndex, event.currentIndex);
    this.updateOrder(items);
  }

  protected selectItem(index: number): void {
    this.selectedIndex.set(this.selectedIndex() === index ? null : index);
  }

  protected moveUp(index: number): void {
    if (index > 0) {
      const items = [...this.orderedItems()];
      [items[index - 1], items[index]] = [items[index], items[index - 1]];
      this.updateOrder(items);
      this.selectedIndex.set(index - 1);
    }
  }

  protected moveDown(index: number): void {
    const items = this.orderedItems();
    if (index < items.length - 1) {
      const newItems = [...items];
      [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
      this.updateOrder(newItems);
      this.selectedIndex.set(index + 1);
    }
  }

  protected resetOrder(): void {
    this.orderedItems.set([...this.originalOrder()]);
    this.selectedIndex.set(null);
    this.hasChanges.set(false);
    this.orderChanged.emit(this.orderedItems());
  }

  protected isDragDisabled(): boolean {
    return false; // Can be controlled via input if needed
  }

  private updateOrder(items: string[]): void {
    this.orderedItems.set(items);
    this.hasChanges.set(true);
    this.orderChanged.emit(items);
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}
