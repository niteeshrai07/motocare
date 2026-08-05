import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError, NEVER } from 'rxjs';
import { vi } from 'vitest';
import { signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { RepairShopPageComponent } from './repair-shop.page';
import { RepairShopService } from '../../core/services/repair-shop.service';
import { AuthService } from '../../core/services/auth.service';
import { Router } from '@angular/router';
import { ApiResponse } from '../../core/models/api-response.model';
import { RepairShop } from '../../core/models/repair-shop.model';

describe('RepairShopPageComponent', () => {
  let fixture: ComponentFixture<RepairShopPageComponent>;
  let component: RepairShopPageComponent;

  const repairShopService = {
    getMyShop: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  };

  const authService = {
    user: signal<any>({
      id: 'mech-1',
      name: 'John Smith',
      email: 'john@example.com',
      phone: '9876543210',
      role: 'mechanic',
      isActive: true,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    }),
  };

  const router = {
    navigate: vi.fn(),
  };

  const mockShop: RepairShop = {
    id: 'shop-12345678',
    shopName: 'MotoCare Repairs',
    vehicleTypesServiced: ['two_wheeler', 'four_wheeler'],
    location: { type: 'Point', coordinates: [77.5946, 28.6139] },
    address: '123 Service Street, Delhi',
    phone: '9876543210',
    description: 'Best repair shop in town',
    openingHours: 'Mon-Fri: 9am-6pm',
    photoUrl: 'https://example.com/photo.jpg',
    rating: 4.5,
    status: 'verified',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  };

  const mockResponse: ApiResponse<{ repairShop: RepairShop }> = {
    success: true,
    message: 'Repair shop fetched successfully',
    data: { repairShop: mockShop },
    errors: null,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RepairShopPageComponent],
      providers: [
        { provide: RepairShopService, useValue: repairShopService },
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RepairShopPageComponent);
    component = fixture.componentInstance;
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should create', () => {
      repairShopService.getMyShop.mockReturnValue(of(mockResponse));
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('should start in loading state', () => {
      repairShopService.getMyShop.mockReturnValue(of(mockResponse));
      const c = component as any;
      expect(c.isLoading()).toBe(true);
    });

    it('should have null shop on init', () => {
      repairShopService.getMyShop.mockReturnValue(of(mockResponse));
      const c = component as any;
      expect(c.shop()).toBeNull();
    });

    it('should have isEditMode false on init', () => {
      repairShopService.getMyShop.mockReturnValue(of(mockResponse));
      const c = component as any;
      expect(c.isEditMode()).toBe(false);
    });

    it('should have isSaving false on init', () => {
      repairShopService.getMyShop.mockReturnValue(of(mockResponse));
      const c = component as any;
      expect(c.isSaving()).toBe(false);
    });

    it('should be isMechanic when user role is mechanic', () => {
      repairShopService.getMyShop.mockReturnValue(of(mockResponse));
      fixture.detectChanges();
      const c = component as any;
      expect(c.isMechanic()).toBe(true);
    });
  });

  describe('Shop Loading', () => {
    it('should populate shop on successful load', () => {
      repairShopService.getMyShop.mockReturnValue(of(mockResponse));
      fixture.detectChanges();

      const c = component as any;
      expect(c.shop()).toBeTruthy();
      expect(c.shop().id).toBe('shop-12345678');
    });

    it('should stop loading after successful fetch', () => {
      repairShopService.getMyShop.mockReturnValue(of(mockResponse));
      fixture.detectChanges();

      const c = component as any;
      expect(c.isLoading()).toBe(false);
    });

    it('should handle 404 (no shop exists)', () => {
      repairShopService.getMyShop.mockReturnValue(
        throwError(() => new HttpErrorResponse({ status: 404 }))
      );
      fixture.detectChanges();

      const c = component as any;
      expect(c.shop()).toBeNull();
      expect(c.isLoading()).toBe(false);
    });

    it('should handle 403 error', () => {
      repairShopService.getMyShop.mockReturnValue(
        throwError(() => new HttpErrorResponse({ status: 403 }))
      );
      fixture.detectChanges();

      const c = component as any;
      expect(c.serverError()).toContain('permission');
    });

    it('should handle 500 error', () => {
      repairShopService.getMyShop.mockReturnValue(
        throwError(() => new HttpErrorResponse({ status: 500, statusText: 'Server Error' }))
      );
      fixture.detectChanges();

      const c = component as any;
      expect(c.serverError()).toBeTruthy();
    });

    it('should set server error on non-success response', () => {
      repairShopService.getMyShop.mockReturnValue(
        of({ success: false, message: 'Shop not found', data: null, errors: null } as any)
      );
      fixture.detectChanges();

      const c = component as any;
      expect(c.serverError()).toBe('Shop not found');
    });
  });

  describe('Create mode (no shop exists)', () => {
    it('should show create form when no shop', () => {
      repairShopService.getMyShop.mockReturnValue(
        throwError(() => new HttpErrorResponse({ status: 404 }))
      );
      fixture.detectChanges();

      const c = component as any;
      expect(c.hasShop()).toBe(false);
    });

    it('should call create with correct payload', () => {
      repairShopService.getMyShop.mockReturnValue(
        throwError(() => new HttpErrorResponse({ status: 404 }))
      );
      const createdResponse = {
        ...mockResponse,
        message: 'Repair shop created successfully',
        data: { repairShop: { ...mockShop, status: 'pending' } },
      };
      repairShopService.create.mockReturnValue(of(createdResponse));
      fixture.detectChanges();

      const c = component as any;
      c.form.controls.shopName.setValue('MotoCare Repairs');
      c.form.controls.vehicleTypesServiced.setValue(['two_wheeler']);
      c.form.controls.location.setValue({ type: 'Point', coordinates: [77.5946, 28.6139] });
      c.form.controls.address.setValue('123 Service Street, Delhi');
      c.form.controls.phone.setValue('9876543210');
      c.form.markAsPristine();
      c.saveShop();

      expect(repairShopService.create).toHaveBeenCalledWith({
        shopName: 'MotoCare Repairs',
        vehicleTypesServiced: ['two_wheeler'],
        location: { type: 'Point', coordinates: [77.5946, 28.6139] },
        address: '123 Service Street, Delhi',
        phone: '9876543210',
        description: undefined,
        openingHours: undefined,
        photoUrl: undefined,
      });
    });

    it('should populate shop on successful create', () => {
      repairShopService.getMyShop.mockReturnValue(
        throwError(() => new HttpErrorResponse({ status: 404 }))
      );
      repairShopService.create.mockReturnValue(of({
        ...mockResponse,
        message: 'Repair shop created successfully',
        data: { repairShop: { ...mockShop, status: 'pending' } },
      }));
      fixture.detectChanges();

      const c = component as any;
      c.form.controls.shopName.setValue('MotoCare Repairs');
      c.form.controls.vehicleTypesServiced.setValue(['two_wheeler']);
      c.form.controls.location.setValue({ type: 'Point', coordinates: [77.5946, 28.6139] });
      c.form.controls.address.setValue('123 Service Street, Delhi');
      c.form.controls.phone.setValue('9876543210');
      c.form.markAsPristine();
      c.saveShop();

      expect(c.shop()).toBeTruthy();
      expect(c.shop().status).toBe('pending');
      expect(c.isEditMode()).toBe(false);
    });

    it('should show success message on create', () => {
      repairShopService.getMyShop.mockReturnValue(
        throwError(() => new HttpErrorResponse({ status: 404 }))
      );
      repairShopService.create.mockReturnValue(of({
        ...mockResponse,
        message: 'Repair shop created successfully',
        data: { repairShop: { ...mockShop, status: 'pending' } },
      }));
      fixture.detectChanges();

      const c = component as any;
      c.form.controls.shopName.setValue('MotoCare Repairs');
      c.form.controls.vehicleTypesServiced.setValue(['two_wheeler']);
      c.form.controls.location.setValue({ type: 'Point', coordinates: [77.5946, 28.6139] });
      c.form.controls.address.setValue('123 Service Street, Delhi');
      c.form.controls.phone.setValue('9876543210');
      c.form.markAsPristine();
      c.saveShop();

      expect(c.successMessage()).toBe('Repair shop created successfully');
    });

    it('should not create when form is invalid', () => {
      repairShopService.getMyShop.mockReturnValue(
        throwError(() => new HttpErrorResponse({ status: 404 }))
      );
      fixture.detectChanges();

      const c = component as any;
      c.saveShop();

      expect(repairShopService.create).not.toHaveBeenCalled();
    });

    it('should set saving state during create', () => {
      repairShopService.getMyShop.mockReturnValue(
        throwError(() => new HttpErrorResponse({ status: 404 }))
      );
      repairShopService.create.mockReturnValue(NEVER as any);
      fixture.detectChanges();

      const c = component as any;
      c.form.controls.shopName.setValue('MotoCare Repairs');
      c.form.controls.vehicleTypesServiced.setValue(['two_wheeler']);
      c.form.controls.location.setValue({ type: 'Point', coordinates: [77.5946, 28.6139] });
      c.form.controls.address.setValue('123 Service Street, Delhi');
      c.form.controls.phone.setValue('9876543210');
      c.form.markAsPristine();
      expect(c.isSaving()).toBe(false);
      c.saveShop();
      expect(c.isSaving()).toBe(true);
    });
  });

  describe('Edit mode', () => {
    it('should show view mode when shop exists', () => {
      repairShopService.getMyShop.mockReturnValue(of(mockResponse));
      fixture.detectChanges();

      const c = component as any;
      expect(c.hasShop()).toBe(true);
      expect(c.isEditMode()).toBe(false);
    });

    it('should enter edit mode when startEdit called', () => {
      repairShopService.getMyShop.mockReturnValue(of(mockResponse));
      fixture.detectChanges();

      const c = component as any;
      c.startEdit();
      expect(c.isEditMode()).toBe(true);
    });

    it('should exit edit mode when cancelEdit called', () => {
      repairShopService.getMyShop.mockReturnValue(of(mockResponse));
      fixture.detectChanges();

      const c = component as any;
      c.startEdit();
      c.cancelEdit();
      expect(c.isEditMode()).toBe(false);
    });

    it('should call update with correct payload on save', () => {
      repairShopService.getMyShop.mockReturnValue(of(mockResponse));
      const updatedShop = { ...mockShop, shopName: 'Updated Shop Name' };
      repairShopService.update.mockReturnValue(of({
        ...mockResponse,
        message: 'Repair shop updated successfully',
        data: { repairShop: updatedShop },
      }));
      fixture.detectChanges();

      const c = component as any;
      c.startEdit();
      c.form.controls.shopName.setValue('Updated Shop Name');
      c.form.markAsPristine();
      c.saveShop();

      expect(repairShopService.update).toHaveBeenCalledWith({
        shopName: 'Updated Shop Name',
        vehicleTypesServiced: ['two_wheeler', 'four_wheeler'],
        location: { type: 'Point', coordinates: [77.5946, 28.6139] },
        address: '123 Service Street, Delhi',
        phone: '9876543210',
        description: 'Best repair shop in town',
        openingHours: 'Mon-Fri: 9am-6pm',
        photoUrl: 'https://example.com/photo.jpg',
      });
    });

    it('should update shop signal on successful edit', () => {
      repairShopService.getMyShop.mockReturnValue(of(mockResponse));
      const updatedShop = { ...mockShop, shopName: 'Updated Shop Name' };
      repairShopService.update.mockReturnValue(of({
        ...mockResponse,
        message: 'Repair shop updated successfully',
        data: { repairShop: updatedShop },
      }));
      fixture.detectChanges();

      const c = component as any;
      c.startEdit();
      c.form.controls.shopName.setValue('Updated Shop Name');
      c.form.markAsPristine();
      c.saveShop();

      expect(c.shop().shopName).toBe('Updated Shop Name');
    });

    it('should show success message on update', () => {
      repairShopService.getMyShop.mockReturnValue(of(mockResponse));
      repairShopService.update.mockReturnValue(of({
        ...mockResponse,
        message: 'Repair shop updated successfully',
        data: { repairShop: { ...mockShop, shopName: 'Updated' } },
      }));
      fixture.detectChanges();

      const c = component as any;
      c.startEdit();
      c.form.controls.shopName.setValue('Updated');
      c.form.markAsPristine();
      c.saveShop();

      expect(c.successMessage()).toBe('Repair shop updated successfully');
    });

    it('should not update when form is invalid', () => {
      repairShopService.getMyShop.mockReturnValue(of(mockResponse));
      fixture.detectChanges();

      const c = component as any;
      c.startEdit();
      c.form.controls.shopName.setValue('');
      c.saveShop();

      expect(repairShopService.update).not.toHaveBeenCalled();
    });

    it('should not update when already saving', () => {
      repairShopService.getMyShop.mockReturnValue(of(mockResponse));
      repairShopService.update.mockReturnValue(NEVER as any);
      fixture.detectChanges();

      const c = component as any;
      c.startEdit();
      c.form.markAsPristine();
      c.saveShop();

      expect(repairShopService.update.mock.calls.length).toBe(1);
      expect(c.isSaving()).toBe(true);

      c.saveShop();
      expect(repairShopService.update.mock.calls.length).toBe(1);
    });

    it('should handle 409 duplicate shop error', () => {
      repairShopService.getMyShop.mockReturnValue(
        throwError(() => new HttpErrorResponse({ status: 404 }))
      );
      repairShopService.create.mockReturnValue(
        throwError(() => new HttpErrorResponse({ status: 409 }))
      );
      fixture.detectChanges();

      const c = component as any;
      c.form.controls.shopName.setValue('Test Shop');
      c.form.controls.vehicleTypesServiced.setValue(['two_wheeler']);
      c.form.controls.location.setValue({ type: 'Point', coordinates: [77.5946, 28.6139] });
      c.form.controls.address.setValue('Address');
      c.form.controls.phone.setValue('9876543210');
      c.form.markAsPristine();
      c.saveShop();

      expect(c.serverError()).toBe('You already have a repair shop');
    });
  });

  describe('Verification status display', () => {
    it('should display status for pending shop', () => {
      const pendingShop = { ...mockShop, status: 'pending' };
      repairShopService.getMyShop.mockReturnValue(
        of({ ...mockResponse, data: { repairShop: pendingShop } })
      );
      fixture.detectChanges();

      const c = component as any;
      expect(c.verificationStatus()).toBe('pending');
      expect(c.verificationLabel()).toBe('Pending Verification');
    });

    it('should display status for verified shop', () => {
      repairShopService.getMyShop.mockReturnValue(of(mockResponse));
      fixture.detectChanges();

      const c = component as any;
      expect(c.verificationStatus()).toBe('verified');
      expect(c.verificationLabel()).toBe('Verified');
    });

    it('should display status for rejected shop', () => {
      const rejectedShop = { ...mockShop, status: 'rejected' };
      repairShopService.getMyShop.mockReturnValue(
        of({ ...mockResponse, data: { repairShop: rejectedShop } })
      );
      fixture.detectChanges();

      const c = component as any;
      expect(c.verificationStatus()).toBe('rejected');
      expect(c.verificationLabel()).toBe('Rejected');
    });
  });

  describe('Re-verification warning', () => {
    it('should not show reverification warning on fresh edit', () => {
      repairShopService.getMyShop.mockReturnValue(of(mockResponse));
      fixture.detectChanges();

      const c = component as any;
      c.startEdit();
      expect(c.reverificationRequired()).toBe(false);
    });

    it('should show reverification warning when shopName changes', () => {
      repairShopService.getMyShop.mockReturnValue(of(mockResponse));
      fixture.detectChanges();

      const c = component as any;
      c.startEdit();
      fixture.detectChanges();
      c.form.controls.shopName.setValue('New Shop Name');
      expect(c.reverificationRequired()).toBe(true);
    });

    it('should show reverification warning when address changes', () => {
      repairShopService.getMyShop.mockReturnValue(of(mockResponse));
      fixture.detectChanges();

      const c = component as any;
      c.startEdit();
      fixture.detectChanges();
      c.form.controls.address.setValue('New Address');
      expect(c.reverificationRequired()).toBe(true);
    });

    it('should show reverification warning when vehicleTypes change', () => {
      repairShopService.getMyShop.mockReturnValue(of(mockResponse));
      fixture.detectChanges();

      const c = component as any;
      c.startEdit();
      fixture.detectChanges();
      c.form.controls.vehicleTypesServiced.setValue(['two_wheeler']);
      expect(c.reverificationRequired()).toBe(true);
    });

    it('should show reverification warning when location changes', () => {
      repairShopService.getMyShop.mockReturnValue(of(mockResponse));
      fixture.detectChanges();

      const c = component as any;
      c.startEdit();
      fixture.detectChanges();
      c.form.controls.location.setValue({ type: 'Point', coordinates: [78.0, 29.0] });
      expect(c.reverificationRequired()).toBe(true);
    });

    it('should NOT show reverification warning when phone changes', () => {
      repairShopService.getMyShop.mockReturnValue(of(mockResponse));
      fixture.detectChanges();

      const c = component as any;
      c.startEdit();
      c.form.controls.phone.setValue('9999999999');
      expect(c.reverificationRequired()).toBe(false);
    });

    it('should NOT show reverification warning when description changes', () => {
      repairShopService.getMyShop.mockReturnValue(of(mockResponse));
      fixture.detectChanges();

      const c = component as any;
      c.startEdit();
      c.form.controls.description.setValue('New description');
      expect(c.reverificationRequired()).toBe(false);
    });

    it('should NOT show reverification warning when openingHours changes', () => {
      repairShopService.getMyShop.mockReturnValue(of(mockResponse));
      fixture.detectChanges();

      const c = component as any;
      c.startEdit();
      c.form.controls.openingHours.setValue('24/7');
      expect(c.reverificationRequired()).toBe(false);
    });

    it('should NOT show reverification warning when photoUrl changes', () => {
      repairShopService.getMyShop.mockReturnValue(of(mockResponse));
      fixture.detectChanges();

      const c = component as any;
      c.startEdit();
      c.form.controls.photoUrl.setValue('https://example.com/newphoto.jpg');
      expect(c.reverificationRequired()).toBe(false);
    });

    it('should show reverification warning in view mode after save with changed fields', () => {
      repairShopService.getMyShop.mockReturnValue(of(mockResponse));
      const pendingShop = { ...mockShop, shopName: 'New Name', status: 'pending' };
      repairShopService.update.mockReturnValue(of({
        ...mockResponse,
        message: 'Repair shop updated successfully',
        data: { repairShop: pendingShop },
      }));
      fixture.detectChanges();

      const c = component as any;
      c.startEdit();
      fixture.detectChanges();
      c.form.controls.shopName.setValue('New Name');
      c.form.markAsPristine();
      c.saveShop();

      expect(c.shop().status).toBe('pending');
    });
  });

  describe('Vehicle type toggle', () => {
    it('should add vehicle type when toggled on', () => {
      repairShopService.getMyShop.mockReturnValue(
        throwError(() => new HttpErrorResponse({ status: 404 }))
      );
      fixture.detectChanges();

      const c = component as any;
      c.toggleVehicleType('two_wheeler');
      expect(c.hasVehicleType('two_wheeler')).toBe(true);
    });

    it('should remove vehicle type when toggled off', () => {
      repairShopService.getMyShop.mockReturnValue(
        throwError(() => new HttpErrorResponse({ status: 404 }))
      );
      fixture.detectChanges();

      const c = component as any;
      c.toggleVehicleType('two_wheeler');
      expect(c.hasVehicleType('two_wheeler')).toBe(true);
      c.toggleVehicleType('two_wheeler');
      expect(c.hasVehicleType('two_wheeler')).toBe(false);
    });
  });

  describe('Geolocation', () => {
    it('should set coordinates on geolocation success', () => {
      repairShopService.getMyShop.mockReturnValue(of(mockResponse));
      fixture.detectChanges();

      const c = component as any;
      const mockPosition = {
        coords: { latitude: 28.6139, longitude: 77.5946 },
      };
      const originalGeolocation = (navigator as any).geolocation;
      (navigator as any).geolocation = {
        getCurrentPosition: (cb: any) => cb(mockPosition),
      };

      c.getLocation();

      expect(c.form.get('location').value).toEqual({
        type: 'Point',
        coordinates: [77.5946, 28.6139],
      });
      expect(c.isLocating()).toBe(false);

      (navigator as any).geolocation = originalGeolocation;
    });

    it('should set error on geolocation failure', () => {
      repairShopService.getMyShop.mockReturnValue(of(mockResponse));
      fixture.detectChanges();

      const c = component as any;
      const originalGeolocation = (navigator as any).geolocation;
      (navigator as any).geolocation = {
        getCurrentPosition: (_cb: any, errCb: any) => errCb(new Error('denied')),
      };

      c.getLocation();

      expect(c.locationError()).toBeTruthy();
      expect(c.isLocating()).toBe(false);

      (navigator as any).geolocation = originalGeolocation;
    });

    it('should not call geolocation when unsupported', () => {
      repairShopService.getMyShop.mockReturnValue(of(mockResponse));
      fixture.detectChanges();

      const c = component as any;
      const originalGeolocation = (navigator as any).geolocation;
      (navigator as any).geolocation = undefined;

      c.getLocation();

      expect(c.locationError()).toBe('Unable to get your location. Please enter coordinates manually.');

      (navigator as any).geolocation = originalGeolocation;
    });
  });

  describe('Location helpers', () => {
    it('should detect when location is set', () => {
      repairShopService.getMyShop.mockReturnValue(of(mockResponse));
      fixture.detectChanges();

      const c = component as any;
      expect(c.isLocationSet()).toBe(true);
    });

    it('should format location coordinates', () => {
      repairShopService.getMyShop.mockReturnValue(of(mockResponse));
      fixture.detectChanges();

      const c = component as any;
      expect(c.formatLocation()).toContain('28.613900');
      expect(c.formatLocation()).toContain('77.594600');
    });
  });

  describe('Back navigation', () => {
    it('should navigate to service requests list', () => {
      repairShopService.getMyShop.mockReturnValue(of(mockResponse));
      fixture.detectChanges();

      const c = component as any;
      c.goBack();

      expect(router.navigate).toHaveBeenCalledWith(['/service-requests']);
    });
  });
});
