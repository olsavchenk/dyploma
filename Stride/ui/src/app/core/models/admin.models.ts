export interface ReviewQueueItem {
  id: string;
  topicId: string;
  topicName: string;
  subjectName: string;
  taskType: string;
  difficultyBand: number;
  aiProvider: string | null;
  createdAt: string;
  templateContent: any;
}

export interface GetReviewQueueRequest {
  page: number;
  pageSize: number;
  topicId?: string;
  taskType?: string;
  difficultyBand?: number;
}

export interface PaginatedReviewQueueResponse {
  items: ReviewQueueItem[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface AdminDashboard {
  totalUsers: number;
  activeUsersToday: number;
  activeUsersThisWeek: number;
  totalStudents: number;
  totalTeachers: number;
  totalAdmins: number;
  totalTasksAttempted: number;
  averageAccuracy: number;
  pendingAIReviews: number;
  generatedAt: string;
}

export interface AdminUser {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  role: string;
  createdAt: string;
  lastLoginAt: string | null;
  isDeleted: boolean;
  totalXp: number;
  currentLevel: number;
  totalTasksAttempted: number;
  totalClasses: number;
}

export interface PaginatedUsersResponse {
  items: AdminUser[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface GetUsersRequest {
  page: number;
  pageSize: number;
  search?: string;
  role?: string;
  isDeleted?: boolean;
  sortBy?: string;
  sortOrder?: string;
}

export interface ChangeUserRoleRequest {
  role: string;
}
