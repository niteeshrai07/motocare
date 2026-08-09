import { Component, computed } from '@angular/core';
import { RouterOutlet, RouterLink, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink],
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.css'
})
export class AppShellComponent {
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

  onLogout(): void {
    this.auth.logout();
  }

  navigateToNotifications(): void {
    this.router.navigate(['/notifications']);
  }
}
