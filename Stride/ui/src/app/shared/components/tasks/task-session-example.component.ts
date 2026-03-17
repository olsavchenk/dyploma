/**
 * Example usage of Task Type Components
 * 
 * This file demonstrates how to integrate the five task type components
 * in a learning session. This is a reference for implementing US-016.
 */

import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  MultipleChoiceTaskComponent,
  FillBlankTaskComponent,
  TrueFalseTaskComponent,
  MatchingTaskComponent,
  OrderingTaskComponent,
} from '@app/shared';
import { LoggingService } from '@app/core/services/logging.service';
import {
  Task,
  TaskType,
  MultipleChoiceTask,
  FillBlankTask,
  TrueFalseTask,
  MatchingTask,
  OrderingTask,
  MatchingPair,
  TaskAnswer,
} from '@app/core';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-task-session-example',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MultipleChoiceTaskComponent,
    FillBlankTaskComponent,
    TrueFalseTaskComponent,
    MatchingTaskComponent,
    OrderingTaskComponent,
  ],
  template: `
    <div class="task-session">
      @if (currentTask(); as task) {
        <div class="task-container">
          <!-- Multiple Choice Task -->
          @if (task.type === 'MultipleChoice') {
            <app-multiple-choice-task
              [task]="task"
              (answerSelected)="onMultipleChoiceAnswer($event)"
            />
          }

          <!-- Fill Blank Task -->
          @if (task.type === 'FillBlank') {
            <app-fill-blank-task
              [task]="task"
              (answersChanged)="onFillBlankAnswers($event)"
            />
          }

          <!-- True/False Task -->
          @if (task.type === 'TrueFalse') {
            <app-true-false-task
              [task]="task"
              (answerSelected)="onTrueFalseAnswer($event)"
            />
          }

          <!-- Matching Task -->
          @if (task.type === 'Matching') {
            <app-matching-task
              [task]="task"
              (matchesChanged)="onMatchingAnswers($event)"
            />
          }

          <!-- Ordering Task -->
          @if (task.type === 'Ordering') {
            <app-ordering-task
              [task]="task"
              (orderChanged)="onOrderingAnswer($event)"
            />
          }

          <div class="actions">
            <button
              mat-raised-button
              color="primary"
              [disabled]="!hasAnswer()"
              (click)="submitAnswer()"
            >
              Підтвердити відповідь
            </button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .task-session {
        max-width: 800px;
        margin: 0 auto;
        padding: 2rem;
      }

      .task-container {
        background: white;
        border-radius: 1rem;
        padding: 2rem;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
      }

      .actions {
        display: flex;
        justify-content: center;
        margin-top: 2rem;
        padding-top: 2rem;
        border-top: 2px solid #e2e8f0;
      }
    `,
  ],
})
export class TaskSessionExampleComponent {
  private readonly logger = inject(LoggingService);

  protected currentTask = signal<Task | null>(null);
  protected currentAnswer = signal<TaskAnswer | null>(null);
  protected startTime = Date.now();

  /**
   * Handle multiple choice answer
   */
  protected onMultipleChoiceAnswer(selectedOption: string): void {
    const task = this.currentTask();
    if (task) {
      this.currentAnswer.set({
        taskId: task.id,
        answer: selectedOption,
        responseTimeMs: Date.now() - this.startTime,
      });
    }
  }

  /**
   * Handle fill blank answers
   */
  protected onFillBlankAnswers(answers: string[]): void {
    const task = this.currentTask();
    if (task) {
      this.currentAnswer.set({
        taskId: task.id,
        answer: answers,
        responseTimeMs: Date.now() - this.startTime,
      });
    }
  }

  /**
   * Handle true/false answer
   */
  protected onTrueFalseAnswer(answer: boolean): void {
    const task = this.currentTask();
    if (task) {
      this.currentAnswer.set({
        taskId: task.id,
        answer: answer.toString(),
        responseTimeMs: Date.now() - this.startTime,
      });
    }
  }

