import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { AdminDashboardPageComponent } from './admin-dashboard.page';
import { AdminService } from '../../core/services/admin.service';
import { ApiResponse } from '../../core/models/api-response.model';

describe('AdminDashboardPageComponent', () => {
  let fixture: ComponentFixture<AdminDashboardPageComponent>;
  let component: AdminDashboardPageComponent;

  const adminService = {
    getDashboard: vi.fn(),
  };

  const mockOverview = {
    totalUsers: 100,
    totalCustomers: 80,
    totalMechanics: 15,
    totalAdmins: 5,
    totalRepairShops: 20,
    pendingShops: 5,
    verifiedShops: 12,
    rejectedShops: 3,
    totalServiceRequests: 200,
    pendingRequests: 10,
    quotedRequests: 15,
    acceptedRequests: 25,
    inProgressRequests: 30,
    completedRequests: 100,
    rejectedRequests: 10,
    cancelledRequests: 5,
    expiredRequests: 5,
    totalReviews: 50,
    averagePlatformRating: 4.2,
  };

  const mockDashboardResponse: ApiResponse<{
    overview: typeof mockOverview;
    statistics: any;
  }> = {
    success: true,
    message: 'Dashboard overview fetched successfully',
    data: {
      overview: mockOverview,
      statistics: {
        usersByRole: { customer: 80, mechanic: 15, admin: 5 },
        shopsByStatus: { pending: 5, verified: 12, rejected: 3 },
        requestsByStatus: {
          pending: 10,
          quoted: 15,
          accepted: 25,
          in_progress: 30,
          completed: 100,
          rejected: 10,
          cancelled: 5,
          expired: 5,
        },
        averagePlatformRating: 4.2,
        totalReviews: 50,
      },
    },
    errors: null,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminDashboardPageComponent],
      providers: [
        { provide: AdminService, useValue: adminService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminDashboardPageComponent);
    component = fixture.componentInstance;
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('Initialization', () => {
    it('should create', () => {
      adminService.getDashboard.mockReturnValue(of(mockDashboardResponse));
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('should start in loading state', () => {
      adminService.getDashboard.mockReturnValue(of(mockDashboardResponse));
      fixture.detectChanges();
      expect(component.isLoading()).toBe(true);
    });

    it('should call getDashboard on init', () => {
      adminService.getDashboard.mockReturnValue(of(mockDashboardResponse));
      fixture.detectChanges();
      expect(adminService.getDashboard).toHaveBeenCalled();
    });
  });

  describe('Loading', () => {
    it('should show spinner while loading', () => {
      adminService.getDashboard.mockReturnValue(of(mockDashboardResponse));
      fixture.detectChanges();
      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('app-spinner')).not.toBeNull();
    });
  });

  describe('Successful load', () => {
    it('should render platform stats', () => {
      adminService.getDashboard.mockReturnValue(of(mockDashboardResponse));
      fixture.detectChanges();
      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('Total Users');
      expect(compiled.textContent).toContain('100');
      expect(compiled.textContent).toContain('Customers');
      expect(compiled.textContent).toContain('80');
      expect(compiled.textContent).toContain('Mechanics');
      expect(compiled.textContent).toContain('15');
      expect(compiled.textContent).toContain('Admins');
      expect(compiled.textContent).toContain('5');
    });

    it('should render operations stats', () => {
      adminService.getDashboard.mockReturnValue(of(mockDashboardResponse));
      fixture.detectChanges();
      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('Pending Repair Shops');
      expect(compiled.textContent).toContain('Verified Repair Shops');
      expect(compiled.textContent).toContain('Pending Service Requests');
      expect(compiled.textContent).toContain('Active Service Requests');
      expect(compiled.textContent).toContain('Completed Service Requests');
      expect(compiled.textContent).toContain('Total Reviews');
      expect(compiled.textContent).toContain('Average Rating');
    });

    it('should compute active service requests as accepted + in_progress', () => {
      adminService.getDashboard.mockReturnValue(of(mockDashboardResponse));
      fixture.detectChanges();
      const c = component as any;
      expect(c.activeServiceRequests).toBe(55); // 25 + 30
    });

    it('should display average rating', () => {
      adminService.getDashboard.mockReturnValue(of(mockDashboardResponse));
      fixture.detectChanges();
      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('4.2');
    });

    it('should display zero for average rating when no reviews', () => {
      const noReviewResponse = {
        ...mockDashboardResponse,
        data: {
          ...mockDashboardResponse.data!,
          overview: { ...mockOverview, totalReviews: 0, averagePlatformRating: 0 },
        },
      };
      adminService.getDashboard.mockReturnValue(of(noReviewResponse));
      fixture.detectChanges();
      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('0');
    });

    it('should render two CardComponent sections', () => {
      adminService.getDashboard.mockReturnValue(of(mockDashboardResponse));
      fixture.detectChanges();
      const compiled = fixture.nativeElement;
      expect(compiled.querySelectorAll('app-card').length).toBe(2);
    });
  });

  describe('Error handling', () => {
    it('should show error on load failure', () => {
      adminService.getDashboard.mockReturnValue(
        throwError(() => new Error('Network error'))
      );
      fixture.detectChanges();
      const c = component as any;
      expect(c.error()).toBe('Network error');
    });

    it('should show retry button on error', () => {
      adminService.getDashboard.mockReturnValue(
        throwError(() => new Error('Network error'))
      );
      fixture.detectChanges();
      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('app-button')).not.toBeNull();
    });

    it('should reload on retry', () => {
      adminService.getDashboard.mockReturnValue(
        throwError(() => new Error('Network error'))
      );
      fixture.detectChanges();
      const c = component as any;
      adminService.getDashboard.mockReturnValue(of(mockDashboardResponse));
      c.loadDashboard();
      expect(adminService.getDashboard).toHaveBeenCalledTimes(2);
    });
  });

  describe('Active Service Requests derivation', () => {
    it('should return 0 when overview is null', () => {
      const c = component as any;
      expect(c.activeServiceRequests).toBe(0);
    });

    it('should compute accepted + in_progress', () => {
      const customOverview = {
        ...mockOverview,
        acceptedRequests: 10,
        inProgressRequests: 20,
      };
      const customResponse = {
        ...mockDashboardResponse,
        data: { ...mockDashboardResponse.data!, overview: customOverview },
      };
      adminService.getDashboard.mockReturnValue(of(customResponse));
      fixture.detectChanges();
      const c = component as any;
      expect(c.activeServiceRequests).toBe(30);
    });
  });
});
