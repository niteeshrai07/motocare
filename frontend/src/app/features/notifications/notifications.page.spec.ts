import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError, NEVER } from 'rxjs';
import { vi } from 'vitest';
import { signal } from '@angular/core';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { NotificationsPageComponent } from './notifications.page';
import { NotificationService } from '../../core/services/notification.service';
import { Notification, NotificationType } from '../../core/models/notification.model';
import { ApiResponse } from '../../core/models/api-response.model';

describe('NotificationsPageComponent', () => {
  let fixture: ComponentFixture<NotificationsPageComponent>;
  let component: NotificationsPageComponent;

  const unreadCountSignal = signal(0);

  const notificationService = {
    list: vi.fn(),
    getById: vi.fn(),
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
    archive: vi.fn(),
    refreshUnreadCount: vi.fn(),
    unreadCount: unreadCountSignal,
  };

  const router = {
    navigate: vi.fn(),
  };

  const mockNotification: Notification = {
    id: 'notif-1',
    type: 'quote_received',
    title: 'New Quote Received',
    message: 'A mechanic has quoted on your service request',
    resourceType: 'service-request',
    resourceId: 'req-123',
    metadata: { shopId: 'shop-1' },
    read: false,
    archived: false,
    createdAt: '2025-01-01T10:00:00.000Z',
    updatedAt: '2025-01-01T10:00:00.000Z',
  };

  const mockListResponse: ApiResponse<{
    notifications: Notification[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      unreadCount: number;
    };
  }> = {
    success: true,
    message: 'Notifications fetched successfully',
    data: {
      notifications: [mockNotification],
      pagination: {
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
        unreadCount: 1,
      },
    },
    errors: null,
  };

  const mockEmptyResponse: ApiResponse<{
    notifications: Notification[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      unreadCount: number;
    };
  }> = {
    success: true,
    message: 'Notifications fetched successfully',
    data: {
      notifications: [],
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
        unreadCount: 0,
      },
    },
    errors: null,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotificationsPageComponent],
      providers: [
        { provide: NotificationService, useValue: notificationService },
        { provide: Router, useValue: router },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NotificationsPageComponent);
    component = fixture.componentInstance;
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('Initialization', () => {
    it('should create', () => {
      notificationService.list.mockReturnValue(of(mockListResponse));
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('should start in loading state', () => {
      notificationService.list.mockReturnValue(of(mockListResponse));
      const c = component as any;
      expect(c.isLoading()).toBe(true);
    });

    it('should call loadNotifications on init', () => {
      notificationService.list.mockReturnValue(of(mockListResponse));
      fixture.detectChanges();
      expect(notificationService.list).toHaveBeenCalled();
    });

    it('should call refreshUnreadCount on init', () => {
      notificationService.list.mockReturnValue(of(mockListResponse));
      fixture.detectChanges();
      expect(notificationService.refreshUnreadCount).toHaveBeenCalled();
    });
  });

  describe('Loading', () => {
    it('should show skeleton rows while loading', () => {
      notificationService.list.mockReturnValue(NEVER as any);
      fixture.detectChanges();
      const compiled = fixture.nativeElement;
      expect(compiled.querySelectorAll('.nt-row--skeleton').length).toBe(3);
    });
  });

  describe('Empty state', () => {
    it('should show empty state when no notifications', () => {
      notificationService.list.mockReturnValue(of(mockEmptyResponse));
      fixture.detectChanges();
      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('No notifications');
    });
  });

  describe('Error handling', () => {
    it('should show server error on load failure', () => {
      notificationService.list.mockReturnValue(
        throwError(() => new HttpErrorResponse({ status: 500, statusText: 'Server Error' }))
      );
      fixture.detectChanges();
      const c = component as any;
      expect(c.serverError()).toBeTruthy();
    });

    it('should show auth error on 401', () => {
      notificationService.list.mockReturnValue(
        throwError(() => new HttpErrorResponse({ status: 401 }))
      );
      fixture.detectChanges();
      const c = component as any;
      expect(c.serverError()).toContain('session has expired');
    });

    it('should show permission error on 403', () => {
      notificationService.list.mockReturnValue(
        throwError(() => new HttpErrorResponse({ status: 403 }))
      );
      fixture.detectChanges();
      const c = component as any;
      expect(c.serverError()).toContain('permission');
    });
  });

  describe('Tabs', () => {
    it('should start with all tab active', () => {
      notificationService.list.mockReturnValue(of(mockListResponse));
      fixture.detectChanges();
      const c = component as any;
      expect(c.activeTab()).toBe('all');
    });

    it('should switch to unread tab', () => {
      notificationService.list.mockReturnValue(of(mockListResponse));
      fixture.detectChanges();
      const c = component as any;
      c.setTab('unread');
      expect(c.activeTab()).toBe('unread');
      expect(notificationService.list).toHaveBeenCalledWith(
        expect.objectContaining({ unreadOnly: true }),
      );
    });

    it('should reset page when switching tabs', () => {
      notificationService.list.mockReturnValue(of(mockListResponse));
      fixture.detectChanges();
      const c = component as any;
      c.page.set(2);
      c.setTab('unread');
      expect(c.page()).toBe(1);
    });
  });

  describe('Pagination', () => {
    it('should show pagination when totalPages > 1', () => {
      const multiPageResponse = {
        ...mockListResponse,
        data: {
          notifications: [mockNotification],
          pagination: {
            page: 1,
            limit: 20,
            total: 40,
            totalPages: 2,
            unreadCount: 1,
          },
        },
      };
      notificationService.list.mockReturnValue(of(multiPageResponse));
      fixture.detectChanges();
      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('.nt-pagination')).not.toBeNull();
    });

    it('should hide pagination when totalPages <= 1', () => {
      notificationService.list.mockReturnValue(of(mockListResponse));
      fixture.detectChanges();
      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('.nt-pagination')).toBeNull();
    });

    it('should go to next page', () => {
      const multiPageResponse = {
        ...mockListResponse,
        data: {
          notifications: [mockNotification],
          pagination: {
            page: 1,
            limit: 20,
            total: 40,
            totalPages: 2,
            unreadCount: 1,
          },
        },
      };
      const page2Response = {
        ...mockListResponse,
        data: {
          notifications: [{ ...mockNotification, id: 'notif-2' }],
          pagination: {
            page: 2,
            limit: 20,
            total: 40,
            totalPages: 2,
            unreadCount: 1,
          },
        },
      };
      notificationService.list.mockReturnValueOnce(of(multiPageResponse)).mockReturnValueOnce(of(page2Response));
      fixture.detectChanges();
      const c = component as any;
      c.nextPage();
      expect(c.page()).toBe(2);
      expect(notificationService.list).toHaveBeenCalledTimes(2);
    });

    it('should go to previous page', () => {
      const page2Response = {
        ...mockListResponse,
        data: {
          notifications: [mockNotification],
          pagination: {
            page: 2,
            limit: 20,
            total: 40,
            totalPages: 2,
            unreadCount: 1,
          },
        },
      };
      const page1Response = {
        ...mockListResponse,
        data: {
          notifications: [{ ...mockNotification, id: 'notif-1' }],
          pagination: {
            page: 1,
            limit: 20,
            total: 40,
            totalPages: 2,
            unreadCount: 1,
          },
        },
      };
      notificationService.list.mockReturnValueOnce(of(page2Response)).mockReturnValueOnce(of(page1Response));
      fixture.detectChanges();
      const c = component as any;
      c.prevPage();
      expect(c.page()).toBe(1);
      expect(notificationService.list).toHaveBeenCalledTimes(2);
    });
  });

  describe('Mark as read', () => {
    it('should mark single notification as read on row click', () => {
      notificationService.list.mockReturnValue(of(mockListResponse));
      notificationService.markAsRead.mockReturnValue(
        of({
          success: true,
          message: 'Notification marked as read',
          data: {
            notification: { ...mockNotification, read: true },
          },
          errors: null,
        })
      );
      fixture.detectChanges();

      const c = component as any;
      c.onRowClick(mockNotification);

      expect(notificationService.markAsRead).toHaveBeenCalledWith('notif-1');
      expect(c.notifications()[0].read).toBe(true);
    });

    it('should update unread count after marking as read', () => {
      notificationService.list.mockReturnValue(of(mockListResponse));
      notificationService.markAsRead.mockReturnValue(
        of({
          success: true,
          message: 'Notification marked as read',
          data: {
            notification: { ...mockNotification, read: true },
          },
          errors: null,
        })
      );
      fixture.detectChanges();

      const c = component as any;
      c.onRowClick(mockNotification);

      expect(c.unreadCount()).toBe(0);
    });

    it('should navigate after marking as read', () => {
      notificationService.list.mockReturnValue(of(mockListResponse));
      notificationService.markAsRead.mockReturnValue(
        of({
          success: true,
          message: 'Notification marked as read',
          data: {
            notification: { ...mockNotification, read: true },
          },
          errors: null,
        })
      );
      fixture.detectChanges();

      const c = component as any;
      c.onRowClick(mockNotification);

      expect(router.navigate).toHaveBeenCalledWith(['/service-requests', 'req-123']);
    });

    it('should navigate immediately if already read', () => {
      const readNotification = { ...mockNotification, read: true };
      notificationService.list.mockReturnValue(
        of({
          ...mockListResponse,
          data: {
            notifications: [readNotification],
            pagination: mockListResponse.data!.pagination,
          },
        })
      );
      fixture.detectChanges();

      const c = component as any;
      c.onRowClick(readNotification);

      expect(notificationService.markAsRead).not.toHaveBeenCalled();
      expect(router.navigate).toHaveBeenCalledWith(['/service-requests', 'req-123']);
    });
  });

  describe('Mark all read', () => {
    it('should mark all notifications as read', () => {
      notificationService.list.mockReturnValue(of(mockListResponse));
      notificationService.markAllAsRead.mockReturnValue(
        of({
          success: true,
          message: 'All notifications marked as read',
          data: { updatedCount: 1 },
          errors: null,
        })
      );
      fixture.detectChanges();

      const c = component as any;
      c.markAllRead();

      expect(notificationService.markAllAsRead).toHaveBeenCalled();
      expect(c.notifications()[0].read).toBe(true);
      expect(c.unreadCount()).toBe(0);
    });

    it('should not mark all read while action in progress', () => {
      notificationService.list.mockReturnValue(of(mockListResponse));
      notificationService.markAllAsRead.mockReturnValue(
        of({
          success: true,
          message: 'All notifications marked as read',
          data: { updatedCount: 1 },
          errors: null,
        })
      );
      fixture.detectChanges();

      const c = component as any;
      c.actionInProgress.set('mark-all-read');
      c.markAllRead();
      expect(notificationService.markAllAsRead).not.toHaveBeenCalled();
    });
  });

  describe('Archive', () => {
    it('should archive notification and remove from list', () => {
      notificationService.list.mockReturnValue(of(mockListResponse));
      notificationService.archive.mockReturnValue(
        of({
          success: true,
          message: 'Notification archived',
          data: null,
          errors: null,
        })
      );
      fixture.detectChanges();

      const c = component as any;
      const event = { stopPropagation: () => {} } as Event;
      c.archive(mockNotification, event);

      expect(notificationService.archive).toHaveBeenCalledWith('notif-1');
      expect(c.notifications().length).toBe(0);
    });

    it('should update unread count when archiving unread notification', () => {
      notificationService.list.mockReturnValue(of(mockListResponse));
      notificationService.archive.mockReturnValue(
        of({
          success: true,
          message: 'Notification archived',
          data: null,
          errors: null,
        })
      );
      fixture.detectChanges();

      const c = component as any;
      const event = { stopPropagation: () => {} } as Event;
      c.archive(mockNotification, event);

      expect(c.unreadCount()).toBe(0);
    });

    it('should not change unread count when archiving read notification', () => {
      const readNotification = { ...mockNotification, read: true };
      notificationService.list.mockReturnValue(
         of({
          ...mockListResponse,
          data: {
            notifications: [readNotification],
            pagination: {
              ...mockListResponse.data!.pagination,
              unreadCount: 0,
            },
          },
        })
      );
      fixture.detectChanges();

      const c = component as any;
      const event = { stopPropagation: () => {} } as Event;
      c.archive(readNotification, event);

      expect(c.unreadCount()).toBe(0);
    });

    it('should stop propagation on archive click', () => {
      notificationService.list.mockReturnValue(of(mockListResponse));
      notificationService.archive.mockReturnValue(
        of({
          success: true,
          message: 'Notification archived',
          data: null,
          errors: null,
        })
      );
      fixture.detectChanges();

      const c = component as any;
      const event = { stopPropagation: vi.fn() } as unknown as Event;
      c.archive(mockNotification, event);
      expect(event.stopPropagation).toHaveBeenCalled();
    });
  });

  describe('Navigation', () => {
    it('should navigate to service-request for service-request resourceType', () => {
      notificationService.list.mockReturnValue(of(mockListResponse));
      fixture.detectChanges();

      const c = component as any;
      c.navigateForType(mockNotification);
      expect(router.navigate).toHaveBeenCalledWith(['/service-requests', 'req-123']);
    });

    it('should navigate to repair-shop for repair-shop resourceType', () => {
      const shopNotification = {
        ...mockNotification,
        resourceType: 'repair-shop',
        resourceId: 'shop-1',
      };
      notificationService.list.mockReturnValue(
        of({
          ...mockListResponse,
          data: {
            notifications: [shopNotification],
            pagination: mockListResponse.data!.pagination,
          },
        })
      );
      fixture.detectChanges();

      const c = component as any;
      c.navigateForType(shopNotification);
      expect(router.navigate).toHaveBeenCalledWith(['/repair-shop']);
    });

    it('should not navigate for review resourceType', () => {
      const reviewNotification = {
        ...mockNotification,
        resourceType: 'review',
        resourceId: 'review-1',
      };
      notificationService.list.mockReturnValue(
        of({
          ...mockListResponse,
          data: {
            notifications: [reviewNotification],
            pagination: mockListResponse.data!.pagination,
          },
        })
      );
      fixture.detectChanges();

      const c = component as any;
      c.navigateForType(reviewNotification);
      expect(router.navigate).not.toHaveBeenCalled();
    });
  });

  describe('Unknown notification type', () => {
    it('should return bell icon for unknown type', () => {
      notificationService.list.mockReturnValue(of(mockListResponse));
      fixture.detectChanges();
      const c = component as any;
      const unknownType = 'unknown_type' as NotificationType;
      expect(c.getNotificationIcon(unknownType)).toBe('bell');
    });
  });

  describe('Time formatting', () => {
    it('should format relative time correctly', () => {
      notificationService.list.mockReturnValue(of(mockListResponse));
      fixture.detectChanges();
      const c = component as any;
      const now = new Date();
      const recent = new Date(now.getTime() - 30 * 1000).toISOString();
      expect(c.formatRelativeTime(recent)).toBe('Just now');
    });
  });
});
