import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError, NEVER } from 'rxjs';
import { vi } from 'vitest';
import { Router, provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { ServiceRequestListPageComponent } from './service-request-list.page';
import { ServiceRequestService } from '../../../core/services/service-request.service';
import { AuthService } from '../../../core/services/auth.service';
import { ApiResponse } from '../../../core/models/api-response.model';
import {
  ServiceRequestListResponse,
  ServiceRequest,
} from '../../../core/models/service-request.model';

describe('ServiceRequestListPageComponent', () => {
  let fixture: ComponentFixture<ServiceRequestListPageComponent>;
  let component: ServiceRequestListPageComponent;

  const serviceRequestService = {
    getMyServiceRequests: vi.fn(),
    getShopServiceRequests: vi.fn(),
  };

  const userSignal = signal<any>(null);
  const authService = {
    user: userSignal,
  };

  const mockRequest: ServiceRequest = {
    id: 'req-1',
    vehicleType: 'two_wheeler',
    issueDescription: 'Engine not starting',
    location: { type: 'Point', coordinates: [77.59, 28.61] },
    status: 'pending',
    estimatedCost: null,
    estimatedDuration: null,
    mechanicNotes: null,
    expiresAt: '2025-01-01T12:00:00.000Z',
    createdAt: '2025-01-01T10:00:00.000Z',
    updatedAt: '2025-01-01T10:00:00.000Z',
    customer: { id: 'cust-1', name: 'Jane Doe' },
    shop: { id: 'shop-1', shopName: 'MotoCare Repairs' },
  };

  const mockResponse: ServiceRequestListResponse = {
    serviceRequests: [mockRequest],
    pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
  };

  const setupCustomer = () => {
    userSignal.set({
      id: 'cust-1',
      name: 'Jane Doe',
      email: 'jane@example.com',
      phone: '9876543210',
      role: 'customer',
      isActive: true,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    });
    serviceRequestService.getMyServiceRequests.mockReturnValue(
      of({
        success: true,
        message: 'Service requests fetched successfully',
        data: mockResponse,
        errors: null,
      } as ApiResponse<ServiceRequestListResponse>),
    );
  };

  const setupMechanic = () => {
    userSignal.set({
      id: 'mech-1',
      name: 'John Smith',
      email: 'john@example.com',
      phone: '9876543210',
      role: 'mechanic',
      isActive: true,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    });
    serviceRequestService.getShopServiceRequests.mockReturnValue(
      of({
        success: true,
        message: 'Service requests fetched successfully',
        data: mockResponse,
        errors: null,
      } as ApiResponse<ServiceRequestListResponse>),
    );
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ServiceRequestListPageComponent],
      providers: [
        { provide: ServiceRequestService, useValue: serviceRequestService },
        { provide: AuthService, useValue: authService },
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ServiceRequestListPageComponent);
    component = fixture.componentInstance;
    vi.clearAllMocks();
    userSignal.set(null);
  });

  describe('Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should start in loading state', () => {
      const c = component as any;
      expect(c.isLoading()).toBe(true);
    });

    it('should have empty requests on init', () => {
      const c = component as any;
      expect(c.requests().length).toBe(0);
    });

    it('should have null server error on init', () => {
      const c = component as any;
      expect(c.serverError()).toBeNull();
    });

    it('should start on page 1', () => {
      const c = component as any;
      expect(c.page()).toBe(1);
    });

    it('should default filter to "all"', () => {
      const c = component as any;
      expect(c.activeFilter()).toBe('all');
    });
  });

  describe('Customer Role', () => {
    it('should call getMyServiceRequests for customer on init', () => {
      setupCustomer();
      fixture.detectChanges();

      expect(serviceRequestService.getMyServiceRequests).toHaveBeenCalled();
      expect(serviceRequestService.getShopServiceRequests).not.toHaveBeenCalled();
    });

    it('should identify as customer', () => {
      setupCustomer();
      fixture.detectChanges();

      const c = component as any;
      expect(c.isCustomer()).toBe(true);
    });

    it('should populate requests for customer', () => {
      setupCustomer();
      fixture.detectChanges();

      const c = component as any;
      expect(c.requests().length).toBe(1);
      expect(c.requests()[0].id).toBe('req-1');
    });

    it('should populate pagination for customer', () => {
      setupCustomer();
      fixture.detectChanges();

      const c = component as any;
      expect(c.totalPages()).toBe(1);
    });
  });

  describe('Mechanic Role', () => {
    it('should call getShopServiceRequests for mechanic on init', () => {
      setupMechanic();
      fixture.detectChanges();

      expect(serviceRequestService.getShopServiceRequests).toHaveBeenCalled();
      expect(serviceRequestService.getMyServiceRequests).not.toHaveBeenCalled();
    });

    it('should identify as not customer for mechanic', () => {
      setupMechanic();
      fixture.detectChanges();

      const c = component as any;
      expect(c.isCustomer()).toBe(false);
    });
  });

  describe('Loading states', () => {
    it('should show loading state while fetching', () => {
      setupCustomer();
      serviceRequestService.getMyServiceRequests.mockReturnValue(NEVER);
      fixture.detectChanges();

      const c = component as any;
      expect(c.isLoading()).toBe(true);
    });

    it('should stop loading after successful fetch', () => {
      setupCustomer();
      fixture.detectChanges();

      const c = component as any;
      expect(c.isLoading()).toBe(false);
    });

    it('should stop loading after error', () => {
      setupCustomer();
      serviceRequestService.getMyServiceRequests.mockReturnValue(
        throwError(() => new Error('Something went wrong')),
      );
      fixture.detectChanges();

      const c = component as any;
      expect(c.isLoading()).toBe(false);
    });
  });

  describe('Error handling', () => {
    it('should set server error on fetch failure', () => {
      setupCustomer();
      serviceRequestService.getMyServiceRequests.mockReturnValue(
        throwError(() => new Error('Network error')),
      );
      fixture.detectChanges();

      const c = component as any;
      expect(c.serverError()).toBe('Network error');
    });

    it('should set server error on non-success response', () => {
      setupCustomer();
      serviceRequestService.getMyServiceRequests.mockReturnValue(
        of({
          success: false,
          message: 'Failed to fetch',
          data: null,
          errors: null,
        } as ApiResponse<ServiceRequestListResponse>),
      );
      fixture.detectChanges();

      const c = component as any;
      expect(c.serverError()).toBe('Failed to fetch');
    });
  });

  describe('Empty state', () => {
    it('should show empty state with no requests', () => {
      setupCustomer();
      serviceRequestService.getMyServiceRequests.mockReturnValue(
        of({
          success: true,
          message: 'Service requests fetched successfully',
          data: {
            serviceRequests: [],
            pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
          },
          errors: null,
        } as ApiResponse<ServiceRequestListResponse>),
      );
      fixture.detectChanges();

      const c = component as any;
      expect(c.requests().length).toBe(0);
    });
  });

  describe('Status filter', () => {
    it('should apply status filter when set', () => {
      setupCustomer();
      fixture.detectChanges();

      const c = component as any;
      c.setFilter('pending');

      expect(c.activeFilter()).toBe('pending');
      expect(serviceRequestService.getMyServiceRequests).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'pending' }),
      );
    });

    it('should reset to page 1 when filter changes', () => {
      setupCustomer();
      fixture.detectChanges();

      const c = component as any;
      c.setFilter('completed');

      expect(c.page()).toBe(1);
    });

    it('should show all statuses when filter is "all"', () => {
      setupCustomer();
      fixture.detectChanges();

      const c = component as any;
      c.setFilter('all');

      expect(c.activeFilter()).toBe('all');
      expect(serviceRequestService.getMyServiceRequests).toHaveBeenCalledWith(
        expect.not.objectContaining({ status: expect.anything() }),
      );
    });
  });

  describe('Pagination', () => {
    it('should go to next page', () => {
      setupCustomer();
      const c = component as any;
      c.totalPages.set(3);
      c.page.set(1);

      serviceRequestService.getMyServiceRequests.mockReturnValue(
        of({
          success: true,
          message: 'OK',
          data: { ...mockResponse, pagination: { page: 2, limit: 20, total: 60, totalPages: 3 } },
          errors: null,
        } as ApiResponse<ServiceRequestListResponse>),
      );

      c.nextPage();
      fixture.detectChanges();

      expect(c.page()).toBe(2);
    });

    it('should not go beyond last page', () => {
      setupCustomer();
      const c = component as any;
      c.totalPages.set(3);
      c.page.set(3);

      serviceRequestService.getMyServiceRequests.mockReturnValue(
        of({
          success: true,
          message: 'OK',
          data: { ...mockResponse, pagination: { page: 3, limit: 20, total: 60, totalPages: 3 } },
          errors: null,
        } as ApiResponse<ServiceRequestListResponse>),
      );

      c.nextPage();
      fixture.detectChanges();

      expect(c.page()).toBe(3);
    });

    it('should go to previous page', () => {
      setupCustomer();
      const c = component as any;
      c.page.set(3);

      serviceRequestService.getMyServiceRequests.mockReturnValue(
        of({
          success: true,
          message: 'OK',
          data: { ...mockResponse, pagination: { page: 2, limit: 20, total: 60, totalPages: 3 } },
          errors: null,
        } as ApiResponse<ServiceRequestListResponse>),
      );

      c.prevPage();
      fixture.detectChanges();

      expect(c.page()).toBe(2);
    });

    it('should not go below page 1', () => {
      setupCustomer();
      const c = component as any;
      c.page.set(1);

      serviceRequestService.getMyServiceRequests.mockReturnValue(
        of({
          success: true,
          message: 'OK',
          data: { ...mockResponse, pagination: { page: 1, limit: 20, total: 60, totalPages: 3 } },
          errors: null,
        } as ApiResponse<ServiceRequestListResponse>),
      );

      c.prevPage();
      fixture.detectChanges();

      expect(c.page()).toBe(1);
    });
  });

  describe('Status formatting', () => {
    it('should format status as human-readable', () => {
      const c = component as any;
      expect(c.formatStatus('pending')).toBe('Pending');
      expect(c.formatStatus('in_progress')).toBe('In Progress');
      expect(c.formatStatus('completed')).toBe('Completed');
    });
  });

  describe('Status filters', () => {
    it('should contain all status options', () => {
      const c = component as any;
      expect(c.statusFilters).toContain('all');
      expect(c.statusFilters).toContain('pending');
      expect(c.statusFilters).toContain('quoted');
      expect(c.statusFilters).toContain('accepted');
      expect(c.statusFilters).toContain('in_progress');
      expect(c.statusFilters).toContain('completed');
      expect(c.statusFilters).toContain('rejected');
      expect(c.statusFilters).toContain('cancelled');
      expect(c.statusFilters).toContain('expired');
    });
  });

  describe('Navigation', () => {
    it('should navigate to detail page on card click', () => {
      setupCustomer();
      fixture.detectChanges();

      const c = component as any;
      const navigateSpy = vi.spyOn(c.router, 'navigate').mockReturnValue(Promise.resolve(true));
      c.onRequestClick({ id: 'req-1' } as ServiceRequest);

      expect(navigateSpy).toHaveBeenCalledWith(['/service-requests', 'req-1']);
    });
  });
});
