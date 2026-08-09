import { Component, signal, OnInit, OnDestroy } from '@angular/core';
import { finalize } from 'rxjs';
import { AdminService } from '../../core/services/admin.service';
import { AdminRepairShopListItem } from '../../core/models/admin.model';
import { CardComponent } from '../../shared/components/card/card.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { DialogComponent } from '../../shared/components/dialog/dialog.component';
import { SpinnerComponent } from '../../shared/components/spinner/spinner.component';
import { VerificationBadgeComponent } from '../../shared/components/verification-badge/verification-badge.component';

@Component({
  selector: 'app-admin-repair-shops',
  standalone: true,
  imports: [CardComponent, ButtonComponent, DialogComponent, SpinnerComponent, VerificationBadgeComponent],
  templateUrl: './admin-repair-shops.page.html',
  styleUrl: './admin-repair-shops.page.scss',
})
export class AdminRepairShopsPageComponent implements OnInit, OnDestroy {
  protected readonly isLoading = signal<boolean>(true);
  protected readonly error = signal<string | null>(null);
  protected readonly successMessage = signal<string | null>(null);
  protected readonly items = signal<AdminRepairShopListItem[]>([]);
  protected readonly page = signal<number>(1);
  protected readonly limit = signal<number>(20);
  protected readonly total = signal<number>(0);
  protected readonly totalPages = signal<number>(1);
  protected readonly searchQuery = signal<string>('');
  protected readonly activeFilter = signal<string>('all');
  protected readonly actionInProgress = signal<boolean>(false);
  protected readonly selectedShop = signal<AdminRepairShopListItem | null>(null);
  protected readonly dialogType = signal<'verify' | 'reject' | null>(null);

  private searchTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly SEARCH_DEBOUNCE_MS = 300;
  private successTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(private readonly adminService: AdminService) {}

  ngOnInit(): void {
    this.loadShops();
  }

  ngOnDestroy(): void {
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }
    if (this.successTimeout) {
      clearTimeout(this.successTimeout);
    }
  }

  protected loadShops(): void {
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

    const filter = this.activeFilter();
    if (filter !== 'all') {
      params.status = filter;
    }

    const search = this.searchQuery();
    if (search) {
      params.search = search;
    }

    this.adminService.getAllRepairShops(params).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.items.set(response.data.repairShops);
          this.page.set(response.data.pagination.page);
          this.total.set(response.data.pagination.total);
          this.totalPages.set(response.data.pagination.totalPages);
        } else {
          this.error.set(response.message || 'Failed to load repair shops');
        }
      },
      error: (err: Error) => {
        this.error.set(err.message || 'Failed to load repair shops');
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
      this.loadShops();
    }, this.SEARCH_DEBOUNCE_MS);
  }

  protected setFilter(filter: string): void {
    this.activeFilter.set(filter);
    this.page.set(1);
    this.loadShops();
  }

  protected openVerifyDialog(shop: AdminRepairShopListItem): void {
    if (this.actionInProgress()) {
      return;
    }
    this.selectedShop.set(shop);
    this.dialogType.set('verify');
  }

  protected openRejectDialog(shop: AdminRepairShopListItem): void {
    if (this.actionInProgress()) {
      return;
    }
    this.selectedShop.set(shop);
    this.dialogType.set('reject');
  }

  protected closeDialog(): void {
    this.dialogType.set(null);
    this.selectedShop.set(null);
  }

  protected confirmAction(): void {
    const shop = this.selectedShop();
    const type = this.dialogType();

    if (!shop || !type || this.actionInProgress()) {
      return;
    }

    this.actionInProgress.set(true);

    const request$ = type === 'verify'
      ? this.adminService.verifyRepairShop(shop.id)
      : this.adminService.rejectRepairShop(shop.id);

    request$.subscribe({
      next: (response) => {
        if (response.success) {
          const newStatus = type === 'verify' ? 'verified' : 'rejected';
          this.items.update((items) =>
            items.map((item) =>
              item.id === shop.id ? { ...item, status: newStatus } : item
            )
          );
          this.setSuccessMessage(
            `${shop.shopName} has been ${newStatus}`
          );
        } else {
          this.error.set(response.message || `Failed to ${type} repair shop`);
        }
      },
      error: (err: Error) => {
        this.error.set(err.message || `Failed to ${type} repair shop`);
      },
      complete: () => {
        this.actionInProgress.set(false);
        this.closeDialog();
      },
    });
  }

  protected nextPage(): void {
    if (this.page() < this.totalPages() && !this.isLoading()) {
      this.page.set(this.page() + 1);
      this.loadShops();
    }
  }

  protected prevPage(): void {
    if (this.page() > 1 && !this.isLoading()) {
      this.page.set(this.page() - 1);
      this.loadShops();
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

  protected formatVehicleTypes(types: string[] | undefined): string {
    if (!types || types.length === 0) return 'Not specified';
    return types
      .map((type) => {
        if (type === 'two_wheeler') return 'Two Wheeler';
        if (type === 'four_wheeler') return 'Four Wheeler';
        return type;
      })
      .join(', ');
  }

  protected get dialogTitle(): string {
    const shop = this.selectedShop();
    const type = this.dialogType();
    if (!shop || !type) {
      return '';
    }
    return type === 'verify' ? 'Verify Repair Shop' : 'Reject Repair Shop';
  }

  protected get dialogBody(): string {
    const shop = this.selectedShop();
    const type = this.dialogType();
    if (!shop || !type) {
      return '';
    }
    if (type === 'verify') {
      return `Are you sure you want to verify ${shop.shopName}? The mechanic will immediately be able to receive service requests.`;
    }
    return `Are you sure you want to reject ${shop.shopName}? The mechanic will be notified.`;
  }

  protected get confirmButtonLabel(): string {
    const type = this.dialogType();
    return type === 'verify' ? 'Verify' : 'Reject';
  }

  protected get confirmButtonVariant(): 'primary' | 'danger' {
    const type = this.dialogType();
    return type === 'verify' ? 'primary' : 'danger';
  }

  protected get isDialogOpen(): boolean {
    return this.dialogType() !== null;
  }

  private setSuccessMessage(message: string): void {
    this.successMessage.set(message);
    if (this.successTimeout) {
      clearTimeout(this.successTimeout);
    }
    this.successTimeout = setTimeout(() => {
      this.successMessage.set(null);
      this.successTimeout = null;
    }, 3000);
  }
}
