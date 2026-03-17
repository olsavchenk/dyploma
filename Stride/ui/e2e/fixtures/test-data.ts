/**
 * Deterministic test data for all E2E tests.
 * Every mock response and assertion references these constants.
 */

// ─── Users ───────────────────────────────────────────────────────────────────

export const TEST_STUDENT = {
  id: 'e2e-student-001',
  email: 'student@stride-test.com',
  password: 'TestPass123!',
  displayName: 'Тестовий Учень',
  avatarUrl: null as string | null,
  role: 'Student' as const,
  isEmailVerified: true,
  hasCompletedOnboarding: true,
  createdAt: '2025-09-01T10:00:00Z',
};

export const TEST_TEACHER = {
  id: 'e2e-teacher-001',
  email: 'teacher@stride-test.com',
  password: 'TestPass123!',
  displayName: 'Тестовий Вчитель',
  avatarUrl: null as string | null,
  role: 'Teacher' as const,
  isEmailVerified: true,
  hasCompletedOnboarding: true,
  createdAt: '2025-08-15T10:00:00Z',
};

export const TEST_ADMIN = {
  id: 'e2e-admin-001',
  email: 'admin@stride-test.com',
  password: 'TestPass123!',
  displayName: 'Адміністратор',
  avatarUrl: null as string | null,
  role: 'Admin' as const,
  isEmailVerified: true,
  hasCompletedOnboarding: true,
  createdAt: '2025-07-01T10:00:00Z',
};

export const TEST_NEW_USER = {
  id: 'e2e-new-001',
  email: 'newuser@stride-test.com',
  password: 'TestPass123!',
  displayName: 'Новий Учень',
  avatarUrl: null as string | null,
  role: 'Student' as const,
  isEmailVerified: true,
  hasCompletedOnboarding: false,
  createdAt: '2026-02-27T10:00:00Z',
};

// ─── Auth tokens ─────────────────────────────────────────────────────────────

export const TEST_JWT_TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJlMmUtc3R1ZGVudC0wMDEiLCJlbWFpbCI6InN0dWRlbnRAc3RyaWRlLXRlc3QuY29tIiwicm9sZSI6IlN0dWRlbnQiLCJleHAiOjk5OTk5OTk5OTl9.test-signature';

export const TEST_TEACHER_TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJlMmUtdGVhY2hlci0wMDEiLCJlbWFpbCI6InRlYWNoZXJAc3RyaWRlLXRlc3QuY29tIiwicm9sZSI6IlRlYWNoZXIiLCJleHAiOjk5OTk5OTk5OTl9.test-signature';

export const TEST_ADMIN_TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJlMmUtYWRtaW4tMDAxIiwiZW1haWwiOiJhZG1pbkBzdHJpZGUtdGVzdC5jb20iLCJyb2xlIjoiQWRtaW4iLCJleHAiOjk5OTk5OTk5OTl9.test-signature';

// ─── Gamification ────────────────────────────────────────────────────────────

export const TEST_GAMIFICATION_STATS = {
  totalXp: 2450,
  currentLevel: 8,
  xpToNextLevel: 550,
  xpProgress: 81.67,
  currentStreak: 12,
  longestStreak: 18,
  streakFreezes: 2,
  league: 'Silver' as const,
  firstTaskOfDayCompleted: false,
};

export const TEST_GAMIFICATION_STATS_EMPTY = {
  totalXp: 0,
  currentLevel: 1,
  xpToNextLevel: 100,
  xpProgress: 0,
  currentStreak: 0,
  longestStreak: 0,
  streakFreezes: 0,
  league: 'Bronze' as const,
  firstTaskOfDayCompleted: false,
};

export const TEST_ACHIEVEMENTS = {
  earned: [
    {
      id: 'ach-001',
      name: 'Перший крок',
      description: 'Виконайте перше завдання',
      iconUrl: null,
      xpReward: 50,
      unlockedAt: '2025-09-02T12:00:00Z',
    },
    {
      id: 'ach-002',
      name: 'Серія 7 днів',
      description: 'Підтримуйте серію 7 днів поспіль',
      iconUrl: null,
      xpReward: 200,
      unlockedAt: '2025-09-08T12:00:00Z',
    },
  ],
  locked: [
    {
      id: 'ach-003',
      name: 'Майстер математики',
      description: 'Досягніть 100% освоєння з математики',
      iconUrl: null,
      xpReward: 500,
      progress: 65,
    },
  ],
  totalEarned: 2,
  totalAvailable: 15,
};

