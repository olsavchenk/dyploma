import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { AdminService, AdminDashboard } from '@app/core';
import { LoggingService } from '@app/core/services/logging.service';

interface KpiCard {
  title: string;
  value: number | string;
  icon: string;
  iconColor: string;
  trend?: string;
  trendLabel?: string;
}

interface QuickLink {
  title: string;
  description: string;
  icon: string;
  route: string;
  color: string;
}

interface ActivityItem {
  icon: string;
  iconColor: string;
  title: string;
  description: string;
  timestamp: string;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatDividerModule,
  ],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss',
})
export class AdminDashboardComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly logger = inject(LoggingService);

  // State
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly dashboard = signal<AdminDashboard | null>(null);

  // KPI Cards
  protected readonly kpiCards = signal<KpiCard[]>([]);

  // Activity Feed
  protected readonly recentActivity = signal<ActivityItem[]>([]);

  // Quick Links
  protected readonly quickLinks: QuickLink[] = [
    {
      title: 'Перегляд завдань AI',
      description: 'Перевірка та затвердження згенерованих завдань',
      icon: 'psychology',
      route: '/admin/ai-review',
      color: 'primary',
    },
    {
      title: 'Управління користувачами',
      description: 'Перегляд та редагування користувачів',
      icon: 'group',
      route: '/admin/users',
      color: 'accent',
    },
  ];

  ngOnInit(): void {
    this.loadDashboard();
  }

  private loadDashboard(): void {
    this.loading.set(true);
    this.error.set(null);

    this.adminService.getDashboardAnalytics().subscribe({
      next: (data) => {
        this.dashboard.set(data);
        this.buildKpiCards(data);
        this.buildRecentActivity(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.logger.error('AdminDashboardComponent', 'Failed to load dashboard', {}, err);
        this.error.set('Не вдалося завантажити дані панелі адміністратора');
        this.loading.set(false);
      },
    });
  }

  private buildKpiCards(data: AdminDashboard): void {
    const cards: KpiCard[] = [
      {
        title: 'Всього користувачів',
        value: data.totalUsers.toLocaleString('uk-UA'),
        icon: 'people',
        iconColor: '#1976d2',
      },
      {
        title: 'Активні сьогодні',
        value: data.activeUsersToday.toLocaleString('uk-UA'),
        icon: 'trending_up',
        iconColor: '#4caf50',
      },
      {
        title: 'Активні за тиждень',
        value: data.activeUsersThisWeek.toLocaleString('uk-UA'),
        icon: 'event',
        iconColor: '#ff9800',
      },
      {
        title: 'Студенти',
        value: data.totalStudents.toLocaleString('uk-UA'),
        icon: 'school',
        iconColor: '#2196f3',
      },
      {
        title: 'Вчителі',
        value: data.totalTeachers.toLocaleString('uk-UA'),
        icon: 'person',
        iconColor: '#9c27b0',
      },
      {
        title: 'Адміністратори',
        value: data.totalAdmins.toLocaleString('uk-UA'),
        icon: 'admin_panel_settings',
        iconColor: '#f44336',
      },
      {
        title: 'Виконано завдань',
        value: data.totalTasksAttempted.toLocaleString('uk-UA'),
        icon: 'assignment_turned_in',
        iconColor: '#00bcd4',
      },
      {
        title: 'Середня точність',
        value: `${data.averageAccuracy.toFixed(1)}%`,
        icon: 'percent',
        iconColor: '#4caf50',
      },
      {
        title: 'На перевірці AI',
        value: data.pendingAIReviews.toLocaleString('uk-UA'),
        icon: 'pending_actions',
        iconColor: '#ff9800',
      },
    ];

    this.kpiCards.set(cards);
  }

  private buildRecentActivity(data: AdminDashboard): void {
    const now = new Date();
    const activities: ActivityItem[] = [];

    // Sample recent activity based on metrics
    if (data.activeUsersToday > 0) {
      activities.push({
        icon: 'person_add',
        iconColor: '#4caf50',
        title: 'Нові активні користувачі',
        description: `${data.activeUsersToday} користувачів активні сьогодні`,
        timestamp: this.getRelativeTime(now),
      });
    }

    if (data.pendingAIReviews > 0) {
      activities.push({
        icon: 'pending_actions',
        iconColor: '#ff9800',
        title: 'Очікують перевірки',
        description: `${data.pendingAIReviews} AI завдань потребують перевірки`,
        timestamp: this.getRelativeTime(now),
      });
    }

    if (data.totalTasksAttempted > 0) {
      activities.push({
        icon: 'assignment_turned_in',
        iconColor: '#2196f3',
        title: 'Виконано завдань',
        description: `Загалом виконано ${data.totalTasksAttempted.toLocaleString('uk-UA')} завдань`,
        timestamp: this.getRelativeTime(now),
      });
    }

    if (data.averageAccuracy > 0) {
      activities.push({
        icon: 'insights',
        iconColor: '#9c27b0',
        title: 'Статистика навчання',
        description: `Середня точність: ${data.averageAccuracy.toFixed(1)}%`,
        timestamp: this.getRelativeTime(now),
      });
    }

    this.recentActivity.set(activities);
  }

  private getRelativeTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Щойно';
    if (diffMins < 60) return `${diffMins} хв тому`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} год тому`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} дн тому`;
  }

  protected onRefresh(): void {
    this.loadDashboard();
  }

  protected formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('uk-UA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
