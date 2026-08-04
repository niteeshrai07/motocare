import { Component, Input } from '@angular/core';
import { ServiceRequestStatus } from '../../../core/models/service-request.model';

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

const STATUS_COLORS: Record<ServiceRequestStatus, string> = {
  pending: 'var(--color-warning)',
  quoted: 'var(--color-info)',
  accepted: 'var(--color-primary)',
  in_progress: 'var(--color-secondary)',
  completed: 'var(--color-success)',
  rejected: 'var(--color-danger)',
  cancelled: 'var(--color-text-muted)',
  expired: 'var(--color-text-muted)',
};

@Component({
  selector: 'app-request-status-badge',
  standalone: true,
  template: `
    <span
      class="status-badge"
      [style.--status-color]="color"
      [attr.aria-label]="label"
      >{{ label }}</span
    >
  `,
  styles: [`
    .status-badge {
      display: inline-flex;
      align-items: center;
      padding: 4px 10px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 600;
      color: white;
      background-color: var(--status-color);
    }
  `],
})
export class RequestStatusBadgeComponent {
  @Input({ required: true }) status!: ServiceRequestStatus;

  get label(): string {
    return STATUS_LABELS[this.status];
  }

  get color(): string {
    return STATUS_COLORS[this.status];
  }
}