// ─── Subjects & Topics ───────────────────────────────────────────────────────

export const TEST_SUBJECTS = [
  {
    id: 'subj-math',
    name: 'Математика',
    slug: 'math',
    description: 'Алгебра, геометрія та інше',
    iconUrl: null,
    sortOrder: 1,
    topicCount: 12,
    progress: 45,
  },
  {
    id: 'subj-ukr',
    name: 'Українська мова',
    slug: 'ukrainian',
    description: 'Граматика, лексика, стилістика',
    iconUrl: null,
    sortOrder: 2,
    topicCount: 15,
    progress: 30,
  },
  {
    id: 'subj-eng',
    name: 'Англійська мова',
    slug: 'english',
    description: 'Граматика, лексика, розмовна практика',
    iconUrl: null,
    sortOrder: 3,
    topicCount: 10,
    progress: 60,
  },
  {
    id: 'subj-hist',
    name: 'Історія України',
    slug: 'history',
    description: 'Від давніх часів до сьогодення',
    iconUrl: null,
    sortOrder: 4,
    topicCount: 8,
    progress: 0,
  },
];

export const TEST_TOPICS = [
  {
    id: 'topic-algebra',
    subjectId: 'subj-math',
    parentTopicId: null,
    name: 'Алгебра',
    gradeLevel: 7,
    sortOrder: 1,
    masteryLevel: 'InProgress',
    progress: 45,
    children: [
      {
        id: 'topic-linear-eq',
        subjectId: 'subj-math',
        parentTopicId: 'topic-algebra',
        name: 'Лінійні рівняння',
        gradeLevel: 7,
        sortOrder: 1,
        masteryLevel: 'Mastered',
        progress: 100,
        children: [],
      },
      {
        id: 'topic-quadratic',
        subjectId: 'subj-math',
        parentTopicId: 'topic-algebra',
        name: 'Квадратні рівняння',
        gradeLevel: 8,
        sortOrder: 2,
        masteryLevel: 'InProgress',
        progress: 40,
        children: [],
      },
    ],
  },
  {
    id: 'topic-geometry',
    subjectId: 'subj-math',
    parentTopicId: null,
    name: 'Геометрія',
    gradeLevel: 7,
    sortOrder: 2,
    masteryLevel: 'NotStarted',
    progress: 0,
    children: [],
  },
];

export const TEST_CONTINUE_LEARNING = [
  {
    topicId: 'topic-quadratic',
    topicName: 'Квадратні рівняння',
    subjectName: 'Математика',
    progress: 40,
    masteryLevel: 'InProgress',
    difficulty: 'Medium',
    lastActiveAt: '2026-02-26T18:00:00Z',
  },
  {
    topicId: 'topic-grammar',
    topicName: 'Граматика',
    subjectName: 'Українська мова',
    progress: 25,
    masteryLevel: 'InProgress',
    difficulty: 'Easy',
    lastActiveAt: '2026-02-25T14:00:00Z',
  },
];

// ─── Tasks ───────────────────────────────────────────────────────────────────

export const TEST_MULTIPLE_CHOICE_TASK = {
  id: 'task-mc-001',
  type: 'MultipleChoice' as const,
  question: 'Яке значення x у рівнянні 2x + 6 = 16?',
  options: ['x = 3', 'x = 5', 'x = 8', 'x = 10'],
  hints: ['Спробуйте перенести 6 на іншу сторону'],
  difficulty: 'Medium',
  topicId: 'topic-algebra',
};

export const TEST_FILL_BLANK_TASK = {
  id: 'task-fb-001',
  type: 'FillBlank' as const,
  question: 'Столиця України — {{blank}}. Вона розташована на річці {{blank}}.',
  hints: ['Подумайте про головне місто країни'],
  difficulty: 'Easy',
  topicId: 'topic-geography',
};

export const TEST_TRUE_FALSE_TASK = {
  id: 'task-tf-001',
  type: 'TrueFalse' as const,
  question: 'Квадрат числа завжди додатний.',
  hints: ['Подумайте про число 0'],
  difficulty: 'Easy',
  topicId: 'topic-algebra',
};

