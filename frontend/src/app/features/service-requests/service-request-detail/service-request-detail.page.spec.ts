import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError, NEVER } from 'rxjs';
import { vi } from 'vitest';
import { ActivatedRoute, Router } from '@angular/router';
import { signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ServiceRequestDetailPageComponent } from './service-request-detail.page';
import { ServiceRequestService } from '../../../core/services/service-request.service';
import { AuthService } from '../../../core/services/auth.service';
import { ApiResponse } from '../../../core/models/api-response.model';
import { ServiceRequest } from '../../../core/models/service-request.model';


describe('ServiceRequestDetailPageComponent', () => {
  let fixture: ComponentFixture<ServiceRequestDetailPageComponent>;
  let component: ServiceRequestDetailPageComponent;

  const serviceRequestService = {
    getById: vi.fn(),
    accept: vi.fn(),
    cancel: vi.fn(),
    quote: vi.fn(),
    reject: vi.fn(),
    startWork: vi.fn(),
    completeWork: vi.fn(),
  };

  const router = {
    navigate: vi.fn(),
  };

  const userSignal = signal<any>(null);
  const authService = {
    user: userSignal,
  };

  const activatedRoute = {
    snapshot: {
      paramMap: {
        get: vi.fn().mockReturnValue('req-123456789'),
      },
    },
  };

  const mockRequest: ServiceRequest = {
    id: 'req-123456789',
    vehicleType: 'two_wheeler',
    issueDescription: 'Engine not starting',
    location: { type: 'Point', coordinates: [77.5946, 28.6139] },
    status: 'pending',
    estimatedCost: 5000,
    estimatedDuration: '2 hours',
    mechanicNotes: 'Will inspect the engine',
    expiresAt: '2025-06-01T12:00:00.000Z',
    createdAt: '2025-01-01T10:00:00.000Z',
    updatedAt: '2025-01-01T11:00:00.000Z',
    customer: { id: 'cust-1', name: 'Jane Doe', phone: '9876543210' },
    shop: { id: 'shop-1', shopName: 'MotoCare Repairs', phone: '1234567890' },
  };

  const mockResponse: ApiResponse<{ serviceRequest: ServiceRequest }> = {
    success: true,
    message: 'Service request fetched successfully',
    data: { serviceRequest: mockRequest },
    errors: null,
  };

  const setCustomer = () => {
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
  };

  const setMechanic = () => {
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
  };

  const setNull = () => {
    userSignal.set(null);
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ServiceRequestDetailPageComponent],
      providers: [
        { provide: ServiceRequestService, useValue: serviceRequestService },
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router },
        { provide: ActivatedRoute, useValue: activatedRoute },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ServiceRequestDetailPageComponent);
    component = fixture.componentInstance;
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should create', () => {
      serviceRequestService.getById.mockReturnValue(of(mockResponse));
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('should start in loading state', () => {
      serviceRequestService.getById.mockReturnValue(of(mockResponse));
      const c = component as any;
      expect(c.isLoading()).toBe(true);
    });

    it('should have null request on init', () => {
      serviceRequestService.getById.mockReturnValue(of(mockResponse));
      const c = component as any;
      expect(c.request()).toBeNull();
    });

    it('should have null server error on init', () => {
      serviceRequestService.getById.mockReturnValue(of(mockResponse));
      const c = component as any;
      expect(c.serverError()).toBeNull();
    });

    it('should have null success message on init', () => {
      serviceRequestService.getById.mockReturnValue(of(mockResponse));
      const c = component as any;
      expect(c.successMessage()).toBeNull();
    });

    it('should have actionInProgress null on init', () => {
      serviceRequestService.getById.mockReturnValue(of(mockResponse));
      const c = component as any;
      expect(c.actionInProgress()).toBeNull();
    });

    it('should have isConfirmingCancel false on init', () => {
      serviceRequestService.getById.mockReturnValue(of(mockResponse));
      const c = component as any;
      expect(c.isConfirmingCancel()).toBe(false);
    });

    it('should have isQuoteFormExpanded false on init', () => {
      serviceRequestService.getById.mockReturnValue(of(mockResponse));
      const c = component as any;
      expect(c.isQuoteFormExpanded()).toBe(false);
    });
  });

  describe('Loading', () => {
    it('should show loading skeleton while fetching', () => {
      serviceRequestService.getById.mockReturnValue(of(mockResponse));
      const c = component as any;
      expect(c.isLoading()).toBe(true);
    });

    it('should stop loading after successful fetch', () => {
      serviceRequestService.getById.mockReturnValue(of(mockResponse));
      fixture.detectChanges();

      const c = component as any;
      expect(c.isLoading()).toBe(false);
    });

    it('should stop loading after error', () => {
      serviceRequestService.getById.mockReturnValue(
        throwError(() => new HttpErrorResponse({ status: 500, statusText: 'Internal Server Error' })),
      );
      fixture.detectChanges();

      const c = component as any;
      expect(c.isLoading()).toBe(false);
    });
  });

  describe('Successful request loading', () => {
    it('should populate request on success', () => {
      serviceRequestService.getById.mockReturnValue(of(mockResponse));
      fixture.detectChanges();

      const c = component as any;
      expect(c.request()).toBeTruthy();
      expect(c.request().id).toBe('req-123456789');
    });

    it('should clear server error on success', () => {
      serviceRequestService.getById.mockReturnValue(of(mockResponse));
      fixture.detectChanges();

      const c = component as any;
      expect(c.serverError()).toBeNull();
    });

    it('should set server error on non-success response', () => {
      serviceRequestService.getById.mockReturnValue(
        of({
          success: false,
          message: 'Service request not found',
          data: null,
          errors: null,
        } as ApiResponse<{ serviceRequest: ServiceRequest }>),
      );
      fixture.detectChanges();

      const c = component as any;
      expect(c.serverError()).toBe('Service request not found');
    });
  });

  describe('Error state', () => {
    it('should set server error on fetch failure', () => {
      serviceRequestService.getById.mockReturnValue(
        throwError(() => new Error('Network error')),
      );
      fixture.detectChanges();

      const c = component as any;
      expect(c.serverError()).toBe('Network error');
    });
  });

  describe('404 handling', () => {
    it('should show friendly 404 message', () => {
      serviceRequestService.getById.mockReturnValue(
        throwError(() => new HttpErrorResponse({ status: 404, statusText: 'Not Found' })),
      );
      fixture.detectChanges();

      const c = component as any;
      expect(c.serverError()).toContain('Service request not found');
      expect(c.serverError()).toContain('deleted or you may not have permission');
      expect(c.request()).toBeNull();
    });

    it('should handle 403 with permission message', () => {
      serviceRequestService.getById.mockReturnValue(
        throwError(() => new HttpErrorResponse({ status: 403, statusText: 'Forbidden' })),
      );
      fixture.detectChanges();

      const c = component as any;
      expect(c.serverError()).toContain('permission');
    });

    it('should handle null data with not found message', () => {
      serviceRequestService.getById.mockReturnValue(
        of({
          success: false,
          message: 'Service request not found',
          data: null,
          errors: null,
        } as ApiResponse<{ serviceRequest: ServiceRequest }>),
      );
      fixture.detectChanges();

      const c = component as any;
      expect(c.request()).toBeNull();
    });
  });

  describe('Conditional contact visibility', () => {
    it('should show contact info for accepted status', () => {

      const acceptedRequest = { ...mockRequest, status: 'accepted' as const };
      serviceRequestService.getById.mockReturnValue(
        of({
          ...mockResponse,
          data: { serviceRequest: acceptedRequest },
        }),
      );
      fixture.detectChanges();

      const c = component as any;
      expect(c.request().customer.phone).toBeDefined();
      expect(c.request().shop.phone).toBeDefined();
    });

    it('should show contact info for in_progress status', () => {

      const inProgressRequest = { ...mockRequest, status: 'in_progress' as const };
      serviceRequestService.getById.mockReturnValue(
        of({
          ...mockResponse,
          data: { serviceRequest: inProgressRequest },
        }),
      );
      fixture.detectChanges();

      const c = component as any;
      expect(c.request().customer.phone).toBeDefined();
      expect(c.request().shop.phone).toBeDefined();
    });

    it('should show contact info for completed status', () => {

      const completedRequest = { ...mockRequest, status: 'completed' as const };
      serviceRequestService.getById.mockReturnValue(
        of({
          ...mockResponse,
          data: { serviceRequest: completedRequest },
        }),
      );
      fixture.detectChanges();

      const c = component as any;
      expect(c.request().shop.phone).toBeDefined();
    });

    it('should not have phone fields for pending status (backend strips them)', () => {

      const pendingRequestNoContact = {
        ...mockRequest,
        status: 'pending' as const,
        customer: { id: 'cust-1', name: 'Jane Doe' },
        shop: { id: 'shop-1', shopName: 'MotoCare Repairs' },
      };
      serviceRequestService.getById.mockReturnValue(
        of({
          ...mockResponse,
          data: { serviceRequest: pendingRequestNoContact },
        }),
      );
      fixture.detectChanges();

      const c = component as any;
      expect(c.request().customer.phone).toBeUndefined();
      expect(c.request().shop.phone).toBeUndefined();
    });
  });

  describe('Status badge rendering', () => {
    it('should render status badge with correct status', () => {
      serviceRequestService.getById.mockReturnValue(of(mockResponse));
      fixture.detectChanges();

      const c = component as any;
      expect(c.request().status).toBe('pending');
    });

    it('should format status correctly', () => {
      const c = component as any;
      expect(c.formatStatus('pending')).toBe('Pending');
      expect(c.formatStatus('in_progress')).toBe('In Progress');
      expect(c.formatStatus('completed')).toBe('Completed');
      expect(c.formatStatus('cancelled')).toBe('Cancelled');
    });
  });

  describe('Back navigation', () => {
    it('should navigate to service requests list', () => {
      serviceRequestService.getById.mockReturnValue(of(mockResponse));
      fixture.detectChanges();

      const c = component as any;
      c.goBack();

      expect(router.navigate).toHaveBeenCalledWith(['/service-requests']);
    });
  });

  describe('Expired status presentation', () => {
    it('should detect expired status', () => {
      const c = component as any;
      c.request.set({ ...mockRequest, status: 'expired' });
      expect(c.isExpired()).toBe(true);
    });

    it('should detect expired by date for non-expired status', () => {
      const c = component as any;
      const expiredRequest = {
        ...mockRequest,
        status: 'pending' as const,
        expiresAt: '2020-01-01T12:00:00.000Z',
      };
      c.request.set(expiredRequest);
      expect(c.isExpired()).toBe(true);
    });

    it('should not mark active request as expired', () => {
      const c = component as any;
      const futureExpiry = new Date(Date.now() + 86400000).toISOString();
      c.request.set({ ...mockRequest, expiresAt: futureExpiry });
      expect(c.isExpired()).toBe(false);
    });
  });

  describe('Coordinate formatting', () => {
    it('should format coordinates as combined string', () => {
      serviceRequestService.getById.mockReturnValue(of(mockResponse));
      fixture.detectChanges();

      const c = component as any;
      expect(c.formatCoordinates()).toBe('28.613900, 77.594600');
    });

    it('should return empty string when location is null', () => {
      const c = component as any;
      c.request.set({ ...mockRequest, location: null as any });
      expect(c.formatCoordinates()).toBe('');
    });

    it('should return empty string when coordinates missing', () => {
      const c = component as any;
      c.request.set({
        ...mockRequest,
        location: { type: 'Point', coordinates: [] },
      });
      expect(c.formatCoordinates()).toBe('');
    });

    it('should detect location presence', () => {
      serviceRequestService.getById.mockReturnValue(of(mockResponse));
      fixture.detectChanges();

      const c = component as any;
      expect(c.hasLocation()).toBe(true);
    });

    it('should detect null location', () => {
      const c = component as any;
      c.request.set({ ...mockRequest, location: null as any });
      expect(c.hasLocation()).toBe(false);
    });
  });

  describe('Helper methods', () => {
    it('should return short id', () => {
      serviceRequestService.getById.mockReturnValue(of(mockResponse));
      fixture.detectChanges();

      const c = component as any;
      expect(c.shortId()).toBe('req-1234');
    });

    it('should return full id if short', () => {

      const shortIdRequest = { ...mockRequest, id: 'abc123' };
      serviceRequestService.getById.mockReturnValue(
        of({
          ...mockResponse,
          data: { serviceRequest: shortIdRequest },
        }),
      );
      fixture.detectChanges();

      const c = component as any;
      expect(c.shortId()).toBe('abc123');
    });

    it('should return vehicle icon for two_wheeler', () => {
      const c = component as any;
      c.request.set({ ...mockRequest, vehicleType: 'two_wheeler' });
      expect(c.vehicleIcon()).toBe('🏍️');
    });

    it('should return vehicle icon for four_wheeler', () => {
      const c = component as any;
      c.request.set({ ...mockRequest, vehicleType: 'four_wheeler' });
      expect(c.vehicleIcon()).toBe('🚗');
    });

    it('should return vehicle label for two_wheeler', () => {
      const c = component as any;
      c.request.set({ ...mockRequest, vehicleType: 'two_wheeler' });
      expect(c.vehicleLabel()).toBe('Two Wheeler');
    });

    it('should return vehicle label for four_wheeler', () => {
      const c = component as any;
      c.request.set({ ...mockRequest, vehicleType: 'four_wheeler' });
      expect(c.vehicleLabel()).toBe('Four Wheeler');
    });
  });

  describe('Role-based action visibility', () => {
    it('should show actions for customer when status is quoted', () => {
      setCustomer();
      const quotedRequest = { ...mockRequest, status: 'quoted' };
      serviceRequestService.getById.mockReturnValue(
        of({ ...mockResponse, data: { serviceRequest: quotedRequest } }),
      );
      fixture.detectChanges();

      const c = component as any;
      expect(c.isCustomer()).toBe(true);
      expect(c.showActions()).toBe(true);
    });

    it('should show actions for customer when status is pending', () => {
      setCustomer();
      serviceRequestService.getById.mockReturnValue(of(mockResponse));
      fixture.detectChanges();

      const c = component as any;
      expect(c.showActions()).toBe(true);
    });

    it('should not show actions for customer when status is accepted', () => {
      setCustomer();
      const acceptedRequest = { ...mockRequest, status: 'accepted' };
      serviceRequestService.getById.mockReturnValue(
        of({ ...mockResponse, data: { serviceRequest: acceptedRequest } }),
      );
      fixture.detectChanges();

      const c = component as any;
      expect(c.showActions()).toBe(false);
    });

    it('should not show actions for customer when status is in_progress', () => {
      setCustomer();
      const inProgressRequest = { ...mockRequest, status: 'in_progress' };
      serviceRequestService.getById.mockReturnValue(
        of({ ...mockResponse, data: { serviceRequest: inProgressRequest } }),
      );
      fixture.detectChanges();

      const c = component as any;
      expect(c.showActions()).toBe(false);
    });

    it('should not show actions for customer when status is completed', () => {
      setCustomer();
      const completedRequest = { ...mockRequest, status: 'completed' };
      serviceRequestService.getById.mockReturnValue(
        of({ ...mockResponse, data: { serviceRequest: completedRequest } }),
      );
      fixture.detectChanges();

      const c = component as any;
      expect(c.showActions()).toBe(false);
    });

    it('should not show actions for customer when status is rejected', () => {
      setCustomer();
      const rejectedRequest = { ...mockRequest, status: 'rejected' };
      serviceRequestService.getById.mockReturnValue(
        of({ ...mockResponse, data: { serviceRequest: rejectedRequest } }),
      );
      fixture.detectChanges();

      const c = component as any;
      expect(c.showActions()).toBe(false);
    });

    it('should not show actions for customer when status is cancelled', () => {
      setCustomer();
      const cancelledRequest = { ...mockRequest, status: 'cancelled' };
      serviceRequestService.getById.mockReturnValue(
        of({ ...mockResponse, data: { serviceRequest: cancelledRequest } }),
      );
      fixture.detectChanges();

      const c = component as any;
      expect(c.showActions()).toBe(false);
    });

    it('should not show actions for customer when status is expired', () => {
      setCustomer();
      const expiredRequest = { ...mockRequest, status: 'expired' };
      serviceRequestService.getById.mockReturnValue(
        of({ ...mockResponse, data: { serviceRequest: expiredRequest } }),
      );
      fixture.detectChanges();

      const c = component as any;
      expect(c.showActions()).toBe(false);
    });

    it('should not show actions for mechanic when status is quoted', () => {
      setMechanic();
      const quotedRequest = { ...mockRequest, status: 'quoted' };
      serviceRequestService.getById.mockReturnValue(
        of({ ...mockResponse, data: { serviceRequest: quotedRequest } }),
      );
      fixture.detectChanges();

      const c = component as any;
      expect(c.isCustomer()).toBe(false);
      expect(c.showActions()).toBe(false);
    });

    it('should not show actions when user is null', () => {
      setNull();
      serviceRequestService.getById.mockReturnValue(of(mockResponse));
      fixture.detectChanges();

      const c = component as any;
      expect(c.isCustomer()).toBe(false);
      expect(c.showActions()).toBe(false);
    });
  });

  describe('canAccept', () => {
    it('should return true when status is quoted', () => {
      setCustomer();
      const quotedRequest = { ...mockRequest, status: 'quoted' };
      serviceRequestService.getById.mockReturnValue(
        of({ ...mockResponse, data: { serviceRequest: quotedRequest } }),
      );
      fixture.detectChanges();

      const c = component as any;
      expect(c.canAccept()).toBe(true);
    });

    it('should return false when status is pending', () => {
      setCustomer();
      serviceRequestService.getById.mockReturnValue(of(mockResponse));
      fixture.detectChanges();

      const c = component as any;
      expect(c.canAccept()).toBe(false);
    });

    it('should return false when status is accepted', () => {
      setCustomer();
      const acceptedRequest = { ...mockRequest, status: 'accepted' };
      serviceRequestService.getById.mockReturnValue(
        of({ ...mockResponse, data: { serviceRequest: acceptedRequest } }),
      );
      fixture.detectChanges();

      const c = component as any;
      expect(c.canAccept()).toBe(false);
    });
  });

  describe('canCancel', () => {
    it('should return true when status is pending', () => {
      setCustomer();
      serviceRequestService.getById.mockReturnValue(of(mockResponse));
      fixture.detectChanges();

      const c = component as any;
      expect(c.canCancel()).toBe(true);
    });

    it('should return true when status is quoted', () => {
      setCustomer();
      const quotedRequest = { ...mockRequest, status: 'quoted' };
      serviceRequestService.getById.mockReturnValue(
        of({ ...mockResponse, data: { serviceRequest: quotedRequest } }),
      );
      fixture.detectChanges();

      const c = component as any;
      expect(c.canCancel()).toBe(true);
    });

    it('should return false when status is accepted', () => {
      setCustomer();
      const acceptedRequest = { ...mockRequest, status: 'accepted' };
      serviceRequestService.getById.mockReturnValue(
        of({ ...mockResponse, data: { serviceRequest: acceptedRequest } }),
      );
      fixture.detectChanges();

      const c = component as any;
      expect(c.canCancel()).toBe(false);
    });
  });

  describe('Accept Quote', () => {
    it('should call accept with correct id', () => {
      setCustomer();
      const quotedRequest = { ...mockRequest, status: 'quoted' };
      serviceRequestService.getById.mockReturnValue(
        of({ ...mockResponse, data: { serviceRequest: quotedRequest } }),
      );
      const acceptedResponse = {
        ...mockResponse,
        message: 'Service request accepted successfully',
        data: { serviceRequest: { ...quotedRequest, status: 'accepted' } },
      };
      serviceRequestService.accept.mockReturnValue(of(acceptedResponse));
      fixture.detectChanges();

      const c = component as any;
      c.accept();

      expect(serviceRequestService.accept).toHaveBeenCalledWith('req-123456789');
    });

    it('should update request signal on accept success', () => {
      setCustomer();
      const quotedRequest = { ...mockRequest, status: 'quoted' };
      serviceRequestService.getById.mockReturnValue(
        of({ ...mockResponse, data: { serviceRequest: quotedRequest } }),
      );
      const acceptedRequest = { ...quotedRequest, status: 'accepted' };
      const acceptedResponse = {
        ...mockResponse,
        message: 'Service request accepted successfully',
        data: { serviceRequest: acceptedRequest },
      };
      serviceRequestService.accept.mockReturnValue(of(acceptedResponse));
      fixture.detectChanges();

      const c = component as any;
      c.accept();

      expect(c.request().status).toBe('accepted');
    });

    it('should set success message on accept success', () => {
      setCustomer();
      const quotedRequest = { ...mockRequest, status: 'quoted' };
      serviceRequestService.getById.mockReturnValue(
        of({ ...mockResponse, data: { serviceRequest: quotedRequest } }),
      );
      const acceptedResponse = {
        ...mockResponse,
        message: 'Service request accepted successfully',
        data: { serviceRequest: { ...quotedRequest, status: 'accepted' } },
      };
      serviceRequestService.accept.mockReturnValue(of(acceptedResponse));
      fixture.detectChanges();

      const c = component as any;
      c.accept();

      expect(c.successMessage()).toBe('Service request accepted successfully');
    });

    it('should set loading state during accept', () => {
      setCustomer();
      const quotedRequest = { ...mockRequest, status: 'quoted' };
      serviceRequestService.getById.mockReturnValue(
        of({ ...mockResponse, data: { serviceRequest: quotedRequest } }),
      );
      serviceRequestService.accept.mockReturnValue(NEVER);
      fixture.detectChanges();

      const c = component as any;
      expect(c.actionInProgress()).toBeNull();
      c.accept();
      expect(c.actionInProgress()).toBe('accept');
    });

    it('should reset accepting state after accept completes', () => {
      setCustomer();
      const quotedRequest = { ...mockRequest, status: 'quoted' };
      serviceRequestService.getById.mockReturnValue(
        of({ ...mockResponse, data: { serviceRequest: quotedRequest } }),
      );
      serviceRequestService.accept.mockReturnValue(of({
        ...mockResponse,
        message: 'Service request accepted successfully',
        data: { serviceRequest: { ...quotedRequest, status: 'accepted' } },
      }));
      fixture.detectChanges();

      const c = component as any;
      c.accept();
      expect(c.actionInProgress()).toBeNull();
    });

    it('should set server error on accept 409 conflict', () => {
      setCustomer();
      const quotedRequest = { ...mockRequest, status: 'quoted' };
      serviceRequestService.getById.mockReturnValue(
        of({ ...mockResponse, data: { serviceRequest: quotedRequest } }),
      );
      serviceRequestService.accept.mockReturnValue(
        throwError(() => new HttpErrorResponse({ status: 409 }))
      );
      fixture.detectChanges();

      const c = component as any;
      c.accept();

      expect(c.serverError()).toBe('This service request cannot be accepted at this time.');
      expect(c.actionInProgress()).toBeNull();
    });

    it('should set server error on accept 403', () => {
      setCustomer();
      const quotedRequest = { ...mockRequest, status: 'quoted' };
      serviceRequestService.getById.mockReturnValue(
        of({ ...mockResponse, data: { serviceRequest: quotedRequest } }),
      );
      serviceRequestService.accept.mockReturnValue(
        throwError(() => new HttpErrorResponse({ status: 403, statusText: 'Forbidden' }))
      );
      fixture.detectChanges();

      const c = component as any;
      c.accept();

      expect(c.serverError()).toBeTruthy();
      expect(c.actionInProgress()).toBeNull();
    });

    it('should not call accept when action is in progress', () => {
      setCustomer();
      const quotedRequest = { ...mockRequest, status: 'quoted' };
      serviceRequestService.getById.mockReturnValue(
        of({ ...mockResponse, data: { serviceRequest: quotedRequest } }),
      );
      serviceRequestService.accept.mockReturnValue(NEVER);
      fixture.detectChanges();

      const c = component as any;
      c.actionInProgress.set('cancel');
      c.accept();

      expect(serviceRequestService.accept).not.toHaveBeenCalled();
    });

    it('should not call accept when request is null', () => {
      setCustomer();
      serviceRequestService.getById.mockReturnValue(of(mockResponse));
      fixture.detectChanges();

      const c = component as any;
      c.request.set(null);
      c.accept();

      expect(serviceRequestService.accept).not.toHaveBeenCalled();
    });

    it('should clear server error and success message before accept', () => {
      setCustomer();
      const quotedRequest = { ...mockRequest, status: 'quoted' };
      serviceRequestService.getById.mockReturnValue(
        of({ ...mockResponse, data: { serviceRequest: quotedRequest } }),
      );
      serviceRequestService.accept.mockReturnValue(NEVER);
      fixture.detectChanges();

      const c = component as any;
      c.serverError.set('Old error');
      c.successMessage.set('Old success');
      c.accept();

      expect(c.serverError()).toBeNull();
      expect(c.successMessage()).toBeNull();
    });
  });

  describe('Cancel Request', () => {
    it('should start cancel confirmation', () => {
      setCustomer();
      serviceRequestService.getById.mockReturnValue(of(mockResponse));
      fixture.detectChanges();

      const c = component as any;
      c.startCancel();

      expect(c.isConfirmingCancel()).toBe(true);
    });

    it('should not start cancel confirmation when action is in progress', () => {
      setCustomer();
      serviceRequestService.getById.mockReturnValue(of(mockResponse));
      fixture.detectChanges();

      const c = component as any;
      c.actionInProgress.set('accept');
      c.startCancel();

      expect(c.isConfirmingCancel()).toBe(false);
    });

    it('should cancel confirmation', () => {
      setCustomer();
      serviceRequestService.getById.mockReturnValue(of(mockResponse));
      fixture.detectChanges();

      const c = component as any;
      c.startCancel();
      expect(c.isConfirmingCancel()).toBe(true);

      c.cancelCancel();
      expect(c.isConfirmingCancel()).toBe(false);
    });

    it('should call cancel with correct id on confirm', () => {
      setCustomer();
      serviceRequestService.getById.mockReturnValue(of(mockResponse));
      const cancelledResponse = {
        ...mockResponse,
        message: 'Service request cancelled successfully',
        data: { serviceRequest: { ...mockRequest, status: 'cancelled' } },
      };
      serviceRequestService.cancel.mockReturnValue(of(cancelledResponse));
      fixture.detectChanges();

      const c = component as any;
      c.startCancel();
      c.confirmCancel();

      expect(serviceRequestService.cancel).toHaveBeenCalledWith('req-123456789');
    });

    it('should update request signal on cancel success', () => {
      setCustomer();
      serviceRequestService.getById.mockReturnValue(of(mockResponse));
      const cancelledRequest = { ...mockRequest, status: 'cancelled' };
      const cancelledResponse = {
        ...mockResponse,
        message: 'Service request cancelled successfully',
        data: { serviceRequest: cancelledRequest },
      };
      serviceRequestService.cancel.mockReturnValue(of(cancelledResponse));
      fixture.detectChanges();

      const c = component as any;
      c.startCancel();
      c.confirmCancel();

      expect(c.request().status).toBe('cancelled');
    });

    it('should set success message on cancel success', () => {
      setCustomer();
      serviceRequestService.getById.mockReturnValue(of(mockResponse));
      const cancelledResponse = {
        ...mockResponse,
        message: 'Service request cancelled successfully',
        data: { serviceRequest: { ...mockRequest, status: 'cancelled' } },
      };
      serviceRequestService.cancel.mockReturnValue(of(cancelledResponse));
      fixture.detectChanges();

      const c = component as any;
      c.startCancel();
      c.confirmCancel();

      expect(c.successMessage()).toBe('Service request cancelled successfully');
    });

    it('should set loading state during cancel', () => {
      setCustomer();
      serviceRequestService.getById.mockReturnValue(of(mockResponse));
      serviceRequestService.cancel.mockReturnValue(NEVER);
      fixture.detectChanges();

      const c = component as any;
      c.startCancel();
      c.confirmCancel();
      expect(c.actionInProgress()).toBe('cancel');
    });

    it('should reset canceling state after cancel completes', () => {
      setCustomer();
      serviceRequestService.getById.mockReturnValue(of(mockResponse));
      serviceRequestService.cancel.mockReturnValue(of({
        ...mockResponse,
        message: 'Service request cancelled successfully',
        data: { serviceRequest: { ...mockRequest, status: 'cancelled' } },
      }));
      fixture.detectChanges();

      const c = component as any;
      c.startCancel();
      c.confirmCancel();
      expect(c.actionInProgress()).toBeNull();
    });

    it('should exit confirmation mode after cancel completes', () => {
      setCustomer();
      serviceRequestService.getById.mockReturnValue(of(mockResponse));
      serviceRequestService.cancel.mockReturnValue(of({
        ...mockResponse,
        message: 'Service request cancelled successfully',
        data: { serviceRequest: { ...mockRequest, status: 'cancelled' } },
      }));
      fixture.detectChanges();

      const c = component as any;
      c.startCancel();
      expect(c.isConfirmingCancel()).toBe(true);
      c.confirmCancel();
      expect(c.isConfirmingCancel()).toBe(false);
    });

    it('should set server error on cancel 409 conflict', () => {
      setCustomer();
      serviceRequestService.getById.mockReturnValue(of(mockResponse));
      serviceRequestService.cancel.mockReturnValue(
        throwError(() => new HttpErrorResponse({ status: 409 }))
      );
      fixture.detectChanges();

      const c = component as any;
      c.startCancel();
      c.confirmCancel();

      expect(c.serverError()).toBe('This service request cannot be cancelled at this time.');
      expect(c.actionInProgress()).toBeNull();
      expect(c.isConfirmingCancel()).toBe(false);
    });

    it('should set server error on cancel 403', () => {
      setCustomer();
      serviceRequestService.getById.mockReturnValue(of(mockResponse));
      serviceRequestService.cancel.mockReturnValue(
        throwError(() => new HttpErrorResponse({ status: 403, statusText: 'Forbidden' }))
      );
      fixture.detectChanges();

      const c = component as any;
      c.startCancel();
      c.confirmCancel();

      expect(c.serverError()).toBeTruthy();
      expect(c.actionInProgress()).toBeNull();
    });

    it('should not call cancel when action is in progress', () => {
      setCustomer();
      serviceRequestService.getById.mockReturnValue(of(mockResponse));
      serviceRequestService.cancel.mockReturnValue(NEVER);
      fixture.detectChanges();

      const c = component as any;
      c.actionInProgress.set('accept');
      c.startCancel();
      c.confirmCancel();

      expect(serviceRequestService.cancel).not.toHaveBeenCalled();
    });

    it('should not call cancel when action is in progress (via startCancel)', () => {
      setCustomer();
      serviceRequestService.getById.mockReturnValue(of(mockResponse));
      fixture.detectChanges();

      const c = component as any;
      c.actionInProgress.set('accept');
      c.startCancel();
      c.confirmCancel();

      expect(serviceRequestService.cancel).not.toHaveBeenCalled();
    });

    it('should not call cancel when request is null', () => {
      setCustomer();
      serviceRequestService.getById.mockReturnValue(of(mockResponse));
      fixture.detectChanges();

      const c = component as any;
      c.request.set(null);
      c.startCancel();
      c.confirmCancel();

       expect(serviceRequestService.cancel).not.toHaveBeenCalled();
    });
  });

  describe('Success banner auto-dismiss', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should auto-dismiss success message after 3 seconds on accept', () => {
      setCustomer();
      const quotedRequest = { ...mockRequest, status: 'quoted' };
      serviceRequestService.getById.mockReturnValue(
        of({ ...mockResponse, data: { serviceRequest: quotedRequest } }),
      );
      const acceptedResponse = {
        ...mockResponse,
        message: 'Service request accepted successfully',
        data: { serviceRequest: { ...quotedRequest, status: 'accepted' } },
      };
      serviceRequestService.accept.mockReturnValue(of(acceptedResponse));
      fixture.detectChanges();

      const c = component as any;
      c.accept();

      expect(c.successMessage()).toBe('Service request accepted successfully');

      vi.advanceTimersByTime(2999);
      expect(c.successMessage()).toBe('Service request accepted successfully');

      vi.advanceTimersByTime(1);
      expect(c.successMessage()).toBeNull();
    });

    it('should auto-dismiss success message after 3 seconds on cancel', () => {
      setCustomer();
      serviceRequestService.getById.mockReturnValue(of(mockResponse));
      const cancelledResponse = {
        ...mockResponse,
        message: 'Service request cancelled successfully',
        data: { serviceRequest: { ...mockRequest, status: 'cancelled' } },
      };
      serviceRequestService.cancel.mockReturnValue(of(cancelledResponse));
      fixture.detectChanges();

      const c = component as any;
      c.startCancel();
      c.confirmCancel();

      expect(c.successMessage()).toBe('Service request cancelled successfully');

      vi.advanceTimersByTime(3000);
      expect(c.successMessage()).toBeNull();
    });

    it('should restart timer if another success occurs before timeout', () => {
      setCustomer();
      const quotedRequest = { ...mockRequest, status: 'quoted' };
      serviceRequestService.getById.mockReturnValue(
        of({ ...mockResponse, data: { serviceRequest: quotedRequest } }),
      );
      const acceptedResponse = {
        ...mockResponse,
        message: 'Service request accepted successfully',
        data: { serviceRequest: { ...quotedRequest, status: 'accepted' } },
      };
      serviceRequestService.accept.mockReturnValue(of(acceptedResponse));
      fixture.detectChanges();

      const c = component as any;
      c.accept();

      expect(c.successMessage()).toBe('Service request accepted successfully');

      vi.advanceTimersByTime(2000);
      expect(c.successMessage()).toBe('Service request accepted successfully');

      const newQuotedRequest = { ...mockRequest, status: 'quoted', id: 'req-999999999' };
      serviceRequestService.getById.mockReturnValue(
        of({ ...mockResponse, data: { serviceRequest: newQuotedRequest } }),
      );
      serviceRequestService.accept.mockReturnValue(of({
        ...mockResponse,
        message: 'Second accept succeeded',
        data: { serviceRequest: { ...newQuotedRequest, status: 'accepted' } },
      }));

      fixture.detectChanges();
      c.request.set({ ...mockRequest, status: 'quoted' });
      c.accept();

      vi.advanceTimersByTime(2000);
      expect(c.successMessage()).toBe('Second accept succeeded');

      vi.advanceTimersByTime(999);
      expect(c.successMessage()).toBe('Second accept succeeded');

      vi.advanceTimersByTime(1);
      expect(c.successMessage()).toBeNull();
    });

    it('should clean up timeout on destroy', () => {
      setCustomer();
      const quotedRequest = { ...mockRequest, status: 'quoted' };
      serviceRequestService.getById.mockReturnValue(
        of({ ...mockResponse, data: { serviceRequest: quotedRequest } }),
      );
      const acceptedResponse = {
        ...mockResponse,
        message: 'Service request accepted successfully',
        data: { serviceRequest: { ...quotedRequest, status: 'accepted' } },
      };
      serviceRequestService.accept.mockReturnValue(of(acceptedResponse));
      fixture.detectChanges();

      const c = component as any;
      c.accept();
      expect(c.successMessage()).toBeTruthy();

      const clearTimeoutSpy = vi.spyOn(window, 'clearTimeout');
      fixture.destroy();

      expect(clearTimeoutSpy).toHaveBeenCalled();
    });
  });

  describe('Reactive signal updates', () => {
    it('should update request signal and reflect status change after accept', () => {
      setCustomer();
      const quotedRequest = { ...mockRequest, status: 'quoted' };
      serviceRequestService.getById.mockReturnValue(
        of({ ...mockResponse, data: { serviceRequest: quotedRequest } }),
      );
      const acceptedResponse = {
        ...mockResponse,
        message: 'Service request accepted successfully',
        data: { serviceRequest: { ...quotedRequest, status: 'accepted' } },
      };
      serviceRequestService.accept.mockReturnValue(of(acceptedResponse));
      fixture.detectChanges();

      const c = component as any;
      expect(c.request().status).toBe('quoted');
      expect(c.canAccept()).toBe(true);
      expect(c.canCancel()).toBe(true);

      c.accept();

      expect(c.request().status).toBe('accepted');
      expect(c.canAccept()).toBe(false);
      expect(c.canCancel()).toBe(false);
      expect(c.showActions()).toBe(false);
    });

    it('should update request signal and reflect status change after cancel', () => {
      setCustomer();
      serviceRequestService.getById.mockReturnValue(of(mockResponse));
      const cancelledResponse = {
        ...mockResponse,
        message: 'Service request cancelled successfully',
        data: { serviceRequest: { ...mockRequest, status: 'cancelled' } },
      };
      serviceRequestService.cancel.mockReturnValue(of(cancelledResponse));
      fixture.detectChanges();

      const c = component as any;
      expect(c.request().status).toBe('pending');
      expect(c.canAccept()).toBe(false);
      expect(c.canCancel()).toBe(true);
      expect(c.showActions()).toBe(true);

      c.startCancel();
      c.confirmCancel();

      expect(c.request().status).toBe('cancelled');
      expect(c.canAccept()).toBe(false);
      expect(c.canCancel()).toBe(false);
      expect(c.showActions()).toBe(false);
    });

    it('should not call accept on service while accept is in progress', () => {
      setCustomer();
      const quotedRequest = { ...mockRequest, status: 'quoted' };
      serviceRequestService.getById.mockReturnValue(
        of({ ...mockResponse, data: { serviceRequest: quotedRequest } }),
      );
      serviceRequestService.accept.mockReturnValue(NEVER);
      fixture.detectChanges();

      const c = component as any;
      c.accept();

      expect(serviceRequestService.accept.mock.calls.length).toBe(1);
      expect(c.actionInProgress()).toBe('accept');

      c.accept();

      expect(serviceRequestService.accept.mock.calls.length).toBe(1);
    });

    it('should not call cancel on service while cancel is in progress', () => {
      setCustomer();
      serviceRequestService.getById.mockReturnValue(of(mockResponse));
      serviceRequestService.cancel.mockReturnValue(NEVER);
      fixture.detectChanges();

      const c = component as any;
      c.startCancel();
      c.confirmCancel();

      expect(serviceRequestService.cancel.mock.calls.length).toBe(1);
      expect(c.actionInProgress()).toBe('cancel');

      c.startCancel();
      c.confirmCancel();

      expect(serviceRequestService.cancel.mock.calls.length).toBe(1);
    });
  });

  describe('Mechanic - Quote', () => {
    it('should call quote with correct payload', () => {
      setMechanic();
      const pendingRequest = { ...mockRequest, status: 'pending' };
      serviceRequestService.getById.mockReturnValue(
        of({ ...mockResponse, data: { serviceRequest: pendingRequest } }),
      );
      const quotedResponse = {
        ...mockResponse,
        message: 'Service request quoted successfully',
        data: { serviceRequest: { ...pendingRequest, status: 'quoted', estimatedCost: 3000, estimatedDuration: '2 hours' } },
      };
      serviceRequestService.quote.mockReturnValue(of(quotedResponse));
      fixture.detectChanges();

      const c = component as any;
      c.quoteForm.controls.estimatedCost.setValue(3000);
      c.quoteForm.controls.estimatedDuration.setValue('2 hours');
      c.toggleQuoteForm();
      c.submitQuote();

      expect(serviceRequestService.quote).toHaveBeenCalledWith('req-123456789', {
        estimatedCost: 3000,
        estimatedDuration: '2 hours',
        mechanicNotes: undefined,
      });
    });

    it('should show Quote and Reject buttons for mechanic on pending request', () => {
      setMechanic();
      const pendingRequest = { ...mockRequest, status: 'pending' };
      serviceRequestService.getById.mockReturnValue(
        of({ ...mockResponse, data: { serviceRequest: pendingRequest } }),
      );
      fixture.detectChanges();

      const c = component as any;
      expect(c.isMechanic()).toBe(true);
      expect(c.canQuote()).toBe(true);
      expect(c.canReject()).toBe(true);
      expect(c.showMechanicActions()).toBe(true);
    });

    it('should expand quote form when Quote clicked', () => {
      setMechanic();
      const pendingRequest = { ...mockRequest, status: 'pending' };
      serviceRequestService.getById.mockReturnValue(
        of({ ...mockResponse, data: { serviceRequest: pendingRequest } }),
      );
      fixture.detectChanges();

      const c = component as any;
      expect(c.isQuoteFormExpanded()).toBe(false);
      c.toggleQuoteForm();
      expect(c.isQuoteFormExpanded()).toBe(true);
    });

    it('should collapse quote form when Cancel clicked', () => {
      setMechanic();
      const pendingRequest = { ...mockRequest, status: 'pending' };
      serviceRequestService.getById.mockReturnValue(
        of({ ...mockResponse, data: { serviceRequest: pendingRequest } }),
      );
      fixture.detectChanges();

      const c = component as any;
      c.toggleQuoteForm();
      expect(c.isQuoteFormExpanded()).toBe(true);
      c.toggleQuoteForm();
      expect(c.isQuoteFormExpanded()).toBe(false);
    });

    it('should not submit quote when form is invalid', () => {
      setMechanic();
      const pendingRequest = { ...mockRequest, status: 'pending' };
      serviceRequestService.getById.mockReturnValue(
        of({ ...mockResponse, data: { serviceRequest: pendingRequest } }),
      );
      fixture.detectChanges();

      const c = component as any;
      c.toggleQuoteForm();
      c.submitQuote();

      expect(serviceRequestService.quote).not.toHaveBeenCalled();
    });

    it('should not submit quote when action is in progress', () => {
      setMechanic();
      const pendingRequest = { ...mockRequest, status: 'pending' };
      serviceRequestService.getById.mockReturnValue(
        of({ ...mockResponse, data: { serviceRequest: pendingRequest } }),
      );
      serviceRequestService.quote.mockReturnValue(NEVER);
      fixture.detectChanges();

      const c = component as any;
      c.quoteForm.controls.estimatedCost.setValue(3000);
      c.quoteForm.controls.estimatedDuration.setValue('2 hours');
      c.toggleQuoteForm();
      c.submitQuote();

      expect(serviceRequestService.quote.mock.calls.length).toBe(1);
      expect(c.actionInProgress()).toBe('quote');

      c.submitQuote();
      expect(serviceRequestService.quote.mock.calls.length).toBe(1);
    });

    it('should update request signal on successful quote', () => {
      setMechanic();
      const pendingRequest = { ...mockRequest, status: 'pending' };
      serviceRequestService.getById.mockReturnValue(
        of({ ...mockResponse, data: { serviceRequest: pendingRequest } }),
      );
      const quotedRequest = { ...pendingRequest, status: 'quoted', estimatedCost: 3000, estimatedDuration: '2 hours' };
      serviceRequestService.quote.mockReturnValue(of({
        ...mockResponse,
        message: 'Service request quoted successfully',
        data: { serviceRequest: quotedRequest },
      }));
      fixture.detectChanges();

      const c = component as any;
      c.quoteForm.controls.estimatedCost.setValue(3000);
      c.quoteForm.controls.estimatedDuration.setValue('2 hours');
      c.toggleQuoteForm();
      c.submitQuote();

      expect(c.request().status).toBe('quoted');
      expect(c.request().estimatedCost).toBe(3000);
      expect(c.isQuoteFormExpanded()).toBe(false);
    });

    it('should show success message on successful quote', () => {
      setMechanic();
      const pendingRequest = { ...mockRequest, status: 'pending' };
      serviceRequestService.getById.mockReturnValue(
        of({ ...mockResponse, data: { serviceRequest: pendingRequest } }),
      );
      serviceRequestService.quote.mockReturnValue(of({
        ...mockResponse,
        message: 'Service request quoted successfully',
        data: { serviceRequest: { ...pendingRequest, status: 'quoted' } },
      }));
      fixture.detectChanges();

      const c = component as any;
      c.quoteForm.controls.estimatedCost.setValue(3000);
      c.quoteForm.controls.estimatedDuration.setValue('2 hours');
      c.toggleQuoteForm();
      c.submitQuote();

      expect(c.successMessage()).toBe('Service request quoted successfully');
    });

    it('should set server error on quote 409', () => {
      setMechanic();
      const pendingRequest = { ...mockRequest, status: 'pending' };
      serviceRequestService.getById.mockReturnValue(
        of({ ...mockResponse, data: { serviceRequest: pendingRequest } }),
      );
      serviceRequestService.quote.mockReturnValue(
        throwError(() => new HttpErrorResponse({ status: 409 }))
      );
      fixture.detectChanges();

      const c = component as any;
      c.quoteForm.controls.estimatedCost.setValue(3000);
      c.quoteForm.controls.estimatedDuration.setValue('2 hours');
      c.toggleQuoteForm();
      c.submitQuote();

      expect(c.serverError()).toBe('This service request cannot be quoted at this time.');
      expect(c.actionInProgress()).toBeNull();
    });

    it('should set server error on quote 403', () => {
      setMechanic();
      const pendingRequest = { ...mockRequest, status: 'pending' };
      serviceRequestService.getById.mockReturnValue(
        of({ ...mockResponse, data: { serviceRequest: pendingRequest } }),
      );
      serviceRequestService.quote.mockReturnValue(
        throwError(() => new HttpErrorResponse({ status: 403 }))
      );
      fixture.detectChanges();

      const c = component as any;
      c.quoteForm.controls.estimatedCost.setValue(3000);
      c.quoteForm.controls.estimatedDuration.setValue('2 hours');
      c.toggleQuoteForm();
      c.submitQuote();

      expect(c.serverError()).toBeTruthy();
      expect(c.actionInProgress()).toBeNull();
    });

    it('should set server error on quote 422 validation error', () => {
      setMechanic();
      const pendingRequest = { ...mockRequest, status: 'pending' };
      serviceRequestService.getById.mockReturnValue(
        of({ ...mockResponse, data: { serviceRequest: pendingRequest } }),
      );
      serviceRequestService.quote.mockReturnValue(
        throwError(() => new HttpErrorResponse({ status: 422 }))
      );
      fixture.detectChanges();

      const c = component as any;
      c.quoteForm.controls.estimatedCost.setValue(3000);
      c.quoteForm.controls.estimatedDuration.setValue('2 hours');
      c.toggleQuoteForm();
      c.submitQuote();

      expect(c.serverError()).toBe('Please fill in all required fields.');
      expect(c.actionInProgress()).toBeNull();
    });

    it('should not show quote form when action is in progress', () => {
      setMechanic();
      const pendingRequest = { ...mockRequest, status: 'pending' };
      serviceRequestService.getById.mockReturnValue(
        of({ ...mockResponse, data: { serviceRequest: pendingRequest } }),
      );
      serviceRequestService.quote.mockReturnValue(NEVER);
      fixture.detectChanges();

      const c = component as any;
      c.quoteForm.controls.estimatedCost.setValue(3000);
      c.quoteForm.controls.estimatedDuration.setValue('2 hours');
      c.toggleQuoteForm();
      c.submitQuote();

      expect(c.actionInProgress()).toBe('quote');
      c.toggleQuoteForm();
      expect(c.isQuoteFormExpanded()).toBe(true);
    });

    it('should not call quote when request is null', () => {
      setMechanic();
      serviceRequestService.getById.mockReturnValue(of(mockResponse));
      fixture.detectChanges();

      const c = component as any;
      c.request.set(null);
      c.toggleQuoteForm();

      expect(c.isQuoteFormExpanded()).toBe(true);
    });
  });

  describe('Mechanic - Reject', () => {
    it('should show Reject button for mechanic on pending', () => {
      setMechanic();
      const pendingRequest = { ...mockRequest, status: 'pending' };
      serviceRequestService.getById.mockReturnValue(
        of({ ...mockResponse, data: { serviceRequest: pendingRequest } }),
      );
      fixture.detectChanges();

      const c = component as any;
      expect(c.canReject()).toBe(true);
    });

    it('should start reject confirmation', () => {
      setMechanic();
      const pendingRequest = { ...mockRequest, status: 'pending' };
      serviceRequestService.getById.mockReturnValue(
        of({ ...mockResponse, data: { serviceRequest: pendingRequest } }),
      );
      fixture.detectChanges();

      const c = component as any;
      expect(c.isConfirmingReject()).toBe(false);
      c.startReject();
      expect(c.isConfirmingReject()).toBe(true);
    });

    it('should call reject with correct id on confirm', () => {
      setMechanic();
      const pendingRequest = { ...mockRequest, status: 'pending' };
      serviceRequestService.getById.mockReturnValue(
        of({ ...mockResponse, data: { serviceRequest: pendingRequest } }),
      );
      const rejectedResponse = {
        ...mockResponse,
        message: 'Service request rejected successfully',
        data: { serviceRequest: { ...pendingRequest, status: 'rejected' } },
      };
      serviceRequestService.reject.mockReturnValue(of(rejectedResponse));
      fixture.detectChanges();

      const c = component as any;
      c.startReject();
      c.confirmReject();

      expect(serviceRequestService.reject).toHaveBeenCalledWith('req-123456789');
    });

    it('should update request signal on successful reject', () => {
      setMechanic();
      const pendingRequest = { ...mockRequest, status: 'pending' };
      serviceRequestService.getById.mockReturnValue(
        of({ ...mockResponse, data: { serviceRequest: pendingRequest } }),
      );
      serviceRequestService.reject.mockReturnValue(of({
        ...mockResponse,
        message: 'Service request rejected successfully',
        data: { serviceRequest: { ...pendingRequest, status: 'rejected' } },
      }));
      fixture.detectChanges();

      const c = component as any;
      c.startReject();
      c.confirmReject();

      expect(c.request().status).toBe('rejected');
      expect(c.isConfirmingReject()).toBe(false);
    });

    it('should show success message on successful reject', () => {
      setMechanic();
      const pendingRequest = { ...mockRequest, status: 'pending' };
      serviceRequestService.getById.mockReturnValue(
        of({ ...mockResponse, data: { serviceRequest: pendingRequest } }),
      );
      serviceRequestService.reject.mockReturnValue(of({
        ...mockResponse,
        message: 'Service request rejected successfully',
        data: { serviceRequest: { ...pendingRequest, status: 'rejected' } },
      }));
      fixture.detectChanges();

      const c = component as any;
      c.startReject();
      c.confirmReject();

      expect(c.successMessage()).toBe('Service request rejected successfully');
    });

    it('should set server error on reject 409', () => {
      setMechanic();
      const pendingRequest = { ...mockRequest, status: 'pending' };
      serviceRequestService.getById.mockReturnValue(
        of({ ...mockResponse, data: { serviceRequest: pendingRequest } }),
      );
      serviceRequestService.reject.mockReturnValue(
        throwError(() => new HttpErrorResponse({ status: 409 }))
      );
      fixture.detectChanges();

      const c = component as any;
      c.startReject();
      c.confirmReject();

      expect(c.serverError()).toBe('This service request cannot be rejected at this time.');
      expect(c.actionInProgress()).toBeNull();
      expect(c.isConfirmingReject()).toBe(false);
    });

    it('should set server error on reject 403', () => {
      setMechanic();
      const pendingRequest = { ...mockRequest, status: 'pending' };
      serviceRequestService.getById.mockReturnValue(
        of({ ...mockResponse, data: { serviceRequest: pendingRequest } }),
      );
      serviceRequestService.reject.mockReturnValue(
        throwError(() => new HttpErrorResponse({ status: 403 }))
      );
      fixture.detectChanges();

      const c = component as any;
      c.startReject();
      c.confirmReject();

      expect(c.serverError()).toBeTruthy();
      expect(c.actionInProgress()).toBeNull();
    });

    it('should cancel reject confirmation', () => {
      setMechanic();
      const pendingRequest = { ...mockRequest, status: 'pending' };
      serviceRequestService.getById.mockReturnValue(
        of({ ...mockResponse, data: { serviceRequest: pendingRequest } }),
      );
      fixture.detectChanges();

      const c = component as any;
      c.startReject();
      expect(c.isConfirmingReject()).toBe(true);
      c.cancelReject();
      expect(c.isConfirmingReject()).toBe(false);
    });

    it('should not start reject when action is in progress', () => {
      setMechanic();
      const pendingRequest = { ...mockRequest, status: 'pending' };
      serviceRequestService.getById.mockReturnValue(
        of({ ...mockResponse, data: { serviceRequest: pendingRequest } }),
      );
      fixture.detectChanges();

      const c = component as any;
      c.actionInProgress.set('quote');
      c.startReject();

      expect(c.isConfirmingReject()).toBe(false);
    });

    it('should not call reject on duplicate clicks while in progress', () => {
      setMechanic();
      const pendingRequest = { ...mockRequest, status: 'pending' };
      serviceRequestService.getById.mockReturnValue(
        of({ ...mockResponse, data: { serviceRequest: pendingRequest } }),
      );
      serviceRequestService.reject.mockReturnValue(NEVER);
      fixture.detectChanges();

      const c = component as any;
      c.startReject();
      c.confirmReject();

      expect(serviceRequestService.reject.mock.calls.length).toBe(1);
      expect(c.actionInProgress()).toBe('reject');

      c.startReject();
      c.confirmReject();

      expect(serviceRequestService.reject.mock.calls.length).toBe(1);
    });
  });

  describe('Mechanic - Start Work', () => {
    it('should show Start Work button for mechanic on accepted', () => {
      setMechanic();
      const acceptedRequest = { ...mockRequest, status: 'accepted' };
      serviceRequestService.getById.mockReturnValue(
        of({ ...mockResponse, data: { serviceRequest: acceptedRequest } }),
      );
      fixture.detectChanges();

      const c = component as any;
      expect(c.isMechanic()).toBe(true);
      expect(c.canStart()).toBe(true);
      expect(c.showMechanicActions()).toBe(true);
    });

    it('should call startWork with correct id', () => {
      setMechanic();
      const acceptedRequest = { ...mockRequest, status: 'accepted' };
      serviceRequestService.getById.mockReturnValue(
        of({ ...mockResponse, data: { serviceRequest: acceptedRequest } }),
      );
      const inProgressResponse = {
        ...mockResponse,
        message: 'Service request started successfully',
        data: { serviceRequest: { ...acceptedRequest, status: 'in_progress' } },
      };
      serviceRequestService.startWork.mockReturnValue(of(inProgressResponse));
      fixture.detectChanges();

      const c = component as any;
      c.startWork();

      expect(serviceRequestService.startWork).toHaveBeenCalledWith('req-123456789');
    });

    it('should update request signal on successful start', () => {
      setMechanic();
      const acceptedRequest = { ...mockRequest, status: 'accepted' };
      serviceRequestService.getById.mockReturnValue(
        of({ ...mockResponse, data: { serviceRequest: acceptedRequest } }),
      );
      serviceRequestService.startWork.mockReturnValue(of({
        ...mockResponse,
        message: 'Service request started successfully',
        data: { serviceRequest: { ...acceptedRequest, status: 'in_progress' } },
      }));
      fixture.detectChanges();

      const c = component as any;
      c.startWork();

      expect(c.request().status).toBe('in_progress');
    });

    it('should show success message on successful start', () => {
      setMechanic();
      const acceptedRequest = { ...mockRequest, status: 'accepted' };
      serviceRequestService.getById.mockReturnValue(
        of({ ...mockResponse, data: { serviceRequest: acceptedRequest } }),
      );
      serviceRequestService.startWork.mockReturnValue(of({
        ...mockResponse,
        message: 'Service request started successfully',
        data: { serviceRequest: { ...acceptedRequest, status: 'in_progress' } },
      }));
      fixture.detectChanges();

      const c = component as any;
      c.startWork();

      expect(c.successMessage()).toBe('Service request started successfully');
    });

    it('should set server error on start 409', () => {
      setMechanic();
      const acceptedRequest = { ...mockRequest, status: 'accepted' };
      serviceRequestService.getById.mockReturnValue(
        of({ ...mockResponse, data: { serviceRequest: acceptedRequest } }),
      );
      serviceRequestService.startWork.mockReturnValue(
        throwError(() => new HttpErrorResponse({ status: 409 }))
      );
      fixture.detectChanges();

      const c = component as any;
      c.startWork();

      expect(c.serverError()).toBe('This service request cannot be started at this time.');
      expect(c.actionInProgress()).toBeNull();
    });

    it('should set server error on start 403', () => {
      setMechanic();
      const acceptedRequest = { ...mockRequest, status: 'accepted' };
      serviceRequestService.getById.mockReturnValue(
        of({ ...mockResponse, data: { serviceRequest: acceptedRequest } }),
      );
      serviceRequestService.startWork.mockReturnValue(
        throwError(() => new HttpErrorResponse({ status: 403 }))
      );
      fixture.detectChanges();

      const c = component as any;
      c.startWork();

      expect(c.serverError()).toBeTruthy();
      expect(c.actionInProgress()).toBeNull();
    });

    it('should not call startWork when action is in progress', () => {
      setMechanic();
      const acceptedRequest = { ...mockRequest, status: 'accepted' };
      serviceRequestService.getById.mockReturnValue(
        of({ ...mockResponse, data: { serviceRequest: acceptedRequest } }),
      );
      serviceRequestService.startWork.mockReturnValue(NEVER);
      fixture.detectChanges();

      const c = component as any;
      c.actionInProgress.set('quote');
      c.startWork();

      expect(serviceRequestService.startWork).not.toHaveBeenCalled();
    });
  });

  describe('Mechanic - Complete Work', () => {
    it('should show Complete Work button for mechanic on in_progress', () => {
      setMechanic();
      const inProgressRequest = { ...mockRequest, status: 'in_progress' };
      serviceRequestService.getById.mockReturnValue(
        of({ ...mockResponse, data: { serviceRequest: inProgressRequest } }),
      );
      fixture.detectChanges();

      const c = component as any;
      expect(c.isMechanic()).toBe(true);
      expect(c.canComplete()).toBe(true);
      expect(c.showMechanicActions()).toBe(true);
    });

    it('should call completeWork with correct id', () => {
      setMechanic();
      const inProgressRequest = { ...mockRequest, status: 'in_progress' };
      serviceRequestService.getById.mockReturnValue(
        of({ ...mockResponse, data: { serviceRequest: inProgressRequest } }),
      );
      const completedResponse = {
        ...mockResponse,
        message: 'Service request completed successfully',
        data: { serviceRequest: { ...inProgressRequest, status: 'completed' } },
      };
      serviceRequestService.completeWork.mockReturnValue(of(completedResponse));
      fixture.detectChanges();

      const c = component as any;
      c.completeWork();

      expect(serviceRequestService.completeWork).toHaveBeenCalledWith('req-123456789');
    });

    it('should update request signal on successful complete', () => {
      setMechanic();
      const inProgressRequest = { ...mockRequest, status: 'in_progress' };
      serviceRequestService.getById.mockReturnValue(
        of({ ...mockResponse, data: { serviceRequest: inProgressRequest } }),
      );
      serviceRequestService.completeWork.mockReturnValue(of({
        ...mockResponse,
        message: 'Service request completed successfully',
        data: { serviceRequest: { ...inProgressRequest, status: 'completed' } },
      }));
      fixture.detectChanges();

      const c = component as any;
      c.completeWork();

      expect(c.request().status).toBe('completed');
    });

    it('should show success message on successful complete', () => {
      setMechanic();
      const inProgressRequest = { ...mockRequest, status: 'in_progress' };
      serviceRequestService.getById.mockReturnValue(
        of({ ...mockResponse, data: { serviceRequest: inProgressRequest } }),
      );
      serviceRequestService.completeWork.mockReturnValue(of({
        ...mockResponse,
        message: 'Service request completed successfully',
        data: { serviceRequest: { ...inProgressRequest, status: 'completed' } },
      }));
      fixture.detectChanges();

      const c = component as any;
      c.completeWork();

      expect(c.successMessage()).toBe('Service request completed successfully');
    });

    it('should set server error on complete 409', () => {
      setMechanic();
      const inProgressRequest = { ...mockRequest, status: 'in_progress' };
      serviceRequestService.getById.mockReturnValue(
        of({ ...mockResponse, data: { serviceRequest: inProgressRequest } }),
      );
      serviceRequestService.completeWork.mockReturnValue(
        throwError(() => new HttpErrorResponse({ status: 409 }))
      );
      fixture.detectChanges();

      const c = component as any;
      c.completeWork();

      expect(c.serverError()).toBe('This service request cannot be completed at this time.');
      expect(c.actionInProgress()).toBeNull();
    });

    it('should set server error on complete 403', () => {
      setMechanic();
      const inProgressRequest = { ...mockRequest, status: 'in_progress' };
      serviceRequestService.getById.mockReturnValue(
        of({ ...mockResponse, data: { serviceRequest: inProgressRequest } }),
      );
      serviceRequestService.completeWork.mockReturnValue(
        throwError(() => new HttpErrorResponse({ status: 403 }))
      );
      fixture.detectChanges();

      const c = component as any;
      c.completeWork();

      expect(c.serverError()).toBeTruthy();
      expect(c.actionInProgress()).toBeNull();
    });

    it('should not call completeWork when action is in progress', () => {
      setMechanic();
      const inProgressRequest = { ...mockRequest, status: 'in_progress' };
      serviceRequestService.getById.mockReturnValue(
        of({ ...mockResponse, data: { serviceRequest: inProgressRequest } }),
      );
      serviceRequestService.completeWork.mockReturnValue(NEVER);
      fixture.detectChanges();

      const c = component as any;
      c.actionInProgress.set('quote');
      c.completeWork();

      expect(serviceRequestService.completeWork).not.toHaveBeenCalled();
    });
  });

  describe('Mechanic - Role and Status Visibility', () => {
    it('should not show Start Work for customer', () => {
      setCustomer();
      const acceptedRequest = { ...mockRequest, status: 'accepted' };
      serviceRequestService.getById.mockReturnValue(
        of({ ...mockResponse, data: { serviceRequest: acceptedRequest } }),
      );
      fixture.detectChanges();

      const c = component as any;
      expect(c.isMechanic()).toBe(false);
      expect(c.showMechanicActions()).toBe(false);
    });

    it('should not show Quote for customer', () => {
      setCustomer();
      serviceRequestService.getById.mockReturnValue(of(mockResponse));
      fixture.detectChanges();

      const c = component as any;
      expect(c.isMechanic()).toBe(false);
      expect(c.canQuote()).toBe(true);
      expect(c.showMechanicActions()).toBe(false);
    });

    it('should not show mechanic actions when user is null', () => {
      setNull();
      const pendingRequest = { ...mockRequest, status: 'pending' };
      serviceRequestService.getById.mockReturnValue(
        of({ ...mockResponse, data: { serviceRequest: pendingRequest } }),
      );
      fixture.detectChanges();

      const c = component as any;
      expect(c.isMechanic()).toBe(false);
      expect(c.showMechanicActions()).toBe(false);
    });

    it('should not show Quote/Reject when status is quoted', () => {
      setMechanic();
      const quotedRequest = { ...mockRequest, status: 'quoted' };
      serviceRequestService.getById.mockReturnValue(
        of({ ...mockResponse, data: { serviceRequest: quotedRequest } }),
      );
      fixture.detectChanges();

      const c = component as any;
      expect(c.canQuote()).toBe(false);
      expect(c.canReject()).toBe(false);
      expect(c.canStart()).toBe(false);
      expect(c.canComplete()).toBe(false);
      expect(c.showMechanicActions()).toBe(false);
    });

    it('should not show Start Work when status is quoted', () => {
      setMechanic();
      const quotedRequest = { ...mockRequest, status: 'quoted' };
      serviceRequestService.getById.mockReturnValue(
        of({ ...mockResponse, data: { serviceRequest: quotedRequest } }),
      );
      fixture.detectChanges();

      const c = component as any;
      expect(c.canStart()).toBe(false);
    });

    it('should not show Complete Work when status is accepted', () => {
      setMechanic();
      const acceptedRequest = { ...mockRequest, status: 'accepted' };
      serviceRequestService.getById.mockReturnValue(
        of({ ...mockResponse, data: { serviceRequest: acceptedRequest } }),
      );
      fixture.detectChanges();

      const c = component as any;
      expect(c.canComplete()).toBe(false);
    });
  });

  describe('Mechanic - Reactive Updates', () => {
    it('should disappear all mechanics buttons after quote', () => {
      setMechanic();
      const pendingRequest = { ...mockRequest, status: 'pending' };
      serviceRequestService.getById.mockReturnValue(
        of({ ...mockResponse, data: { serviceRequest: pendingRequest } }),
      );
      serviceRequestService.quote.mockReturnValue(of({
        ...mockResponse,
        message: 'Service request quoted successfully',
        data: { serviceRequest: { ...pendingRequest, status: 'quoted' } },
      }));
      fixture.detectChanges();

      const c = component as any;
      expect(c.showMechanicActions()).toBe(true);
      expect(c.canQuote()).toBe(true);
      expect(c.canReject()).toBe(true);

      c.quoteForm.controls.estimatedCost.setValue(3000);
      c.quoteForm.controls.estimatedDuration.setValue('2 hours');
      c.toggleQuoteForm();
      c.submitQuote();

      expect(c.request().status).toBe('quoted');
      expect(c.showMechanicActions()).toBe(false);
      expect(c.canQuote()).toBe(false);
      expect(c.canReject()).toBe(false);
    });

    it('should disappear all mechanics buttons after reject', () => {
      setMechanic();
      const pendingRequest = { ...mockRequest, status: 'pending' };
      serviceRequestService.getById.mockReturnValue(
        of({ ...mockResponse, data: { serviceRequest: pendingRequest } }),
      );
      serviceRequestService.reject.mockReturnValue(of({
        ...mockResponse,
        message: 'Service request rejected successfully',
        data: { serviceRequest: { ...pendingRequest, status: 'rejected' } },
      }));
      fixture.detectChanges();

      const c = component as any;
      expect(c.showMechanicActions()).toBe(true);
      c.startReject();
      c.confirmReject();

      expect(c.request().status).toBe('rejected');
      expect(c.showMechanicActions()).toBe(false);
    });

    it('should disappear Start Work and show Complete Work after start (via signal update)', () => {
      setMechanic();
      const acceptedRequest = { ...mockRequest, status: 'accepted' };
      serviceRequestService.getById.mockReturnValue(
        of({ ...mockResponse, data: { serviceRequest: acceptedRequest } }),
      );
      serviceRequestService.startWork.mockReturnValue(of({
        ...mockResponse,
        message: 'Service request started successfully',
        data: { serviceRequest: { ...acceptedRequest, status: 'in_progress' } },
      }));
      fixture.detectChanges();

      const c = component as any;
      expect(c.canStart()).toBe(true);
      expect(c.canComplete()).toBe(false);

      c.startWork();

      expect(c.request().status).toBe('in_progress');
      expect(c.canStart()).toBe(false);
      expect(c.canComplete()).toBe(true);
    });

    it('should disappear all buttons after complete', () => {
      setMechanic();
      const inProgressRequest = { ...mockRequest, status: 'in_progress' };
      serviceRequestService.getById.mockReturnValue(
        of({ ...mockResponse, data: { serviceRequest: inProgressRequest } }),
      );
      serviceRequestService.completeWork.mockReturnValue(of({
        ...mockResponse,
        message: 'Service request completed successfully',
        data: { serviceRequest: { ...inProgressRequest, status: 'completed' } },
      }));
      fixture.detectChanges();

      const c = component as any;
      expect(c.canComplete()).toBe(true);

      c.completeWork();

      expect(c.request().status).toBe('completed');
      expect(c.showMechanicActions()).toBe(false);
      expect(c.canComplete()).toBe(false);
    });

    it('should not call additional GET after PATCH succeeds', () => {
      setMechanic();
      const pendingRequest = { ...mockRequest, status: 'pending' };
      serviceRequestService.getById.mockReturnValue(
        of({ ...mockResponse, data: { serviceRequest: pendingRequest } }),
      );
      serviceRequestService.quote.mockReturnValue(of({
        ...mockResponse,
        message: 'Service request quoted successfully',
        data: { serviceRequest: { ...pendingRequest, status: 'quoted' } },
      }));
      fixture.detectChanges();

      const c = component as any;
      c.quoteForm.controls.estimatedCost.setValue(3000);
      c.quoteForm.controls.estimatedDuration.setValue('2 hours');
      c.toggleQuoteForm();
      c.submitQuote();

      expect(serviceRequestService.getById.mock.calls.length).toBe(1);
      expect(serviceRequestService.quote.mock.calls.length).toBe(1);
    });
  });
});
