import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { AdminUsersPageComponent } from './admin-users.page';
import { AdminService } from '../../core/services/admin.service';
import { AuthService } from '../../core/services/auth.service';
import { ApiResponse } from '../../core/models/api-response.model';
import { AdminUserListItem } from '../../core/models/admin.model';

describe('AdminUsersPageComponent', () => {
  let fixture: ComponentFixture<AdminUsersPageComponent>;
  let component: AdminUsersPageComponent;

  const adminService = {
    getAllUsers: vi.fn(),
    activateUser: vi.fn(),
    deactivateUser: vi.fn(),
  };

  const authService = {
    user: vi.fn(),
  };

  const mockActiveUser: AdminUserListItem = {
    id: 'user-1',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '123-456-7890',
    role: 'customer',
    isActive: true,
    createdAt: '2025-01-01T10:00:00.000Z',
    updatedAt: '2025-01-01T10:00:00.000Z',
  };

  const mockInactiveUser: AdminUserListItem = {
    ...mockActiveUser,
    id: 'user-2',
    name: 'Jane Smith',
    isActive: false,
  };

  const mockCurrentAdmin: AdminUserListItem = {
    ...mockActiveUser,
    id: 'admin-1',
    name: 'Current Admin',
    role: 'admin',
  };

  const mockListResponse: ApiResponse<{
    users: AdminUserListItem[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> = {
    success: true,
    message: 'Users fetched successfully',
    data: {
      users: [mockActiveUser],
      pagination: {
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
      },
    },
    errors: null,
  };

  const mockEmptyResponse: ApiResponse<{
    users: AdminUserListItem[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> = {
    success: true,
    message: 'Users fetched successfully',
    data: {
      users: [],
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
      },
    },
    errors: null,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminUsersPageComponent],
      providers: [
        { provide: AdminService, useValue: adminService },
        { provide: AuthService, useValue: authService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminUsersPageComponent);
    component = fixture.componentInstance;
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  describe('Initialization', () => {
    it('should create', () => {
      adminService.getAllUsers.mockReturnValue(of(mockListResponse));
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('should start in loading state', () => {
      adminService.getAllUsers.mockReturnValue(of(mockListResponse));
      fixture.detectChanges();
      expect(component.isLoading()).toBe(true);
    });

    it('should call getAllUsers on init', () => {
      adminService.getAllUsers.mockReturnValue(of(mockListResponse));
      fixture.detectChanges();
      expect(adminService.getAllUsers).toHaveBeenCalledWith({
        page: 1,
        limit: 20,
        sort: 'newest',
      });
    });
  });

  describe('Loading', () => {
    it('should show spinner while loading', () => {
      adminService.getAllUsers.mockReturnValue(of(mockListResponse));
      fixture.detectChanges();
      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('app-spinner')).not.toBeNull();
    });
  });

  describe('Successful load', () => {
    it('should render users', () => {
      adminService.getAllUsers.mockReturnValue(of(mockListResponse));
      fixture.detectChanges();
      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('John Doe');
    });

    it('should render user details', () => {
      adminService.getAllUsers.mockReturnValue(of(mockListResponse));
      fixture.detectChanges();
      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('john@example.com');
      expect(compiled.textContent).toContain('123-456-7890');
    });

    it('should render role badge', () => {
      adminService.getAllUsers.mockReturnValue(of(mockListResponse));
      fixture.detectChanges();
      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('customer');
    });

    it('should render CardComponent', () => {
      adminService.getAllUsers.mockReturnValue(of(mockListResponse));
      fixture.detectChanges();
      const compiled = fixture.nativeElement;
      expect(compiled.querySelectorAll('app-card').length).toBe(1);
    });
  });

  describe('Empty state', () => {
    it('should show empty state when no users', () => {
      adminService.getAllUsers.mockReturnValue(of(mockEmptyResponse));
      fixture.detectChanges();
      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('No users found');
    });
  });

  describe('Error handling', () => {
    it('should show error on load failure', () => {
      adminService.getAllUsers.mockReturnValue(
        throwError(() => new Error('Network error'))
      );
      fixture.detectChanges();
      const c = component as any;
      expect(c.error()).toBe('Network error');
    });

    it('should show retry button on error', () => {
      adminService.getAllUsers.mockReturnValue(
        throwError(() => new Error('Network error'))
      );
      fixture.detectChanges();
      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('app-button')).not.toBeNull();
    });

    it('should reload on retry', () => {
      adminService.getAllUsers.mockReturnValue(
        throwError(() => new Error('Network error'))
      );
      fixture.detectChanges();
      const c = component as any;
      adminService.getAllUsers.mockReturnValue(of(mockListResponse));
      c.loadUsers();
      expect(adminService.getAllUsers).toHaveBeenCalledTimes(2);
    });
  });

  describe('Role filter', () => {
    it('should start with all filter', () => {
      adminService.getAllUsers.mockReturnValue(of(mockListResponse));
      fixture.detectChanges();
      const c = component as any;
      expect(c.roleFilter()).toBe('all');
    });

    it('should call getAllUsers with role filter', () => {
      adminService.getAllUsers.mockReturnValue(of(mockListResponse));
      fixture.detectChanges();
      const c = component as any;
      c.setRoleFilter('customer');
      expect(adminService.getAllUsers).toHaveBeenCalledWith(
        expect.objectContaining({ role: 'customer' })
      );
    });

    it('should reset page when changing role filter', () => {
      adminService.getAllUsers.mockReturnValue(of(mockListResponse));
      fixture.detectChanges();
      const c = component as any;
      c.page.set(2);
      c.setRoleFilter('customer');
      expect(c.page()).toBe(1);
    });
  });

  describe('Status filter', () => {
    it('should start with all status filter', () => {
      adminService.getAllUsers.mockReturnValue(of(mockListResponse));
      fixture.detectChanges();
      const c = component as any;
      expect(c.statusFilter()).toBe('all');
    });

    it('should call getAllUsers with search for active filter', () => {
      adminService.getAllUsers.mockReturnValue(of(mockListResponse));
      fixture.detectChanges();
      const c = component as any;
      c.setStatusFilter('active');
      expect(adminService.getAllUsers).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'active' })
      );
    });

    it('should call getAllUsers with search for inactive filter', () => {
      adminService.getAllUsers.mockReturnValue(of(mockListResponse));
      fixture.detectChanges();
      const c = component as any;
      c.setStatusFilter('inactive');
      expect(adminService.getAllUsers).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'inactive' })
      );
    });

    it('should reset page when changing status filter', () => {
      adminService.getAllUsers.mockReturnValue(of(mockListResponse));
      fixture.detectChanges();
      const c = component as any;
      c.page.set(2);
      c.setStatusFilter('active');
      expect(c.page()).toBe(1);
    });
  });

  describe('Search', () => {
    it('should update searchQuery on input', () => {
      adminService.getAllUsers.mockReturnValue(of(mockListResponse));
      fixture.detectChanges();
      const compiled = fixture.nativeElement;
      const input = compiled.querySelector('input');
      input.value = 'john';
      input.dispatchEvent(new Event('input'));
      expect(component.searchQuery()).toBe('john');
    });

    it('should trim whitespace', () => {
      adminService.getAllUsers.mockReturnValue(of(mockListResponse));
      fixture.detectChanges();
      const compiled = fixture.nativeElement;
      const input = compiled.querySelector('input');
      input.value = '  john  ';
      input.dispatchEvent(new Event('input'));
      expect(component.searchQuery()).toBe('john');
    });

    it('should ignore duplicate searches', () => {
      adminService.getAllUsers.mockReturnValue(of(mockListResponse));
      fixture.detectChanges();
      const compiled = fixture.nativeElement;
      const input = compiled.querySelector('input');
      input.value = 'john';
      input.dispatchEvent(new Event('input'));
      input.value = 'john';
      input.dispatchEvent(new Event('input'));
      vi.advanceTimersByTime(300);
      expect(adminService.getAllUsers).toHaveBeenCalledTimes(2); // initial + one search
    });

    it('should reset page on new search', () => {
      adminService.getAllUsers.mockReturnValue(of(mockListResponse));
      fixture.detectChanges();
      const c = component as any;
      c.page.set(2);
      const compiled = fixture.nativeElement;
      const input = compiled.querySelector('input');
      input.value = 'john';
      input.dispatchEvent(new Event('input'));
      vi.advanceTimersByTime(300);
      expect(c.page()).toBe(1);
    });

    it('should reload when search becomes empty', () => {
      adminService.getAllUsers.mockReturnValue(of(mockListResponse));
      fixture.detectChanges();
      const c = component as any;
      c.searchQuery.set('test');
      const compiled = fixture.nativeElement;
      const input = compiled.querySelector('input');
      input.value = '';
      input.dispatchEvent(new Event('input'));
      vi.advanceTimersByTime(300);
      expect(adminService.getAllUsers).toHaveBeenCalled();
    });
  });

  describe('Pagination', () => {
    it('should show pagination when totalPages > 1', () => {
      const multiPageResponse = {
        ...mockListResponse,
        data: {
          users: [mockActiveUser],
          pagination: {
            page: 1,
            limit: 20,
            total: 40,
            totalPages: 2,
          },
        },
      };
      adminService.getAllUsers.mockReturnValue(of(multiPageResponse));
      fixture.detectChanges();
      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('.admin-users__pagination')).not.toBeNull();
    });

    it('should hide pagination when totalPages <= 1', () => {
      adminService.getAllUsers.mockReturnValue(of(mockListResponse));
      fixture.detectChanges();
      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('.admin-users__pagination')).toBeNull();
    });

    it('should go to next page', () => {
      const multiPageResponse = {
        ...mockListResponse,
        data: {
          users: [mockActiveUser],
          pagination: {
            page: 1,
            limit: 20,
            total: 40,
            totalPages: 2,
          },
        },
      };
      const page2Response = {
        ...mockListResponse,
        data: {
          users: [{ ...mockActiveUser, id: 'user-2' }],
          pagination: {
            page: 2,
            limit: 20,
            total: 40,
            totalPages: 2,
          },
        },
      };
      adminService.getAllUsers.mockReturnValueOnce(of(multiPageResponse)).mockReturnValueOnce(of(page2Response));
      fixture.detectChanges();
      const c = component as any;
      c.nextPage();
      expect(c.page()).toBe(2);
      expect(adminService.getAllUsers).toHaveBeenCalledTimes(2);
    });

    it('should go to previous page', () => {
      const page2Response = {
        ...mockListResponse,
        data: {
          users: [mockActiveUser],
          pagination: {
            page: 2,
            limit: 20,
            total: 40,
            totalPages: 2,
          },
        },
      };
      const page1Response = {
        ...mockListResponse,
        data: {
          users: [{ ...mockActiveUser, id: 'user-1' }],
          pagination: {
            page: 1,
            limit: 20,
            total: 40,
            totalPages: 2,
          },
        },
      };
      adminService.getAllUsers.mockReturnValueOnce(of(page2Response)).mockReturnValueOnce(of(page1Response));
      fixture.detectChanges();
      const c = component as any;
      c.prevPage();
      expect(c.page()).toBe(1);
      expect(adminService.getAllUsers).toHaveBeenCalledTimes(2);
    });
  });

  describe('Activate dialog', () => {
    it('should open activate dialog', () => {
      adminService.getAllUsers.mockReturnValue(of(mockListResponse));
      fixture.detectChanges();
      const c = component as any;
      c.openActivateDialog(mockInactiveUser);
      expect(c.dialogType()).toBe('activate');
      expect(c.selectedUser()?.id).toBe('user-2');
    });

    it('should show activate dialog title', () => {
      adminService.getAllUsers.mockReturnValue(of(mockListResponse));
      fixture.detectChanges();
      const c = component as any;
      c.openActivateDialog(mockInactiveUser);
      expect(c.dialogTitle).toBe('Activate User');
    });

    it('should show activate dialog body with user name', () => {
      adminService.getAllUsers.mockReturnValue(of(mockListResponse));
      fixture.detectChanges();
      const c = component as any;
      c.openActivateDialog(mockInactiveUser);
      expect(c.dialogBody).toContain('Jane Smith');
      expect(c.dialogBody).toContain('regain access to MotoCare');
    });

    it('should not open activate dialog if action in progress', () => {
      adminService.getAllUsers.mockReturnValue(of(mockListResponse));
      fixture.detectChanges();
      const c = component as any;
      c.actionInProgress.set(true);
      c.openActivateDialog(mockInactiveUser);
      expect(c.dialogType()).toBeNull();
    });
  });

  describe('Deactivate dialog', () => {
    it('should open deactivate dialog', () => {
      adminService.getAllUsers.mockReturnValue(of(mockListResponse));
      fixture.detectChanges();
      const c = component as any;
      c.openDeactivateDialog(mockActiveUser);
      expect(c.dialogType()).toBe('deactivate');
      expect(c.selectedUser()?.id).toBe('user-1');
    });

    it('should show deactivate dialog title', () => {
      adminService.getAllUsers.mockReturnValue(of(mockListResponse));
      fixture.detectChanges();
      const c = component as any;
      c.openDeactivateDialog(mockActiveUser);
      expect(c.dialogTitle).toBe('Deactivate User');
    });

    it('should show deactivate dialog body with user name', () => {
      adminService.getAllUsers.mockReturnValue(of(mockListResponse));
      fixture.detectChanges();
      const c = component as any;
      c.openDeactivateDialog(mockActiveUser);
      expect(c.dialogBody).toContain('John Doe');
      expect(c.dialogBody).toContain('no longer be able to access MotoCare');
    });

    it('should not open deactivate dialog if action in progress', () => {
      adminService.getAllUsers.mockReturnValue(of(mockListResponse));
      fixture.detectChanges();
      const c = component as any;
      c.actionInProgress.set(true);
      c.openDeactivateDialog(mockActiveUser);
      expect(c.dialogType()).toBeNull();
    });
  });

  describe('Confirm action', () => {
    it('should call activateUser on confirm', () => {
      adminService.getAllUsers.mockReturnValue(of(mockListResponse));
      adminService.activateUser.mockReturnValue(
        of({
          success: true,
          message: 'User activated successfully',
          data: { user: { ...mockInactiveUser, isActive: true } },
          errors: null,
        })
      );
      fixture.detectChanges();
      const c = component as any;
      c.openActivateDialog(mockInactiveUser);
      c.confirmAction();
      expect(adminService.activateUser).toHaveBeenCalledWith('user-2');
    });

    it('should call deactivateUser on confirm', () => {
      adminService.getAllUsers.mockReturnValue(of(mockListResponse));
      adminService.deactivateUser.mockReturnValue(
        of({
          success: true,
          message: 'User deactivated successfully',
          data: { user: { ...mockActiveUser, isActive: false } },
          errors: null,
        })
      );
      fixture.detectChanges();
      const c = component as any;
      c.openDeactivateDialog(mockActiveUser);
      c.confirmAction();
      expect(adminService.deactivateUser).toHaveBeenCalledWith('user-1');
    });

    it('should update local list after activate', () => {
      adminService.getAllUsers.mockReturnValue(of(mockListResponse));
      adminService.activateUser.mockReturnValue(
        of({
          success: true,
          message: 'User activated successfully',
          data: { user: { ...mockInactiveUser, isActive: true } },
          errors: null,
        })
      );
      fixture.detectChanges();
      const c = component as any;
      c.items.set([mockInactiveUser]);
      c.openActivateDialog(mockInactiveUser);
      c.confirmAction();
      expect(c.items()[0].isActive).toBe(true);
    });

    it('should update local list after deactivate', () => {
      adminService.getAllUsers.mockReturnValue(of(mockListResponse));
      adminService.deactivateUser.mockReturnValue(
        of({
          success: true,
          message: 'User deactivated successfully',
          data: { user: { ...mockActiveUser, isActive: false } },
          errors: null,
        })
      );
      fixture.detectChanges();
      const c = component as any;
      c.items.set([mockActiveUser]);
      c.openDeactivateDialog(mockActiveUser);
      c.confirmAction();
      expect(c.items()[0].isActive).toBe(false);
    });

    it('should show success banner after activate', () => {
      adminService.getAllUsers.mockReturnValue(of(mockListResponse));
      adminService.activateUser.mockReturnValue(
        of({
          success: true,
          message: 'User activated successfully',
          data: { user: { ...mockInactiveUser, isActive: true } },
          errors: null,
        })
      );
      fixture.detectChanges();
      const c = component as any;
      c.openActivateDialog(mockInactiveUser);
      c.confirmAction();
      expect(c.successMessage()).toContain('Jane Smith has been activated');
    });

    it('should show error banner on failure', () => {
      adminService.getAllUsers.mockReturnValue(of(mockListResponse));
      adminService.activateUser.mockReturnValue(
        throwError(() => new Error('Activate failed'))
      );
      fixture.detectChanges();
      const c = component as any;
      c.openActivateDialog(mockInactiveUser);
      c.confirmAction();
      expect(c.error()).toContain('Activate failed');
    });

    it('should close dialog after success', () => {
      adminService.getAllUsers.mockReturnValue(of(mockListResponse));
      adminService.activateUser.mockReturnValue(
        of({
          success: true,
          message: 'User activated successfully',
          data: { user: { ...mockInactiveUser, isActive: true } },
          errors: null,
        })
      );
      fixture.detectChanges();
      const c = component as any;
      c.openActivateDialog(mockInactiveUser);
      c.confirmAction();
      expect(c.dialogType()).toBeNull();
    });

    it('should not confirm if no user selected', () => {
      adminService.getAllUsers.mockReturnValue(of(mockListResponse));
      fixture.detectChanges();
      const c = component as any;
      c.confirmAction();
      expect(adminService.activateUser).not.toHaveBeenCalled();
      expect(adminService.deactivateUser).not.toHaveBeenCalled();
    });

    it('should not confirm if no dialog type', () => {
      adminService.getAllUsers.mockReturnValue(of(mockListResponse));
      fixture.detectChanges();
      const c = component as any;
      c.selectedUser.set(mockActiveUser);
      c.confirmAction();
      expect(adminService.activateUser).not.toHaveBeenCalled();
      expect(adminService.deactivateUser).not.toHaveBeenCalled();
    });
  });

  describe('Close dialog', () => {
    it('should close dialog and clear selection', () => {
      adminService.getAllUsers.mockReturnValue(of(mockListResponse));
      fixture.detectChanges();
      const c = component as any;
      c.openActivateDialog(mockInactiveUser);
      c.closeDialog();
      expect(c.dialogType()).toBeNull();
      expect(c.selectedUser()).toBeNull();
    });
  });

  describe('Format date', () => {
    it('should format date correctly', () => {
      adminService.getAllUsers.mockReturnValue(of(mockListResponse));
      fixture.detectChanges();
      const c = component as any;
      expect(c.formatDate('2025-01-01T10:00:00.000Z')).toBe('01 Jan 2025');
    });
  });

  describe('Pagination navigation', () => {
    it('should not navigate beyond last page', () => {
      adminService.getAllUsers.mockReturnValue(of(mockListResponse));
      fixture.detectChanges();
      const c = component as any;
      c.page.set(1);
      c.totalPages.set(1);
      c.nextPage();
      expect(c.page()).toBe(1);
    });

    it('should not navigate before first page', () => {
      adminService.getAllUsers.mockReturnValue(of(mockListResponse));
      fixture.detectChanges();
      const c = component as any;
      c.page.set(1);
      c.prevPage();
      expect(c.page()).toBe(1);
    });
  });

  describe('Optimistic update', () => {
    it('should update user status without reloading', () => {
      adminService.getAllUsers.mockReturnValue(of(mockListResponse));
      adminService.activateUser.mockReturnValue(
        of({
          success: true,
          message: 'User activated successfully',
          data: { user: { ...mockInactiveUser, isActive: true } },
          errors: null,
        })
      );
      fixture.detectChanges();
      const c = component as any;
      c.items.set([mockInactiveUser]);
      c.openActivateDialog(mockInactiveUser);
      c.confirmAction();
      expect(adminService.getAllUsers).toHaveBeenCalledTimes(1); // only initial load
    });
  });

  describe('Success banner auto-dismiss', () => {
    it('should auto-dismiss success after 3 seconds', () => {
      adminService.getAllUsers.mockReturnValue(of(mockListResponse));
      adminService.activateUser.mockReturnValue(
        of({
          success: true,
          message: 'User activated successfully',
          data: { user: { ...mockInactiveUser, isActive: true } },
          errors: null,
        })
      );
      fixture.detectChanges();
      const c = component as any;
      c.openActivateDialog(mockInactiveUser);
      c.confirmAction();
      expect(c.successMessage()).toContain('Jane Smith has been activated');
      vi.advanceTimersByTime(3000);
      expect(c.successMessage()).toBeNull();
    });
  });

  describe('Self-deactivation protection', () => {
    it('should hide Deactivate button for the logged-in admin', () => {
      authService.user.mockReturnValue({ id: 'user-1', role: 'admin' });
      const selfUserResponse = {
        ...mockListResponse,
        data: {
          users: [mockCurrentAdmin],
          pagination: mockListResponse.data!.pagination,
        },
      };
      adminService.getAllUsers.mockReturnValue(of(selfUserResponse));
      fixture.detectChanges();
      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('app-button')).toBeNull();
    });

    it('should show Deactivate button for other active users', () => {
      authService.user.mockReturnValue({ id: 'admin-1', role: 'admin' });
      const otherUserResponse = {
        ...mockListResponse,
        data: {
          users: [mockActiveUser],
          pagination: mockListResponse.data!.pagination,
        },
      };
      adminService.getAllUsers.mockReturnValue(of(otherUserResponse));
      fixture.detectChanges();
      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('app-button')).not.toBeNull();
      expect(compiled.textContent).toContain('Deactivate');
    });

    it('should show error banner when backend rejects self-deactivation', () => {
      adminService.getAllUsers.mockReturnValue(of(mockListResponse));
      adminService.deactivateUser.mockReturnValue(
        throwError(() => new Error('You cannot deactivate your own account'))
      );
      fixture.detectChanges();
      const c = component as any;
      c.items.set([mockActiveUser]);
      c.openDeactivateDialog(mockActiveUser);
      c.confirmAction();
      expect(c.error()).toContain('You cannot deactivate your own account');
    });

    it('should not update local list when self-deactivation fails', () => {
      adminService.getAllUsers.mockReturnValue(of(mockListResponse));
      adminService.deactivateUser.mockReturnValue(
        throwError(() => new Error('You cannot deactivate your own account'))
      );
      fixture.detectChanges();
      const c = component as any;
      c.items.set([mockActiveUser]);
      c.openDeactivateDialog(mockActiveUser);
      c.confirmAction();
      expect(c.items()[0].isActive).toBe(true);
    });
  });
});
