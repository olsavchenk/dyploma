export interface TaskGenerationStatus {
  jobId: string;
  status: 'Pending' | 'InProgress' | 'Completed' | 'PartiallyCompleted' | 'Failed';
  totalTasksRequested: number;
  tasksGenerated: number;
  tasksFailed: number;
  createdAt: string;
  completedAt: string | null;
  errorMessage: string | null;
}

export interface TaskTemplatePagedResult {
  items: TaskTemplateListItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface TaskTemplateListItem {
  id: string;
  topicId: string;
  taskType: string;
  difficultyBand: number;
  question: string;
  reviewStatus: string;
  isApproved: boolean;
  createdAt: string;
}

export interface TaskTemplateDetail {
  id: string;
  topicId: string;
  taskType: string;
  difficultyBand: number;
  question: string;
  options: string[] | null;
  answer: string;
  explanation: string | null;
  hints: string[] | null;
  reviewStatus: string;
  isApproved: boolean;
  reviewedBy: string | null;
  assignmentId: string | null;
  generationJobId: string | null;
  createdAt: string;
}

export interface BulkActionRequest {
  action: 'approve' | 'reject' | 'delete';
  templateIds: string[];
}

export interface TaskReviewFilters {
  reviewStatus?: string;
  difficultyBand?: number;
  taskType?: string;
  page?: number;
  pageSize?: number;
}