  /**
   * Handle matching answers
   */
  protected onMatchingAnswers(pairs: MatchingPair[]): void {
    const task = this.currentTask();
    if (task) {
      this.currentAnswer.set({
        taskId: task.id,
        answer: pairs,
        responseTimeMs: Date.now() - this.startTime,
      });
    }
  }

  /**
   * Handle ordering answer
   */
  protected onOrderingAnswer(orderedItems: string[]): void {
    const task = this.currentTask();
    if (task) {
      this.currentAnswer.set({
        taskId: task.id,
        answer: orderedItems,
        responseTimeMs: Date.now() - this.startTime,
      });
    }
  }

  /**
   * Check if user has provided an answer
   */
  protected hasAnswer(): boolean {
    const answer = this.currentAnswer();
    if (!answer) return false;

    // Check if answer is not empty
    if (Array.isArray(answer.answer)) {
      return answer.answer.length > 0;
    }
    return answer.answer !== '';
  }

  /**
   * Submit the answer to the backend
   */
  protected async submitAnswer(): Promise<void> {
    const answer = this.currentAnswer();
    if (!answer) return;

    // Format answer for API
    const formattedAnswer = this.formatAnswerForApi(answer.answer);

    // TODO: Call TaskService to submit answer
    // const response = await this.taskService.submitTask(answer.taskId, {
    //   answer: formattedAnswer,
    //   responseTimeMs: answer.responseTimeMs
    // });

    this.logger.debug('TaskSessionExampleComponent', 'Submitting answer', {
      taskId: answer.taskId,
      answer: formattedAnswer,
      responseTimeMs: answer.responseTimeMs,
    });

    // Reset for next task
    this.currentAnswer.set(null);
    this.startTime = Date.now();
  }

  /**
   * Format answer based on task type for API submission
   */
  private formatAnswerForApi(answer: string | string[] | MatchingPair[]): string {
    if (typeof answer === 'string') {
      return answer;
    }
    return JSON.stringify(answer);
  }

  /**
   * Example: Load tasks (would be called from TaskService)
   */
  private loadExampleTasks(): void {
    // Multiple Choice example
    const mcTask: MultipleChoiceTask = {
      id: '1',
      topicId: 'topic-1',
      difficulty: 50,
      type: 'MultipleChoice',
      question: 'Яка столиця України?',
      options: ['Львів', 'Київ', 'Одеса', 'Харків'],
      hints: ['Це найбільше місто України'],
    };

    // Fill Blank example
    const fbTask: FillBlankTask = {
      id: '2',
      topicId: 'topic-1',
      difficulty: 60,
      type: 'FillBlank',
      question: 'Україна отримала незалежність у {{blank}} році, столиця — {{blank}}.',
      hints: ['Подія відбулася в кінці XX століття'],
    };

    // True/False example
    const tfTask: TrueFalseTask = {
      id: '3',
      topicId: 'topic-1',
      difficulty: 40,
      type: 'TrueFalse',
      question: 'Україна є членом Європейського Союзу з 2023 року.',
      hints: ['Україна має статус кандидата'],
    };

    // Matching example
    const matchingTask: MatchingTask = {
      id: '4',
      topicId: 'topic-1',
      difficulty: 70,
      type: 'Matching',
      question: 'Співставте міста з їхніми областями:',
      leftItems: [
        { id: 'l1', content: 'Львів' },
        { id: 'l2', content: 'Одеса' },
        { id: 'l3', content: 'Харків' },
      ],
      rightItems: [
        { id: 'r1', content: 'Одеська область' },
        { id: 'r2', content: 'Львівська область' },
        { id: 'r3', content: 'Харківська область' },
      ],
    };

    // Ordering example
    const orderingTask: OrderingTask = {
      id: '5',
      topicId: 'topic-1',
      difficulty: 65,
      type: 'Ordering',
      question: 'Розташуйте події в хронологічному порядку:',
      items: [
        'Незалежність України (1991)',
        'Революція Гідності (2014)',
        'Перебудова в СРСР (1985)',
        'Помаранчева революція (2004)',
      ],
    };

    // Set first task
    this.currentTask.set(mcTask);
  }
}
