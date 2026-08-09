import { Component, signal, OnInit, OnDestroy } from '@angular/core';
import { finalize } from 'rxjs';
import { AdminService } from '../../core/services/admin.service';
import { AdminReviewListItem } from '../../core/models/admin.model';
import { Review } from '../../core/models/review.model';
import { CardComponent } from '../../shared/components/card/card.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { DialogComponent } from '../../shared/components/dialog/dialog.component';
import { SpinnerComponent } from '../../shared/components/spinner/spinner.component';

type ReviewSort = 'newest' | 'oldest' | 'highest' | 'lowest';

const SORT_OPTIONS: ReviewSort[] = ['newest', 'oldest', 'highest', 'lowest'];

@Component({
  selector: 'app-admin-reviews',
  standalone: true,
  imports: [CardComponent, ButtonComponent, DialogComponent, SpinnerComponent],
  templateUrl: './admin-reviews.page.html',
  styleUrl: './admin-reviews.page.scss',
})
export class AdminReviewsPageComponent implements OnInit, OnDestroy {
  protected readonly SORT_OPTIONS = SORT_OPTIONS;
  protected readonly isLoading = signal<boolean>(true);
  protected readonly error = signal<string | null>(null);
  protected readonly items = signal<AdminReviewListItem[]>([]);
  protected readonly page = signal<number>(1);
  protected readonly limit = signal<number>(20);
  protected readonly total = signal<number>(0);
  protected readonly totalPages = signal<number>(1);
  protected readonly searchQuery = signal<string>('');
  protected readonly currentSort = signal<ReviewSort>('newest');
  protected readonly selectedReview = signal<Review | null>(null);
  protected readonly isDetailOpen = signal<boolean>(false);

  private searchTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly SEARCH_DEBOUNCE_MS = 300;

  constructor(private readonly adminService: AdminService) {}

  ngOnInit(): void {
    this.loadReviews();
  }

  ngOnDestroy(): void {
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }
  }

  protected loadReviews(): void {
    this.isLoading.set(true);
    this.error.set(null);

    const params: {
      page: number;
      limit: number;
      search?: string;
      sort?: ReviewSort;
    } = {
      page: this.page(),
      limit: this.limit(),
      sort: this.currentSort(),
    };

    const search = this.searchQuery();
    if (search) {
      params.search = search;
    }

    this.adminService.getAllReviews(params).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.items.set(response.data.reviews);
          this.page.set(response.data.pagination.page);
          this.total.set(response.data.pagination.total);
          this.totalPages.set(response.data.pagination.totalPages);
        } else {
          this.error.set(response.message || 'Failed to load reviews');
        }
      },
      error: (err: Error) => {
        this.error.set(err.message || 'Failed to load reviews');
      },
      complete: () => {
        this.isLoading.set(false);
      },
    });
  }

  protected onSearchInput(event: Event): void {
    const rawValue = (event.target as HTMLInputElement).value;
    const trimmed = rawValue.trim();

    if (this.searchQuery() === trimmed) {
      return;
    }

    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }

    this.searchTimer = setTimeout(() => {
      this.searchQuery.set(trimmed);
      this.page.set(1);
      this.loadReviews();
    }, this.SEARCH_DEBOUNCE_MS);
  }

  protected setSort(sort: ReviewSort): void {
    this.currentSort.set(sort);
    this.page.set(1);
    this.loadReviews();
  }

  protected openDetail(review: AdminReviewListItem): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.adminService.getReviewDetail(review.id).subscribe({
      next: (response) => {
        if (response.success && response.data?.review) {
          this.selectedReview.set(response.data.review);
          this.isDetailOpen.set(true);
        } else {
          this.error.set(response.message || 'Failed to load review details');
        }
        this.isLoading.set(false);
      },
      error: (err: Error) => {
        this.error.set(err.message || 'Failed to load review details');
        this.isLoading.set(false);
      },
    });
  }

  protected closeDetail(): void {
    this.isDetailOpen.set(false);
    this.selectedReview.set(null);
  }

  protected nextPage(): void {
    if (this.page() < this.totalPages() && !this.isLoading()) {
      this.page.set(this.page() + 1);
      this.loadReviews();
    }
  }

  protected prevPage(): void {
    if (this.page() > 1 && !this.isLoading()) {
      this.page.set(this.page() - 1);
      this.loadReviews();
    }
  }

  protected formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  protected getStars(rating: number): string {
    const full = '★'.repeat(rating);
    const empty = '☆'.repeat(5 - rating);
    return full + empty;
  }

  protected getSortLabel(sort: ReviewSort): string {
    const labels: Record<ReviewSort, string> = {
      newest: 'Newest',
      oldest: 'Oldest',
      highest: 'Highest',
      lowest: 'Lowest',
    };
    return labels[sort];
  }
}
