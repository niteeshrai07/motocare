import { Component, signal, computed, OnInit } from '@angular/core';
import { finalize } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { NotificationService } from '../../core/services/notification.service';
import { Notification, NotificationType } from '../../core/models/notification.model';
import { ButtonComponent } from '../../shared/components/button/button.component';

type ActionType = 'mark-read' | 'mark-all-read' | 'archive' | null;

const NOTIFICATION_ICONS: Record<NotificationType, string> = {
  service_request_submitted: 'clipboard-list',
  quote_received: 'file-text',
  quote_accepted: 'check-circle',
  quote_rejected: 'x-circle',
  service_started: 'wrench',
  service_completed: 'check-check',
  review_received: 'star',
  review_reminder: 'bell',
  shop_verified: 'shield-check',
  shop_rejected: 'shield-x',
  system_notification: 'info',
};

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [ButtonComponent],
  templateUrl: './notifications.page.html',
  styleUrl: './notifications.page.scss',
})
export class NotificationsPageComponent implements OnInit {
  protected readonly notifications = signal<Notification[]>([]);
  protected readonly isLoading = signal<boolean>(true);
  protected readonly serverError = signal<string | null>(null);
  protected readonly successMessage = signal<string | null>(null);
  protected readonly page = signal<number>(1);
  protected readonly totalPages = signal<number>(1);
  protected readonly total = signal<number>(0);
  protected readonly unreadCount = signal<number>(0);
  protected readonly activeTab = signal<'all' | 'unread'>('all');
  protected readonly actionInProgress = signal<ActionType>(null);

  protected readonly isActionLoading = computed(() => {
    return this.actionInProgress() !== null;
  });

  private successTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly notificationService: NotificationService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.loadNotifications();
    this.notificationService.refreshUnreadCount();
  }

  ngOnDestroy(): void {
    if (this.successTimeout) {
      clearTimeout(this.successTimeout);
    }
  }

  protected loadNotifications(): void {
    this.isLoading.set(true);
    this.serverError.set(null);

    const params: {
      page: number;
      limit: number;
      unreadOnly: boolean;
      sort: 'newest' | 'oldest';
    } = {
      page: this.page(),
      limit: 20,
      unreadOnly: this.activeTab() === 'unread',
      sort: 'newest',
    };

    this.notificationService
      .list(params)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.notifications.set(response.data.notifications);
            this.page.set(response.data.pagination.page);
            this.totalPages.set(response.data.pagination.totalPages);
            this.total.set(response.data.pagination.total);
            this.unreadCount.set(response.data.pagination.unreadCount);
          } else if (response.message) {
            this.serverError.set(response.message);
          } else {
            this.serverError.set('Failed to load notifications');
          }
        },
        error: (error: Error) => {
          if (error instanceof HttpErrorResponse) {
            if (error.status === 401) {
              this.serverError.set('Your session has expired. Please log in again.');
            } else if (error.status === 403) {
              this.serverError.set('You do not have permission to view notifications.');
            } else {
              this.serverError.set(error.message || 'Failed to load notifications');
            }
          } else {
            this.serverError.set(error.message || 'Failed to load notifications');
          }
        },
      });
  }

  protected setTab(tab: 'all' | 'unread'): void {
    this.activeTab.set(tab);
    this.page.set(1);
    this.loadNotifications();
  }

  protected nextPage(): void {
    if (this.page() < this.totalPages()) {
      this.page.set(this.page() + 1);
      this.loadNotifications();
    }
  }

  protected prevPage(): void {
    if (this.page() > 1) {
      this.page.set(this.page() - 1);
      this.loadNotifications();
    }
  }

  protected onRowClick(notification: Notification): void {
    if (notification.read) {
      this.navigateForType(notification);
      return;
    }

    this.actionInProgress.set('mark-read');
    this.notificationService.markAsRead(notification.id).subscribe({
      next: (response) => {
        if (response.success) {
          this.updateLocalReadStatus(notification.id, true);
          const newCount = Math.max(0, this.notificationService.unreadCount() - 1);
          this.notificationService.unreadCount.set(newCount);
          this.unreadCount.set(newCount);
        }
      },
      error: () => {
        this.actionInProgress.set(null);
      },
      complete: () => {
        this.actionInProgress.set(null);
        this.navigateForType(notification);
      },
    });
  }

  protected markAllRead(): void {
    if (this.isActionLoading()) {
      return;
    }

    this.actionInProgress.set('mark-all-read');
    this.notificationService.markAllAsRead().subscribe({
      next: (response) => {
        if (response.success) {
          this.notifications.update((items) =>
            items.map((n) => ({ ...n, read: true })),
          );
          this.unreadCount.set(0);
          this.notificationService.unreadCount.set(0);
          this.setSuccessMessage(response.message || 'All notifications marked as read');
        }
      },
      error: (error: Error) => {
        if (error instanceof HttpErrorResponse) {
          this.serverError.set(error.message || 'Failed to mark all notifications as read');
        } else {
          this.serverError.set(error.message || 'Failed to mark all notifications as read');
        }
      },
      complete: () => {
        this.actionInProgress.set(null);
      },
    });
  }

  protected archive(notification: Notification, event: Event): void {
    event.stopPropagation();

    if (this.isActionLoading()) {
      return;
    }

    this.actionInProgress.set('archive');
    this.notificationService.archive(notification.id).subscribe({
      next: (response) => {
        if (response.success) {
          this.notifications.update((items) =>
            items.filter((n) => n.id !== notification.id),
          );
          this.total.set(Math.max(0, this.total() - 1));

          if (!notification.read) {
            this.unreadCount.set(Math.max(0, this.unreadCount() - 1));
            this.notificationService.unreadCount.set(
              Math.max(0, this.notificationService.unreadCount() - 1),
            );
          }

          this.setSuccessMessage(response.message || 'Notification archived');
        }
      },
      error: (error: Error) => {
        if (error instanceof HttpErrorResponse) {
          this.serverError.set(error.message || 'Failed to archive notification');
        } else {
          this.serverError.set(error.message || 'Failed to archive notification');
        }
      },
      complete: () => {
        this.actionInProgress.set(null);
      },
    });
  }

  protected navigateForType(notification: Notification): void {
    if (notification.resourceType === 'service-request' && notification.resourceId) {
      this.router.navigate(['/service-requests', notification.resourceId]);
    } else if (notification.resourceType === 'repair-shop') {
      this.router.navigate(['/repair-shop']);
    }
  }

  protected getNotificationIcon(type: NotificationType): string {
    return NOTIFICATION_ICONS[type] ?? 'bell';
  }

  protected formatRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays}d ago`;
    }
    if (diffHours > 0) {
      return `${diffHours}h ago`;
    }
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    if (diffMinutes > 0) {
      return `${diffMinutes}m ago`;
    }
    return 'Just now';
  }

  private updateLocalReadStatus(id: string, read: boolean): void {
    this.notifications.update((items) =>
      items.map((n) => (n.id === id ? { ...n, read } : n)),
    );
  }

  private setSuccessMessage(message: string): void {
    this.successMessage.set(message);
    if (this.successTimeout) {
      clearTimeout(this.successTimeout);
    }
    this.successTimeout = setTimeout(() => {
      this.successMessage.set(null);
      this.successTimeout = null;
    }, 3000);
  }
}