export const TEST_MATCHING_TASK = {
  id: 'task-match-001',
  type: 'Matching' as const,
  question: "Зіставте країни з їхніми столицями:",
  leftItems: [
    { id: 'left-1', content: 'Україна' },
    { id: 'left-2', content: 'Франція' },
    { id: 'left-3', content: 'Японія' },
  ],
  rightItems: [
    { id: 'right-1', content: 'Токіо' },
    { id: 'right-2', content: 'Київ' },
    { id: 'right-3', content: 'Париж' },
  ],
  hints: [],
  difficulty: 'Medium',
  topicId: 'topic-geography',
};

export const TEST_ORDERING_TASK = {
  id: 'task-ord-001',
  type: 'Ordering' as const,
  question: 'Розташуйте етапи розв\'язання рівняння у правильному порядку:',
  items: [
    'Записати рівняння',
    'Перенести відомі члени',
    'Спростити вираз',
    'Знайти невідому',
    'Перевірити відповідь',
  ],
  hints: ['Почніть з запису рівняння'],
  difficulty: 'Hard',
  topicId: 'topic-algebra',
};

export const TEST_TASK_SUBMIT_CORRECT = {
  isCorrect: true,
  correctAnswer: 'x = 5',
  explanation: 'Щоб розв\'язати 2x + 6 = 16, віднімемо 6 від обох сторін: 2x = 10, потім x = 5.',
  xpEarned: 15,
  nextDifficulty: 'Hard',
  currentStreak: 13,
};

export const TEST_TASK_SUBMIT_INCORRECT = {
  isCorrect: false,
  correctAnswer: 'x = 5',
  explanation: 'Щоб розв\'язати 2x + 6 = 16, віднімемо 6 від обох сторін: 2x = 10, потім x = 5.',
  xpEarned: 0,
  nextDifficulty: 'Medium',
  currentStreak: 0,
};

// ─── Leaderboard ─────────────────────────────────────────────────────────────

export const TEST_LEADERBOARD = {
  league: 'Silver',
  weekNumber: 9,
  year: 2026,
  entries: [
    { studentId: 'lb-1', displayName: 'Олена К.', avatarUrl: null, weeklyXp: 950, rank: 1, isCurrentUser: false },
    { studentId: 'lb-2', displayName: 'Максим П.', avatarUrl: null, weeklyXp: 820, rank: 2, isCurrentUser: false },
    { studentId: 'lb-3', displayName: 'Софія В.', avatarUrl: null, weeklyXp: 710, rank: 3, isCurrentUser: false },
    { studentId: 'lb-4', displayName: 'Андрій Б.', avatarUrl: null, weeklyXp: 680, rank: 4, isCurrentUser: false },
    { studentId: 'lb-5', displayName: 'Марія Л.', avatarUrl: null, weeklyXp: 590, rank: 5, isCurrentUser: false },
    { studentId: TEST_STUDENT.id, displayName: TEST_STUDENT.displayName, avatarUrl: null, weeklyXp: 440, rank: 8, isCurrentUser: true },
    { studentId: 'lb-9', displayName: 'Дмитро Р.', avatarUrl: null, weeklyXp: 120, rank: 18, isCurrentUser: false },
    { studentId: 'lb-10', displayName: 'Ірина Т.', avatarUrl: null, weeklyXp: 80, rank: 19, isCurrentUser: false },
  ],
  currentUserRank: 8,
  totalParticipants: 20,
  promotionZone: 5,
  demotionZone: 3,
};

export const TEST_LEADERBOARD_PREVIEW = {
  league: 'Silver',
  topEntries: [
    { studentId: 'lb-1', displayName: 'Олена К.', avatarUrl: null, weeklyXp: 950, rank: 1, isCurrentUser: false },
    { studentId: 'lb-2', displayName: 'Максим П.', avatarUrl: null, weeklyXp: 820, rank: 2, isCurrentUser: false },
    { studentId: 'lb-3', displayName: 'Софія В.', avatarUrl: null, weeklyXp: 710, rank: 3, isCurrentUser: false },
  ],
  currentUserEntry: {
    studentId: TEST_STUDENT.id,
    displayName: TEST_STUDENT.displayName,
    avatarUrl: null,
    weeklyXp: 440,
    rank: 8,
    isCurrentUser: true,
  },
  totalParticipants: 20,
};

// ─── User Profile ────────────────────────────────────────────────────────────

