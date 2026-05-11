import { Component, inject, computed } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../../core/services/auth.service';
import { NavItem } from '../../models';

@Component({
  selector: 'app-sidenav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, MatIconModule, TranslateModule],
  templateUrl: './sidenav.component.html',
  styleUrl: './sidenav.component.scss',
})
export class SidenavComponent {
  private readonly authService = inject(AuthService);

  protected readonly isAuthenticated = this.authService.isAuthenticated;
  protected readonly userRole = this.authService.userRole;

  /**
   * Nav items. `label` now holds an i18n key — the template runs it through the
   * translate pipe. Keep the routes/icons as-is so behaviour does not change.
   */
  protected readonly navItems = computed<NavItem[]>(() => {
    const role = this.userRole();

    if (role === 'Admin') {
      return [
        { label: 'layout.sidenav.dashboard', icon: 'dashboard',            route: '/dashboard' },
        { label: 'layout.sidenav.users',     icon: 'group',                route: '/admin/users' },
        { label: 'layout.sidenav.content',   icon: 'menu_book',            route: '/admin/subjects' },
        { label: 'layout.sidenav.aiReview',  icon: 'smart_toy',            route: '/admin/ai-review' },
        { label: 'layout.sidenav.system',    icon: 'admin_panel_settings', route: '/admin' },
      ];
    }

    if (role === 'Teacher') {
      return [
        { label: 'layout.sidenav.dashboard', icon: 'dashboard', route: '/dashboard' },
        { label: 'layout.sidenav.classes',   icon: 'class',     route: '/teacher/classes' },
        { label: 'layout.sidenav.analytics', icon: 'bar_chart', route: '/teacher/dashboard' },
        { label: 'layout.sidenav.review',    icon: 'task_alt',  route: '/teacher/dashboard' },
        { label: 'layout.sidenav.profile',   icon: 'person',    route: '/profile' },
      ];
    }

    // Student (default)
    return [
      { label: 'layout.sidenav.dashboard',    icon: 'dashboard',    route: '/dashboard' },
      { label: 'layout.sidenav.learn',        icon: 'school',       route: '/learn' },
      { label: 'layout.sidenav.leaderboard',  icon: 'leaderboard',  route: '/leaderboard' },
      { label: 'layout.sidenav.achievements', icon: 'emoji_events', route: '/profile', roles: ['Student'] },
      { label: 'layout.sidenav.profile',      icon: 'person',       route: '/profile' },
    ];
  });

  protected shouldShowItem(item: NavItem): boolean {
    const role = this.userRole();
    if (!item.roles || item.roles.length === 0) return true;
    return role !== null && item.roles.includes(role);
  }
}
