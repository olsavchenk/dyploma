export interface Class {
  id: string;
  teacherId: string;
  name: string;
  joinCode: string;
  gradeLevel: string;
  createdAt: string;
  studentCount: number;
  assignmentCount: number;
  averageAccuracy?: number;
}

export interface ClassMember {
  id: string;
  studentId: string;
  studentName: string;
  studentAvatar: string | null;
  joinedAt: string;
  totalXp: number;
  currentLevel: number;
  accuracy: number;
  tasksCompleted: number;
  lastActive: string | null;
}

export interface Assignment {
  id: string;
  classId: string;
  topicId: string | null;
  subjectName: string;
  topicName: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  taskCount: number;
  minDifficulty: number;
  maxDifficulty: number;
  createdAt: string;
  completionRate: number;
  averageScore: number;
  generationJobId: string | null;
}

export interface StudentAssignment {
  id: string;
  assignmentId: string;
  assignment: Assignment;
  studentId: string;
  status: 'NotStarted' | 'InProgress' | 'Completed';
  tasksCompleted: number;
  totalTasks: number;
  accuracy: number | null;
  completedAt: string | null;
}

export interface ClassAnalytics {
  classId: string;
  totalStudents: number;
  activeStudents: number;
  totalTasksCompleted: number;
  averageAccuracy: number;
  topicPerformance: TopicPerformance[];
  topPerformers: StudentPerformanceSummary[];
  strugglingStudents: StudentPerformanceSummary[];
}

export interface TopicPerformance {
  topicId: string;
  topicName: string;
  totalAttempts: number;
  averageAccuracy: number;
  studentsAttempted: number;
}

export interface StudentPerformanceSummary {
  studentId: string;
  studentName: string;
  studentAvatar: string | null;
  totalXp: number;
  currentLevel: number;
  accuracy: number;
  tasksCompleted: number;
  lastActive: string | null;
}

export interface StudentPerformanceDetail {
  student: ClassMember;
  topicPerformance: StudentTopicPerformance[];
  recentActivity: StudentActivity[];
  overallStats: {
    totalXp: number;
    currentLevel: number;
    accuracy: number;
    tasksCompleted: number;
    averageResponseTime: number;
    strengths: string[];
    weaknesses: string[];
  };
}

export interface StudentTopicPerformance {
  topicId: string;
  topicName: string;
  tasksAttempted: number;
  accuracy: number;
  currentDifficulty: number;
  topicMastery: number;
  lastAttemptAt: string | null;
}

export interface StudentActivity {
  id: string;
  topicName: string;
  isCorrect: boolean;
  difficulty: number;
  attemptedAt: string;
  responseTime: number;
}

export interface CreateClassRequest {
  name: string;
  gradeLevel: string;
}

export interface UpdateClassRequest {
  name?: string;
  gradeLevel?: string;
}

export interface JoinClassRequest {
  joinCode: string;
}

export interface CreateAssignmentRequest {
  subjectName: string;
  topicName: string;
  title: string;
  description?: string;
  dueDate?: string;
  taskCount: number;
  minDifficulty?: number;
  maxDifficulty?: number;
}

export interface UpdateAssignmentRequest {
  title?: string;
  description?: string;
  dueDate?: string;
}

export interface ClassQuickStats {
  totalClasses: number;
  totalStudents: number;
  activeThisWeek: number;
  averageClassSize: number;
}