export const TEST_STUDENT_PROFILE = {
  id: TEST_STUDENT.id,
  email: TEST_STUDENT.email,
  displayName: TEST_STUDENT.displayName,
  avatarUrl: null,
  role: 'Student',
  createdAt: TEST_STUDENT.createdAt,
  lastLoginAt: '2026-02-27T08:00:00Z',
  studentStats: {
    totalXp: 2450,
    currentLevel: 8,
    currentStreak: 12,
    longestStreak: 18,
    streakFreezes: 2,
    league: 'Silver',
    totalTasksAttempted: 187,
    achievementsUnlocked: 2,
  },
  teacherStats: null,
};

export const TEST_TEACHER_PROFILE = {
  id: TEST_TEACHER.id,
  email: TEST_TEACHER.email,
  displayName: TEST_TEACHER.displayName,
  avatarUrl: null,
  role: 'Teacher',
  createdAt: TEST_TEACHER.createdAt,
  lastLoginAt: '2026-02-27T08:30:00Z',
  studentStats: null,
  teacherStats: {
    school: 'Тестова школа №1',
    gradesTaught: [7, 8, 9],
    subjectsExpertise: ['Математика', 'Фізика'],
    totalClasses: 3,
    totalStudents: 45,
  },
};

// ─── Teacher Data ────────────────────────────────────────────────────────────

export const TEST_CLASSES = [
  {
    id: 'class-001',
    name: '7-А Математика',
    gradeLevel: 7,
    teacherId: TEST_TEACHER.id,
    joinCode: 'ABC123',
    studentCount: 25,
    assignmentCount: 5,
    averageAccuracy: 72.5,
    createdAt: '2025-09-01T08:00:00Z',
  },
  {
    id: 'class-002',
    name: '8-Б Алгебра',
    gradeLevel: 8,
    teacherId: TEST_TEACHER.id,
    joinCode: 'XYZ789',
    studentCount: 20,
    assignmentCount: 3,
    averageAccuracy: 68.0,
    createdAt: '2025-09-01T08:00:00Z',
  },
];

export const TEST_CLASS_QUICK_STATS = {
  totalClasses: 2,
  totalStudents: 45,
  activeThisWeek: 38,
  averageClassSize: 22.5,
};

export const TEST_CLASS_STUDENTS = [
  {
    id: 'member-001',
    studentId: 'student-001',
    displayName: 'Олена Коваленко',
    avatarUrl: null,
    level: 6,
    accuracy: 85.2,
    tasksCompleted: 120,
    lastActiveAt: '2026-02-27T07:00:00Z',
  },
  {
    id: 'member-002',
    studentId: 'student-002',
    displayName: 'Максим Петренко',
    avatarUrl: null,
    level: 5,
    accuracy: 72.8,
    tasksCompleted: 95,
    lastActiveAt: '2026-02-26T15:00:00Z',
  },
];

export const TEST_CLASS_ANALYTICS = {
  totalStudents: 25,
  activeStudents: 22,
  totalTasksCompleted: 1840,
  averageAccuracy: 72.5,
  topPerformers: [
    { studentId: 'student-001', displayName: 'Олена Коваленко', accuracy: 85.2, tasksCompleted: 120 },
  ],
  strugglingStudents: [
    { studentId: 'student-003', displayName: 'Ігор Мельник', accuracy: 45.0, tasksCompleted: 30 },
  ],
};

export const TEST_ASSIGNMENTS = [
  {
    id: 'assign-001',
    classId: 'class-001',
    title: 'Лінійні рівняння — практика',
    description: 'Розв\'яжіть 10 завдань з лінійних рівнянь',
    subjectName: 'Математика',
    topicName: 'Лінійні рівняння',
    taskCount: 10,
    dueDate: '2026-03-05T23:59:00Z',
    createdAt: '2026-02-25T10:00:00Z',
    status: 'Active',
  },
];

// ─── Student Classes (Learn browse) ─────────────────────────────────────────

export const TEST_STUDENT_CLASSES = [
  {
    id: 'class-001',
    name: '7-А Математика',
    gradeLevel: 7,
    teacherName: 'Тестовий Вчитель',
    subjects: [
      {
        id: 'subj-math',
        name: 'Математика',
        description: 'Алгебра, геометрія та інше',
        iconUrl: null,
        topicCount: 12,
        progress: 45,
      },
    ],
  },
];

// ─── Admin Data ──────────────────────────────────────────────────────────────

