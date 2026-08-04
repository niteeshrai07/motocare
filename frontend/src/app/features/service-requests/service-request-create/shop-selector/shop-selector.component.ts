import { Component, Input, Output, EventEmitter, signal, OnChanges } from '@angular/core';
import { finalize } from 'rxjs';
import { RepairShopSummary, VehicleType } from '../../../../core/models/service-request.model';
import { ServiceRequestService } from '../../../../core/services/service-request.service';
import { SpinnerComponent } from '../../../../shared/components/spinner/spinner.component';

@Component({
  selector: 'app-shop-selector',
  standalone: true,
  imports: [SpinnerComponent],
  template: `
    <div class="shop-selector">
      @if (isLoading()) {
        <div class="shop-selector__loading">
          <app-spinner size="sm" />
          <span>Searching for nearby repair shops...</span>
        </div>
      } @else if (serverError()) {
        <div class="shop-selector__error" role="alert">
          {{ serverError() }}
        </div>
      } @else if (shops().length === 0) {
        <p class="shop-selector__empty">No repair shops found nearby.</p>
      } @else {
        <div class="shop-selector__list">
          @for (shop of shops(); track shop.id) {
            <div
              class="shop-selector__item"
              [class.shop-selector__item--selected]="shop.id === selectedShopId"
              (click)="selectShop(shop)"
            >
              <div class="shop-selector__name">{{ shop.shopName }}</div>
              <div class="shop-selector__meta">
                @if (shop.rating !== undefined && shop.rating !== null) {
                  <span class="shop-selector__rating">★ {{ shop.rating }}</span>
                }
                @if (shop.phone) {
                  <span class="shop-selector__phone">{{ shop.phone }}</span>
                }
              </div>
              @if (shop.vehicleTypesServiced) {
                <div class="shop-selector__vehicles">
                  @if (shop.vehicleTypesServiced.includes('two_wheeler')) {
                    <span class="shop-selector__vehicle-badge">Two Wheeler</span>
                  }
                  @if (shop.vehicleTypesServiced.includes('four_wheeler')) {
                    <span class="shop-selector__vehicle-badge">Four Wheeler</span>
                  }
                </div>
              }
            </div>
          }
        </div>
      }

      <button
        type="button"
        class="shop-selector__retry"
        (click)="retrySearch()"
        [disabled]="isLoading()"
      >
        Retry Search
      </button>
    </div>
  `,
  styles: [`
    .shop-selector {
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
    }

    .shop-selector__loading {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-4);
      color: var(--color-text-secondary);
    }

    .shop-selector__error {
      padding: var(--space-3);
      background: #fef2f2;
      border: 1px solid var(--color-danger);
      border-radius: var(--radius-md);
      font-size: 13px;
      color: var(--color-danger);
    }

    .shop-selector__empty {
      padding: var(--space-3);
      color: var(--color-text-secondary);
      font-size: 14px;
    }

    .shop-selector__list {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
    }

    .shop-selector__item {
      padding: var(--space-3);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      background: var(--color-surface);
      cursor: pointer;
      transition: border-color var(--transition-fast), background var(--transition-fast);
    }

    .shop-selector__item:hover {
      background: var(--color-hover);
    }

    .shop-selector__item--selected {
      border-color: var(--color-primary);
      background: var(--color-primary-subtle);
    }

    .shop-selector__name {
      font-size: 14px;
      font-weight: 600;
      color: var(--color-text);
      margin-bottom: var(--space-1);
    }

    .shop-selector__meta {
      display: flex;
      gap: var(--space-3);
      font-size: 13px;
      color: var(--color-text-secondary);
    }

    .shop-selector__rating {
      color: #f59e0b;
    }

    .shop-selector__vehicles {
      display: flex;
      gap: var(--space-1);
      margin-top: var(--space-1);
    }

    .shop-selector__vehicle-badge {
      font-size: 11px;
      padding: 2px 8px;
      background: var(--color-border);
      border-radius: var(--radius-sm);
      color: var(--color-text-secondary);
    }

    .shop-selector__retry {
      padding: var(--space-2) var(--space-3);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      background: var(--color-surface);
      font-size: 13px;
      color: var(--color-text);
      cursor: pointer;
      transition: background var(--transition-fast);
    }

    .shop-selector__retry:hover {
      background: var(--color-hover);
    }
  `],
})
export class ShopSelectorComponent {
  @Input({ required: true }) lng!: number;
  @Input({ required: true }) lat!: number;
  @Input() vehicleType?: VehicleType;
  @Input() selectedShopId?: string;

  @Output() shopSelected = new EventEmitter<RepairShopSummary>();

  protected readonly isLoading = signal<boolean>(false);
  protected readonly serverError = signal<string | null>(null);
  protected readonly shops = signal<RepairShopSummary[]>([]);

  constructor(private readonly serviceRequestService: ServiceRequestService) {}

  ngOnChanges(): void {
    if (this.lng !== undefined && this.lat !== undefined) {
      this.searchShops();
    }
  }

  protected searchShops(): void {
    this.isLoading.set(true);
    this.serverError.set(null);

    this.serviceRequestService
      .getNearbyShops({
        lng: this.lng,
        lat: this.lat,
        vehicleType: this.vehicleType,
      })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.shops.set(response.data.repairShops);
          } else {
            this.serverError.set(response.message || 'Failed to search for repair shops');
            this.shops.set([]);
          }
        },
        error: (error: Error) => {
          this.serverError.set(error.message || 'Failed to search for repair shops');
          this.shops.set([]);
        },
      });
  }

  protected retrySearch(): void {
    this.searchShops();
  }

  protected selectShop(shop: RepairShopSummary): void {
    this.shopSelected.emit(shop);
  }
}
