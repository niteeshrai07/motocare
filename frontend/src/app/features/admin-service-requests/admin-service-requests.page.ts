import { Component, signal, OnInit, OnDestroy } from '@angular/core';
import { finalize } from 'rxjs';
import { Router } from '@angular/router';
import { AdminService } from '../../core/services/admin.service';
import { AdminServiceRequestListItem } from '../../core/models/admin.model';
import { ServiceRequestStatus } from '../../core/models/service-request.model';
import { CardComponent } from '../../shared/components/card/card.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { SpinnerComponent } from '../../shared/components/spinner/spinner.component';
import { RequestStatusBadgeComponent } from '../../shared/components/request-status-badge/request-status-badge.component';

const STATUS_FILTERS: ServiceRequestStatus[] = [
  'pending',
  'quoted',
  'accepted',
  'in_progress',
  'completed',
  'rejected',
  'cancelled',
  'expired',
];

@Component({
  selector: 'app-admin-service-requests',
  standalone: true,
  imports: [CardComponent, ButtonComponent, SpinnerComponent, RequestStatusBadgeComponent],
  templateUrl: './admin-service-requests.page.html',
  styleUrl: './admin-service-requests.page.scss',
})
export class AdminServiceRequestsPageComponent implements OnInit, OnDestroy {
  protected readonly STATUS_FILTERS = STATUS_FILTERS;
  protected readonly isLoading = signal<boolean>(true);
  protected readonly error = signal<string | null>(null);
  protected readonly items = signal<AdminServiceRequestListItem[]>([]);
  protected readonly page = signal<number>(1);
  protected readonly limit = signal<number>(20);
  protected readonly total = signal<number>(0);
  protected readonly totalPages = signal<number>(1);
  protected readonly searchQuery = signal<string>('');
  protected readonly currentFilter = signal<string>('all');

  private searchTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly SEARCH_DEBOUNCE_MS = 300;

  constructor(
    private readonly adminService: AdminService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.loadRequests();
  }

  ngOnDestroy(): void {
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }
  }

  protected loadRequests(): void {
    this.isLoading.set(true);
    this.error.set(null);

    const params: {
      page: number;
      limit: number;
      status?: string;
      search?: string;
      sort?: 'newest' | 'oldest';
    } = {
      page: this.page(),
      limit: this.limit(),
      sort: 'newest',
    };

    const statusFilter = this.currentFilter();
    if (statusFilter !== 'all') {
      params.status = statusFilter;
    }

    const search = this.searchQuery();
    if (search) {
      params.search = search;
    }

    this.adminService.getAllServiceRequests(params).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.items.set(response.data.serviceRequests);
          this.page.set(response.data.pagination.page);
          this.total.set(response.data.pagination.total);
          this.totalPages.set(response.data.pagination.totalPages);
        } else {
          this.error.set(response.message || 'Failed to load service requests');
        }
      },
      error: (err: Error) => {
        this.error.set(err.message || 'Failed to load service requests');
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
      this.loadRequests();
    }, this.SEARCH_DEBOUNCE_MS);
  }

  protected setStatusFilter(status: string): void {
    this.currentFilter.set(status);
    this.page.set(1);
    this.loadRequests();
  }

  protected nextPage(): void {
    if (this.page() < this.totalPages() && !this.isLoading()) {
      this.page.set(this.page() + 1);
      this.loadRequests();
    }
  }

  protected prevPage(): void {
    if (this.page() > 1 && !this.isLoading()) {
      this.page.set(this.page() - 1);
      this.loadRequests();
    }
  }

  protected viewDetails(id: string): void {
    this.router.navigate(['/service-requests', id]);
  }

  protected formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  protected formatStatus(status: string): string {
    if (status === 'all') return 'All';
    const labels: Record<ServiceRequestStatus, string> = {
      pending: 'Pending',
      quoted: 'Quoted',
      accepted: 'Accepted',
      in_progress: 'In Progress',
      completed: 'Completed',
      rejected: 'Rejected',
      cancelled: 'Cancelled',
      expired: 'Expired',
    };
    return labels[status as ServiceRequestStatus] ?? status;
  }

  protected vehicleLabel(type: string): string {
    return type === 'two_wheeler' ? 'Two Wheeler' : 'Four Wheeler';
  }
}
