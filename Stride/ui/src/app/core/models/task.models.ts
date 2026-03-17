export type TaskType = 'MultipleChoice' | 'FillBlank' | 'TrueFalse' | 'Matching' | 'Ordering';

export interface BaseTask {
  id: string;
  topicId: string;
  difficulty: number;
  question: string;
  hints?: string[];
}

export interface MultipleChoiceTask extends BaseTask {
  type: 'MultipleChoice';
  options: string[];
}

export interface FillBlankTask extends BaseTask {
  type: 'FillBlank';
  question: string; // Contains {{blank}} placeholders
}

export interface TrueFalseTask extends BaseTask {
  type: 'TrueFalse';
}

export interface MatchingTask extends BaseTask {
  type: 'Matching';
  leftItems: MatchingItem[];
  rightItems: MatchingItem[];
}

export interface OrderingTask extends BaseTask {
  type: 'Ordering';
  items: string[];
}

// Discriminated union of all task types
export type Task = MultipleChoiceTask | FillBlankTask | TrueFalseTask | MatchingTask | OrderingTask;

export interface MatchingItem {
  id: string;
  content: string;
}

export interface MatchingPair {
  leftId: string;
  rightId: string;
}

export interface TaskAnswer {
  taskId: string;
  answer: string | string[] | MatchingPair[];
  responseTimeMs: number;
}

export interface TaskSubmitResponse {
  isCorrect: boolean;
  correctAnswer: string | string[] | MatchingPair[];
  explanation?: string;
  xpEarned: number;
  nextDifficulty: number;
  currentStreak: number;
}

export interface TaskAttempt {
  id: string;
  topicId: string;
  topicName: string;
  isCorrect: boolean;
  responseTimeMs: number;
  difficultyAtTime: number;
  xpEarned: number;
  createdAt: string;
}
