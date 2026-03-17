import { Page, Locator, expect } from '@playwright/test';

export class LayoutPage {
  readonly page: Page;
  // Header
  readonly header: Locator;
  readonly logo: Locator;
  readonly menuToggle: Locator;
  readonly streakCounter: Locator;
  readonly xpMiniBar: Locator;
  readonly notificationBell: Locator;
  readonly avatarMenu: Locator;
  // Sidenav
  readonly sidenav: Locator;
  readonly sidenavItems: Locator;
  // Bottom nav
  readonly bottomNav: Locator;
  readonly bottomNavItems: Locator;

  constructor(page: Page) {
    this.page = page;
    // Header
    this.header = page.locator('mat-toolbar.app-header');
    this.logo = page.locator('.logo-container');
    this.menuToggle = page.locator('button.menu-toggle');
    this.streakCounter = page.locator('.streak-display, .streak-stat').first();
    this.xpMiniBar = page.locator('.xp-mini-bar, .xp-display').first();
    this.notificationBell = page.locator('button').filter({ has: page.locator('mat-icon').filter({ hasText: 'notifications' }) });
    this.avatarMenu = page.locator('.avatar-menu, .user-menu, button.avatar-button').first();
    // Sidenav
    this.sidenav = page.locator('app-sidenav');
    this.sidenavItems = page.locator('app-sidenav a[mat-list-item]');
    // Bottom nav
    this.bottomNav = page.locator('app-bottom-nav, .bottom-nav');
    this.bottomNavItems = page.locator('.bottom-nav-item');
  }

  async expectHeaderVisible(): Promise<void> {
    await expect(this.header).toBeVisible();
  }

  async expectStreakVisible(): Promise<void> {
    await expect(this.streakCounter).toBeVisible();
  }

  async expectSidenavVisible(): Promise<void> {
    await expect(this.sidenav).toBeVisible();
  }

  async expectBottomNavVisible(): Promise<void> {
    await expect(this.bottomNav).toBeVisible();
  }

  async expectBottomNavItemCount(count: number): Promise<void> {
    await expect(this.bottomNavItems).toHaveCount(count);
  }

  async clickSidenavItem(text: string): Promise<void> {
    await this.sidenavItems.filter({ hasText: text }).click();
  }

  async clickBottomNavItem(text: string): Promise<void> {
    await this.bottomNavItems.filter({ hasText: text }).click();
  }

  async openAvatarMenu(): Promise<void> {
    await this.avatarMenu.click();
  }

  async clickLogout(): Promise<void> {
    await this.openAvatarMenu();
    await this.page.locator('button, a').filter({ hasText: /Вихід|Вийти/i }).click();
  }

  async expectActiveNavItem(text: string): Promise<void> {
    await expect(
      this.sidenavItems.filter({ hasText: text }).or(this.bottomNavItems.filter({ hasText: text })),
    ).toHaveClass(/active/);
  }
}
