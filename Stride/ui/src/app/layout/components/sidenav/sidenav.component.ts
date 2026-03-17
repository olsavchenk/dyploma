import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../../../core/services/auth.service';
import { NavItem } from '../../models';

@Component({
  selector: 'app-sidenav',
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    MatListModule,
    MatIconModule,
    MatBadgeModule,
    MatTooltipModule,
  ],
  templateUrl: './sidenav.component.html',
  styleUrl: './sidenav.component.scss',
})
export class SidenavComponent {
  private readonly authService = inject(AuthService);

  protected readonly isAuthenticated = this.authService.isAuthenticated;
  protected readonly userRole = this.authService.userRole;

  // Navigation items based on role
  protected readonly navItems = computed<NavItem[]>(() => {
    const role = this.userRole();
    const baseItems: NavItem[] = [
      { label: 'Головна', icon: 'home', route: '/dashboard' },
      { label: 'Навчання', icon: 'school', route: '/learn' },
      { label: 'Рейтинг', icon: 'leaderboard', route: '/leaderboard' },
      { label: 'Профіль', icon: 'person', route: '/profile' },
    ];

    const teacherItems: NavItem[] = [
      { label: 'Класи', icon: 'class', route: '/teacher/classes', roles: ['Teacher'] },
    ];

    const adminItems: NavItem[] = [
      { label: 'Адмін-панель', icon: 'admin_panel_settings', route: '/admin', roles: ['Admin'] },
    ];

    let items = [...baseItems];

    if (role === 'Teacher') {
      items = [...baseItems, ...teacherItems];
    } else if (role === 'Admin') {
      items = [...baseItems, ...teacherItems, ...adminItems];
    }

    return items;
  });

  protected shouldShowItem(item: NavItem): boolean {
    const currentRole = this.userRole();
    if (!item.roles || item.roles.length === 0) {
      return true;
    }
    return currentRole !== null && item.roles.includes(currentRole);
  }
}
