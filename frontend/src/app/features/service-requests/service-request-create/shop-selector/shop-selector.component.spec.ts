import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { ShopSelectorComponent } from './shop-selector.component';
import { ServiceRequestService } from '../../../../core/services/service-request.service';
import { ApiResponse } from '../../../../core/models/api-response.model';
import { NearbyShopsResponse, RepairShopSummary } from '../../../../core/models/service-request.model';

describe('ShopSelectorComponent', () => {
  let fixture: ComponentFixture<ShopSelectorComponent>;
  let component: ShopSelectorComponent;

  const serviceRequestService = {
    getNearbyShops: vi.fn(),
  };

  const mockShops: NearbyShopsResponse = {
    repairShops: [
      {
        id: 'shop-1',
        shopName: 'MotoCare Repairs',
        vehicleTypesServiced: ['two_wheeler', 'four_wheeler'],
        address: '123 Main St',
        phone: '1234567890',
        rating: 4.5,
      },
      {
        id: 'shop-2',
        shopName: 'Bike Fix',
        vehicleTypesServiced: ['two_wheeler'],
        address: '456 Main St',
        rating: 4.0,
      },
    ],
    pagination: { page: 1, limit: 20 },
  };

  const mockResponse: ApiResponse<NearbyShopsResponse> = {
    success: true,
    message: 'Nearby repair shops fetched successfully',
    data: mockShops,
    errors: null,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShopSelectorComponent],
      providers: [
        { provide: ServiceRequestService, useValue: serviceRequestService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ShopSelectorComponent);
    component = fixture.componentInstance;
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should create', () => {
      component.lng = 77.5946;
      component.lat = 28.6139;
      serviceRequestService.getNearbyShops.mockReturnValue(of(mockResponse));
      (component as any).searchShops();
      expect(component).toBeTruthy();
    });

    it('should start with empty shops', () => {
      expect((component as any).shops().length).toBe(0);
    });

    it('should start not loading', () => {
      expect((component as any).isLoading()).toBe(false);
    });
  });

  describe('Shop search', () => {
    it('should fetch shops with coordinates', () => {
      component.lng = 77.5946;
      component.lat = 28.6139;
      serviceRequestService.getNearbyShops.mockReturnValue(of(mockResponse));
      (component as any).searchShops();

      expect(serviceRequestService.getNearbyShops).toHaveBeenCalledWith({
        lng: 77.5946,
        lat: 28.6139,
      });
    });

    it('should populate shops on success', () => {
      component.lng = 77.5946;
      component.lat = 28.6139;
      serviceRequestService.getNearbyShops.mockReturnValue(of(mockResponse));
      (component as any).searchShops();

      expect((component as any).shops().length).toBe(2);
      expect((component as any).shops()[0].shopName).toBe('MotoCare Repairs');
    });

    it('should set error on failure', () => {
      component.lng = 77.5946;
      component.lat = 28.6139;
      serviceRequestService.getNearbyShops.mockReturnValue(
        throwError(() => new Error('Network error')),
      );
      (component as any).searchShops();

      expect((component as any).serverError()).toBe('Network error');
      expect((component as any).shops().length).toBe(0);
    });

    it('should reset error on retry', () => {
      component.lng = 77.5946;
      component.lat = 28.6139;
      serviceRequestService.getNearbyShops.mockReturnValue(
        throwError(() => new Error('Network error')),
      );
      (component as any).searchShops();
      expect((component as any).serverError()).toBe('Network error');

      serviceRequestService.getNearbyShops.mockReturnValue(of(mockResponse));
      (component as any).searchShops();
      expect((component as any).serverError()).toBeNull();
    });

    it('should show empty state when no shops found', () => {
      component.lng = 77.5946;
      component.lat = 28.6139;
      serviceRequestService.getNearbyShops.mockReturnValue(
        of({
          success: true,
          message: 'OK',
          data: { repairShops: [], pagination: { page: 1, limit: 20 } },
          errors: null,
        } as ApiResponse<NearbyShopsResponse>),
      );
      (component as any).searchShops();

      expect((component as any).shops().length).toBe(0);
      expect((component as any).serverError()).toBeNull();
    });
  });

  describe('Shop selection', () => {
    it('should emit shopSelected event on selection', () => {
      const spy = vi.fn();
      component.shopSelected.subscribe(spy);
      fixture.detectChanges();

      const shop: RepairShopSummary = {
        id: 'shop-1',
        shopName: 'Test Shop',
        vehicleTypesServiced: ['two_wheeler'],
        address: 'Test address',
      };
      (component as any).selectShop(shop);

      expect(spy).toHaveBeenCalledWith(shop);
    });
  });

  describe('Retry', () => {
    it('should retry search on retrySearch call', () => {
      component.lng = 77.5946;
      component.lat = 28.6139;
      serviceRequestService.getNearbyShops.mockReturnValue(of(mockResponse));
      (component as any).searchShops();

      vi.clearAllMocks();
      (component as any).retrySearch();

      expect(serviceRequestService.getNearbyShops).toHaveBeenCalled();
    });
  });
});
