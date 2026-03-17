export interface Subject {
  id: string;
  name: string;
  slug: string;
  description: string;
  iconUrl: string | null;
  sortOrder: number;
  topicCount: number;
  progress?: number;
}

export interface Topic {
  id: string;
  subjectId: string;
  parentTopicId: string | null;
  name: string;
  gradeLevel: number;
  sortOrder: number;
  masteryLevel?: number;
  progress?: number;
  children?: Topic[];
}

export interface ContinueLearningTopic {
  topicId: string;
  topicName: string;
  subjectId: string;
  subjectName: string;
  subjectIconUrl: string | null;
  progress: number;
  lastActiveAt: string;
  currentDifficulty: number;
  masteryLevel: number;
}

export interface LearningPath {
  id: string;
  subjectId: string;
  name: string;
  gradeLevel: number;
  description: string;
  totalSteps: number;
  completedSteps: number;
  progress: number;
}

export interface LearningPathStep {
  id: string;
  pathId: string;
  topicId: string;
  topicName: string;
  stepOrder: number;
  isCompleted: boolean;
  masteryLevel: number;
}

export interface StudentClassSubject {
  subjectId: string | null;
  name: string;
  iconUrl: string | null;
  description: string | null;
  assignmentCount: number;
  completedCount: number;
  progressPercentage: number;
}

export interface StudentClass {
  id: string;
  name: string;
  gradeLevel: number;
  teacherName: string;
  joinedAt: string;
  subjects: StudentClassSubject[];
}