export const TEST_ADMIN_DASHBOARD = {
  totalUsers: 1250,
  activeUsersToday: 340,
  activeUsersThisWeek: 890,
  totalStudents: 1100,
  totalTeachers: 140,
  totalAdmins: 10,
  totalTasksAttempted: 48500,
  averageAccuracy: 71.3,
  pendingAIReviews: 23,
};

export const TEST_ADMIN_USERS = {
  users: [
    {
      id: 'user-001',
      displayName: 'Олена Коваленко',
      email: 'olena@test.com',
      role: 'Student',
      createdAt: '2025-09-01T10:00:00Z',
      lastLoginAt: '2026-02-27T07:00:00Z',
      isDeleted: false,
      stats: { totalXp: 3200, currentLevel: 10, totalTasks: 240 },
    },
    {
      id: 'user-002',
      displayName: 'Іван Мельник',
      email: 'ivan@test.com',
      role: 'Teacher',
      createdAt: '2025-08-15T10:00:00Z',
      lastLoginAt: '2026-02-26T15:00:00Z',
      isDeleted: false,
      stats: { totalClasses: 3, totalStudents: 60 },
    },
  ],
  totalCount: 1250,
  page: 1,
  pageSize: 20,
};

export const TEST_REVIEW_QUEUE = {
  items: [
    {
      id: 'tmpl-001',
      subjectName: 'Математика',
      topicName: 'Квадратні рівняння',
      taskType: 'MultipleChoice',
      difficultyBand: 'Medium',
      provider: 'Gemini',
      createdAt: '2026-02-26T12:00:00Z',
      question: 'Яке значення дискримінанта для рівняння x² + 4x + 4 = 0?',
    },
    {
      id: 'tmpl-002',
      subjectName: 'Українська мова',
      topicName: 'Граматика',
      taskType: 'FillBlank',
      difficultyBand: 'Easy',
      provider: 'Gemini',
      createdAt: '2026-02-26T13:00:00Z',
      question: 'Вставте пропущену букву: мол_ко',
    },
  ],
  totalCount: 23,
  page: 1,
  pageSize: 20,
};

// ─── Student Detail (Teacher view) ──────────────────────────────────────────

export const TEST_STUDENT_DETAIL = {
  studentId: 'student-001',
  displayName: 'Олена Коваленко',
  avatarUrl: null,
  overall: {
    accuracy: 85.2,
    tasksCompleted: 120,
    averageResponseTime: 18.5,
  },
  strengths: ['Лінійні рівняння', 'Дроби'],
  weaknesses: ['Квадратні рівняння'],
  topicPerformance: [
    { topicName: 'Лінійні рівняння', accuracy: 95, tasksCompleted: 40, progress: 100 },
    { topicName: 'Квадратні рівняння', accuracy: 60, tasksCompleted: 25, progress: 40 },
  ],
  recentActivity: [
    { date: '2026-02-27T07:00:00Z', topicName: 'Квадратні рівняння', tasksCompleted: 5, accuracy: 60, xpEarned: 45 },
  ],
};

// ─── Task Templates (Teacher review) ────────────────────────────────────────

export const TEST_TASK_TEMPLATES = {
  items: [
    {
      id: 'tmpl-101',
      question: 'Розв\'яжіть рівняння: 3x - 7 = 14',
      taskType: 'FillBlank',
      difficultyBand: 'Medium',
      reviewStatus: 'Pending',
      createdAt: '2026-02-25T10:00:00Z',
    },
    {
      id: 'tmpl-102',
      question: 'Чи вірно, що √4 = 2?',
      taskType: 'TrueFalse',
      difficultyBand: 'Easy',
      reviewStatus: 'Approved',
      createdAt: '2026-02-24T10:00:00Z',
    },
  ],
  totalCount: 50,
  page: 1,
  pageSize: 20,
};

// ─── Notification Events ─────────────────────────────────────────────────────

export const TEST_ACHIEVEMENT_EVENT = {
  achievementId: 'ach-003',
  name: 'Майстер математики',
  description: 'Досягніть 100% освоєння з математики',
  iconUrl: null,
  xpReward: 500,
};

export const TEST_LEVEL_UP_EVENT = {
  newLevel: 9,
  previousLevel: 8,
  totalXp: 3000,
  xpForNextLevel: 600,
  rewardsUnlocked: ['Новий аватар', 'Титул "Знавець"'],
};

// ─── API Base URL ────────────────────────────────────────────────────────────

export const API_BASE = 'http://localhost:5000/api/v1';
