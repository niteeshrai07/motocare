import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { AdminReviewsPageComponent } from './admin-reviews.page';
import { AdminService } from '../../core/services/admin.service';
import { ApiResponse } from '../../core/models/api-response.model';
import { AdminReviewListItem } from '../../core/models/admin.model';

describe('AdminReviewsPageComponent', () => {
  let fixture: ComponentFixture<AdminReviewsPageComponent>;
  let component: AdminReviewsPageComponent;

  const adminService = {
    getAllReviews: vi.fn(),
    getReviewDetail: vi.fn(),
  };

  const mockReview: AdminReviewListItem = {
    id: 'review-1',
    rating: 5,
    comment: 'Excellent service!',
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
    reviews: AdminReviewListItem[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> = {
    success: true,
    message: 'Reviews fetched successfully',
    data: {
      reviews: [mockReview],
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
    reviews: AdminReviewListItem[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> = {
    success: true,
    message: 'Reviews fetched successfully',
    data: {
      reviews: [],
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
      },
    },
    errors: null,
  };

  const mockDetailReview = {
    id: 'review-1',
    serviceRequestId: 'req-1',
    customer: { id: 'cust-1', name: 'John Doe' },
    shop: { id: 'shop-1', shopName: 'Test Shop' },
    rating: 5,
    comment: 'Excellent service!',
    createdAt: '2025-01-01T10:00:00.000Z',
    updatedAt: '2025-01-01T10:00:00.000Z',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminReviewsPageComponent],
      providers: [
        { provide: AdminService, useValue: adminService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminReviewsPageComponent);
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
      adminService.getAllReviews.mockReturnValue(of(mockListResponse));
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('should start in loading state', () => {
      adminService.getAllReviews.mockReturnValue(of(mockListResponse));
      fixture.detectChanges();
      expect(component.isLoading()).toBe(true);
    });

    it('should call getAllReviews on init', () => {
      adminService.getAllReviews.mockReturnValue(of(mockListResponse));
      fixture.detectChanges();
      expect(adminService.getAllReviews).toHaveBeenCalledWith({
        page: 1,
        limit: 20,
        sort: 'newest',
      });
    });
  });

  describe('Loading', () => {
    it('should show spinner while loading', () => {
      adminService.getAllReviews.mockReturnValue(of(mockListResponse));
      fixture.detectChanges();
      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('app-spinner')).not.toBeNull();
    });
  });

  describe('Successful load', () => {
    it('should render reviews', () => {
      adminService.getAllReviews.mockReturnValue(of(mockListResponse));
      fixture.detectChanges();
      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('Excellent service!');
    });

    it('should render customer and shop names', () => {
      adminService.getAllReviews.mockReturnValue(of(mockListResponse));
      fixture.detectChanges();
      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('John Doe');
      expect(compiled.textContent).toContain('Test Shop');
    });

    it('should render rating stars', () => {
      adminService.getAllReviews.mockReturnValue(of(mockListResponse));
      fixture.detectChanges();
      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('★★★★★');
      expect(compiled.textContent).toContain('5 / 5');
    });

    it('should render CardComponent', () => {
      adminService.getAllReviews.mockReturnValue(of(mockListResponse));
      fixture.detectChanges();
      const compiled = fixture.nativeElement;
      expect(compiled.querySelectorAll('app-card').length).toBe(1);
    });
  });

  describe('Empty state', () => {
    it('should show empty state when no reviews', () => {
      adminService.getAllReviews.mockReturnValue(of(mockEmptyResponse));
      fixture.detectChanges();
      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('No reviews found');
    });
  });

  describe('Error handling', () => {
    it('should show error on load failure', () => {
      adminService.getAllReviews.mockReturnValue(
        throwError(() => new Error('Network error'))
      );
      fixture.detectChanges();
      const c = component as any;
      expect(c.error()).toBe('Network error');
    });

    it('should show retry button on error', () => {
      adminService.getAllReviews.mockReturnValue(
        throwError(() => new Error('Network error'))
      );
      fixture.detectChanges();
      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('app-button')).not.toBeNull();
    });

    it('should reload on retry', () => {
      adminService.getAllReviews.mockReturnValue(
        throwError(() => new Error('Network error'))
      );
      fixture.detectChanges();
      const c = component as any;
      adminService.getAllReviews.mockReturnValue(of(mockListResponse));
      c.loadReviews();
      expect(adminService.getAllReviews).toHaveBeenCalledTimes(2);
    });
  });

  describe('Sort', () => {
    it('should start with newest sort', () => {
      adminService.getAllReviews.mockReturnValue(of(mockListResponse));
      fixture.detectChanges();
      const c = component as any;
      expect(c.currentSort()).toBe('newest');
    });

    it('should call getAllReviews with sort option', () => {
      adminService.getAllReviews.mockReturnValue(of(mockListResponse));
      fixture.detectChanges();
      const c = component as any;
      c.setSort('highest');
      expect(adminService.getAllReviews).toHaveBeenCalledWith(
        expect.objectContaining({ sort: 'highest' })
      );
    });

    it('should reset page when changing sort', () => {
      adminService.getAllReviews.mockReturnValue(of(mockListResponse));
      fixture.detectChanges();
      const c = component as any;
      c.page.set(2);
      c.setSort('oldest');
      expect(c.page()).toBe(1);
    });
  });

  describe('Search', () => {
    it('should update searchQuery on input', () => {
      adminService.getAllReviews.mockReturnValue(of(mockListResponse));
      fixture.detectChanges();
      const compiled = fixture.nativeElement;
      const input = compiled.querySelector('input');
      input.value = 'excellent';
      input.dispatchEvent(new Event('input'));
      expect(component.searchQuery()).toBe('excellent');
    });

    it('should trim whitespace', () => {
      adminService.getAllReviews.mockReturnValue(of(mockListResponse));
      fixture.detectChanges();
      const compiled = fixture.nativeElement;
      const input = compiled.querySelector('input');
      input.value = '  excellent  ';
      input.dispatchEvent(new Event('input'));
      expect(component.searchQuery()).toBe('excellent');
    });

    it('should ignore duplicate searches', () => {
      adminService.getAllReviews.mockReturnValue(of(mockListResponse));
      fixture.detectChanges();
      const compiled = fixture.nativeElement;
      const input = compiled.querySelector('input');
      input.value = 'excellent';
      input.dispatchEvent(new Event('input'));
      input.value = 'excellent';
      input.dispatchEvent(new Event('input'));
      vi.advanceTimersByTime(300);
      expect(adminService.getAllReviews).toHaveBeenCalledTimes(2); // initial + one search
    });

    it('should reset page on new search', () => {
      adminService.getAllReviews.mockReturnValue(of(mockListResponse));
      fixture.detectChanges();
      const c = component as any;
      c.page.set(2);
      const compiled = fixture.nativeElement;
      const input = compiled.querySelector('input');
      input.value = 'excellent';
      input.dispatchEvent(new Event('input'));
      vi.advanceTimersByTime(300);
      expect(c.page()).toBe(1);
    });

    it('should reload when search becomes empty', () => {
      adminService.getAllReviews.mockReturnValue(of(mockListResponse));
      fixture.detectChanges();
      const c = component as any;
      c.searchQuery.set('test');
      const compiled = fixture.nativeElement;
      const input = compiled.querySelector('input');
      input.value = '';
      input.dispatchEvent(new Event('input'));
      vi.advanceTimersByTime(300);
      expect(adminService.getAllReviews).toHaveBeenCalled();
    });
  });

  describe('Pagination', () => {
    it('should show pagination when totalPages > 1', () => {
      const multiPageResponse = {
        ...mockListResponse,
        data: {
          reviews: [mockReview],
          pagination: {
            page: 1,
            limit: 20,
            total: 40,
            totalPages: 2,
          },
        },
      };
      adminService.getAllReviews.mockReturnValue(of(multiPageResponse));
      fixture.detectChanges();
      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('.admin-reviews__pagination')).not.toBeNull();
    });

    it('should hide pagination when totalPages <= 1', () => {
      adminService.getAllReviews.mockReturnValue(of(mockListResponse));
      fixture.detectChanges();
      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('.admin-reviews__pagination')).toBeNull();
    });

    it('should go to next page', () => {
      const multiPageResponse = {
        ...mockListResponse,
        data: {
          reviews: [mockReview],
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
          reviews: [{ ...mockReview, id: 'review-2' }],
          pagination: {
            page: 2,
            limit: 20,
            total: 40,
            totalPages: 2,
          },
        },
      };
      adminService.getAllReviews.mockReturnValueOnce(of(multiPageResponse)).mockReturnValueOnce(of(page2Response));
      fixture.detectChanges();
      const c = component as any;
      c.nextPage();
      expect(c.page()).toBe(2);
      expect(adminService.getAllReviews).toHaveBeenCalledTimes(2);
    });

    it('should go to previous page', () => {
      const page2Response = {
        ...mockListResponse,
        data: {
          reviews: [mockReview],
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
          reviews: [{ ...mockReview, id: 'review-1' }],
          pagination: {
            page: 1,
            limit: 20,
            total: 40,
            totalPages: 2,
          },
        },
      };
      adminService.getAllReviews.mockReturnValueOnce(of(page2Response)).mockReturnValueOnce(of(page1Response));
      fixture.detectChanges();
      const c = component as any;
      c.prevPage();
      expect(c.page()).toBe(1);
      expect(adminService.getAllReviews).toHaveBeenCalledTimes(2);
    });
  });

  describe('Detail view', () => {
    it('should open detail dialog', () => {
      adminService.getAllReviews.mockReturnValue(of(mockListResponse));
      adminService.getReviewDetail.mockReturnValue(of({
        success: true,
        message: 'Review fetched successfully',
        data: { review: mockDetailReview },
        errors: null,
      }));
      fixture.detectChanges();
      const c = component as any;
      c.openDetail(mockReview);
      expect(c.isDetailOpen()).toBe(true);
      expect(c.selectedReview()?.id).toBe('review-1');
    });

    it('should close detail dialog', () => {
      adminService.getAllReviews.mockReturnValue(of(mockListResponse));
      adminService.getReviewDetail.mockReturnValue(of({
        success: true,
        message: 'Review fetched successfully',
        data: { review: mockDetailReview },
        errors: null,
      }));
      fixture.detectChanges();
      const c = component as any;
      c.openDetail(mockReview);
      c.closeDetail();
      expect(c.isDetailOpen()).toBe(false);
      expect(c.selectedReview()).toBeNull();
    });

    it('should display service request ID in detail', () => {
      adminService.getAllReviews.mockReturnValue(of(mockListResponse));
      adminService.getReviewDetail.mockReturnValue(of({
        success: true,
        message: 'Review fetched successfully',
        data: { review: mockDetailReview },
        errors: null,
      }));
      fixture.detectChanges();
      const c = component as any;
      c.openDetail(mockReview);
      expect(c.selectedReview()?.serviceRequestId).toBe('req-1');
    });
  });

  describe('Format helpers', () => {
    it('should format date correctly', () => {
      adminService.getAllReviews.mockReturnValue(of(mockListResponse));
      fixture.detectChanges();
      const c = component as any;
      expect(c.formatDate('2025-01-01T10:00:00.000Z')).toBe('01 Jan 2025');
    });

    it('should render stars correctly', () => {
      adminService.getAllReviews.mockReturnValue(of(mockListResponse));
      fixture.detectChanges();
      const c = component as any;
      expect(c.getStars(5)).toBe('★★★★★');
      expect(c.getStars(3)).toBe('★★★☆☆');
      expect(c.getStars(0)).toBe('☆☆☆☆☆');
    });

    it('should return correct sort labels', () => {
      adminService.getAllReviews.mockReturnValue(of(mockListResponse));
      fixture.detectChanges();
      const c = component as any;
      expect(c.getSortLabel('newest')).toBe('Newest');
      expect(c.getSortLabel('highest')).toBe('Highest');
    });
  });

  describe('Pagination navigation', () => {
    it('should not navigate beyond last page', () => {
      adminService.getAllReviews.mockReturnValue(of(mockListResponse));
      fixture.detectChanges();
      const c = component as any;
      c.page.set(1);
      c.totalPages.set(1);
      c.nextPage();
      expect(c.page()).toBe(1);
    });

    it('should not navigate before first page', () => {
      adminService.getAllReviews.mockReturnValue(of(mockListResponse));
      fixture.detectChanges();
      const c = component as any;
      c.page.set(1);
      c.prevPage();
      expect(c.page()).toBe(1);
    });
  });
});
