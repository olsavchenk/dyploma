export interface Subject {
  id: string;
  name: string;
  slug: string;
  description: string;
  iconUrl: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
}
export interface CreateSubjectRequest { name: string; slug: string; description: string; iconUrl: string; sortOrder: number; }
export interface UpdateSubjectRequest extends Partial<CreateSubjectRequest> {}

export interface Topic {
  id: string;
  subjectId: string;
  name: string;
  description: string;
  difficultyLevel: number;
  sortOrder: number;
  isActive: boolean;
}
export interface CreateTopicRequest { subjectId: string; name: string; description: string; difficultyLevel: number; sortOrder: number; }
export interface UpdateTopicRequest extends Partial<Omit<CreateTopicRequest, 'subjectId'>> {}

export interface Achievement {
  id: string;
  code: string;
  name: string;
  description: string;
  iconUrl: string;
  xpReward: number;
  unlockCriteria: Record<string, unknown>;
  isHidden: boolean;
  createdAt: string;
}
export interface CreateAchievementRequest { code: string; name: string; description: string; iconUrl: string; xpReward: number; unlockCriteria: Record<string, unknown>; isHidden: boolean; }
export interface UpdateAchievementRequest extends Partial<CreateAchievementRequest> {}

export interface PagedResult<T> { items: T[]; total: number; page: number; pageSize: number; }
