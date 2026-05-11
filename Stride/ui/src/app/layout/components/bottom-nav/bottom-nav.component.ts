import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../../core/services/auth.service';
import { NavItem } from '../../models';

@Component({
  selector: 'app-bottom-nav',
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    MatButtonModule,
    MatIconModule,
    MatBadgeModule,
    TranslateModule,
  ],
  templateUrl: './bottom-nav.component.html',
  styleUrl: './bottom-nav.component.scss',
})
export class BottomNavComponent {
  private readonly authService = inject(AuthService);
  protected readonly router = inject(Router);

  protected readonly isAuthenticated = this.authService.isAuthenticated;
  protected readonly userRole = this.authService.userRole;

  // Bottom navigation items (mobile-friendly subset). Labels are i18n keys.
  protected readonly navItems = computed<NavItem[]>(() => {
    const role = this.userRole();
    const baseItems: NavItem[] = [
      { label: 'layout.sidenav.dashboard',   icon: 'home',        route: '/dashboard' },
      { label: 'layout.sidenav.learn',       icon: 'school',      route: '/learn' },
      { label: 'layout.sidenav.leaderboard', icon: 'leaderboard', route: '/leaderboard' },
      { label: 'layout.sidenav.profile',     icon: 'person',      route: '/profile' },
    ];

    // Teacher gets "Classes" instead of "Profile" on mobile for quick access
    if (role === 'Teacher') {
      return [
        baseItems[0], // Home
        baseItems[1], // Learn
        { label: 'layout.sidenav.classes', icon: 'class', route: '/teacher/classes' },
        baseItems[3], // Profile
      ];
    }

    return baseItems;
  });

  protected isRouteActive(route: string): boolean {
    return this.router.url === route || this.router.url.startsWith(route + '/');
  }
}
