import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { ServiceRequest, ServiceRequestStatus } from '../../../core/models/service-request.model';
import { RequestStatusBadgeComponent } from '../request-status-badge/request-status-badge.component';

@Component({
  selector: 'app-service-request-card',
  standalone: true,
  imports: [RequestStatusBadgeComponent, CurrencyPipe],
  template: `
    <div class="request-card" (click)="onClick()">
      <div class="request-card__header">
        <app-request-status-badge [status]="request.status" />
        <span class="request-card__id">#SR-{{ shortId() }}</span>
        <span class="request-card__date">{{ formatDate(request.createdAt) }}</span>
      </div>

      <div class="request-card__body">
        <div class="request-card__vehicle">
          <span class="request-card__vehicle-icon">{{ vehicleIcon() }}</span>
          <span class="request-card__vehicle-type">{{ vehicleLabel() }}</span>
        </div>

        <p class="request-card__description" [title]="request.issueDescription">
          {{ request.issueDescription }}
        </p>

        @if (hasContactInfo()) {
          <div class="request-card__contact">
            <div class="request-card__shop">{{ request.shop.shopName }}</div>
            @if (request.shop.phone) {
              <div class="request-card__phone">{{ request.shop.phone }}</div>
            }
          </div>
        } @else {
          <div class="request-card__shop">{{ request.shop.shopName }}</div>
        }

        @if (request.estimatedCost !== null && request.estimatedCost !== undefined) {
          <div class="request-card__cost">
            Cost estimate: {{ request.estimatedCost | currency }}
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .request-card {
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
      padding: var(--space-4);
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-sm);
      cursor: pointer;
      transition: box-shadow var(--transition-normal), transform var(--transition-normal), border-color var(--transition-normal);
    }

    .request-card:hover {
      box-shadow: var(--shadow-lg);
      transform: translateY(-2px);
      border-color: var(--color-primary);
    }

    .request-card__header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .request-card__date {
      font-size: 12px;
      color: var(--color-text-secondary);
    }

    .request-card__id {
      font-size: 12px;
      font-family: var(--font-mono, monospace);
      font-weight: 600;
      color: var(--color-primary);
    }

    .request-card__body {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
    }

    .request-card__vehicle {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      font-size: 14px;
      font-weight: 500;
    }

    .request-card__vehicle-icon {
      font-size: 16px;
    }

    .request-card__description {
      font-size: 14px;
      color: var(--color-text);
      word-break: break-word;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .request-card__shop {
      font-size: 14px;
      font-weight: 500;
      color: var(--color-text);
    }

    .request-card__phone {
      font-size: 13px;
      color: var(--color-text-secondary);
    }

    .request-card__cost {
      font-size: 13px;
      color: var(--color-text-secondary);
    }
  `],
})
export class ServiceRequestCardComponent {
  @Input({ required: true }) request!: ServiceRequest;
  @Output() selected = new EventEmitter<ServiceRequest>();

  onClick(): void {
    this.selected.emit(this.request);
  }

  shortId(): string {
    const id = this.request.id || '';
    return id.length > 8 ? id.substring(0, 8) : id;
  }

  vehicleIcon(): string {
    return this.request.vehicleType === 'two_wheeler' ? '🏍️' : '🚗';
  }

  vehicleLabel(): string {
    return this.request.vehicleType === 'two_wheeler' ? 'Two Wheeler' : 'Four Wheeler';
  }

  hasContactInfo(): boolean {
    const contactStatuses: ServiceRequestStatus[] = ['accepted', 'in_progress', 'completed'];
    return contactStatuses.includes(this.request.status);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }
}
