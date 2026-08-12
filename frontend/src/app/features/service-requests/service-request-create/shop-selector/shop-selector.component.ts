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
    <div class="ss">

      <!-- Loading -->
      @if (isLoading()) {
        <div class="ss__loading" aria-label="Searching for nearby shops...">
          <app-spinner size="sm" />
          <span>Searching for nearby repair shops...</span>
        </div>

      <!-- Error -->
      } @else if (serverError()) {
        <div class="ss__error" role="alert">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {{ serverError() }}
        </div>

      <!-- Empty -->
      } @else if (shops().length === 0) {
        <div class="ss__empty">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
          </svg>
          <p>No repair shops found nearby. Try a different location or vehicle type.</p>
        </div>

      <!-- Shop list -->
      } @else {
        <div class="ss__list" role="listbox" aria-label="Available repair shops">
          @for (shop of shops(); track shop.id) {
            <div
              class="ss__item"
              role="option"
              [class.ss__item--selected]="shop.id === selectedShopId"
              [attr.aria-selected]="shop.id === selectedShopId"
              (click)="selectShop(shop)"
              tabindex="0"
              (keydown.enter)="selectShop(shop)"
              (keydown.space)="selectShop(shop)"
            >
              <!-- Selected indicator -->
              <span class="ss__radio" [class.ss__radio--checked]="shop.id === selectedShopId" aria-hidden="true">
                @if (shop.id === selectedShopId) {
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                       stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                }
              </span>

              <!-- Shop info -->
              <div class="ss__info">
                <div class="ss__name">{{ shop.shopName }}</div>
                <div class="ss__meta">
                  @if (shop.rating !== undefined && shop.rating !== null) {
                    <span class="ss__rating">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b"
                           stroke-width="1" aria-hidden="true">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                      </svg>
                      {{ shop.rating }}
                    </span>
                  }
                  @if (shop.phone) {
                    <span class="ss__phone">{{ shop.phone }}</span>
                  }
                </div>
                @if (shop.vehicleTypesServiced) {
                  <div class="ss__vehicles">
                    @if (shop.vehicleTypesServiced.includes('two_wheeler')) {
                      <span class="ss__vbadge">🏍️ Two Wheeler</span>
                    }
                    @if (shop.vehicleTypesServiced.includes('four_wheeler')) {
                      <span class="ss__vbadge">🚗 Four Wheeler</span>
                    }
                  </div>
                }
              </div>

              @if (shop.id === selectedShopId) {
                <span class="ss__selected-label">Selected</span>
              }
            </div>
          }
        </div>
      }

      <!-- Retry -->
      <button
        type="button"
        class="ss__retry"
        (click)="retrySearch()"
        [disabled]="isLoading()"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <polyline points="1 4 1 10 7 10"/>
          <path d="M3.51 15a9 9 0 1 0 .49-4.6"/>
        </svg>
        Retry Search
      </button>

    </div>
  `,
  styles: [`
    /* ── Wrapper ─────────────────────────────── */
    .ss {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    /* ── Loading ─────────────────────────────── */
    .ss__loading {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 16px 14px;
      color: var(--color-text-muted);
      font-size: 13px;
      background: #fafbff;
      border-radius: 12px;
      border: 1px solid var(--color-border);
    }

    /* ── Error ───────────────────────────────── */
    .ss__error {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      padding: 10px 13px;
      background: rgba(239,68,68,0.05);
      border: 1px solid rgba(239,68,68,0.2);
      border-radius: 10px;
      font-size: 12.5px;
      color: #b91c1c;
      line-height: 1.5;
    }

    /* ── Empty ───────────────────────────────── */
    .ss__empty {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 14px;
      background: #fafbff;
      border: 1.5px dashed #c7d2fe;
      border-radius: 12px;
      color: var(--color-text-muted);
    }

    .ss__empty svg {
      color: #6366f1;
      flex-shrink: 0;
      margin-top: 1px;
    }

    .ss__empty p {
      font-size: 12.5px;
      line-height: 1.55;
      margin: 0;
    }

    /* ── Shop list ───────────────────────────── */
    .ss__list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    /* ── Shop item ───────────────────────────── */
    .ss__item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 13px 14px;
      background: #fff;
      border: 1.5px solid var(--color-border);
      border-radius: 12px;
      cursor: pointer;
      outline: none;
      transition:
        border-color 140ms ease,
        background 140ms ease,
        box-shadow 140ms ease;
    }

    .ss__item:hover {
      border-color: #c7d2fe;
      background: #fafaff;
    }

    .ss__item--selected {
      border-color: #6366f1;
      background: #f5f3ff;
      box-shadow: 0 0 0 3px rgba(99,102,241,0.1);
    }

    .ss__item:focus-visible {
      box-shadow: 0 0 0 3px rgba(79,70,229,0.22);
    }

    /* Radio circle indicator */
    .ss__radio {
      display: grid;
      place-items: center;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      border: 2px solid var(--color-border);
      flex-shrink: 0;
      margin-top: 2px;
      transition: border-color 140ms ease, background 140ms ease;
    }

    .ss__radio--checked {
      border-color: #6366f1;
      background: #6366f1;
      color: #fff;
    }

    /* Shop info */
    .ss__info {
      flex: 1;
      min-width: 0;
    }

    .ss__name {
      font-size: 13.5px;
      font-weight: 700;
      color: #111827;
      margin-bottom: 4px;
    }

    .ss__meta {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      align-items: center;
      font-size: 12px;
      color: var(--color-text-muted);
    }

    .ss__rating {
      display: flex;
      align-items: center;
      gap: 3px;
      font-weight: 600;
      color: #92400e;
    }

    .ss__phone {
      color: var(--color-text-muted);
    }

    .ss__vehicles {
      display: flex;
      flex-wrap: wrap;
      gap: 5px;
      margin-top: 6px;
    }

    .ss__vbadge {
      font-size: 10.5px;
      padding: 3px 8px;
      border-radius: 6px;
      background: #eef2ff;
      color: #4338ca;
      font-weight: 600;
    }

    .ss__selected-label {
      flex-shrink: 0;
      font-size: 10px;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 6px;
      background: #ecfdf5;
      color: #047857;
      border: 1px solid rgba(16,185,129,0.2);
      margin-top: 2px;
    }

    /* ── Retry button ────────────────────────── */
    .ss__retry {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 7px 13px;
      border: 1.5px solid var(--color-border);
      border-radius: 8px;
      background: var(--color-surface);
      color: var(--color-text-muted);
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      font-family: var(--font-body);
      align-self: flex-start;
      transition: background 140ms ease, border-color 140ms ease, color 140ms ease;
    }

    .ss__retry:hover:not(:disabled) {
      background: var(--color-hover);
      border-color: #c7d2fe;
      color: #4338ca;
    }

    .ss__retry:disabled {
      opacity: 0.45;
      cursor: not-allowed;
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
