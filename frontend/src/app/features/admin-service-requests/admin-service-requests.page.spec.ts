import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { Router } from '@angular/router';
import { AdminServiceRequestsPageComponent } from './admin-service-requests.page';
import { AdminService } from '../../core/services/admin.service';
import { ApiResponse } from '../../core/models/api-response.model';
import { AdminServiceRequestListItem } from '../../core/models/admin.model';

describe('AdminServiceRequestsPageComponent', () => {
  let fixture: ComponentFixture<AdminServiceRequestsPageComponent>;
  let component: AdminServiceRequestsPageComponent;

  const adminService = {
    getAllServiceRequests: vi.fn(),
  };

  const router = {
    navigate: vi.fn(),
  };

  const mockRequest: AdminServiceRequestListItem = {
    id: 'req-1',
    status: 'pending',
    vehicleType: 'two_wheeler',
    customer: {
      id: 'cust-1',
      name: 'John Doe',
    },
    shop: {
      id: 'shop-1',
      shopName: 'Test Shop',
    },
    createdAt: '2025-01-01T10:00:00.000Z',
    updatedAt: '2025-01-01T10:00:00.000Z',
  };

  const mockListResponse: ApiResponse<{
    serviceRequests: AdminServiceRequestListItem[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> = {
    success: true,
    message: 'Service requests fetched successfully',
    data: {
      serviceRequests: [mockRequest],
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
    serviceRequests: AdminServiceRequestListItem[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> = {
    success: true,
    message: 'Service requests fetched successfully',
    data: {
      serviceRequests: [],
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
      imports: [AdminServiceRequestsPageComponent],
      providers: [
        { provide: AdminService, useValue: adminService },
        { provide: Router, useValue: router },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminServiceRequestsPageComponent);
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
      adminService.getAllServiceRequests.mockReturnValue(of(mockListResponse));
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('should start in loading state', () => {
      adminService.getAllServiceRequests.mockReturnValue(of(mockListResponse));
      fixture.detectChanges();
      expect(component.isLoading()).toBe(true);
    });

    it('should call getAllServiceRequests on init', () => {
      adminService.getAllServiceRequests.mockReturnValue(of(mockListResponse));
      fixture.detectChanges();
      expect(adminService.getAllServiceRequests).toHaveBeenCalledWith({
        page: 1,
        limit: 20,
        sort: 'newest',
      });
    });
  });

  describe('Loading', () => {
    it('should show spinner while loading', () => {
      adminService.getAllServiceRequests.mockReturnValue(of(mockListResponse));
      fixture.detectChanges();
      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('app-spinner')).not.toBeNull();
    });
  });

  describe('Successful load', () => {
    it('should render service requests', () => {
      adminService.getAllServiceRequests.mockReturnValue(of(mockListResponse));
      fixture.detectChanges();
      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('req-1');
    });

    it('should render customer and shop names', () => {
      adminService.getAllServiceRequests.mockReturnValue(of(mockListResponse));
      fixture.detectChanges();
      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('John Doe');
      expect(compiled.textContent).toContain('Test Shop');
    });

    it('should render status badge', () => {
      adminService.getAllServiceRequests.mockReturnValue(of(mockListResponse));
      fixture.detectChanges();
      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('app-request-status-badge')).not.toBeNull();
    });

    it('should render CardComponent', () => {
      adminService.getAllServiceRequests.mockReturnValue(of(mockListResponse));
      fixture.detectChanges();
      const compiled = fixture.nativeElement;
      expect(compiled.querySelectorAll('app-card').length).toBe(1);
    });

    it('should not render workflow action buttons', () => {
      adminService.getAllServiceRequests.mockReturnValue(of(mockListResponse));
      fixture.detectChanges();
      const compiled = fixture.nativeElement;
      expect(compiled.textContent).not.toContain('Accept');
      expect(compiled.textContent).not.toContain('Quote');
      expect(compiled.textContent).not.toContain('Cancel');
      expect(compiled.textContent).not.toContain('Reject');
      expect(compiled.textContent).not.toContain('Start Work');
      expect(compiled.textContent).not.toContain('Complete');
    });
  });

  describe('Empty state', () => {
    it('should show empty state when no service requests', () => {
      adminService.getAllServiceRequests.mockReturnValue(of(mockEmptyResponse));
      fixture.detectChanges();
      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('No service requests found');
    });
  });

  describe('Error handling', () => {
    it('should show error on load failure', () => {
      adminService.getAllServiceRequests.mockReturnValue(
        throwError(() => new Error('Network error'))
      );
      fixture.detectChanges();
      const c = component as any;
      expect(c.error()).toBe('Network error');
    });

    it('should show retry button on error', () => {
      adminService.getAllServiceRequests.mockReturnValue(
        throwError(() => new Error('Network error'))
      );
      fixture.detectChanges();
      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('app-button')).not.toBeNull();
    });

    it('should reload on retry', () => {
      adminService.getAllServiceRequests.mockReturnValue(
        throwError(() => new Error('Network error'))
      );
      fixture.detectChanges();
      const c = component as any;
      adminService.getAllServiceRequests.mockReturnValue(of(mockListResponse));
      c.loadRequests();
      expect(adminService.getAllServiceRequests).toHaveBeenCalledTimes(2);
    });
  });

  describe('Status filter', () => {
    it('should start with all filter', () => {
      adminService.getAllServiceRequests.mockReturnValue(of(mockListResponse));
      fixture.detectChanges();
      const c = component as any;
      expect(c.currentFilter()).toBe('all');
    });

    it('should call getAllServiceRequests with status filter', () => {
      adminService.getAllServiceRequests.mockReturnValue(of(mockListResponse));
      fixture.detectChanges();
      const c = component as any;
      c.setStatusFilter('pending');
      expect(adminService.getAllServiceRequests).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'pending' })
      );
    });

    it('should reset page when changing status filter', () => {
      adminService.getAllServiceRequests.mockReturnValue(of(mockListResponse));
      fixture.detectChanges();
      const c = component as any;
      c.page.set(2);
      c.setStatusFilter('pending');
      expect(c.page()).toBe(1);
    });
  });

  describe('Search', () => {
    it('should update searchQuery on input', () => {
      adminService.getAllServiceRequests.mockReturnValue(of(mockListResponse));
      fixture.detectChanges();
      const compiled = fixture.nativeElement;
      const input = compiled.querySelector('input');
      input.value = 'test';
      input.dispatchEvent(new Event('input'));
      expect(component.searchQuery()).toBe('test');
    });

    it('should trim whitespace', () => {
      adminService.getAllServiceRequests.mockReturnValue(of(mockListResponse));
      fixture.detectChanges();
      const compiled = fixture.nativeElement;
      const input = compiled.querySelector('input');
      input.value = '  test  ';
      input.dispatchEvent(new Event('input'));
      expect(component.searchQuery()).toBe('test');
    });

    it('should ignore duplicate searches', () => {
      adminService.getAllServiceRequests.mockReturnValue(of(mockListResponse));
      fixture.detectChanges();
      const compiled = fixture.nativeElement;
      const input = compiled.querySelector('input');
      input.value = 'test';
      input.dispatchEvent(new Event('input'));
      input.value = 'test';
      input.dispatchEvent(new Event('input'));
      vi.advanceTimersByTime(300);
      expect(adminService.getAllServiceRequests).toHaveBeenCalledTimes(2); // initial + one search
    });

    it('should reset page on new search', () => {
      adminService.getAllServiceRequests.mockReturnValue(of(mockListResponse));
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
      adminService.getAllServiceRequests.mockReturnValue(of(mockListResponse));
      fixture.detectChanges();
      const c = component as any;
      c.searchQuery.set('test');
      const compiled = fixture.nativeElement;
      const input = compiled.querySelector('input');
      input.value = '';
      input.dispatchEvent(new Event('input'));
      vi.advanceTimersByTime(300);
      expect(adminService.getAllServiceRequests).toHaveBeenCalled();
    });
  });

  describe('Pagination', () => {
    it('should show pagination when totalPages > 1', () => {
      const multiPageResponse = {
        ...mockListResponse,
        data: {
          serviceRequests: [mockRequest],
          pagination: {
            page: 1,
            limit: 20,
            total: 40,
            totalPages: 2,
          },
        },
      };
      adminService.getAllServiceRequests.mockReturnValue(of(multiPageResponse));
      fixture.detectChanges();
      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('.admin-service-requests__pagination')).not.toBeNull();
    });

    it('should hide pagination when totalPages <= 1', () => {
      adminService.getAllServiceRequests.mockReturnValue(of(mockListResponse));
      fixture.detectChanges();
      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('.admin-service-requests__pagination')).toBeNull();
    });

    it('should go to next page', () => {
      const multiPageResponse = {
        ...mockListResponse,
        data: {
          serviceRequests: [mockRequest],
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
          serviceRequests: [{ ...mockRequest, id: 'req-2' }],
          pagination: {
            page: 2,
            limit: 20,
            total: 40,
            totalPages: 2,
          },
        },
      };
      adminService.getAllServiceRequests.mockReturnValueOnce(of(multiPageResponse)).mockReturnValueOnce(of(page2Response));
      fixture.detectChanges();
      const c = component as any;
      c.nextPage();
      expect(c.page()).toBe(2);
      expect(adminService.getAllServiceRequests).toHaveBeenCalledTimes(2);
    });

    it('should go to previous page', () => {
      const page2Response = {
        ...mockListResponse,
        data: {
          serviceRequests: [mockRequest],
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
          serviceRequests: [{ ...mockRequest, id: 'req-1' }],
          pagination: {
            page: 1,
            limit: 20,
            total: 40,
            totalPages: 2,
          },
        },
      };
      adminService.getAllServiceRequests.mockReturnValueOnce(of(page2Response)).mockReturnValueOnce(of(page1Response));
      fixture.detectChanges();
      const c = component as any;
      c.prevPage();
      expect(c.page()).toBe(1);
      expect(adminService.getAllServiceRequests).toHaveBeenCalledTimes(2);
    });
  });

  describe('Detail navigation', () => {
    it('should navigate to service request detail', () => {
      adminService.getAllServiceRequests.mockReturnValue(of(mockListResponse));
      fixture.detectChanges();
      const c = component as any;
      c.viewDetails('req-1');
      expect(router.navigate).toHaveBeenCalledWith(['/service-requests', 'req-1']);
    });
  });

  describe('Format helpers', () => {
    it('should format date correctly', () => {
      adminService.getAllServiceRequests.mockReturnValue(of(mockListResponse));
      fixture.detectChanges();
      const c = component as any;
      expect(c.formatDate('2025-01-01T10:00:00.000Z')).toBe('01 Jan 2025');
    });

    it('should format status correctly', () => {
      adminService.getAllServiceRequests.mockReturnValue(of(mockListResponse));
      fixture.detectChanges();
      const c = component as any;
      expect(c.formatStatus('pending')).toBe('Pending');
      expect(c.formatStatus('in_progress')).toBe('In Progress');
    });

    it('should format vehicle type correctly', () => {
      adminService.getAllServiceRequests.mockReturnValue(of(mockListResponse));
      fixture.detectChanges();
      const c = component as any;
      expect(c.vehicleLabel('two_wheeler')).toBe('Two Wheeler');
      expect(c.vehicleLabel('four_wheeler')).toBe('Four Wheeler');
    });
  });

  describe('Pagination navigation', () => {
    it('should not navigate beyond last page', () => {
      adminService.getAllServiceRequests.mockReturnValue(of(mockListResponse));
      fixture.detectChanges();
      const c = component as any;
      c.page.set(1);
      c.totalPages.set(1);
      c.nextPage();
      expect(c.page()).toBe(1);
    });

    it('should not navigate before first page', () => {
      adminService.getAllServiceRequests.mockReturnValue(of(mockListResponse));
      fixture.detectChanges();
      const c = component as any;
      c.page.set(1);
      c.prevPage();
      expect(c.page()).toBe(1);
    });
  });
});
