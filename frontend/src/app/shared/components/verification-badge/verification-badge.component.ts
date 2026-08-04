import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type VerificationStatus = 'pending' | 'verified' | 'rejected';

const STATUS_LABELS: Record<VerificationStatus, string> = {
  pending: 'Pending Verification',
  verified: 'Verified',
  rejected: 'Rejected',
};

const STATUS_COLORS: Record<VerificationStatus, string> = {
  pending: 'var(--color-warning)',
  verified: 'var(--color-success)',
  rejected: 'var(--color-danger)',
};

@Component({
  selector: 'app-verification-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span
      class="verification-badge"
      [style.background-color]="STATUS_COLORS[status]"
    >
      {{ STATUS_LABELS[status] }}
    </span>
  `,
  styles: [`
    .verification-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 600;
      color: var(--color-white);
    }
  `],
})
export class VerificationBadgeComponent {
  @Input({ required: true }) status: VerificationStatus = 'pending';

  protected readonly STATUS_LABELS = STATUS_LABELS;
  protected readonly STATUS_COLORS = STATUS_COLORS;
}
