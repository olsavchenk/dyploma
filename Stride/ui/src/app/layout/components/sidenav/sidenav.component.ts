import { Component, inject, computed } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/services/auth.service';
import { NavItem } from '../../models';

@Component({
  selector: 'app-sidenav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, MatIconModule],
  templateUrl: './sidenav.component.html',
  styleUrl: './sidenav.component.scss',
})
export class SidenavComponent {
  private readonly authService = inject(AuthService);

  protected readonly isAuthenticated = this.authService.isAuthenticated;
  protected readonly userRole = this.authService.userRole;

  protected readonly navItems = computed<NavItem[]>(() => {
    const role = this.userRole();

    if (role === 'Admin') {
      return [
        { label: 'Головна',       icon: 'dashboard',           route: '/dashboard' },
        { label: 'Користувачі',   icon: 'group',               route: '/admin/users' },
        { label: 'Контент',       icon: 'menu_book',           route: '/admin/subjects' },
        { label: 'AI-перевірка',  icon: 'smart_toy',           route: '/admin/ai-review' },
        { label: 'Система',       icon: 'admin_panel_settings', route: '/admin' },
      ];
    }

    if (role === 'Teacher') {
      return [
        { label: 'Головна',     icon: 'dashboard',  route: '/dashboard' },
        { label: 'Класи',       icon: 'class',      route: '/teacher/classes' },
        { label: 'Аналітика',   icon: 'bar_chart',  route: '/teacher/analytics' },
        { label: 'Перевірка',   icon: 'task_alt',   route: '/teacher/task-review' },
        { label: 'Профіль',     icon: 'person',     route: '/profile' },
      ];
    }

    // Student (default)
    return [
      { label: 'Головна',     icon: 'dashboard',         route: '/dashboard' },
      { label: 'Навчання',    icon: 'school',             route: '/learn' },
      { label: 'Рейтинг',    icon: 'leaderboard',        route: '/leaderboard' },
      { label: 'Досягнення',  icon: 'emoji_events',       route: '/profile', roles: ['Student'] },
      { label: 'Профіль',     icon: 'person',             route: '/profile' },
    ];
  });

  protected shouldShowItem(item: NavItem): boolean {
    const role = this.userRole();
    if (!item.roles || item.roles.length === 0) return true;
    return role !== null && item.roles.includes(role);
  }
}
