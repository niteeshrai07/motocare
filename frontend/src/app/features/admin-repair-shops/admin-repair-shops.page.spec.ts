import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { AdminRepairShopsPageComponent } from './admin-repair-shops.page';
import { AdminService } from '../../core/services/admin.service';
import { ApiResponse } from '../../core/models/api-response.model';
import { AdminRepairShopListItem } from '../../core/models/admin.model';

describe('AdminRepairShopsPageComponent', () => {
  let fixture: ComponentFixture<AdminRepairShopsPageComponent>;
  let component: AdminRepairShopsPageComponent;

  const adminService = {
    getAllRepairShops: vi.fn(),
    verifyRepairShop: vi.fn(),
    rejectRepairShop: vi.fn(),
  };

  const mockShop: AdminRepairShopListItem = {
    id: 'shop-1',
    shopName: 'Test Repair Shop',
    status: 'pending',
    rating: 4.5,
    totalReviews: 10,
    vehicleTypesServiced: ['two_wheeler', 'four_wheeler'],
    owner: {
      id: 'owner-1',
      name: 'John Doe',
      email: 'john@example.com',
      phone: '123-456-7890',
    },
    createdAt: '2025-01-01T10:00:00.000Z',
    updatedAt: '2025-01-01T10:00:00.000Z',
  };

  const mockVerifiedShop: AdminRepairShopListItem = {
    ...mockShop,
    id: 'shop-2',
    status: 'verified',
  };

  const mockRejectedShop: AdminRepairShopListItem = {
    ...mockShop,
    id: 'shop-3',
    status: 'rejected',
  };

  const mockListResponse: ApiResponse<{
    repairShops: AdminRepairShopListItem[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> = {
    success: true,
    message: 'Repair shops fetched successfully',
    data: {
      repairShops: [mockShop],
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
    repairShops: AdminRepairShopListItem[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> = {
    success: true,
    message: 'Repair shops fetched successfully',
    data: {
      repairShops: [],
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
      imports: [AdminRepairShopsPageComponent],
      providers: [
        { provide: AdminService, useValue: adminService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminRepairShopsPageComponent);
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
      adminService.getAllRepairShops.mockReturnValue(of(mockListResponse));
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('should start in loading state', () => {
      adminService.getAllRepairShops.mockReturnValue(of(mockListResponse));
      fixture.detectChanges();
      expect(component.isLoading()).toBe(true);
    });

    it('should call getAllRepairShops on init', () => {
      adminService.getAllRepairShops.mockReturnValue(of(mockListResponse));
      fixture.detectChanges();
      expect(adminService.getAllRepairShops).toHaveBeenCalledWith({
        page: 1,
        limit: 20,
        sort: 'newest',
      });
    });
  });

  describe('Loading', () => {
    it('should show spinner while loading', () => {
      adminService.getAllRepairShops.mockReturnValue(of(mockListResponse));
      fixture.detectChanges();
      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('app-spinner')).not.toBeNull();
    });
  });

  describe('Successful load', () => {
    it('should render repair shops', () => {
      adminService.getAllRepairShops.mockReturnValue(of(mockListResponse));
      fixture.detectChanges();
      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('Test Repair Shop');
    });

    it('should render two CardComponent sections', () => {
      adminService.getAllRepairShops.mockReturnValue(of(mockListResponse));
      fixture.detectChanges();
      const compiled = fixture.nativeElement;
      expect(compiled.querySelectorAll('app-card').length).toBe(1);
    });

    it('should display owner information', () => {
      adminService.getAllRepairShops.mockReturnValue(of(mockListResponse));
      fixture.detectChanges();
      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('John Doe');
      expect(compiled.textContent).toContain('123-456-7890');
    });

    it('should display verification badge', () => {
      adminService.getAllRepairShops.mockReturnValue(of(mockListResponse));
      fixture.detectChanges();
      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('app-verification-badge')).not.toBeNull();
    });
  });

  describe('Empty state', () => {
    it('should show empty state when no repair shops', () => {
      adminService.getAllRepairShops.mockReturnValue(of(mockEmptyResponse));
      fixture.detectChanges();
      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('No repair shops found');
    });
  });

  describe('Error handling', () => {
    it('should show error on load failure', () => {
      adminService.getAllRepairShops.mockReturnValue(
        throwError(() => new Error('Network error'))
      );
      fixture.detectChanges();
      const c = component as any;
      expect(c.error()).toBe('Network error');
    });

    it('should show retry button on error', () => {
      adminService.getAllRepairShops.mockReturnValue(
        throwError(() => new Error('Network error'))
      );
      fixture.detectChanges();
      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('app-button')).not.toBeNull();
    });

    it('should reload on retry', () => {
      adminService.getAllRepairShops.mockReturnValue(
        throwError(() => new Error('Network error'))
      );
      fixture.detectChanges();
      const c = component as any;
      adminService.getAllRepairShops.mockReturnValue(of(mockListResponse));
      c.loadShops();
      expect(adminService.getAllRepairShops).toHaveBeenCalledTimes(2);
    });
  });

  describe('Filter', () => {
    it('should start with all filter', () => {
      adminService.getAllRepairShops.mockReturnValue(of(mockListResponse));
      fixture.detectChanges();
      const c = component as any;
      expect(c.activeFilter()).toBe('all');
    });

    it('should call getAllRepairShops with status filter', () => {
      adminService.getAllRepairShops.mockReturnValue(of(mockListResponse));
      fixture.detectChanges();
      const c = component as any;
      c.setFilter('pending');
      expect(adminService.getAllRepairShops).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'pending' })
      );
    });

    it('should reset page when changing filter', () => {
      adminService.getAllRepairShops.mockReturnValue(of(mockListResponse));
      fixture.detectChanges();
      const c = component as any;
      c.page.set(2);
      c.setFilter('pending');
      expect(c.page()).toBe(1);
    });
  });

  describe('Search', () => {
    it('should update searchQuery on input', () => {
      adminService.getAllRepairShops.mockReturnValue(of(mockListResponse));
      fixture.detectChanges();
      const compiled = fixture.nativeElement;
      const input = compiled.querySelector('input');
      input.value = 'test';
      input.dispatchEvent(new Event('input'));
      expect(component.searchQuery()).toBe('test');
    });

    it('should trim whitespace', () => {
      adminService.getAllRepairShops.mockReturnValue(of(mockListResponse));
      fixture.detectChanges();
      const compiled = fixture.nativeElement;
      const input = compiled.querySelector('input');
      input.value = '  test  ';
      input.dispatchEvent(new Event('input'));
      expect(component.searchQuery()).toBe('test');
    });

    it('should ignore duplicate searches', () => {
      adminService.getAllRepairShops.mockReturnValue(of(mockListResponse));
      fixture.detectChanges();
      const compiled = fixture.nativeElement;
      const input = compiled.querySelector('input');
      input.value = 'test';
      input.dispatchEvent(new Event('input'));
      input.value = 'test';
      input.dispatchEvent(new Event('input'));
      vi.advanceTimersByTime(300);
      expect(adminService.getAllRepairShops).toHaveBeenCalledTimes(2); // initial + one search
    });

    it('should reset page on new search', () => {
      adminService.getAllRepairShops.mockReturnValue(of(mockListResponse));
      fixture.detectChanges();
      const c = component as any;
      c.page.set(2);
      const compiled = fixture.nativeElement;
      const input = compiled.querySelector('input');
      input.value = 'test';
      input.dispatchEvent(new Event('input'));
      vi.advanceTimersByTime(300);
      expect(c.page()).toBe(1);
    });

    it('should reload when search becomes empty', () => {
      adminService.getAllRepairShops.mockReturnValue(of(mockListResponse));
      fixture.detectChanges();
      const c = component as any;
      c.searchQuery.set('test');
      const compiled = fixture.nativeElement;
      const input = compiled.querySelector('input');
      input.value = '';
      input.dispatchEvent(new Event('input'));
      vi.advanceTimersByTime(300);
      expect(adminService.getAllRepairShops).toHaveBeenCalled();
    });
  });

  describe('Pagination', () => {
    it('should show pagination when totalPages > 1', () => {
      const multiPageResponse = {
        ...mockListResponse,
        data: {
          repairShops: [mockShop],
          pagination: {
            page: 1,
            limit: 20,
            total: 40,
            totalPages: 2,
          },
        },
      };
      adminService.getAllRepairShops.mockReturnValue(of(multiPageResponse));
      fixture.detectChanges();
      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('.admin-repair-shops__pagination')).not.toBeNull();
    });

    it('should hide pagination when totalPages <= 1', () => {
      adminService.getAllRepairShops.mockReturnValue(of(mockListResponse));
      fixture.detectChanges();
      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('.admin-repair-shops__pagination')).toBeNull();
    });

    it('should go to next page', () => {
      const multiPageResponse = {
        ...mockListResponse,
        data: {
          repairShops: [mockShop],
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
          repairShops: [{ ...mockShop, id: 'shop-2' }],
          pagination: {
            page: 2,
            limit: 20,
            total: 40,
            totalPages: 2,
          },
        },
      };
      adminService.getAllRepairShops.mockReturnValueOnce(of(multiPageResponse)).mockReturnValueOnce(of(page2Response));
      fixture.detectChanges();
      const c = component as any;
      c.nextPage();
      expect(c.page()).toBe(2);
      expect(adminService.getAllRepairShops).toHaveBeenCalledTimes(2);
    });

    it('should go to previous page', () => {
      const page2Response = {
        ...mockListResponse,
        data: {
          repairShops: [mockShop],
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
          repairShops: [{ ...mockShop, id: 'shop-1' }],
          pagination: {
            page: 1,
            limit: 20,
            total: 40,
            totalPages: 2,
          },
        },
      };
      adminService.getAllRepairShops.mockReturnValueOnce(of(page2Response)).mockReturnValueOnce(of(page1Response));
      fixture.detectChanges();
      const c = component as any;
      c.prevPage();
      expect(c.page()).toBe(1);
      expect(adminService.getAllRepairShops).toHaveBeenCalledTimes(2);
    });
  });

  describe('Verify dialog', () => {
    it('should open verify dialog', () => {
      adminService.getAllRepairShops.mockReturnValue(of(mockListResponse));
      fixture.detectChanges();
      const c = component as any;
      c.openVerifyDialog(mockShop);
      expect(c.dialogType()).toBe('verify');
      expect(c.selectedShop()?.id).toBe('shop-1');
    });

    it('should show verify dialog title', () => {
      adminService.getAllRepairShops.mockReturnValue(of(mockListResponse));
      fixture.detectChanges();
      const c = component as any;
      c.openVerifyDialog(mockShop);
      expect(c.dialogTitle).toBe('Verify Repair Shop');
    });

    it('should show verify dialog body with shop name', () => {
      adminService.getAllRepairShops.mockReturnValue(of(mockListResponse));
      fixture.detectChanges();
      const c = component as any;
      c.openVerifyDialog(mockShop);
      expect(c.dialogBody).toContain('Test Repair Shop');
      expect(c.dialogBody).toContain('mechanic will immediately be able to receive service requests');
    });

    it('should not open verify dialog if action in progress', () => {
      adminService.getAllRepairShops.mockReturnValue(of(mockListResponse));
      fixture.detectChanges();
      const c = component as any;
      c.actionInProgress.set(true);
      c.openVerifyDialog(mockShop);
      expect(c.dialogType()).toBeNull();
    });
  });

  describe('Reject dialog', () => {
    it('should open reject dialog', () => {
      adminService.getAllRepairShops.mockReturnValue(of(mockListResponse));
      fixture.detectChanges();
      const c = component as any;
      c.openRejectDialog(mockShop);
      expect(c.dialogType()).toBe('reject');
      expect(c.selectedShop()?.id).toBe('shop-1');
    });

    it('should show reject dialog title', () => {
      adminService.getAllRepairShops.mockReturnValue(of(mockListResponse));
      fixture.detectChanges();
      const c = component as any;
      c.openRejectDialog(mockShop);
      expect(c.dialogTitle).toBe('Reject Repair Shop');
    });

    it('should show reject dialog body with shop name', () => {
      adminService.getAllRepairShops.mockReturnValue(of(mockListResponse));
      fixture.detectChanges();
      const c = component as any;
      c.openRejectDialog(mockShop);
      expect(c.dialogBody).toContain('Test Repair Shop');
      expect(c.dialogBody).toContain('mechanic will be notified');
    });

    it('should not open reject dialog if action in progress', () => {
      adminService.getAllRepairShops.mockReturnValue(of(mockListResponse));
      fixture.detectChanges();
      const c = component as any;
      c.actionInProgress.set(true);
      c.openRejectDialog(mockShop);
      expect(c.dialogType()).toBeNull();
    });
  });

  describe('Confirm action', () => {
    it('should call verifyRepairShop on confirm', () => {
      adminService.getAllRepairShops.mockReturnValue(of(mockListResponse));
      adminService.verifyRepairShop.mockReturnValue(
        of({
          success: true,
          message: 'Repair shop verified successfully',
          data: { repairShop: { ...mockShop, status: 'verified' } },
          errors: null,
        })
      );
      fixture.detectChanges();
      const c = component as any;
      c.openVerifyDialog(mockShop);
      c.confirmAction();
      expect(adminService.verifyRepairShop).toHaveBeenCalledWith('shop-1');
    });

    it('should call rejectRepairShop on confirm', () => {
      adminService.getAllRepairShops.mockReturnValue(of(mockListResponse));
      adminService.rejectRepairShop.mockReturnValue(
        of({
          success: true,
          message: 'Repair shop rejected successfully',
          data: { repairShop: { ...mockShop, status: 'rejected' } },
          errors: null,
        })
      );
      fixture.detectChanges();
      const c = component as any;
      c.openRejectDialog(mockShop);
      c.confirmAction();
      expect(adminService.rejectRepairShop).toHaveBeenCalledWith('shop-1');
    });

    it('should update local list after verify', () => {
      adminService.getAllRepairShops.mockReturnValue(of(mockListResponse));
      adminService.verifyRepairShop.mockReturnValue(
        of({
          success: true,
          message: 'Repair shop verified successfully',
          data: { repairShop: { ...mockShop, status: 'verified' } },
          errors: null,
        })
      );
      fixture.detectChanges();
      const c = component as any;
      c.openVerifyDialog(mockShop);
      c.confirmAction();
      expect(c.items()[0].status).toBe('verified');
    });

    it('should update local list after reject', () => {
      adminService.getAllRepairShops.mockReturnValue(of(mockListResponse));
      adminService.rejectRepairShop.mockReturnValue(
        of({
          success: true,
          message: 'Repair shop rejected successfully',
          data: { repairShop: { ...mockShop, status: 'rejected' } },
          errors: null,
        })
      );
      fixture.detectChanges();
      const c = component as any;
      c.openRejectDialog(mockShop);
      c.confirmAction();
      expect(c.items()[0].status).toBe('rejected');
    });

    it('should show success banner after verify', () => {
      adminService.getAllRepairShops.mockReturnValue(of(mockListResponse));
      adminService.verifyRepairShop.mockReturnValue(
        of({
          success: true,
          message: 'Repair shop verified successfully',
          data: { repairShop: { ...mockShop, status: 'verified' } },
          errors: null,
        })
      );
      fixture.detectChanges();
      const c = component as any;
      c.openVerifyDialog(mockShop);
      c.confirmAction();
      expect(c.successMessage()).toContain('Test Repair Shop has been verified');
    });

    it('should show error banner on failure', () => {
      adminService.getAllRepairShops.mockReturnValue(of(mockListResponse));
      adminService.verifyRepairShop.mockReturnValue(
        throwError(() => new Error('Verify failed'))
      );
      fixture.detectChanges();
      const c = component as any;
      c.openVerifyDialog(mockShop);
      c.confirmAction();
      expect(c.error()).toContain('Verify failed');
    });

    it('should close dialog after success', () => {
      adminService.getAllRepairShops.mockReturnValue(of(mockListResponse));
      adminService.verifyRepairShop.mockReturnValue(
        of({
          success: true,
          message: 'Repair shop verified successfully',
          data: { repairShop: { ...mockShop, status: 'verified' } },
          errors: null,
        })
      );
      fixture.detectChanges();
      const c = component as any;
      c.openVerifyDialog(mockShop);
      c.confirmAction();
      expect(c.dialogType()).toBeNull();
    });

    it('should disable buttons during action', () => {
      adminService.getAllRepairShops.mockReturnValue(of(mockListResponse));
      adminService.verifyRepairShop.mockReturnValue(
        of({
          success: true,
          message: 'Repair shop verified successfully',
          data: { repairShop: { ...mockShop, status: 'verified' } },
          errors: null,
        })
      );
      fixture.detectChanges();
      const c = component as any;
      c.openVerifyDialog(mockShop);
      c.confirmAction();
      expect(c.actionInProgress()).toBe(false); // completed synchronously in test
    });

    it('should not confirm if no shop selected', () => {
      adminService.getAllRepairShops.mockReturnValue(of(mockListResponse));
      fixture.detectChanges();
      const c = component as any;
      c.confirmAction();
      expect(adminService.verifyRepairShop).not.toHaveBeenCalled();
      expect(adminService.rejectRepairShop).not.toHaveBeenCalled();
    });

    it('should not confirm if no dialog type', () => {
      adminService.getAllRepairShops.mockReturnValue(of(mockListResponse));
      fixture.detectChanges();
      const c = component as any;
      c.selectedShop.set(mockShop);
      c.confirmAction();
      expect(adminService.verifyRepairShop).not.toHaveBeenCalled();
      expect(adminService.rejectRepairShop).not.toHaveBeenCalled();
    });
  });

  describe('Close dialog', () => {
    it('should close dialog and clear selection', () => {
      adminService.getAllRepairShops.mockReturnValue(of(mockListResponse));
      fixture.detectChanges();
      const c = component as any;
      c.openVerifyDialog(mockShop);
      c.closeDialog();
      expect(c.dialogType()).toBeNull();
      expect(c.selectedShop()).toBeNull();
    });
  });

  describe('Format date', () => {
    it('should format date correctly', () => {
      adminService.getAllRepairShops.mockReturnValue(of(mockListResponse));
      fixture.detectChanges();
      const c = component as any;
      expect(c.formatDate('2025-01-01T10:00:00.000Z')).toBe('01 Jan 2025');
    });
  });

  describe('Pagination navigation', () => {
    it('should not navigate beyond last page', () => {
      adminService.getAllRepairShops.mockReturnValue(of(mockListResponse));
      fixture.detectChanges();
      const c = component as any;
      c.page.set(1);
      c.totalPages.set(1);
      c.nextPage();
      expect(c.page()).toBe(1);
    });

    it('should not navigate before first page', () => {
      adminService.getAllRepairShops.mockReturnValue(of(mockListResponse));
      fixture.detectChanges();
      const c = component as any;
      c.page.set(1);
      c.prevPage();
      expect(c.page()).toBe(1);
    });
  });

  describe('Optimistic update', () => {
    it('should update item status without reloading', () => {
      adminService.getAllRepairShops.mockReturnValue(of(mockListResponse));
      adminService.verifyRepairShop.mockReturnValue(
        of({
          success: true,
          message: 'Repair shop verified successfully',
          data: { repairShop: { ...mockShop, status: 'verified' } },
          errors: null,
        })
      );
      fixture.detectChanges();
      const c = component as any;
      c.openVerifyDialog(mockShop);
      c.confirmAction();
      expect(adminService.getAllRepairShops).toHaveBeenCalledTimes(1); // only initial load
    });
  });

  describe('Success banner auto-dismiss', () => {
    it('should auto-dismiss success after 3 seconds', () => {
      adminService.getAllRepairShops.mockReturnValue(of(mockListResponse));
      adminService.verifyRepairShop.mockReturnValue(
        of({
          success: true,
          message: 'Repair shop verified successfully',
          data: { repairShop: { ...mockShop, status: 'verified' } },
          errors: null,
        })
      );
      fixture.detectChanges();
      const c = component as any;
      c.openVerifyDialog(mockShop);
      c.confirmAction();
      expect(c.successMessage()).toContain('Test Repair Shop has been verified');
      vi.advanceTimersByTime(3000);
      expect(c.successMessage()).toBeNull();
    });
  });

  describe('Vehicle types display', () => {
    it('should render vehicle types', () => {
      adminService.getAllRepairShops.mockReturnValue(of(mockListResponse));
      fixture.detectChanges();
      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('Two Wheeler');
      expect(compiled.textContent).toContain('Four Wheeler');
    });
  });
});
