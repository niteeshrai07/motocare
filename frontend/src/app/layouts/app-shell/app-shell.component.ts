import { Component, computed, signal } from '@angular/core';
import { RouterOutlet, RouterLink, Router } from '@angular/router';
import { TitleCasePipe } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, TitleCasePipe],
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.css'
})
export class AppShellComponent {

  /** Mobile sidebar open/closed state (UI-only, no business logic) */
  protected readonly sidebarOpen = signal<boolean>(false);

  constructor(
    private readonly auth: AuthService,
    private readonly notificationService: NotificationService,
    private readonly router: Router,
  ) {}

  protected readonly isMechanic = computed(() => {
    return this.auth.user()?.role === 'mechanic';
  });

  protected readonly isAdmin = computed(() => {
    return this.auth.user()?.role === 'admin';
  });

  protected readonly unreadCount = computed(() => {
    return this.notificationService.unreadCount();
  });

  /** Returns the first letter of the current user's name, or '?' */
  protected readonly userInitial = computed(() => {
    const name = this.auth.user()?.name;
    return name ? name.charAt(0).toUpperCase() : '?';
  });

  protected readonly userName = computed(() => {
    return this.auth.user()?.name ?? '';
  });

  protected readonly userRole = computed(() => {
    return this.auth.user()?.role ?? '';
  });

  toggleSidebar(): void {
    this.sidebarOpen.update(v => !v);
  }

  closeSidebar(): void {
    this.sidebarOpen.set(false);
  }

  onLogout(): void {
    this.auth.logout();
  }

  navigateToNotifications(): void {
    this.router.navigate(['/notifications']);
  }
}
