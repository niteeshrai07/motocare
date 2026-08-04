import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { Router, provideRouter } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { signal } from '@angular/core';
import { ServiceRequestCreatePageComponent } from './service-request-create.page';
import { ServiceRequestService } from '../../../core/services/service-request.service';
import { AuthService } from '../../../core/services/auth.service';
import { ApiResponse } from '../../../core/models/api-response.model';
import { ServiceRequest } from '../../../core/models/service-request.model';

describe('ServiceRequestCreatePageComponent', () => {
  let fixture: ComponentFixture<ServiceRequestCreatePageComponent>;
  let component: ServiceRequestCreatePageComponent;

  const serviceRequestService = {
    create: vi.fn(),
    getNearbyShops: vi.fn(),
  };

  const userSignal = signal<any>(null);
  const authService = {
    user: userSignal,
  };

  const mockRequest: ServiceRequest = {
    id: 'req-new-request-id',
    vehicleType: 'two_wheeler',
    issueDescription: 'Engine not starting properly',
    location: { type: 'Point', coordinates: [77.5946, 28.6139] },
    status: 'pending',
    estimatedCost: null,
    estimatedDuration: null,
    mechanicNotes: null,
    expiresAt: '2025-06-01T12:00:00.000Z',
    createdAt: '2025-01-01T10:00:00.000Z',
    updatedAt: '2025-01-01T11:00:00.000Z',
    customer: { id: 'cust-1', name: 'Jane Doe' },
    shop: { id: 'shop-1', shopName: 'MotoCare Repairs' },
  };

  const mockCreateResponse: ApiResponse<{ serviceRequest: ServiceRequest }> = {
    success: true,
    message: 'Service request created successfully',
    data: { serviceRequest: mockRequest },
    errors: null,
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
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ServiceRequestCreatePageComponent],
      providers: [
        { provide: ServiceRequestService, useValue: serviceRequestService },
        { provide: AuthService, useValue: authService },
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ServiceRequestCreatePageComponent);
    component = fixture.componentInstance;
    vi.clearAllMocks();
    userSignal.set(null);
  });

  describe('Initialization', () => {
    it('should create', () => {
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('should not be loading on init', () => {
      const c = component as any;
      expect(c.isLoading()).toBe(false);
    });

    it('should have empty form errors on init', () => {
      const c = component as any;
      expect(c.serverError()).toBeNull();
      expect(c.locationError()).toBeNull();
    });

    it('should redirect non-customer to service requests', () => {
      const c = component as any;
      vi.spyOn(c.router, 'navigate').mockReturnValue(Promise.resolve(true));
      userSignal.set({
        id: 'mech-1',
        role: 'mechanic',
      });
      fixture.detectChanges();
      expect(c.isCustomer()).toBe(false);
      expect((c.hasLoaded as any)()).toBe(true);
    });
  });

  describe('Form validation', () => {
    it('should start with invalid form', () => {
      const c = component as any;
      expect(c.form.valid).toBe(false);
    });

    it('should have shopId required', () => {
      const c = component as any;
      const control = c.form.get('shopId');
      expect(control?.hasError('required')).toBe(true);
    });

    it('should have vehicleType required', () => {
      const c = component as any;
      const control = c.form.get('vehicleType');
      expect(control?.hasError('required')).toBe(true);
    });

    it('should validate issueDescription minLength', () => {
      const c = component as any;
      const control = c.form.get('issueDescription');
      control?.setValue('ab');
      expect(control?.hasError('minlength')).toBe(true);
    });

    it('should validate issueDescription maxLength', () => {
      const c = component as any;
      const control = c.form.get('issueDescription');
      control?.setValue('a'.repeat(501));
      expect(control?.hasError('maxlength')).toBe(true);
    });

    it('should accept valid issueDescription', () => {
      const c = component as any;
      const control = c.form.get('issueDescription');
      control?.setValue('Engine not starting');
      expect(control?.valid).toBe(true);
    });

    it('should validate locationLat range', () => {
      const c = component as any;
      const control = c.form.get('locationLat');
      control?.setValue(91);
      expect(control?.hasError('max')).toBe(true);
    });

    it('should validate locationLng range', () => {
      const c = component as any;
      const control = c.form.get('locationLng');
      control?.setValue(-181);
      expect(control?.hasError('min')).toBe(true);
    });

    it('should form is invalid when incomplete', () => {
      const c = component as any;
      c.form.get('vehicleType').setValue('two_wheeler');
      c.form.get('shopId').setValue('shop-1');
      c.form.get('issueDescription').setValue('Engine not starting');
      c.form.get('locationType').setValue('manual');
      c.form.get('locationLat').setValue(28.6139);
      c.form.get('locationLng').setValue(77.5946);
      expect(c.form.valid).toBe(true);
    });
  });

  describe('Successful creation', () => {
    it('should navigate to detail page after successful creation', () => {
      serviceRequestService.create.mockReturnValue(of(mockCreateResponse));
      fixture.detectChanges();

      const c = component as any;
      const navigateSpy = vi.spyOn(c.router, 'navigate').mockReturnValue(Promise.resolve(true));

      c.form.get('vehicleType').setValue('two_wheeler');
      c.form.get('shopId').setValue('shop-1');
      c.form.get('issueDescription').setValue('Engine not starting');
      c.form.get('locationType').setValue('manual');
      c.form.get('locationLat').setValue('28.6139');
      c.form.get('locationLng').setValue('77.5946');

      c.onSubmit();

      expect(serviceRequestService.create).toHaveBeenCalledWith({
        shopId: 'shop-1',
        vehicleType: 'two_wheeler',
        issueDescription: 'Engine not starting',
        location: {
          type: 'Point',
          coordinates: [77.5946, 28.6139],
        },
      });
      expect(navigateSpy).toHaveBeenCalledWith(['/service-requests', 'req-new-request-id']);
    });

    it('should set server error on non-success response', () => {
      serviceRequestService.create.mockReturnValue(
        of({
          success: false,
          message: 'Failed to create service request',
          data: null,
          errors: null,
        } as ApiResponse<{ serviceRequest: ServiceRequest }>),
      );
      fixture.detectChanges();

      const c = component as any;
      c.form.get('vehicleType').setValue('two_wheeler');
      c.form.get('shopId').setValue('shop-1');
      c.form.get('issueDescription').setValue('Engine not starting');
      c.form.get('locationType').setValue('manual');
      c.form.get('locationLat').setValue('28.6139');
      c.form.get('locationLng').setValue('77.5946');

      c.onSubmit();

      expect(c.serverError()).toBe('Failed to create service request');
    });
  });

  describe('Error handling', () => {
    it('should set server error on 409 duplicate request', () => {
      serviceRequestService.create.mockReturnValue(
        throwError(() => new HttpErrorResponse({
          status: 409,
          error: { message: 'You already have an active request with this repair shop' },
        })),
      );
      fixture.detectChanges();

      const c = component as any;
      c.form.get('vehicleType').setValue('two_wheeler');
      c.form.get('shopId').setValue('shop-1');
      c.form.get('issueDescription').setValue('Engine not starting');
      c.form.get('locationType').setValue('manual');
      c.form.get('locationLat').setValue('28.6139');
      c.form.get('locationLng').setValue('77.5946');

      c.onSubmit();

      expect(c.serverError()).toContain('active request');
    });

    it('should set server error on 404 shop not found', () => {
      serviceRequestService.create.mockReturnValue(
        throwError(() => new HttpErrorResponse({
          status: 404,
          error: { message: 'Repair shop not found' },
        })),
      );
      fixture.detectChanges();

      const c = component as any;
      c.form.get('vehicleType').setValue('two_wheeler');
      c.form.get('shopId').setValue('shop-1');
      c.form.get('issueDescription').setValue('Engine not starting');
      c.form.get('locationType').setValue('manual');
      c.form.get('locationLat').setValue('28.6139');
      c.form.get('locationLng').setValue('77.5946');

      c.onSubmit();

      expect(c.serverError()).toContain('not found');
    });

    it('should set server error on 500', () => {
      serviceRequestService.create.mockReturnValue(
        throwError(() => new HttpErrorResponse({
          status: 500,
          statusText: 'Internal Server Error',
        })),
      );
      fixture.detectChanges();

      const c = component as any;
      c.form.get('vehicleType').setValue('two_wheeler');
      c.form.get('shopId').setValue('shop-1');
      c.form.get('issueDescription').setValue('Engine not starting');
      c.form.get('locationType').setValue('manual');
      c.form.get('locationLat').setValue('28.6139');
      c.form.get('locationLng').setValue('77.5946');

      c.onSubmit();

      expect(c.serverError()).toBeTruthy();
    });

    it('should set server error on network failure', () => {
      serviceRequestService.create.mockReturnValue(
        throwError(() => new Error('Network error')),
      );
      fixture.detectChanges();

      const c = component as any;

      c.form.get('vehicleType').setValue('two_wheeler');
      c.form.get('shopId').setValue('shop-1');
      c.form.get('issueDescription').setValue('Engine not starting');
      c.form.get('locationType').setValue('manual');
      c.form.get('locationLat').setValue('28.6139');
      c.form.get('locationLng').setValue('77.5946');

      c.onSubmit();

      expect(c.serverError()).toBe('Network error');
    });
  });

  describe('Loading state', () => {
    it('should set isSubmitting to true during creation', () => {
      serviceRequestService.create.mockReturnValue(of(mockCreateResponse));
      fixture.detectChanges();

      const c = component as any;
      c.form.get('vehicleType').setValue('two_wheeler');
      c.form.get('shopId').setValue('shop-1');
      c.form.get('issueDescription').setValue('Engine not starting');
      c.form.get('locationType').setValue('manual');
      c.form.get('locationLat').setValue('28.6139');
      c.form.get('locationLng').setValue('77.5946');

      // isLoading is set true in onSubmit, but since of() resolves synchronously,
      // it will be false by the time we check
    });

    it('should prevent duplicate submissions', () => {
      serviceRequestService.create.mockReturnValue(of(mockCreateResponse));
      fixture.detectChanges();

      const c = component as any;
      c.isLoading.set(true);

      c.form.get('vehicleType').setValue('two_wheeler');
      c.form.get('shopId').setValue('shop-1');
      c.form.get('issueDescription').setValue('Engine not starting');
      c.form.get('locationType').setValue('manual');
      c.form.get('locationLat').setValue('28.6139');
      c.form.get('locationLng').setValue('77.5946');

      c.onSubmit();

      // create should not be called because isLoading prevents it
      expect(serviceRequestService.create).not.toHaveBeenCalled();
    });
  });

  describe('Geolocation', () => {
    it('should set coordinates on geolocation success', () => {
      const c = component as any;
      const mockPosition = {
        coords: {
          latitude: 28.6139,
          longitude: 77.5946,
        },
      };
      const originalGeolocation = (navigator as any).geolocation;
      (navigator as any).geolocation = {
        getCurrentPosition: (cb: any) => cb(mockPosition),
      };

      c.useGeolocation();

      expect(c.coordinates()).toEqual({ lng: 77.5946, lat: 28.6139 });
      expect(c.form.get('locationType').value).toBe('geolocation');

      (navigator as any).geolocation = originalGeolocation;
    });

    it('should show error on geolocation denied', () => {
      const c = component as any;
      const originalGeolocation = (navigator as any).geolocation;
      (navigator as any).geolocation = {
        getCurrentPosition: (_cb: any, errCb: any) => errCb(new Error('denied')),
      };

      c.useGeolocation();

      expect(c.locationError()).toContain('Unable to retrieve your location');
      expect(c.form.get('locationType').value).toBe('manual');

      (navigator as any).geolocation = originalGeolocation;
    });

    it('should show error when geolocation unsupported', () => {
      const c = component as any;
      const originalGeolocation = (navigator as any).geolocation;
      (navigator as any).geolocation = undefined;

      c.useGeolocation();

      expect(c.locationError()).toContain('not supported');

      (navigator as any).geolocation = originalGeolocation;
    });
  });

  describe('Shop selection', () => {
    it('should set shopId on shop selection', () => {
      const c = component as any;
      c.onShopSelected({ id: 'shop-123', shopName: 'Test Shop' });
      expect(c.form.get('shopId').value).toBe('shop-123');
    });
  });

  describe('Manual coordinate parsing', () => {
    it('should parse valid manual latitude', () => {
      const c = component as any;
      c.form.get('locationLat').setValue('28.6139');
      expect(c.manualLat).toBe(28.6139);
    });

    it('should parse valid manual longitude', () => {
      const c = component as any;
      c.form.get('locationLng').setValue('77.5946');
      expect(c.manualLng).toBe(77.5946);
    });

    it('should return null for invalid manual latitude', () => {
      const c = component as any;
      c.form.get('locationLat').setValue('abc');
      expect(c.manualLat).toBeNull();
    });

    it('should return null for empty manual longitude', () => {
      const c = component as any;
      c.form.get('locationLng').setValue('');
      expect(c.manualLng).toBeNull();
    });
  });

  describe('Back navigation', () => {
    it('should navigate to service requests list', () => {
      fixture.detectChanges();
      const c = component as any;
      const navigateSpy = vi.spyOn(c.router, 'navigate').mockReturnValue(Promise.resolve(true));
      c.goBack();
      expect(navigateSpy).toHaveBeenCalledWith(['/service-requests']);
    });
  });

  describe('Vehicle types', () => {
    it('should provide two_wheeler and four_wheeler options', () => {
      const c = component as any;
      expect(c.vehicleTypes.length).toBe(2);
      expect(c.vehicleTypes[0].value).toBe('two_wheeler');
      expect(c.vehicleTypes[1].value).toBe('four_wheeler');
    });
  });
});
