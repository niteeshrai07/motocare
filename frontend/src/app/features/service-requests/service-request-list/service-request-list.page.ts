import { Component, signal, computed, effect } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { ServiceRequestService } from '../../../core/services/service-request.service';
import { AuthService } from '../../../core/services/auth.service';
import { ServiceRequest, ServiceRequestStatus } from '../../../core/models/service-request.model';
import { CardComponent } from '../../../shared/components/card/card.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { ServiceRequestCardComponent } from '../../../shared/components/service-request-card/service-request-card.component';

const PAGE_SIZE = 20;

const STATUS_FILTERS: ('all' | ServiceRequestStatus)[] = [
  'all',
  'pending',
  'quoted',
  'accepted',
  'in_progress',
  'completed',
  'rejected',
  'cancelled',
  'expired',
];

const STATUS_LABELS: Record<ServiceRequestStatus, string> = {
  pending: 'Pending',
  quoted: 'Quoted',
  accepted: 'Accepted',
  in_progress: 'In Progress',
  completed: 'Completed',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
  expired: 'Expired',
};

@Component({
  selector: 'app-service-request-list',
  standalone: true,
  imports: [ServiceRequestCardComponent, RouterLink],
  templateUrl: './service-request-list.page.html',
  styleUrl: './service-request-list.page.scss',
})
export class ServiceRequestListPageComponent {
  protected readonly isLoading = signal<boolean>(true);
  protected readonly requests = signal<ServiceRequest[]>([]);
  protected readonly serverError = signal<string | null>(null);

  protected readonly page = signal<number>(1);
  protected readonly totalPages = signal<number>(1);

  protected readonly activeFilter = signal<'all' | ServiceRequestStatus>('all');

  protected readonly statusFilters = STATUS_FILTERS;

  protected readonly isCustomer = computed(() => {
    const user = this.authService.user();
    return user?.role === 'customer';
  });

  // Guard: prevents loadRequests() from firing before the async user signal resolves,
  // ensuring the correct endpoint is chosen (customer vs mechanic)
  private readonly hasLoaded = signal(false);

  constructor(
    private readonly serviceRequestService: ServiceRequestService,
    private readonly authService: AuthService,
    private readonly router: Router,
  ) {
    effect(() => {
      const user = this.authService.user();
      const role = user?.role;
      if ((role === 'customer' || role === 'mechanic') && !this.hasLoaded()) {
        this.hasLoaded.set(true);
        this.loadRequests();
      }
    });
  }

  protected loadRequests(): void {
    this.isLoading.set(true);
    this.serverError.set(null);

    const params: { status?: ServiceRequestStatus; page?: number; limit?: number } = {
      limit: PAGE_SIZE,
      page: this.page(),
    };

    const filter = this.activeFilter();
    if (filter !== 'all') {
      params.status = filter;
    }

    const obs = this.isCustomer()
      ? this.serviceRequestService.getMyServiceRequests(params)
      : this.serviceRequestService.getShopServiceRequests(params);

    obs
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.requests.set(response.data.serviceRequests);
            this.page.set(response.data.pagination.page);
            this.totalPages.set(response.data.pagination.totalPages);
          } else {
            this.serverError.set(response.message || 'Failed to load service requests');
          }
        },
        error: (error: Error) => {
          this.serverError.set(error.message || 'Failed to load service requests');
        },
      });
  }

  protected setFilter(filter: 'all' | ServiceRequestStatus): void {
    this.activeFilter.set(filter);
    this.page.set(1);
    this.loadRequests();
  }

  protected nextPage(): void {
    if (this.page() < this.totalPages()) {
      this.page.set(this.page() + 1);
      this.loadRequests();
    }
  }

  protected prevPage(): void {
    if (this.page() > 1) {
      this.page.set(this.page() - 1);
      this.loadRequests();
    }
  }

  protected onRequestClick(request: ServiceRequest): void {
    this.router.navigate(['/service-requests', request.id]);
  }

  protected formatStatus(status: ServiceRequestStatus): string {
    return STATUS_LABELS[status] ?? status;
  }
}
